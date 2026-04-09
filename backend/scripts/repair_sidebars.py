"""
Reads sidebars.ts from GitHub, validates and repairs syntax,
then writes the fixed version back.
Run from backend/ directory:
    python scripts/repair_sidebars.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.github_client import get_repo
from github import GithubException
import re

def repair_sidebars():
    repo = get_repo()
    path = "docs-site/sidebars.ts"

    try:
        file = repo.get_contents(path)
        content = file.decoded_content.decode("utf-8")

        print("=== Current sidebars.ts (last 20 lines) ===")
        lines = content.split("\n")
        for i, line in enumerate(lines[-20:], len(lines) - 19):
            print(f"{i}: {line}")
        print("===========================================")

        fixed = content

        # Fix 1: Remove trailing commas before closing brackets/braces
        # e.g.  ,\n  ] → \n  ]
        fixed = re.sub(r',(\s*\])', r'\1', fixed)
        fixed = re.sub(r',(\s*\})', r'\1', fixed)

        # Fix 2: Remove double commas
        fixed = re.sub(r',\s*,', ',', fixed)

        # Fix 3: Remove commas on lines that only contain a comma
        fixed = re.sub(r'^\s*,\s*$', '', fixed, flags=re.MULTILINE)

        # Fix 4: Remove empty lines that are just whitespace
        fixed = re.sub(r'\n{3,}', '\n\n', fixed)

        # Fix 5: Make sure file ends with newline
        fixed = fixed.rstrip() + "\n"

        if fixed == content:
            print("No syntax issues found — file looks clean.")
            print("The error may be elsewhere. Printing line 485-490:")
            for i, line in enumerate(lines[484:490], 485):
                print(f"{i}: {repr(line)}")
            return

        print("\n=== Fixed sidebars.ts (last 20 lines) ===")
        fixed_lines = fixed.split("\n")
        for i, line in enumerate(fixed_lines[-20:], len(fixed_lines) - 19):
            print(f"{i}: {line}")
        print("==========================================")

        repo.update_file(
            path=path,
            message="fix: repair sidebars.ts syntax error",
            content=fixed,
            sha=file.sha,
            branch="main"
        )
        print("\nSUCCESS: sidebars.ts repaired and pushed to GitHub.")
        print("Vercel will rebuild automatically.")

    except GithubException as e:
        print(f"GitHub error: {e}")

if __name__ == "__main__":
    repair_sidebars()
