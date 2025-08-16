import pylast
import os
from dotenv import load_dotenv
from lastfm_client import LastfmClient
import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

API_KEY = os.getenv("LASTFM_API_KEY")
API_SECRET = os.getenv("LASTFM_API_SECRET")

client = LastfmClient(API_KEY, API_SECRET)

similar_artists = asyncio.run(client.get_similar_artists("Ed Sheeran", 3))
logger.info(similar_artists)

albums = asyncio.run(client.get_albums_of_artists(["Ed Sheeran"]))
import pdb; pdb.set_trace()
logger.info('====================')
logger.info(albums)
logger.info('====================')
albums = [album for artist_albums in albums.values() for album in artist_albums]
tracks = asyncio.run(client.get_track_titles_of_albums(albums))
logger.info('----------------')
logger.info(tracks)
logger.info('----------------')
i = 1
for album, track_titles in tracks.items():
    logger.info(f"Album {i}: {album}")
    logger.info(f"Tracks: {track_titles}")
    i += 1


import pdb; pdb.set_trace()
