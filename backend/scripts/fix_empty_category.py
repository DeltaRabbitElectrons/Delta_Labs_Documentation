"""
One-time fix: removes empty categories from sidebars.ts on GitHub.
Run from backend/ directory:
    python scripts/fix_empty_category.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.github_client import get_repo
from github import GithubException
import re

def remove_empty_categories():
    repo = get_repo()
    path = "docs-site/sidebars.ts"

    try:
        file = repo.get_contents(path)
        content = file.decoded_content.decode("utf-8")
        original = content

        # Remove any category block that has an empty items array
        # Matches: { type: "category", label: "...", ..., items: [ ] }
        # This pattern handles whitespace/newlines inside items: []
        pattern = r'\s*\{\s*type:\s*"category"[^}]*items:\s*\[\s*\]\s*\},?'
        cleaned = re.sub(pattern, '', content, flags=re.DOTALL)

        # Also clean up any trailing commas before closing brackets
        cleaned = re.sub(r',(\s*[\]\}])', r'\1', cleaned)

        if cleaned == original:
            print("No empty categories found in sidebars.ts")
            return

        repo.update_file(
            path=path,
            message="fix: remove empty categories from sidebars.ts",
            content=cleaned,
            sha=file.sha,
            branch="main"
        )
        print("SUCCESS: Empty categories removed from sidebars.ts")
        print("Vercel will now rebuild automatically.")

    except GithubException as e:
        print(f"GitHub error: {e}")

if __name__ == "__main__":
    remove_empty_categories()
