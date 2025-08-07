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
from lastfm_client import LastfmClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """main"""
    # Load environment variables
    load_dotenv()
    
    # Get Spotify API configuration
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")
    lastfm_api_key = os.getenv("LASTFM_API_KEY")
    lastfm_api_secret = os.getenv("LASTFM_API_SECRET")
    # logger.info(lastfm_api_key, lastfm_api_secret)
    if not all([client_id, client_secret, redirect_uri, lastfm_api_key, lastfm_api_secret]):
        logger.info("Error: Please set the following environment variables:")
        logger.info("- SPOTIFY_CLIENT_ID")
        logger.info("- SPOTIFY_CLIENT_SECRET")
        logger.info("- SPOTIFY_REDIRECT_URI")
        logger.info("- LASTFM_API_KEY")
        logger.info("- LASTFM_API_SECRET")
        logger.info("\nPlease copy env.example to .env and fill in the corresponding values")
        return
    
    try:
        # Create Spotify client
        logger.info("Initializing Spotify client...")
        spotify_client = SpotifyClient(client_id, client_secret, redirect_uri)
        logger.info("Spotify client initialized successfully!")
        
        # Create Lastfm client
        logger.info("Initializing Lastfm client...")
        lastfm_client = LastfmClient(lastfm_api_key, lastfm_api_secret)
        logger.info("Lastfm client initialized successfully!")
        
        # Create MCP server
        logger.info("Starting MCP server...")
        mcp_server = SpotifyMCPServer(spotify_client, lastfm_client)
        logger.info("MCP server initialized successfully!")
        
        # Run server
        logger.info("MCP server started, waiting for connections...")
        logger.info("Using fastmcp library, supporting more concise API")
        
        # Check if event loop is already running
        mcp_server.run()
        
    except Exception as e:
        logger.info(f"Startup failed: {e}")
        logger.info("\nPlease ensure:")
        logger.info("1. Spotify API credentials are correctly set")
        logger.info("2. All dependencies are installed: pip install -r requirements.txt")
        logger.info("3. Network connection is normal")
        logger.info("4. fastmcp library is correctly installed")


if __name__ == "__main__":
    main()