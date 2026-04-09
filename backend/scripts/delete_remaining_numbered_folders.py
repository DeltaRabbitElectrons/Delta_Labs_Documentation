import os
import sys
import re
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
from app.github_client import get_repo
from github import GithubException

def get_all_files_recursive(repo, path):
    files = []
    print(f"DEBUG: Scanning {path}...")
    try:
        contents = repo.get_contents(path)
        for item in contents:
            if item.type == "dir":
                print(f"DEBUG: Entering dir {item.path}")
                files.extend(get_all_files_recursive(repo, item.path))
            else:
                files.append(item)
    except GithubException as e:
        print(f"Error reading {path}: {e}")
    return files

def is_numbered_folder(path):
    parts = path.split("/")
    for part in parts:
        if re.match(r'^\d+-', part):
            return True
    return False

repo = get_repo()
print("Scanning docs-site/docs/ for numbered folders...")

try:
    all_contents = get_all_files_recursive(repo, "docs-site/docs")
except Exception as e:
    print(f"Fatal error: {e}")
    sys.exit(1)

print(f"DEBUG: Total files found in docs-site/docs: {len(all_contents)}")

# Find all files inside numbered folders
to_delete = []
for f in all_contents:
    rel_path = f.path.replace("docs-site/docs/", "")
    if is_numbered_folder(rel_path):
        to_delete.append(f)
    # else:
    #     print(f"DEBUG: Keeping {rel_path}")

print(f"Found {len(to_delete)} files to delete in numbered folders")
print()

deleted = 0
failed = 0

for file in to_delete:
    try:
        repo.delete_file(
            path=file.path,
            message=f"chore: remove duplicate file {file.path}",
            sha=file.sha
        )
        print(f"DELETED: {file.path}")
        deleted += 1
    except GithubException as e:
        print(f"FAILED: {file.path} — {e}")
        failed += 1

print()
print(f"Done! Deleted: {deleted}, Failed: {failed}")
print("All numbered folder files removed.")
print("Vercel will now build successfully.")
