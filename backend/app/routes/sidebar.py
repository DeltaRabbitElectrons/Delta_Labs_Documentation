import json
import logging
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.auth.jwt import admin_only
from app.github_client import write_file, delete_file
from app.schemas.sidebar import SidebarUpdateRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sidebar", tags=["sidebar"])

def sanitize_slug(slug: str, workspace: str = "docs") -> str:
    """
    Removes numbered prefixes from slug path segments AND 
    removes redundant workspace prefixes if they got stacked.
    Example: "ws:foo:01-intro" → "intro"
    """
    if not slug:
        return slug
    
    # 1. Strip redundant workspace prefixes
    prefix = f"ws:{workspace}:"
    while slug.startswith(prefix):
        slug = slug[len(prefix):]
    
    # 2. Strip numbered segments (01-name -> name)
    parts = slug.split("/")
    return "/".join(re.sub(r'^\d+-', '', part) for part in parts)

def sanitize_tree(nodes: list, workspace: str = "docs") -> list:
    """Recursively sanitize all slugs in the tree."""
    return [
        {
            **node,
            "slug": sanitize_slug(node.get("slug") or "", workspace) or None,
            "children": sanitize_tree(node.get("children") or [], workspace)
        }
        for node in nodes
    ]


_JUNK_SLUG_RE = re.compile(
    r'^(new-?page-?\d*|untitled-?\d*|new-?\d*|tmp-?\d*|[a-z0-9])$', re.IGNORECASE
)

def filter_tree(nodes: list) -> list:
    """
    Remove invalid nodes before persisting:
    - Nodes with empty/null label
    - Page nodes with null, empty, or junk slug
    - Empty categories (no valid children after recursive filtering)
    """
    result = []
    for node in nodes:
        label = (node.get("label") or "").strip()
        if not label:
            logger.warning("filter_tree: skipping node with empty label")
            continue
        ntype = node.get("type")
        if ntype == "page":
            slug = (node.get("slug") or "").strip()
            if not slug:
                logger.warning(f"filter_tree: skipping page with empty slug (label='{label}')")
                continue
            last_segment = slug.split("/")[-1]
            if _JUNK_SLUG_RE.match(last_segment):
                logger.warning(f"filter_tree: skipping junk slug '{slug}'")
                continue
            result.append(node)
        elif ntype == "category":
            clean_children = filter_tree(node.get("children") or [])
            if not clean_children:
                logger.info(f"filter_tree: skipping empty category '{label}'")
                continue
            result.append({**node, "children": clean_children})
        else:
            result.append(node)
    return result

def transform_node_for_docusaurus(node: dict, valid_slugs: list[str] = None) -> dict | str | None:
    """
    Converts a single portal SidebarNode to a Docusaurus-compatible sidebar item.
    Returns None if the node is a page and its slug is not valid (missing in GitHub).
    """
    def find_best_slug(target: str) -> str | None:
        if not valid_slugs:
            return target
        if target in valid_slugs:
            return target
        target_name = target.split("/")[-1]
        for s in valid_slugs:
            if s.split("/")[-1] == target_name:
                return s
        return None

    ntype = node.get("type")
    if ntype == "page":
        slug = (node.get("slug") or "").strip()
        if not slug:
            return None
        
        best_slug = find_best_slug(slug)
        if not best_slug:
            logger.warning(f"Docusaurus Sync: slug '{slug}' not found in GitHub files — skipping")
            return None
            
        label = node.get("label")
        if label:
            return {
                "type": "doc",
                "id": best_slug,
                "label": label
            }
        return best_slug

    elif ntype == "category":
        children = node.get("children") or []
        items = [
            transformed for transformed in (transform_node_for_docusaurus(c, valid_slugs) for c in children)
            if transformed is not None
        ]
        if not items:
            return None

        return {
            "type": "category",
            "label": (node.get("label") or "Untitled").strip(),
            "collapsible": True,
            "collapsed": False,
            "items": items
        }
    return None

def generate_sidebars_ts(tree: list, valid_slugs: list[str] = None) -> str:
    """
    Converts the sidebar tree to valid Docusaurus sidebars.ts content for the main docs.
    """
    transformed_items = [
        transformed for transformed in (transform_node_for_docusaurus(n, valid_slugs) for n in (tree or []))
        if transformed is not None
    ]
    
    if not transformed_items:
        transformed_items = ["introduction"]

    # Convert to JSON string and massage it into a TS file
    items_json = json.dumps(transformed_items, indent=2)
    
    # We need to remove quotes from keys to look like standard TS, though not strictly required
    content = (
        "import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';\n\n"
        "const sidebars: SidebarsConfig = {\n"
        f"  tutorialSidebar: {items_json}\n"
        "};\n\n"
        "export default sidebars;\n"
    )
    return content

# GET /sidebar — return the full sidebar tree
@router.get("")
async def get_sidebar(workspace: str = "docs", db=Depends(get_db)):
    tree_id = "main" if workspace == "docs" else f"ws_{workspace}"
    doc = await db.sidebar_tree.find_one({"_id": tree_id})
    if not doc:
        return {"tree": []}
    return {"tree": doc["tree"]}

