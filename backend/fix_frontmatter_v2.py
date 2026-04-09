import os
import re
from github import Github
from dotenv import load_dotenv
import time

load_dotenv('.env')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_REPO = os.getenv('GITHUB_REPO')

def derive_title(slug: str) -> str:
    if not slug: return "Untitled"
    # remove extension and split by slash
    name = slug.split("/")[-1]
    # replace dashes/underscores with spaces and title case
    return name.replace("-", " ").replace("_", " ").title()

def fix_frontmatter():
    repo = Github(GITHUB_TOKEN).get_repo(GITHUB_REPO)
    docs_path = "docs-site/docs"
    
    print(f"Scanning {docs_path} in {GITHUB_REPO}...")
    
    def get_all_files(path):
        files = []
        contents = repo.get_contents(path)
        for item in contents:
            if item.type == "dir":
                files.extend(get_all_files(item.path))
            elif item.name.endswith(".md"):
                files.append(item)
        return files

    all_files = get_all_files(docs_path)
    print(f"Found {len(all_files)} markdown files.")

    for f in all_files:
        content = f.decoded_content.decode("utf-8")
        slug = f.path[len(docs_path): -3].lstrip("/")
        
        # Match frontmatter block
        fm_match = re.search(r'^---\r?\n(.*?)\r?\n---', content, re.DOTALL)
        if not fm_match:
            # No frontmatter? Add it!
            title = derive_title(slug)
            new_content = f"---\ntitle: {title}\nsidebar_label: {title}\n---\n\n" + content
            print(f"Adding missing frontmatter to {f.path}")
            repo.update_file(f.path, f"docs: add missing frontmatter to {slug}", new_content, f.sha)
            continue
        
        fm_block = fm_match.group(1)
        lines = fm_block.split('\n')
        new_lines = []
        modified = False
        
        has_title = False
        has_sidebar_label = False
        current_title = ""
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            if ":" not in line:
                new_lines.append(line)
                continue
                
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip()
            
            if key == "title":
                has_title = True
                if not val or val.lower() in ["null", "none", "undefined", '""', "''"]:
                    val = derive_title(slug)
                    modified = True
                current_title = val
                new_lines.append(f"title: {val}")
            elif key == "sidebar_label":
                has_sidebar_label = True
                if not val or val.lower() in ["null", "none", "undefined", '""', "''"]:
                    val = current_title or derive_title(slug)
                    modified = True
                new_lines.append(f"sidebar_label: {val}")
            else:
                new_lines.append(line)

        if not has_title:
            title = derive_title(slug)
            new_lines.insert(0, f"title: {title}")
            current_title = title
            modified = True
        
        if not has_sidebar_label:
            val = current_title or derive_title(slug)
            new_lines.append(f"sidebar_label: {val}")
            modified = True
        
        if modified:
            new_fm = "---\n" + "\n".join(new_lines) + "\n---"
            new_content = re.sub(r'^---\r?\n.*?\r?\n---', new_fm, content, flags=re.DOTALL)
            print(f"FIXING: {f.path}")
            try:
                repo.update_file(f.path, f"docs: fix frontmatter in {slug}", new_content, f.sha)
                # Sleep a bit to avoid secondary rate limits
                time.sleep(0.5)
            except Exception as e:
                print(f"ERROR updating {f.path}: {e}")

if __name__ == "__main__":
    fix_frontmatter()
    print("DONE.")
