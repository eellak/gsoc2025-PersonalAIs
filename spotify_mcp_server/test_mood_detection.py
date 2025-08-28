#!/usr/bin/env python3
"""
Test script for mood detection tool
"""

import asyncio
import json
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mcp_server import SpotifyMCPSuperServerV2
from spotify_client import SpotifySuperClient
from lastfm_client import LastfmClient
from llm_client import LLMClient

async def test_mood_detection():
    """Test the mood detection tool"""
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")
    lastfm_api_key = os.getenv("LASTFM_API_KEY")
    lastfm_api_secret = os.getenv("LASTFM_API_SECRET")
    
    # Initialize clients (you may need to adjust these based on your setup)
    spotify_client = SpotifySuperClient(client_id=client_id, client_secret=client_secret, redirect_uri=redirect_uri)
    lastfm_client = LastfmClient(api_key=lastfm_api_key, api_secret=lastfm_api_secret)
    llm_client = LLMClient(dashscope_api_key=os.getenv("DASHSCOPE_API_KEY"))
    
    # Create MCP server instance
    server = SpotifyMCPSuperServerV2(spotify_client, lastfm_client, llm_client)
    
    # Test cases
    test_cases = [
        "I'm feeling sad today",
        "I'm hyped and excited!",
        "I'm in a chill mood but want to feel more energetic",
        "I'm anxious and need something to calm me down",
        "I'm feeling relaxed and peaceful"
    ]
    
    print("Testing Mood Detection Tool\n")
    print("=" * 50)
    
    tools = await server.mcp.get_tools()
    mood_detection_tool = tools["mood_detection"]
    print('mood_detection_tool: ', mood_detection_tool)
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}: {test_case}")
        print("-" * 30)
    
        # Call the mood detection tool
        
        result = await mood_detection_tool.run({
            "user_mood_expression": test_case,
        })
        exit(0)
    print("=" * 50)
    print("Testing completed!")

if __name__ == "__main__":
    asyncio.run(test_mood_detection()) 