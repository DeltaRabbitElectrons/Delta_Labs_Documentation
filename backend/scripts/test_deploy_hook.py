"""
Tests the Vercel deploy hook directly.
Run from backend/ directory:
    python scripts/test_deploy_hook.py
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import requests

hook_url = os.getenv("VERCEL_DEPLOY_HOOK")

if not hook_url:
    print("ERROR: VERCEL_DEPLOY_HOOK is not set in backend/.env")
else:
    print(f"Hook URL found: {hook_url[:60]}...")
    print("Sending POST request...")
    try:
        response = requests.post(hook_url, timeout=15)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        if response.status_code in (200, 201):
            print("\nSUCCESS: Deploy hook fired! Check Vercel dashboard for new deployment.")
        else:
            print("\nERROR: Hook returned unexpected status. The hook URL may be expired.")
            print("Go to Vercel → Project Settings → Git → Deploy Hooks → create a new one.")
    except Exception as e:
        print(f"ERROR: {e}")
