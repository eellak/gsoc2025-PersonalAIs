#!/usr/bin/env python3
"""
Demo for testing recommend_tracks tool
"""

import os
import asyncio
from dotenv import load_dotenv
from spotify_client import SpotifySuperClient as SpotifyClient
from mcp_server import SpotifyMCPSuperServerV2
from lastfm_client import LastfmClient
from llm_client import LLMClient
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_recommend_tracks():
    # Load environment variables
    load_dotenv()
    
    # Get API credentials from environment
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")
    lastfm_api_key = os.getenv("LASTFM_API_KEY")
    lastfm_api_secret = os.getenv("LASTFM_API_SECRET")
    dashscope_api_key = os.getenv("DASHSCOPE_API_KEY")
    
    # Check if all credentials are provided
    if not all([client_id, client_secret, redirect_uri, lastfm_api_key, lastfm_api_secret, dashscope_api_key]):
        logger.error("Error: Missing API credentials. Please check your .env file.")
        return
    
    try:
        # Initialize clients
        logger.info("Initializing Spotify client...")
        spotify_client = SpotifyClient(client_id, client_secret, redirect_uri)
        logger.info("Spotify client initialized successfully!")
        
        logger.info("Initializing Last.fm client...")
        lastfm_client = LastfmClient(lastfm_api_key, lastfm_api_secret)
        logger.info("Last.fm client initialized successfully!")
        
        logger.info("Initializing LLM client...")
        llm_client = LLMClient(dashscope_api_key)
        logger.info("LLM client initialized successfully!")
        
        # Initialize MCP server
        logger.info("Initializing MCP server...")
        mcp_server = SpotifyMCPSuperServerV2(spotify_client, lastfm_client, llm_client)
        logger.info("MCP server initialized successfully!")
        
        # Test recommend_tracks with different activities
        test_activities = [
            "working out",  # Continuous activity
            "mood changing from happy to sad",  # Mood change activity
            "relaxing after a stressful day"  # Emotional journey activity
        ]
        
        for activity in test_activities:
            logger.info(f"\nTesting recommend_tracks with activity: '{activity}'")
            # result = await mcp_server.recommend_tracks(activity)
            # tool = mcp_server.setup_tools.recommend_tracks(
            #     activity=activity,
            #     limit=5,
            # )
            tools = await mcp_server.mcp.get_tools()
            recommend_tracks_tool = tools["recommend_tracks"]
            print('recommend_tracks_tool: ', recommend_tracks_tool)
            result = await recommend_tracks_tool.run({
                "activity": activity,
                "limit": 5,
            })

            result = json.loads(result[0].text)
            import pdb; pdb.set_trace()
            if result["success"]:
                logger.info(f"Success: {result['message']}")
                logger.info(f"Playlist ID: {result.get('playlist_id', 'N/A')}")
                logger.info(f"Start point: {result['start_point']}")
                logger.info(f"End point: {result['end_point']}")
                logger.info("Recommended tracks:")
                for i, track in enumerate(result['recommended_tracks'], 1):
                    track_name = track['name']
                    artists = ', '.join([artist for artist in track['artists']])
                    valence = track['valence']
                    energy = track['energy']
                    logger.info(f"  {i}. {track_name} by {artists} - Valence: {valence:.2f}, Energy: {energy:.2f}")
            else:
                logger.error(f"Failed: {result['message']}")
                if 'error_details' in result:
                    logger.error(f"Error details: {result['error_details']}")
    
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_recommend_tracks())