from github import Github, GithubException
from app.config import settings
import requests
import logging

logger = logging.getLogger(__name__)

def get_repo():
    return Github(settings.GITHUB_TOKEN).get_repo(settings.GITHUB_REPO)

def _trigger_vercel_rebuild():
    hook_url = settings.VERCEL_DEPLOY_HOOK_URL
    if not hook_url:
        logger.warning("VERCEL_DEPLOY_HOOK_URL not set in .env — skipping Vercel rebuild")
        return False

    try:
        logger.info(f"Firing Vercel deploy hook: {hook_url}")
        response = requests.post(hook_url, timeout=15)
        
        if response.status_code in (200, 201):
            logger.info(f"SUCCESS: Vercel deploy hook triggered — status {response.status_code}")
            try:
                data = response.json()
                # Vercel deploy hook response usually contains a job ID
                job_id = data.get("job", {}).get("id") or data.get("id")
                if job_id:
                    logger.info(f"Vercel response job ID: {job_id}")
            except Exception:
                pass
            return True
        else:
            logger.error(f"ERROR: Vercel deploy hook failed — status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.error(f"ERROR: Vercel deploy hook exception: {str(e)}")
        return False

def write_doc(slug: str, content: str, message: str) -> bool:
    """
    Write or update a Markdown file in GitHub.
    """
    path = f'{settings.DOCS_FOLDER}/{slug}.md'
    return write_file(path, content, message)

def write_file(path: str, content: str, message: str) -> bool:
    """
    Write any file to the GitHub repo.
    """
    try:
        repo = get_repo()
        try:
            existing = repo.get_contents(path)
            # File exists - update it
            logger.info(f"Updating existing file at {path}")
            repo.update_file(
                path=path, 
                message=message, 
                content=content, 
                sha=existing.sha,
                branch=getattr(settings, "GITHUB_BRANCH", "main")
            )
            logger.info(f"Successfully updated {path}")
            return True
        except GithubException as e:
            if e.status == 404:
                # File does not exist - create it
                logger.info(f"Creating new file at {path}")
                repo.create_file(
                    path=path, 
                    message=message, 
                    content=content,
                    branch=getattr(settings, "GITHUB_BRANCH", "main")
                )
                logger.info(f"Successfully created {path}")
                return True
            else:
                logger.error(f"GitHub API error (status {e.status}) for {path}: {e.data}")
                return False

    except Exception as e:
        logger.error(f"Unexpected error writing to GitHub {path}: {str(e)}")
        return False

def delete_file(path: str, message: str) -> bool:
    try:
        repo = get_repo()
        existing = repo.get_contents(path)
        repo.delete_file(path=path, message=message, sha=existing.sha)
        return True
    except GithubException as e:
        logger.error(f"GitHub delete error for {path}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error deleting {path}: {e}")
        return False

def get_file_history(slug: str, workspace: str = "docs") -> list:
    """
    Returns the commit history for a specific docs page AND sidebar changes from GitHub.
    """
    try:
        repo = get_repo()
        
        if workspace == "docs":
            page_path = f"{settings.DOCS_FOLDER}/{slug}.md"
            sidebar_path = "docs-site/sidebars.ts"
        else:
            page_path = f"docs-site/workspaces/{workspace}/{slug}.md"
            sidebar_path = f"docs-site/sidebars-{workspace}.json"

        # Fetch page commits
        page_commits = []
        try:
            page_commits = list(repo.get_commits(path=page_path)[:30])
            for c in page_commits:
                c._is_sidebar_change = False
        except GithubException as e:
            if e.status != 404:
                logger.error(f"GitHub page commits fetch error for {page_path}: {e}")

        # Fetch sidebar commits
        sidebar_commits = []
        try:
            sidebar_commits = list(repo.get_commits(path=sidebar_path)[:20])
            for c in sidebar_commits:
                c._is_sidebar_change = True
        except GithubException as e:
            if e.status != 404:
                logger.error(f"GitHub sidebar commits fetch error for {sidebar_path}: {e}")
        
        all_commits = page_commits + sidebar_commits
        # Sort by date descending
        all_commits.sort(key=lambda c: c.commit.author.date, reverse=True)
        
        history = []
        seen_shas = set()
        
        for commit in all_commits[:50]:
            if commit.sha in seen_shas:
                continue
            seen_shas.add(commit.sha)
            
            is_sidebar = getattr(commit, "_is_sidebar_change", False)

            history.append({
                "sha": commit.sha,
                "short_sha": commit.sha[:7],
                "message": commit.commit.message,
                "author_name": commit.commit.author.name,
                "author_email": commit.commit.author.email,
                "date": commit.commit.author.date.isoformat(),
                "github_url": commit.html_url,
                "is_sidebar": is_sidebar
            })
        
        return history
    except GithubException as e:
        print(f"GitHub history fetch error: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in get_file_history: {e}")
        return []

def get_file_at_commit(slug: str, commit_sha: str, workspace: str = "docs", is_sidebar: bool = False) -> str | None:
    """
    Returns the raw file content of a specific file (doc or sidebar JSON) at a specific commit SHA.
    """
    try:
        repo = get_repo()
        if is_sidebar:
            if workspace == "docs":
                path = "docs-site/sidebar-state.json"
            else:
                path = f"docs-site/sidebars-{workspace}.json"
        else:
            if workspace == "docs":
                path = f"{settings.DOCS_FOLDER}/{slug}.md"
            else:
                path = f"docs-site/workspaces/{workspace}/{slug}.md"
            
        try:
            file_content = repo.get_contents(path, ref=commit_sha)
            return file_content.decoded_content.decode("utf-8")
        except GithubException as e:
            if is_sidebar and workspace == "docs" and e.status == 404:
                # Fallback to sidebars.ts for main docs
                path = "docs-site/sidebars.ts"
                file_content = repo.get_contents(path, ref=commit_sha)
                return file_content.decoded_content.decode("utf-8")
            raise e
    except GithubException as e:
        print(f"GitHub get_file_at_commit error (sha={commit_sha}, workspace={workspace}, is_sidebar={is_sidebar}): {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in get_file_at_commit: {e}")
        return None

def list_all_docs() -> list[str]:
    """
    Returns a list of all .md files in the docs folder, recursively.
    Format: 'slug' (no leading slash, no .md extension)
    """
    try:
        repo = get_repo()
        docs_path = settings.DOCS_FOLDER
        all_files = []
        # Get recursively
        contents = repo.get_contents(docs_path)
        while contents:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                contents.extend(repo.get_contents(file_content.path))
            else:
                if file_content.path.endswith(".md"):
                    # Remove folder prefix + .md suffix
                    rel_path = file_content.path[len(docs_path):].lstrip("/")
                    slug = rel_path[:-3]
                    all_files.append(slug)
        return all_files
    except Exception as e:
        logger.error(f"Error listing docs from GitHub: {e}")
        return []


def list_workspace_docs(workspace_slug: str) -> list[str]:
    """
    Returns a list of all .md file slugs in a specific workspace folder.
    Scans docs-site/workspaces/{workspace_slug}/ recursively.
    Format: 'slug' (no leading slash, no .md extension)
    """
    try:
        repo = get_repo()
        ws_path = f"docs-site/workspaces/{workspace_slug}"
        all_files = []
        try:
            contents = repo.get_contents(ws_path)
        except GithubException as e:
            if e.status == 404:
                logger.info(f"Workspace folder '{ws_path}' does not exist in GitHub yet")
                return []
            raise

        while contents:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                contents.extend(repo.get_contents(file_content.path))
            elif file_content.path.endswith(".md"):
                rel_path = file_content.path[len(ws_path):].lstrip("/")
                slug = rel_path[:-3]  # Remove .md extension
                all_files.append(slug)
        return all_files
    except Exception as e:
        logger.error(f"Error listing workspace docs from GitHub ({workspace_slug}): {e}")
        return []
