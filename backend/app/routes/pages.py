from fastapi import APIRouter, Depends, HTTPException
import re
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.auth.jwt import admin_only, portal_user
from app.github_client import write_doc

router = APIRouter()

def derive_title(slug: str) -> str:
    if not slug:
        return ""
    return slug.split("/")[-1].replace("-", " ").title()

def clean_slug(slug: str, workspace: str) -> str:
    if not slug:
        return ""
    prefix = f"ws:{workspace}:"
    if slug.startswith(prefix):
        return slug[len(prefix):]
    return slug

def build_markdown(slug: str, title: str, position: int, content: str, label: Optional[str] = None) -> str:
    clean_path = "/".join(re.sub(r'^\d+-', '', part) for part in slug.split("/"))
    label_line = f"sidebar_label: {label}\n" if label else ""
    return (
        f"---\n"
        f"id: {clean_path}\n"
        f"slug: /{clean_path}\n"
        f"title: {title}\n"
        f"sidebar_position: {position}\n"
        f"{label_line}"
        f"---\n\n"
        f"{content}"
    )
class CreatePage(BaseModel):
    slug: str
    title: str
    content: str           # Full Markdown body (NO frontmatter)
    category: str
    sidebar_position: int = 1
    sidebar_label: Optional[str] = None

class UpdatePage(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    sidebar_position: Optional[int] = None
    sidebar_label: Optional[str] = None

# GET /pages — list all pages (for sidebar navigation)
@router.get("")
async def list_pages(workspace: str = "docs", user=Depends(portal_user)):
    db = get_db()
    if workspace == "docs":
        pages = await db.pages.find({"$or": [{"workspace": {"$exists": False}}, {"workspace": "docs"}]}).to_list(1000)
    else:
        pages = await db.pages.find({"workspace": workspace}).to_list(1000)
    return [
        {
            "slug": clean_slug(p.get("slug", ""), workspace),
            "title": p.get("title") or derive_title(p.get("slug", "")),
            "category": p.get("category", "General"),
            "sidebar_position": p.get("sidebar_position", 1),
            "sidebar_label": p.get("sidebar_label") or p.get("title") or derive_title(p.get("slug", "")),
            "updatedAt": p.get("updatedAt"),
            "isDraft": p.get("isDraft", False),
        }
        for p in pages
        if p.get("slug")
    ]

# GET /pages/{slug} — get full page content for the editor
@router.get("/{slug:path}")
async def get_page(slug: str, workspace: str = "docs", user=Depends(portal_user)):
    db = get_db()
    # Be smart: if slug already starts with ws:workspace:, don't double prefix it
    prefix = f"ws:{workspace}:"
    if workspace == "docs":
        db_slug = slug
    elif slug.startswith(prefix):
        db_slug = slug
    else:
        db_slug = f"{prefix}{slug}"
    
    page = await db.pages.find_one({"slug": db_slug})
    
    if not page or not page.get("content"):
        if workspace != "docs":
            # Non-docs workspace: no GitHub fallback
            if not page:
                raise HTTPException(status_code=404, detail=f"Page '{slug}' not found in workspace")
        else:
            # Docs workspace: Fetch from GitHub if missing in MongoDB
            from app.github_client import get_repo
            from github import GithubException
            try:
                repo = get_repo()
                path = f"docs-site/docs/{slug}.md"
                file = repo.get_contents(path)
                raw_content = file.decoded_content.decode("utf-8")

                # Strip frontmatter
                content = raw_content
                title = derive_title(slug)
                sidebar_label = title
                
                if raw_content.startswith("---"):
                    parts = raw_content.split("---", 2)
                    if len(parts) >= 3:
                        frontmatter = parts[1]
                        content = parts[2].strip()
                        for line in frontmatter.split("\n"):
                            if line.startswith("title:"):
                                title = line.split(":", 1)[1].strip()
                            if line.startswith("sidebar_label:"):
                                sidebar_label = line.split(":", 1)[1].strip()

                # Sync to MongoDB
                page_data = {
                    "slug": slug,
                    "title": title,
                    "content": content,
                    "sidebar_label": sidebar_label,
                    "updatedAt": datetime.utcnow()
                }
                await db.pages.update_one({"slug": slug}, {"$set": page_data}, upsert=True)
                page = page_data
            except GithubException:
                if not page:
                    raise HTTPException(status_code=404, detail=f"Page '{slug}' not found")

    return {
        "slug": page.get("slug", db_slug),
        "title": page.get("title") or derive_title(slug),
        "content": page.get("content", ""),
        "sidebar_label": page.get("sidebar_label") or page.get("title") or derive_title(slug),
        "change_log": page.get("change_log", []),
        "updatedAt": page.get("updatedAt"),
    }


# POST /pages — admin creates new page (publishes immediately)
@router.post("")
async def create_page(body: CreatePage, admin=Depends(admin_only)):
    db = get_db()
    if await db.pages.find_one({"slug": body.slug}):
        raise HTTPException(400, "Slug already exists")
    md = build_markdown(body.slug, body.title, body.sidebar_position, body.content, body.sidebar_label)
    if not write_doc(body.slug, md, f"docs: create {body.slug} [{admin.get('name', 'Admin')}]"):
        raise HTTPException(500, "GitHub write failed")
    result = await db.pages.insert_one({
        "slug": body.slug,
        "title": body.title,
        "content": body.content,
        "category": body.category,
        "sidebar_position": body.sidebar_position,
        "sidebar_label": body.sidebar_label,
        "isDraft": False,
        "authorId": str(admin["_id"]),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    })
    return {"id": str(result.inserted_id), "message": "Page created and published live"}

# PATCH /pages/{slug} — admin updates page (publishes immediately)
@router.patch("/{slug:path}")
async def update_page(slug: str, body: UpdatePage, admin=Depends(admin_only)):
    db = get_db()
    page = await db.pages.find_one({"slug": slug})
    if not page:
        raise HTTPException(404, "Page not found")
    
    # Derive title from slug if missing
    derived_title = derive_title(slug)
    title = body.title or page.get("title") or derived_title
    content = body.content if body.content is not None else page.get("content", "")
    position = body.sidebar_position or page.get("sidebar_position", 1)
    label = body.sidebar_label if body.sidebar_label is not None else (page.get("sidebar_label") or page.get("title") or derived_title)
    
    md = build_markdown(slug, title, position, content, label)
    write_doc(slug, md, f"docs: update {slug} [{admin.get('name', 'Admin')}]")
    await db.pages.update_one({"slug": slug}, {"$set": {
        "title": title,
        "content": content,
        "sidebar_position": position,
        "sidebar_label": label,
        "updatedAt": datetime.utcnow(),
    }})
    return {"message": "Page updated and live"}
