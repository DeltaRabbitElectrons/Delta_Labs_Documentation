import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from github import Github

load_dotenv('.env')
MONGO_URI = os.getenv('MONGO_URI')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_REPO = os.getenv('GITHUB_REPO')

async def audit():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['deltalabs']
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("No sidebar doc")
        return

    repo = Github(GITHUB_TOKEN).get_repo(GITHUB_REPO)
    docs_path = "docs-site/docs"
    
    # List all doc files in GH
    gh_files = []
    contents = repo.get_contents(docs_path)
    while contents:
        file_content = contents.pop(0)
        if file_content.type == "dir":
            contents.extend(repo.get_contents(file_content.path))
        elif file_content.path.endswith(".md"):
            rel_path = file_content.path[len(docs_path):].lstrip("/")
            gh_files.append(rel_path[:-3]) # remove .md

    print(f"Total GH docs: {len(gh_files)}")

    def check_nodes(nodes):
        for n in nodes:
            if n.get("type") == "page":
                slug = n.get("slug")
                if not slug:
                    print(f"CRITICAL: Page node with no slug: {n.get('label')}")
                elif slug not in gh_files:
                    print(f"CRITICAL: Sidebar slug '{slug}' not found in GitHub docs!")
            elif n.get("type") == "category":
                check_nodes(n.get("children", []))

    check_nodes(doc.get("tree", []))

if __name__ == "__main__":
    asyncio.run(audit())
