import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.github_client import get_repo
from github import GithubException

def delete_junk_files():
    repo = get_repo()
    
    junk_files = [
        "docs-site/docs/in.md",
        "docs-site/docs/intro1.md",
        "docs-site/docs/intro11.md",
        "docs-site/docs/it.md",
    ]
    
    for path in junk_files:
        try:
            file = repo.get_contents(path)
            repo.delete_file(
                path=path,
                message=f"chore: remove junk file {path}",
                sha=file.sha,
                branch="main"
            )
            print(f"Deleted: {path}")
        except GithubException as e:
            if e.status == 404:
                print(f"Already gone (404): {path}")
            else:
                print(f"Error deleting {path}: {e}")

if __name__ == "__main__":
    delete_junk_files()
    print("Done.")
