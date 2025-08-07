import pylast
import os
from dotenv import load_dotenv
from lastfm_client import LastfmClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

API_KEY = os.getenv("LASTFM_API_KEY")
API_SECRET = os.getenv("LASTFM_API_SECRET")

client = LastfmClient(API_KEY, API_SECRET)

similar_artists = client.get_similar_artists("Ed Sheeran")
logger.info(similar_artists)


import pdb; pdb.set_trace()
