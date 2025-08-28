import pylast
import os
from typing import List, Dict
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
        logger.info('api_key: %s', self.api_key)
        logger.info('api_secret: %s', self.api_secret)
        self.lastfm = pylast.LastFMNetwork(
            api_key=self.api_key, api_secret=self.api_secret
        )
        # SESSION_KEY_FILE = os.path.join(os.path.expanduser("~"), ".session_key")
        # logger.info('SESSION_KEY_FILE: %s', SESSION_KEY_FILE)
        # if not os.path.exists(SESSION_KEY_FILE):
        #     logger.info('SESSION_KEY_FILE does not exist')
        #     skg = pylast.SessionKeyGenerator(self.lastfm)
        #     url = skg.get_web_auth_url()

        #     logger.info(f"Please authorize this script to access your account: {url}\n")
        #     import time
        #     import webbrowser

        #     webbrowser.open(url)

        #     while True:
        #         try:
        #             session_key = skg.get_web_auth_session_key(url)
        #             with open(SESSION_KEY_FILE, "w") as f:
        #                 f.write(session_key)
        #             break
        #         except pylast.WSError:
        #             time.sleep(1)
        # else:
        #     session_key = open(SESSION_KEY_FILE).read()

        # self.lastfm.session_key = session_key


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
            if isinstance(artist_names, str):
                artist_names = [artist_names]
            async with httpx.AsyncClient() as client:
                for artist_name in artist_names:
                    artist = self.lastfm.get_artist(artist_name)
                    similar_artists.extend([similar.item.name for similar in artist.get_similar(limit=limit)])
            if include_original:
                similar_artists.extend(artist_names)
            return list(set(similar_artists))
        except (pylast.WSError, httpx.HTTPError):
            return []

    # get albums of artists
    async def get_albums_of_artists(self, artist_names: List[str], limit: int = 10) -> Dict[str, List[pylast.Album]]:   
        """Get albums of artists.

        Args:
            artist_names (List[str]): The list of artist names.
            limit (int, optional): The number of albums to return. Defaults to 10.

        Returns:
            Dict[str, List[pylast.Album]]: A dictionary of artist names and their albums.
        """
        try:
            if isinstance(artist_names, str):
                artist_names = [artist_names]
            async with httpx.AsyncClient() as client:
                artists_albums_dict = {}
                for artist_name in artist_names:
                    albums = []
                    artist = self.lastfm.get_artist(artist_name)
                    albums.extend([album.item for album in artist.get_top_albums(limit=limit)])
                    artists_albums_dict[artist_name] = albums
                return artists_albums_dict
        except (pylast.WSError, httpx.HTTPError):
            return {}

    # get track titles of an album
    async def get_track_titles_of_albums(self, albums: List[pylast.Album], limit: int = 10) -> Dict[str, List[str]]:
        """Get track titles of albums.

        Args:
            albums (List[pylast.Album]): The list of album objects.
            limit (int, optional): The number of tracks to return. Defaults to 10.

        Returns:
            Dict[str, List[str]]: A dictionary of album title and its track titles.
        """
        try:
            if isinstance(albums, pylast.Album):
                albums = [albums]
            async with httpx.AsyncClient() as client:
                albums_tracks_dict = {}
                for album in albums:
                    tracks = album.get_tracks()
                    albums_tracks_dict[album.title] = []
                    for track in tracks:
                        albums_tracks_dict[album.title].append(track.title)
                return albums_tracks_dict
        except (pylast.WSError, httpx.HTTPError):
            return {}
