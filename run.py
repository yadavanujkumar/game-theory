"""
Game Theory Simulation Studio Launcher
Starts the FastAPI server with PyTorch AI backend and opens the web UI in your default browser.
"""

import sys
import os
import webbrowser
import threading
import time

def start_server():
    import uvicorn
    # Add python directory to sys.path
    python_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "python")
    sys.path.insert(0, python_dir)
    
    from server import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

def main():
    print("=" * 65)
    print(" ⚡ GAME THEORY SIMULATION STUDIO (AI & EVOLUTIONARY LAB)")
    print("=" * 65)
    print(" [1] Starting FastAPI / PyTorch Backend Server...")
    print(" [2] Serving interactive Web UI at: http://127.0.0.1:8000")
    print(" [3] Opening your web browser...")
    print("=" * 65)

    def open_browser():
        time.sleep(1.2)
        webbrowser.open("http://127.0.0.1:8000")

    threading.Thread(target=open_browser, daemon=True).start()
    start_server()

if __name__ == "__main__":
    main()
