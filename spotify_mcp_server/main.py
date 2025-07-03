#!/usr/bin/env python3
"""
Spotify MCP Server Main Program
Using fastmcp library
"""

import os
import asyncio
from dotenv import load_dotenv
from spotify_client import SpotifySuperClient as SpotifyClient
from mcp_server import SpotifyMCPSuperServer as SpotifyMCPServer


def main():
    """main"""
    # Load environment variables
    load_dotenv()
    
    # Get Spotify API configuration
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")
    
    if not all([client_id, client_secret, redirect_uri]):
        print("Error: Please set the following environment variables:")
        print("- SPOTIFY_CLIENT_ID")
        print("- SPOTIFY_CLIENT_SECRET")
        print("- SPOTIFY_REDIRECT_URI")
        print("\nPlease copy env.example to .env and fill in the corresponding values")
        return
    
    try:
        # Create Spotify client
        print("Initializing Spotify client...")
        spotify_client = SpotifyClient(client_id, client_secret, redirect_uri)
        print("Spotify client initialized successfully!")
        
        # Create MCP server
        print("Starting MCP server...")
        mcp_server = SpotifyMCPServer(spotify_client)
        
        # Run server
        print("MCP server started, waiting for connections...")
        print("Using fastmcp library, supporting more concise API")
        
        # Check if event loop is already running
        mcp_server.run()
        
    except Exception as e:
        print(f"Startup failed: {e}")
        print("\nPlease ensure:")
        print("1. Spotify API credentials are correctly set")
        print("2. All dependencies are installed: pip install -r requirements.txt")
        print("3. Network connection is normal")
        print("4. fastmcp library is correctly installed")


if __name__ == "__main__":
    main() 