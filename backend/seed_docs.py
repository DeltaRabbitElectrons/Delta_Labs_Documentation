import asyncio, os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Determine paths relative to this script
SCRIPT_DIR = Path(__file__).parent
DOCS_FOLDER = SCRIPT_DIR.parent / "docs-site" / "docs"

def parse_frontmatter(raw: str) -> dict:
    if not raw.startswith("---"):
        return {"title": "Untitled", "body": raw}
    end = raw.find("---", 3)
    if end == -1:
        return {"title": "Untitled", "body": raw}
    front = raw[3:end]
    body = raw[end + 3:].strip()
    meta = {}
    for line in front.strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip().strip('"')
    return {**meta, "body": body}

async def seed():
    # Use environment variables for connection
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME")
    
    if not mongodb_url or not database_name:
        print("Error: MONGODB_URL or DATABASE_NAME not set in .env")
        return

    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    seeded = 0
    
    if not DOCS_FOLDER.exists():
        print(f"Error: Docs folder not found at {DOCS_FOLDER}")
        return

    print(f"Scanning {DOCS_FOLDER}...")
    for md_file in DOCS_FOLDER.rglob("*.md"):
        rel = md_file.relative_to(DOCS_FOLDER)
        slug = str(rel.with_suffix("")).replace("\\", "/") # Ensure forward slashes for slugs
        category = str(rel.parts[0]) if len(rel.parts) > 1 else "General"
        parsed = parse_frontmatter(md_file.read_text(encoding="utf-8"))
        title = parsed.get("title", slug)
        body = parsed.get("body", "")
        position = int(parsed.get("sidebar_position", 1))
        label = parsed.get("sidebar_label") or None
        
        if await db.pages.find_one({"slug": slug}):
            print(f"  Skip (exists): {slug}")
            continue
            
        await db.pages.insert_one({
            "slug": slug, "title": title, "content": body,
            "category": category, "sidebar_position": position,
            "sidebar_label": label, "isDraft": False,
            "authorId": "seed",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        })
        print(f"  [OK] Seeded: {slug}")
        seeded += 1
    
    print(f"\nDone — seeded {seeded} pages into MongoDB.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
