import os
import sys
from github import Github, GithubException, Auth

# Add backend directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.github_client import _trigger_vercel_rebuild

def delete_numbered_folders():
    auth = Auth.Token(settings.GITHUB_TOKEN)
    g = Github(auth=auth)
    repo = g.get_repo(settings.GITHUB_REPO)
    
    docs_path = "docs-site/docs"
    numbered_prefixes = [f"{i:02d}-" for i in range(11)]
    
    print(f"Connecting to repo: {settings.GITHUB_REPO}")
    print(f"Looking for ALL folders in: {docs_path}")
    
    try:
        contents = repo.get_contents(docs_path)
    except GithubException as e:
        print(f"Error fetching contents of {docs_path}: {e}")
        return

    all_dirs = [c.name for c in contents if c.type == "dir"]
    print(f"Directories found: {all_dirs}")

    folders_to_process = []
    for content_file in contents:
        if content_file.type == "dir":
            name = content_file.name
            if any(name.startswith(prefix) for prefix in numbered_prefixes):
                folders_to_process.append(content_file)

    if not folders_to_process:
        print("No numbered folders found (matching prefixes 00- to 10-).")
        # Trigger rebuild anyway just in case some were deleted manually or by previous run
        print("Firing Vercel deploy hook to be safe...")
        _trigger_vercel_rebuild()
        return

    print(f"Found {len(folders_to_process)} numbered folders to process:")
    for folder in folders_to_process:
        print(f" - {folder.path}")

    files_deleted_count = 0
    
    for folder in folders_to_process:
        print(f"\nProcessing folder: {folder.name}")
        try:
            # We fetch contents again because they might have changed
            try:
                folder_contents = repo.get_contents(folder.path)
            except GithubException as e:
                if e.status == 404:
                    print(f" Folder {folder.name} already seems to be gone (404).")
                    continue
                raise e

            # Recursively find all files in the folder
            all_files = []
            queue = list(folder_contents)
            while queue:
                item = queue.pop(0)
                if item.type == "dir":
                    try:
                        queue.extend(repo.get_contents(item.path))
                    except GithubException as e:
                        print(f"  Warning: could not get contents of {item.path}: {e}")
                else:
                    all_files.append(item)

            for item in all_files:
                print(f" Deleting file: {item.path}")
                try:
                    repo.delete_file(
                        path=item.path,
                        message=f"chore: remove duplicate numbered folder {folder.name}",
                        sha=item.sha,
                        branch=settings.GITHUB_BRANCH
                    )
                    files_deleted_count += 1
                except GithubException as e:
                    if e.status == 404:
                        print(f"  File {item.path} already gone (404).")
                    else:
                        print(f"  Error deleting {item.path}: {e}")
            
            print(f"Folder {folder.name} fully processed.")
                    
        except GithubException as e:
            print(f" Error processing folder {folder.name}: {e}")

    print(f"\nTotal files deleted: {files_deleted_count}")
    
    print("Firing Vercel deploy hook...")
    success = _trigger_vercel_rebuild()
    if success:
        print("Vercel deploy hook triggered successfully.")
    else:
        print("Failed to trigger Vercel deploy hook.")

if __name__ == "__main__":
    delete_numbered_folders()
