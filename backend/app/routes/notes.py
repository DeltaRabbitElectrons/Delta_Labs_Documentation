from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from app.database import get_db
from app.auth.jwt import current_user

router = APIRouter()


class SaveNote(BaseModel):
    workspace_id: str = "default"  # "default" for My Notes, or custom workspace ID
    title: str
    content: str  # Plain text / Markdown


class CreateWorkspace(BaseModel):
    name: str


# ──────────────── Notes CRUD ────────────────

@router.get("/")
async def get_notes(workspace_id: str = "default", user=Depends(current_user)):
    db = get_db()
    notes = await db.admin_notes.find({
        "adminId": str(user["_id"]),
        "workspaceId": workspace_id,
    }).sort("updatedAt", -1).to_list(100)
    return [
        {
            "id": str(n["_id"]),
            "title": n.get("title", "Untitled"),
            "content": n.get("content", ""),
            "updatedAt": n.get("updatedAt", n.get("createdAt")).isoformat(),
        }
        for n in notes
    ]


@router.post("/")
async def create_note(body: SaveNote, user=Depends(current_user)):
    db = get_db()
    result = await db.admin_notes.insert_one({
        "adminId": str(user["_id"]),
        "workspaceId": body.workspace_id,
        "title": body.title or "Untitled",
        "content": body.content,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    })
    return {"id": str(result.inserted_id)}


@router.patch("/{note_id}")
async def update_note(note_id: str, body: SaveNote, user=Depends(current_user)):
    db = get_db()
    result = await db.admin_notes.update_one(
        {"_id": ObjectId(note_id), "adminId": str(user["_id"])},
        {"$set": {
            "title": body.title,
            "content": body.content,
            "updatedAt": datetime.utcnow(),
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Note not found")
    return {"message": "Saved"}


@router.delete("/{note_id}")
async def delete_note(note_id: str, user=Depends(current_user)):
    db = get_db()
    await db.admin_notes.delete_one({"_id": ObjectId(note_id), "adminId": str(user["_id"])})
    return {"message": "Deleted"}


# ──────────────── Workspaces ────────────────

@router.get("/workspaces")
async def get_workspaces(user=Depends(current_user)):
    db = get_db()
    workspaces = await db.workspaces.find({
        "adminId": str(user["_id"])
    }).sort("createdAt", 1).to_list(50)
    return [
        {
            "id": str(w["_id"]),
            "name": w["name"],
            "createdAt": w["createdAt"].isoformat(),
        }
        for w in workspaces
    ]


@router.post("/workspaces")
async def create_workspace(body: CreateWorkspace, user=Depends(current_user)):
    if not body.name.strip():
        raise HTTPException(400, "Workspace name cannot be empty")
    db = get_db()
    result = await db.workspaces.insert_one({
        "adminId": str(user["_id"]),
        "name": body.name.strip(),
        "createdAt": datetime.utcnow(),
    })
    return {"id": str(result.inserted_id), "name": body.name.strip()}


@router.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: str, user=Depends(current_user)):
    db = get_db()
    # Also delete all notes in this workspace
    await db.admin_notes.delete_many({
        "adminId": str(user["_id"]),
        "workspaceId": workspace_id,
    })
    await db.workspaces.delete_one({
        "_id": ObjectId(workspace_id),
        "adminId": str(user["_id"]),
    })
    return {"message": "Workspace deleted"}
