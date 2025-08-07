import pylast
import os
from typing import List
import httpx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LastfmClient:
    def __init__(self, api_key, api_secret):
        self.api_key = api_key
        self.api_secret = api_secret
        self._init_lastfm_client()

    def _init_lastfm_client(self):
        self.lastfm = pylast.LastFMNetwork(
            api_key=self.api_key, api_secret=self.api_secret
        )
        SESSION_KEY_FILE = os.path.join(os.path.expanduser("~"), ".session_key")
        if not os.path.exists(SESSION_KEY_FILE):
            skg = pylast.SessionKeyGenerator(network)
            url = skg.get_web_auth_url()

            logger.info(f"Please authorize this script to access your account: {url}\n")
            import time
            import webbrowser

            webbrowser.open(url)

            while True:
                try:
                    session_key = skg.get_web_auth_session_key(url)
                    with open(SESSION_KEY_FILE, "w") as f:
                        f.write(session_key)
                    break
                except pylast.WSError:
                    time.sleep(1)
        else:
            session_key = open(SESSION_KEY_FILE).read()

        self.lastfm.session_key = session_key


    async def get_similar_artists(self, artist_names: List[str], limit: int = 10, include_original: bool = False):
        """Get similar artists for a given list of artist names.

        Args:
            artist_names (List[str]): The list of artist names.
            limit (int, optional): The number of similar artists to return. Defaults to 10.

        Returns:
            list: A list of similar artists.
        """
        try:
            similar_artists = []
            async with httpx.AsyncClient() as client:
                for artist_name in artist_names:
                    artist = self.lastfm.get_artist(artist_name)
                    similar_artists.extend([similar.item.name for similar in artist.get_similar(limit=limit)])
            if include_original:
                similar_artists.extend(artist_names)
            return list(set(similar_artists))
        except (pylast.WSError, httpx.HTTPError):
            return []