# POST /sidebar — replace the entire tree (called after any structural change)
@router.post("")
async def save_sidebar(
    body: SidebarUpdateRequest,
    workspace: str = "docs",
    db=Depends(get_db),
    current_user=Depends(admin_only)
):
    logger.info(f"Saving sidebar tree with {len(body.tree)} root nodes by {current_user['name']} (workspace={workspace})")
    
    try:
        # 1. Sanitize and filter the tree
        raw_tree = [node.model_dump() for node in body.tree]
        clean_tree = filter_tree(sanitize_tree(raw_tree, workspace))
        
        # 2. Save new tree to MongoDB
        tree_id = "main" if workspace == "docs" else f"ws_{workspace}"
        await db.sidebar_tree.update_one(
            {"_id": tree_id},
            {"$set": {
                "tree": clean_tree,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": current_user["name"]
            }},
            upsert=True
        )

        # 3. Sync to GitHub/Docusaurus for version control
        from app.github_client import list_all_docs
        valid_slugs = list_all_docs() # This works for docs-site/docs relative to repo root
        
        if workspace == "docs":
            sidebars_content = generate_sidebars_ts(clean_tree, valid_slugs=valid_slugs)

            if not sidebars_content:
                raise HTTPException(status_code=500, detail="Sidebar generation failed validation. Check backend logs.")

            write_file(
                path="docs-site/sidebars.ts",
                content=sidebars_content,
                message=f"chore: update sidebar structure by {current_user['name']}"
            )
            
            write_file(
                path="docs-site/sidebar-state.json",
                content=json.dumps(clean_tree, indent=2),
                message=f"chore: update sidebar data by {current_user['name']}"
            )
        else:
            # For custom workspaces, we save a JSON file that Docusaurus picks up
            sidebar_path = f"docs-site/sidebars-{workspace}.json"
            
            # Use workspace-specific valid slugs for cross-validation
            from app.github_client import list_workspace_docs
            ws_valid_slugs = list_workspace_docs(workspace)
            logger.info(f"Workspace '{workspace}' has {len(ws_valid_slugs)} valid slugs in GitHub: {ws_valid_slugs}")
            
            transformed_items = [
                transformed for transformed in (
                    transform_node_for_docusaurus(n, ws_valid_slugs if ws_valid_slugs else None)
                    for n in (clean_tree or [])
                )
                if transformed is not None
            ]
            
            # Wrap it in the expected Docusaurus format: { "sidebar_slug": [...] }
            sidebar_json = { f"sidebar_{workspace}": transformed_items }
            
            write_file(
                path=sidebar_path,
                content=json.dumps(sidebar_json, indent=2),
                message=f"chore({workspace}): update sidebar data by {current_user['name']}"
            )
            logger.info(f"Sidebar saved to MongoDB and GitHub for workspace '{workspace}'")
        
        from app.github_client import _trigger_vercel_rebuild as trigger_rebuild
        trigger_rebuild()
        logger.info(f"Vercel rebuild triggered after sidebar save for workspace '{workspace}'")
        
        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sidebar save failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# POST /sidebar/page — create a new page node + its .md file
@router.post("/page")
async def create_page(
    body: dict,
    workspace: str = "docs",
    db=Depends(get_db),
    current_user=Depends(admin_only)
):
    logger.info(f"create_page request: workspace={workspace}, body={body}")
    slug = body.get("slug")
    
    # Robust cleaning: remove stacked prefixes
    prefix = f"ws:{workspace}:"
    while slug and slug.startswith(prefix):
        slug = slug[len(prefix):]
        
    title = body.get("label", slug)

    if not slug:
        raise HTTPException(status_code=400, detail="slug is required")

    # Write .md file to GitHub for ALL workspaces to enable history
    # Sanitize slug for GitHub file path
    safe_slug = slug.replace(":", "-")

    default_content = f"""---
title: {title}
sidebar_label: {title}
id: {safe_slug}
---

# {title}

Start writing here...
"""
    if workspace == "docs":
        file_path = f"docs-site/docs/{safe_slug}.md"
    else:
        file_path = f"docs-site/workspaces/{workspace}/{safe_slug}.md"

    write_file(
        path=file_path,
        content=default_content,
        message=f"{workspace}: create page '{title}' by {current_user['name']}"
    )

    # Create MongoDB record (workspace-scoped)
    # Use workspace prefix for non-docs pages to avoid slug collisions
    db_slug = slug if workspace == "docs" else f"ws:{workspace}:{slug}"
    existing = await db.pages.find_one({"slug": db_slug})
    if not existing:
        await db.pages.insert_one({
            "slug": db_slug,
            "workspace": workspace,
            "title": title,
            "content": f"# {title}\n\nStart writing here...",
            "sidebar_label": title,
            "change_log": []
        })
    
    return {"success": True, "slug": slug}

# DELETE /sidebar/page — delete a page's .md file and MongoDB record
@router.delete("/page/{slug:path}")
async def delete_page(
    slug: str,
    delete_content: bool = False,
    workspace: str = "docs",
    db=Depends(get_db),
    current_user=Depends(admin_only)
):
    # Delete .md file from GitHub
    # Sanitize slug for GitHub file path
    safe_slug = slug.replace(":", "-")

    if workspace == "docs":
        file_path = f"docs-site/docs/{safe_slug}.md"
    else:
        file_path = f"docs-site/workspaces/{workspace}/{safe_slug}.md"

    try:
        deleted = delete_file(
            path=file_path,
            message=f"{workspace}: delete page '{slug}' by {current_user['name']}"
        )
        logger.info(f"Deleted GitHub file: {file_path} — result: {deleted}")
    except Exception as e:
        logger.warning(f"GitHub delete failed for {file_path}: {e}")

    # Remove from MongoDB
    # Robust cleaning for MongoDB slug
    prefix = f"ws:{workspace}:"
    while slug and slug.startswith(prefix):
        slug = slug[len(prefix):]
        
    db_slug = slug if workspace == "docs" else f"ws:{workspace}:{slug}"
    if delete_content or workspace != "docs":
        await db.pages.delete_one({"slug": db_slug})
        logger.info(f"Deleted MongoDB record for slug: {db_slug}")

    return {"success": True, "slug": slug}
