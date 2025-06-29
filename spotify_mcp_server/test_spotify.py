#!/usr/bin/env python3
"""
Spotify Client Test Script
"""

import os
from dotenv import load_dotenv
from spotify_client import SpotifyClient


def test_spotify_client():
    """Test Spotify client functionality"""
    # Load environment variables
    load_dotenv()
    
    # Get configuration
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")
    
    if not all([client_id, client_secret, redirect_uri]):
        print("❌ Please set environment variables first")
        return
    
    try:
        print("🔧 Initializing Spotify client...")
        client = SpotifyClient(client_id, client_secret, redirect_uri)
        print("✅ Spotify client initialized successfully!")
        
        # Test getting user profile
        print("\n👤 Testing user profile retrieval...")
        result = client.get_user_profile()
        if result["success"]:
            user = result["data"]
            print(f"✅ User: {user['display_name']}")
            print(f"   Email: {user.get('email', 'Not provided')}")
            print(f"   Account Type: {user.get('product', 'Unknown')}")
        else:
            print(f"❌ Failed to get user profile: {result['message']}")
        
        # Test getting playback status
        print("\n🎵 Testing playback status retrieval...")
        result = client.get_current_playback()
        if result["success"]:
            if result["data"]:
                track = result["data"]["item"]
                print(f"✅ Currently playing: {track['name']} - {', '.join([artist['name'] for artist in track['artists']])}")
            else:
                print("ℹ️  No content is currently playing")
        else:
            print(f"❌ Failed to get playback status: {result['message']}")
        
        # Test getting playlists
        print("\n📋 Testing playlist retrieval...")
        result = client.get_user_playlists(5)
        if result["success"]:
            playlists = result["data"]["items"]
            print(f"✅ Retrieved {len(playlists)} playlists:")
            for i, playlist in enumerate(playlists, 1):
                print(f"   {i}. {playlist['name']} ({playlist['tracks']['total']} tracks)")
        else:
            print(f"❌ Failed to get playlists: {result['message']}")
        
        # Test getting device list
        print("\n📱 Testing device list retrieval...")
        result = client.get_available_devices()
        if result["success"]:
            devices = result["data"]["devices"]
            print(f"✅ Retrieved {len(devices)} devices:")
            for i, device in enumerate(devices, 1):
                status = "Active" if device['is_active'] else "Inactive"
                print(f"   {i}. {device['name']} ({device['type']}) - {status}")
        else:
            print(f"❌ Failed to get device list: {result['message']}")
        
        print('get_user_playlists')
        # Test getting user's saved tracks
        print("\n❤️ Testing user's saved tracks retrieval...")
        result = client.get_user_playlists()
        print(f"Retrieved {len(result['data']['items'])} playlists")
        print(result)


        print("\n🎉 All tests completed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    test_spotify_client() 