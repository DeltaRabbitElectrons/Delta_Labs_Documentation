import os
import re
from github import Github
from dotenv import load_dotenv

load_dotenv('.env')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_REPO = os.getenv('GITHUB_REPO')

def cleanup_gh_files():
    repo = Github(GITHUB_TOKEN).get_repo(GITHUB_REPO)
    docs_path = "docs-site/docs"
    
    contents = repo.get_contents(docs_path)
    all_files = []
    while contents:
        file_content = contents.pop(0)
        if file_content.type == "dir":
            contents.extend(repo.get_contents(file_content.path))
        else:
            all_files.append(file_content)

    for f in all_files:
        if not f.path.endswith(".md"): continue
        
        # Check if path contains 00- prefixes
        parts = f.path.split("/")
        new_parts = [re.sub(r'^\d+-', '', p) for p in parts]
        new_path = "/".join(new_parts)
        
        if new_path != f.path:
            print(f"Renaming {f.path} -> {new_path}")
            # To rename in GitHub, we create new and delete old
            try:
                # Check if new already exists
                try:
                    repo.get_contents(new_path)
                    print(f"  Warning: {new_path} already exists. Deleting {f.path}...")
                    repo.delete_file(f.path, f"cleanup: remove duplicate prefixed file {f.path}", f.sha)
                except:
                    # Create new with same content
                    content = f.decoded_content.decode("utf-8")
                    repo.create_file(new_path, f"chore: rename {f.path} to {new_path}", content)
                    repo.delete_file(f.path, f"chore: delete old prefixed file {f.path}", f.sha)
            except Exception as e:
                print(f"  Error renaming {f.path}: {e}")

if __name__ == "__main__":
    cleanup_gh_files()
