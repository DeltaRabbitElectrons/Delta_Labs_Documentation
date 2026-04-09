import os
import re
from github import Github
from dotenv import load_dotenv

load_dotenv('.env')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_REPO = os.getenv('GITHUB_REPO')

def derive_title(slug: str) -> str:
    if not slug: return "Untitled"
    return slug.split("/")[-1].replace("-", " ").title()

def fix_frontmatter():
    repo = Github(GITHUB_TOKEN).get_repo(GITHUB_REPO)
    docs_path = "docs-site/docs"
    
    contents = repo.get_contents(docs_path)
    all_files = []
    while contents:
        file_content = contents.pop(0)
        if file_content.type == "dir":
            contents.extend(repo.get_contents(file_content.path))
        elif file_content.path.endswith(".md"):
            all_files.append(file_content)

    for f in all_files:
        content = f.decoded_content.decode("utf-8")
        slug = f.path[len(docs_path): -3].lstrip("/")
        
        # Check for empty/null title or sidebar_label in frontmatter
        fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not fm_match: continue
        
        fm_block = fm_match.group(1)
        original_fm = fm_block
        
        # Parse simple keys
        lines = fm_block.split('\n')
        new_lines = []
        modified = False
        
        for line in lines:
            if line.startswith('title:'):
                val = line[len('title:'):].strip()
                if not val or val.lower() == 'null':
                    line = f'title: {derive_title(slug)}'
                    modified = True
            elif line.startswith('sidebar_label:'):
                val = line[len('sidebar_label:'):].strip()
                if not val or val.lower() == 'null':
                    # Find title value
                    title_match = re.search(r'title: (.*)', fm_block)
                    title = title_match.group(1) if title_match else derive_title(slug)
                    line = f'sidebar_label: {title}'
                    modified = True
            new_lines.append(line)
        
        if modified:
            new_fm = '\n'.join(new_lines)
            new_content = content.replace(original_fm, new_fm)
            print(f"Fixing frontmatter for {f.path}")
            repo.update_file(f.path, f"chore: fix invalid frontmatter in {slug}", new_content, f.sha)

if __name__ == "__main__":
    fix_frontmatter()
