from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from app.database import get_db
from app.auth.jwt import current_user
import re

router = APIRouter()


class CreateWorkspaceBody(BaseModel):
    name: str


class RenameWorkspaceBody(BaseModel):
    name: str


def _slugify(name: str) -> str:
    """Convert a workspace name to a URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug or 'workspace'

def _clean_slug(slug: str, workspace: str) -> str:
    """Strip workspace prefix and sanitize colons for filesystem/URL safety."""
    if not slug: return ""
    prefix = f"ws:{workspace}:"
    while slug.startswith(prefix):
        slug = slug[len(prefix):]
    # Replace any remaining colons (illegal in filenames on Windows)
    slug = slug.replace(":", "-")
    return slug


def _clean_tree_slugs(nodes: list, workspace: str) -> list:
    """Recursively clean all slugs in a sidebar tree for export."""
    cleaned = []
    for node in nodes:
        clean_node = {**node}
        if "slug" in clean_node and clean_node["slug"]:
            clean_node["slug"] = _clean_slug(clean_node["slug"], workspace)
        if "children" in clean_node and clean_node["children"]:
            clean_node["children"] = _clean_tree_slugs(clean_node["children"], workspace)
        cleaned.append(clean_node)
    return cleaned


async def _unique_slug(db, slug: str, exclude_id: str | None = None) -> str:
    """Ensure slug is unique in the portal_workspaces collection."""
    candidate = slug
    counter = 1
    while True:
        query = {"slug": candidate}
        if exclude_id:
            query["_id"] = {"$ne": ObjectId(exclude_id)}
        existing = await db.portal_workspaces.find_one(query)
        if not existing:
            return candidate
        counter += 1
        candidate = f"{slug}-{counter}"


# ──────────────── Workspace CRUD ────────────────

@router.get("/")
async def get_workspaces():
    """Return all workspaces ordered by `order` ASC."""
    db = get_db()
    workspaces = await db.portal_workspaces.find().sort("order", 1).to_list(200)
    return [
        {
            "id": str(w["_id"]),
            "name": w["name"],
            "slug": w["slug"],
            "order": w.get("order", 0),
            "created_at": w.get("created_at", w.get("createdAt", datetime.utcnow())).isoformat(),
            "updated_at": w.get("updated_at", w.get("created_at", datetime.utcnow())).isoformat(),
        }
        for w in workspaces
    ]


@router.post("/")
async def create_workspace(body: CreateWorkspaceBody, user=Depends(current_user)):
    """Create a new workspace, auto-generate slug, append to end of order list."""
    if not body.name.strip():
        raise HTTPException(400, "Workspace name cannot be empty")

    db = get_db()

    # Determine next order value
    last = await db.portal_workspaces.find_one(sort=[("order", -1)])
    next_order = (last["order"] + 1) if last and "order" in last else 0

    slug = _slugify(body.name)
    slug = await _unique_slug(db, slug)

    now = datetime.utcnow()
    doc = {
        "name": body.name.strip(),
        "slug": slug,
        "order": next_order,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.portal_workspaces.insert_one(doc)

    # ── Seed workspace in GitHub so Docusaurus can discover it ──
    from app.github_client import write_file
    import json as _json

    ws_name = body.name.strip()

    # 1. Create a placeholder index.md so the workspace folder exists
    placeholder_content = (
        f"---\n"
        f"title: Welcome to {ws_name}\n"
        f"sidebar_label: Welcome\n"
        f"id: index\n"
        f"---\n\n"
        f"# Welcome to {ws_name}\n\n"
        f"This workspace has been created. Start adding pages!\n"
    )
    write_file(
        path=f"docs-site/workspaces/{slug}/index.md",
        content=placeholder_content,
        message=f"feat: initialize workspace '{ws_name}'"
    )

    # 2. Create the sidebar JSON file
    initial_sidebar = {
        f"sidebar_{slug}": [
            {"type": "doc", "id": "index", "label": "Welcome"}
        ]
    }
    write_file(
        path=f"docs-site/sidebars-{slug}.json",
        content=_json.dumps(initial_sidebar, indent=2),
        message=f"feat: initialize sidebar for '{ws_name}'"
    )

    # 3. Initialize sidebar tree in MongoDB
    await db.sidebar_tree.update_one(
        {"_id": f"ws_{slug}"},
        {"$set": {
            "tree": [{"type": "page", "slug": "index", "label": "Welcome"}],
            "updated_at": now.isoformat(),
            "updated_by": user.get("name", "system"),
        }},
        upsert=True
    )

    # 4. Create the initial page record in MongoDB
    await db.pages.update_one(
        {"slug": f"ws:{slug}:index"},
        {"$set": {
            "slug": f"ws:{slug}:index",
            "workspace": slug,
            "title": f"Welcome to {ws_name}",
            "content": f"# Welcome to {ws_name}\n\nThis workspace has been created. Start adding pages!",
            "sidebar_label": "Welcome",
            "change_log": [],
        }},
        upsert=True
    )

    return {
        "id": str(result.inserted_id),
        "name": doc["name"],
        "slug": doc["slug"],
        "order": doc["order"],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }


@router.patch("/{workspace_id}")
async def rename_workspace(workspace_id: str, body: RenameWorkspaceBody, user=Depends(current_user)):
    """Rename a workspace and regenerate its slug."""
    if not body.name.strip():
        raise HTTPException(400, "Workspace name cannot be empty")

    db = get_db()

    ws = await db.portal_workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not ws:
        raise HTTPException(404, "Workspace not found")

    # Prevent renaming the locked "docs" workspace
    if ws.get("slug") == "docs":
        raise HTTPException(403, "The Documentation workspace cannot be renamed")

    new_slug = _slugify(body.name)
    new_slug = await _unique_slug(db, new_slug, exclude_id=workspace_id)

    now = datetime.utcnow()
    await db.portal_workspaces.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$set": {
            "name": body.name.strip(),
            "slug": new_slug,
            "updated_at": now,
        }}
    )

    return {
        "id": workspace_id,
        "name": body.name.strip(),
        "slug": new_slug,
        "updated_at": now.isoformat(),
    }


@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str, user=Depends(current_user)):
    """Delete a workspace and all associated data. The 'docs' workspace cannot be deleted."""
    db = get_db()

    ws = await db.portal_workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not ws:
        raise HTTPException(404, "Workspace not found")

    # Prevent deleting the locked "docs" workspace
    if ws.get("slug") == "docs":
        raise HTTPException(403, "The Documentation workspace cannot be deleted")

    slug = ws["slug"]

    # 1. Delete workspace MongoDB record
    await db.portal_workspaces.delete_one({"_id": ObjectId(workspace_id)})

    # 2. Delete all pages belonging to this workspace
    await db.pages.delete_many({"workspace": slug})

    # 3. Delete the sidebar tree document
    await db.sidebar_tree.delete_one({"_id": f"ws_{slug}"})

    # 4. Clean up GitHub artifacts
    from app.github_client import delete_file, get_repo
    import logging
    _logger = logging.getLogger(__name__)

    # 4a. Delete the sidebar JSON file
    try:
        delete_file(
            path=f"docs-site/sidebars-{slug}.json",
            message=f"cleanup: delete sidebar for workspace '{slug}'"
        )
    except Exception as e:
        _logger.warning(f"Failed to delete sidebar JSON for '{slug}': {e}")

    # 4b. Delete all files in the workspace folder
    try:
        repo = get_repo()
        ws_path = f"docs-site/workspaces/{slug}"
        try:
            contents = repo.get_contents(ws_path)
            # Flatten: get all files recursively
            files_to_delete = []
            while contents:
                item = contents.pop(0)
                if item.type == "dir":
                    contents.extend(repo.get_contents(item.path))
                else:
                    files_to_delete.append(item)
            for f in files_to_delete:
                repo.delete_file(
                    path=f.path,
                    message=f"cleanup: remove '{f.path}' (workspace '{slug}' deleted)",
                    sha=f.sha
                )
                _logger.info(f"Deleted GitHub file: {f.path}")
        except Exception:
            _logger.info(f"Workspace folder '{ws_path}' not found in GitHub (already clean)")
    except Exception as e:
        _logger.warning(f"GitHub cleanup for workspace '{slug}' failed: {e}")

    return {"message": "Workspace deleted", "id": workspace_id}


# ──────────────── Sync & Export (Stage 1 & 5) ────────────────

@router.get("/export-all")
async def export_all_workspaces():
    """
    Returns a bulk export of all workspaces, their pages, and sidebar trees.
    Used by the docs-site sync script to generate static files.
    """
    db = get_db()
    
    # 1. Fetch all workspaces
    workspaces = await db.portal_workspaces.find().sort("order", 1).to_list(100)
    
    export_data = {}
    
    for ws in workspaces:
        slug = ws["slug"]
        
        # 2. Fetch pages for this workspace
        # Pages in custom workspaces are prefixed with 'ws:{slug}:' in their slug field
        # OR they have a 'workspace' field.
        if slug == "docs":
            pages_cursor = db.pages.find({"$or": [{"workspace": {"$exists": False}}, {"workspace": "docs"}]})
        else:
            pages_cursor = db.pages.find({"workspace": slug})
            
        pages = await pages_cursor.to_list(1000)
        
        # 3. Fetch sidebar tree for this workspace
        tree_id = "main" if slug == "docs" else f"ws_{slug}"
        sidebar_doc = await db.sidebar_tree.find_one({"_id": tree_id})
        sidebar_tree = sidebar_doc["tree"] if sidebar_doc else []
        
        export_data[slug] = {
            "name": ws["name"],
            "pages": [
                {
                    "slug": _clean_slug(p["slug"], slug) if slug != "docs" else p["slug"],
                    "title": p.get("title", ""),
                    "content": p.get("content", ""),
                    "sidebar_label": p.get("sidebar_label", ""),
                    "sidebar_position": p.get("sidebar_position", 1),
                    "category": p.get("category", "General")
                }
                for p in pages if p.get("slug")
            ],
            "sidebar_tree": _clean_tree_slugs(sidebar_tree, slug) if slug != "docs" else sidebar_tree
        }
        
    return export_data


@router.post("/trigger-rebuild")
async def trigger_rebuild(user=Depends(current_user)):
    """
    Trigger a production rebuild of the Docs site via Vercel deploy hook.
    """
    from app.github_client import _trigger_vercel_rebuild
    success = _trigger_vercel_rebuild()
    if not success:
        raise HTTPException(500, "Vercel rebuild trigger failed. Check backend logs.")
    return {"message": "Rebuild triggered successfully"}
