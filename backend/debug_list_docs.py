import os
import sys
import re
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.github_client import get_repo

def debug_list_docs():
    repo = get_repo()
    path = "docs-site/docs"
    print(f"Listing everything in {path}...")
    
    queue = [path]
    all_items = []
    
    while queue:
        current_path = queue.pop(0)
        try:
            contents = repo.get_contents(current_path)
            for item in contents:
                all_items.append(item.path)
                if item.type == "dir":
                    queue.append(item.path)
        except Exception as e:
            print(f"Error reading {current_path}: {e}")

    print(f"Total items found: {len(all_items)}")
    for item in all_items:
        if re.search(r'\d+-', item):
            print(f"FOUND NUMBERED: {item}")
        elif "design-system" in item:
            print(f"FOUND DESIGN-SYSTEM: {item}")

if __name__ == "__main__":
    debug_list_docs()
