import os
import subprocess
import re

def nuke_port(port):
    print(f"Cleaning Port {port}...")
    try:
        res = subprocess.run(f"netstat -ano", capture_output=True, text=True, shell=True)
        lines = res.stdout.splitlines()
        for line in lines:
            if f":{port}" in line and "LISTENING" in line:
                print(f"  Line found: {line}")
                parts = line.strip().split()
                if not parts: continue
                pid = parts[-1]
                print(f"  Attempting to kill PID {pid}...")
                subprocess.run(f"taskkill /F /PID {pid}", shell=True)
    except Exception as e:
        print(f"  Error: {e}")

ports = [3000, 8000, 8001]
for p in ports:
    nuke_port(p)

print("\nAll target ports cleaned up.")
