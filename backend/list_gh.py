import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.github_client import get_repo

def list_all(repo, path=""):
    try:
        contents = repo.get_contents(path)
        for item in contents:
            print(item.path)
            if item.type == "dir":
                list_all(repo, item.path)
    except Exception as e:
        print(f"Error {path}: {e}")

repo = get_repo()
list_all(repo)
