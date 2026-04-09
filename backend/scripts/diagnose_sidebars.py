"""
Diagnoses exact character at the error location in sidebars.ts
Run from backend/ directory:
    python scripts/diagnose_sidebars.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.github_client import get_repo

def diagnose():
    repo = get_repo()
    file = repo.get_contents("docs-site/sidebars.ts")
    content = file.decoded_content.decode("utf-8")
    lines = content.split("\n")

    # Print lines around the error
    start = max(0, 480)
    end = min(len(lines), 500)
    print(f"Lines {start+1}-{end} with exact characters:")
    for i, line in enumerate(lines[start:end], start+1):
        print(f"Line {i}: {repr(line)}")

    print("\nTotal lines:", len(lines))

if __name__ == "__main__":
    diagnose()
