"""
CRITICAL FIX: Syncs real content from GitHub .md files into MongoDB pages collection.
Portal shows empty pages because MongoDB content is empty.
This script reads every .md file from GitHub and updates MongoDB with real content.

Run from backend/ directory:
    python scripts/sync_content_from_github.py
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio
from app.config import settings
from app.github_client import get_repo
from github import GithubException

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]


def get_all_md_files(repo, path="docs-site/docs"):
    """Recursively get all .md files from GitHub."""
    files = []
    try:
        contents = repo.get_contents(path)
        for item in contents:
            if item.type == "dir":
                files.extend(get_all_md_files(repo, item.path))
            elif item.name.endswith(".md") and item.name != "README.md":
                files.append(item)
    except GithubException as e:
        print(f"Error reading {path}: {e}")
    return files


def parse_md_file(raw: str) -> dict:
    """
    Parse a .md file — extract frontmatter and body content.
    Returns dict with title, sidebar_label, content.
    """
    title = ""
    sidebar_label = ""
    content = raw

    if raw.startswith("---"):
        parts = raw.split("---", 2)
        if len(parts) >= 3:
            frontmatter = parts[1].strip()
            content = parts[2].strip()

            # Parse frontmatter fields
            for line in frontmatter.split("\n"):
                if line.startswith("title:"):
                    title = line.replace("title:", "").strip().strip('"').strip("'")
                elif line.startswith("sidebar_label:"):
                    sidebar_label = line.replace("sidebar_label:", "").strip().strip('"').strip("'")

    return {
        "title": title,
        "sidebar_label": sidebar_label or title,
        "content": content,
    }


def file_path_to_slug(path: str) -> str:
    """Convert 'docs-site/docs/getting-started/intro.md' → 'getting-started/intro'"""
    return path.replace("docs-site/docs/", "").replace(".md", "")


def derive_title(slug: str) -> str:
    return slug.split("/")[-1].replace("-", " ").title()


async def sync():
    repo = get_repo()
    print("Reading all .md files from GitHub...")
    all_files = get_all_md_files(repo)
    print(f"Found {len(all_files)} .md files\n")

    updated = 0
    created = 0
    skipped = 0

    for file in all_files:
        slug = file_path_to_slug(file.path)

        try:
            raw = file.decoded_content.decode("utf-8")
            parsed = parse_md_file(raw)

            title = parsed["title"] or derive_title(slug)
            sidebar_label = parsed["sidebar_label"] or title
            content = parsed["content"]

            # Check if MongoDB record exists
            existing = await db.pages.find_one({"slug": slug})

            if existing:
                # Update with real content from GitHub
                # Only update if content is actually different or empty
                existing_content = existing.get("content", "")
                if not existing_content or existing_content != content:
                    await db.pages.update_one(
                        {"slug": slug},
                        {"$set": {
                            "title": title,
                            "sidebar_label": sidebar_label,
                            "content": content,
                        }}
                    )
                    print(f"  UPDATED: {slug} ({len(content)} chars)")
                    updated += 1
                else:
                    skipped += 1
            else:
                # Create new record
                await db.pages.insert_one({
                    "slug": slug,
                    "title": title,
                    "sidebar_label": sidebar_label,
                    "content": content,
                    "change_log": [],
                    "isDraft": False,
                })
                print(f"  CREATED: {slug}")
                created += 1

        except Exception as e:
            print(f"  ERROR processing {slug}: {e}")

    print(f"\n{'='*50}")
    print(f"Sync complete!")
    print(f"  Updated: {updated}")
    print(f"  Created: {created}")
    print(f"  Already in sync: {skipped}")
    print(f"  Total processed: {updated + created + skipped}")
    print(f"\nPortal should now show real content for all pages.")


asyncio.run(sync())
