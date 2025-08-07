import pylast
import os
from dotenv import load_dotenv
from lastfm_client import LastfmClient

load_dotenv()

API_KEY = os.getenv("LASTFM_API_KEY")
API_SECRET = os.getenv("LASTFM_API_SECRET")

client = LastfmClient(API_KEY, API_SECRET)

similar_artists = client.get_similar_artists("Ed Sheeran")
print(similar_artists)


import pdb; pdb.set_trace()
