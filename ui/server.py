#!/usr/bin/env python3
"""
Simple HTTP server for Nyayantar UI
Serves the frontend and proxies requests to FastAPI backend
"""
import http.server
import socketserver
import webbrowser
from pathlib import Path
import os

PORT = 3000
UI_DIR = Path(__file__).parent

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve files from UI directory"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(UI_DIR), **kwargs)
    
    def end_headers(self):
        # Add CORS headers to allow frontend to call FastAPI
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.end_headers()

def main():
    """Start the HTTP server"""
    os.chdir(UI_DIR)
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print("="*60)
        print("Nyayantar UI Server")
        print("="*60)
        print(f"Server running at: http://localhost:{PORT}")
        print(f"Serving files from: {UI_DIR}")
        print(f"\nFastAPI should be running at: http://localhost:8000")
        print(f"\nOpen your browser to: http://localhost:{PORT}")
        print("="*60)
        print("\nPress CTRL+C to stop the server\n")
        
        # Try to open browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")

if __name__ == "__main__":
    main()
