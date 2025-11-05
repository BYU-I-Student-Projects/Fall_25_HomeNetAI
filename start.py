#!/usr/bin/env python3
"""
Simple script to start both backend and frontend
"""
import subprocess
import sys
import os
import time

def start_backend():
    """Start the backend server"""
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    return subprocess.Popen(
        [sys.executable, 'start_backend.py'],
        cwd=backend_dir,
        shell=True
    )

def start_frontend():
    """Start the frontend server"""
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    
    # Check if node_modules exists
    if not os.path.exists(os.path.join(frontend_dir, 'node_modules')):
        print("Frontend dependencies not installed.")
        print("Please run: cd frontend && npm install")
        print("Then run this script again.")
        sys.exit(1)
    
    return subprocess.Popen(
        'npm run dev',
        cwd=frontend_dir,
        shell=True
    )

def main():
    print("Starting HomeNetAI...")
    print("=" * 50)
    
    # Start backend
    print("Starting backend...")
    backend_process = start_backend()
    time.sleep(2)  # Give backend time to start
    
    # Start frontend
    print("Starting frontend...")
    frontend_process = start_frontend()
    time.sleep(2)  # Give frontend time to start
    
    print("\nBoth servers started!")
    print("Backend: http://localhost:8000")
    print("Frontend: http://localhost:8080")
    print("API Docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop both servers\n")
    
    try:
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n\nStopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Servers stopped")

if __name__ == "__main__":
    main()

