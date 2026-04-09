import os
from github import Github
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("GITHUB_TOKEN")
repo_name = os.getenv("GITHUB_REPO")
g = Github(token)
repo = g.get_repo(repo_name)

path = "docs-site/docs/intro.md"
content = repo.get_contents(path).decoded_content.decode()
print(f"Current content of {path}:")
print(content[:100] + "...")

new_content = content + "\n\n<!-- updated at " + str(os.getpid()) + " -->"
sha = repo.get_contents(path).sha

print(f"Updating {path}...")
repo.update_file(path=path, message="Test push from assistant", content=new_content, sha=sha)
print("SUCCESS: Update pushed to GitHub.")
