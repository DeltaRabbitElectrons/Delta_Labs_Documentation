from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.auth.jwt import current_user

router = APIRouter()


class SendMessage(BaseModel):
    text: str


@router.get("/messages")
async def get_messages(limit: int = 100, user=Depends(current_user)):
    db = get_db()
    messages = await db.chat_messages.find({}).sort("createdAt", -1).limit(limit).to_list(limit)
    messages.reverse()  # oldest first for display
    return [
        {
            "id": str(m["_id"]),
            "text": m["text"],
            "authorId": m["authorId"],
            "authorName": m["authorName"],
            "authorInitials": m["authorName"][:2].upper(),
            "createdAt": m["createdAt"].isoformat(),
        }
        for m in messages
    ]


@router.post("/messages")
async def send_message(body: SendMessage, user=Depends(current_user)):
    if not body.text.strip():
        raise HTTPException(400, "Message cannot be empty")
    if len(body.text) > 2000:
        raise HTTPException(400, "Message too long (max 2000 chars)")

    db = get_db()
    await db.chat_messages.insert_one({
        "text": body.text.strip(),
        "authorId": str(user["_id"]),
        "authorName": user["name"],
        "createdAt": datetime.utcnow(),
    })
    return {"message": "Sent"}
