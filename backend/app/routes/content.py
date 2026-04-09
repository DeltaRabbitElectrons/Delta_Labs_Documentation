from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.database import get_db
from app.auth.jwt import admin_only
from app.github_client import get_file_history, get_file_at_commit, write_file, _trigger_vercel_rebuild
from app.schemas.content import RevertRequest, ContentSaveRequest
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()


def strip_frontmatter(content: str) -> str:
    lines = content.split("\n")
    if len(lines) > 0 and lines[0].strip() == "---":
        end = next((i for i, line in enumerate(lines[1:], 1) if line.strip() == "---"), None)
        if end:
            return "\n".join(lines[end + 1:]).strip()
    return content


@router.post("/save")
async def save_content(
    request: ContentSaveRequest,
    db=Depends(get_db),
    current_user=Depends(admin_only)
):

    workspace = request.workspace or "docs"
    slug = request.slug
    html_content = request.content or request.newValue
    if html_content is None:
        raise HTTPException(422, "Content field is required")

    title = request.title or slug.split("/")[-1].replace("-", " ").title()
    sidebar_label = request.sidebar_label or title
    admin_name = current_user.get("name", "Admin")

    # Robust cleaning: remove stacked prefixes
    prefix = f"ws:{workspace}:"
    clean_slug_val = slug
    while clean_slug_val.startswith(prefix):
        clean_slug_val = clean_slug_val[len(prefix):]

    db_slug = clean_slug_val if workspace == "docs" else f"ws:{workspace}:{clean_slug_val}"
    # Sanitize slug for GitHub file path (replace colons which are illegal on Windows)
    # Important: use clean_slug_val here!
    safe_slug = clean_slug_val.replace(":", "-")

    # Sync to GitHub for version control support in ALL workspaces
    markdown_content = html_content.strip()
    file_content = f"""---
title: {title}
sidebar_label: {sidebar_label}
id: {safe_slug}
---

{markdown_content}
"""
    if workspace == "docs":
        file_path = f"docs-site/docs/{safe_slug}.md"
    else:
        file_path = f"docs-site/workspaces/{workspace}/{safe_slug}.md"

    logger.info(f"Writing to GitHub: {file_path}")
    github_success = write_file(
        path=file_path,
        content=file_content,
        message=f"{workspace}: content updated by {admin_name}"
    )
    logger.info(f"GitHub write result for {file_path}: {github_success}")

    change_entry = {
        "admin_name": admin_name,
        "edited_at": datetime.now(timezone.utc).isoformat(),
        "message": f"Updated by {admin_name}"
    }

    await db.pages.update_one(
        {"slug": db_slug},
        {"$set": {
            "content": html_content,
            "title": title,
            "sidebar_label": sidebar_label,
            "workspace": workspace,
            "updatedAt": datetime.now(timezone.utc)
        },
        "$push": {"change_log": change_entry}},
        upsert=True
    )
    logger.info(f"MongoDB updated for slug: {db_slug}")

    return {
        "success": True,
        "slug": slug,
        "github": github_success if workspace == "docs" else True
    }


@router.post("/trigger-rebuild")
async def trigger_rebuild(user=Depends(admin_only)):

    logger.info("Firing Vercel deploy hook...")
    success = _trigger_vercel_rebuild()
    return {"success": success}


@router.get("/history/{slug:path}")
async def get_page_history(
    slug: str,
    workspace: str = "docs",
    current_user=Depends(admin_only)
):

    try:
        history = get_file_history(slug, workspace)
        return {"slug": slug, "history": history}
    except Exception as e:
        logger.error(f"ERROR: History fetch failed for {slug}: {e}")
        return {"slug": slug, "history": [], "error": str(e)}


@router.post("/revert")
async def revert_page(
    body: RevertRequest,
    db=Depends(get_db),
    user=Depends(admin_only)
):

    try:
        old_content = get_file_at_commit(
            slug=body.slug,
            commit_sha=body.commit_sha,
            workspace=body.workspace or "docs",
            is_sidebar=body.is_sidebar
        )

        if not old_content:
            raise HTTPException(status_code=404, detail="Commit not found")

        workspace = body.workspace or "docs"

        if body.is_sidebar:
            is_json = False
            try:
                tree = json.loads(old_content)
                is_json = True
            except json.JSONDecodeError:
                pass

            if is_json:
                sidebar_path = "docs-site/sidebar-state.json" if workspace == "docs" else f"docs-site/sidebars-{workspace}.json"
                write_file(
                    path=sidebar_path,
                    content=old_content,
                    message=f"revert: restore sidebar to {body.commit_sha[:7]} by {user['name']}"
                )
                
                # For main docs, we also sync the sidebars.ts file
                if workspace == "docs":
                    from app.routes.sidebar import generate_sidebars_ts
                    ts_content = generate_sidebars_ts(tree)
                    write_file(
                        path="docs-site/sidebars.ts",
                        content=ts_content,
                        message=f"revert: sync sidebars.ts by {user['name']}"
                    )

                tree_id = "main" if workspace == "docs" else f"ws_{workspace}"
                await db.sidebar_tree.update_one(
                    {"_id": tree_id},
                    {"$set": {
                        "tree": tree,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "updated_by": user["name"]
                    }},
                    upsert=True
                )
            else:
                # Legacy support for sidebars.ts (docs only)
                write_file(
                    path="docs-site/sidebars.ts",
                    content=old_content,
                    message=f"revert: restore sidebars.ts to {body.commit_sha[:7]} by {user['name']}"
                )
        else:
            if workspace == "docs":
                path = f"docs-site/docs/{body.slug}.md"
            else:
                path = f"docs-site/workspaces/{workspace}/{body.slug}.md"

            success = write_file(
                path=path,
                content=old_content,
                message=f"revert: restore {body.slug} to {body.commit_sha[:7]} by {user['name']}"
            )

            if not success:
                raise HTTPException(status_code=500, detail="GitHub write failed")

            clean_content = strip_frontmatter(old_content)
            db_slug = body.slug if workspace == "docs" else f"ws:{workspace}:{body.slug}"
            await db.pages.update_one(
                {"slug": db_slug},
                {"$set": {"content": clean_content}},
                upsert=True
            )

        # Always trigger a Vercel rebuild so the live docs site updates
        _trigger_vercel_rebuild()
        logger.info(f"Vercel rebuild triggered after revert to {body.commit_sha[:7]}")

        return {"success": True, "reverted_to": body.commit_sha}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revert failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
