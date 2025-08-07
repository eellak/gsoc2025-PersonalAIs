#!/usr/bin/env python3
"""
Spotify Client Test Script
"""

import os
from dotenv import load_dotenv
from spotify_client import SpotifySuperClient as SpotifyClient
from tqdm import tqdm
import asyncio
from lastfm_client import LastfmClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_spotify_client():
    """Test Spotify client functionality (async)"""
    # Load environment variables
    load_dotenv()
    
    # Get configuration
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")
    lastfm_api_key = os.getenv("LASTFM_API_KEY")
    lastfm_api_secret = os.getenv("LASTFM_API_SECRET")
    
    lastfm_client = LastfmClient(lastfm_api_key, lastfm_api_secret)

    if not all([client_id, client_secret, redirect_uri, lastfm_api_key, lastfm_api_secret]):
        logger.info("❌ Please set environment variables first")
        return
    
    # try:
    logger.info("🔧 Initializing Spotify client...")
    client = SpotifyClient(client_id, client_secret, redirect_uri)
    logger.info("✅ Spotify client initialized successfully!")
    
    # Test getting user profile
    logger.info("\n👤 Testing user profile retrieval...")
    result = client.get_user_profile()
    if result["success"]:
        user = result["data"]
        logger.info(f"✅ User: {user['display_name']}")
        logger.info(f"   Email: {user.get('email', 'Not provided')}")
        logger.info(f"   Account Type: {user.get('product', 'Unknown')}")
    else:
        logger.info(f"❌ Failed to get user profile: {result['message']}")
    
    # Test getting playback status
    logger.info("\n🎵 Testing playback status retrieval...")
    result = client.get_current_playback()
    if result["success"]:
        if result["data"]:
            track = result["data"]["item"]
            logger.info(f"✅ Currently playing: {track['name']} - {', '.join([artist['name'] for artist in track['artists']])}")
        else:
            logger.info("ℹ️  No content is currently playing")
    else:
        logger.info(f"❌ Failed to get playback status: {result['message']}")
    
    # Test getting playlists
    logger.info("\n📋 Testing playlist retrieval...")
    result = client.get_user_playlists(5)
    if result["success"]:
        playlists = result["data"]["items"]
        logger.info(f"✅ Retrieved {len(playlists)} playlists:")
        for i, playlist in enumerate(playlists, 1):
            logger.info(f"   {i}. {playlist['name']} ({playlist['tracks']['total']} tracks)")
    else:
        logger.info(f"❌ Failed to get playlists: {result['message']}")
    
    # Test getting device list
    logger.info("\n📱 Testing device list retrieval...")
    result = client.get_available_devices()
    if result["success"]:
        devices = result["data"]["devices"]
        logger.info(f"✅ Retrieved {len(devices)} devices:")
        for i, device in enumerate(devices, 1):
            status = "Active" if device['is_active'] else "Inactive"
            logger.info(f"   {i}. {device['name']} ({device['type']}) - {status}")
    else:
        logger.info(f"❌ Failed to get device list: {result['message']}")
    
    logger.info('get_user_playlists')
    # Test getting user's saved tracks
    logger.info("\n❤️ Testing user's saved tracks retrieval...")
    result = client.get_user_playlists()
    logger.info(f"Retrieved {len(result['data']['items'])} playlists")

    # # recall tracks testing
    # _, artist_names = client.recall_artists()
    # # artist_ids = await client.get_tivo_artist_ids(artist_names[:3])
    # artist_ids = await client.get_tivo_artist_ids(artist_names)
    # # de-duplicate artist_ids
    # artist_ids = list(set(artist_ids))
    # print('artist_names:', artist_names)
    # artist_album_dict = await client.get_tivo_artist_album_ids(artist_ids)
    # tivo_tracks = await client.get_tivo_tracks_in_artist_album_dict(artist_album_dict)
    # recall_track_titles = [track['title'] for track in tivo_tracks]
    # search_tracks = []  
    # search_track_ids = []
    # search_artist_names = []
    # # search_tracks: dict_keys(['album', 'artists', 'available_markets', 'disc_number', 'duration_ms', 'explicit', 'external_ids', 'external_urls', 'href', 'id', 'is_local', 'is_playable', 'name', 'popularity', 'preview_url', 'track_number', 'type', 'uri'])
    # for track_title in tqdm(recall_track_titles, desc="Searching tracks"):
    #     search_track = client.search_tracks(track_title)
    #     if search_track['success'] and len(search_track['data']['tracks']['items']) > 0:
    #         search_item = search_track['data']['tracks']['items'][0]
    #         if search_item['id'] in search_track_ids:
    #             continue
    #         search_tracks.append(search_item)
    #         search_track_ids.append(search_item['id'])
    #         search_artist_names.append(', '.join([artist['name'] for artist in search_item['artists']]))
    # result = {
    #     'success': True,
    #     'data': {
    #         'tracks': search_tracks,
    #         'track_ids': search_track_ids,
    #         'artist_names': search_artist_names,
    #     },
    #     'message': "Successfully recall tracks",
    # }


    # tivo_tracks = await client.recall_all_tivo_tracks_obj()
    # result = await client.recall_all_tracks()
    # result = await client.recall_tracks_based_on_artist_name('Ed Sheeran')

    # Test getting similar artists
    logger.info("\n🎵 Testing similar artists retrieval...")
    # similar_artists = await lastfm_client.get_similar_artists(["Ed Sheeran"], limit=10)
    similar_artists = await lastfm_client.get_similar_artists(["Justin Bieber"], limit=10, include_original=True)
    logger.info(f"✅ Retrieved {len(similar_artists)} similar artists:")
    for i, artist in enumerate(similar_artists, 1):
        logger.info(f"   {i}. {artist}")

    # results = client.recall_artists()
    # results = client.recall_artists(lastfm_similar_artists=similar_artists)
    results = await client.recall_tracks_based_on_artist_names(lastfm_similar_artists=similar_artists)
    logger.info(results)
    import pdb; pdb.set_trace()
    
    # with open('result.json', 'w') as f:
    #     import json
    #     json.dump(result, f, indent=4)
    # print("\n🎉 All tests completed!")
    
    # except Exception as e:
    #     print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    asyncio.run(test_spotify_client())