"""
Spotify Client Class
Wrapper for spotipy library functionality
"""

import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from typing import Dict, List, Optional, Any, Set
from datetime import datetime
import random
import requests
from tqdm import tqdm
import httpx
from util.third_party_crawler import crawl_music_map_artists, crawl_boil_the_frog_artists_and_tracks
import json

class SpotifyClient:
    """Spotify Client Class"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize Spotify client
        
        Args:
            client_id: Spotify application client ID
            client_secret: Spotify application client secret
            redirect_uri: Redirect URI
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        
        # Spotify API permission scopes
        self.scopes = [
            "user-read-email",
            "user-read-private",
            "user-read-playback-state",
            "user-modify-playback-state",
            "user-read-currently-playing",
            "playlist-read-private",
            "playlist-modify-private",
            "playlist-modify-public",
            "user-read-recently-played",
            "user-top-read",
            "user-follow-read",
            "user-follow-modify",
            "streaming",
            "app-remote-control",
            "playlist-read-collaborative"
        ]
        
        # Initialize spotipy client
        self._init_spotipy_client()
    
    def _init_spotipy_client(self):
        """Initialize spotipy client"""
        try:
            self.sp = spotipy.Spotify(
                auth_manager=SpotifyOAuth(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    redirect_uri=self.redirect_uri,
                    scope=" ".join(self.scopes)
                )
            )
        except Exception as e:
            raise Exception(f"Spotify client initialization failed: {e}")
    
    def get_user_profile(self) -> Dict[str, Any]:
        """Get current user profile"""
        try:
            user = self.sp.current_user()
            return {
                "success": True,
                "data": user,
                "message": "Successfully retrieved user profile"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get user profile"
            }
    
    def get_current_playback(self) -> Dict[str, Any]:
        """Get current playback status"""
        try:
            playback = self.sp.current_playback()
            if not playback:
                return {
                    "success": True,
                    "data": None,
                    "message": "No content is currently playing"
                }
            
            return {
                "success": True,
                "data": playback,
                "message": "Successfully retrieved playback status"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get playback status"
            }
    
    def get_user_playlists(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Get user playlists"""
        try:
            playlists = self.sp.current_user_playlists(limit=limit, offset=offset)
            return {
                "success": True,
                "data": playlists,
                "message": f"Successfully retrieved playlists, total: {len(playlists['items'])}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get playlists"
            }
    
    def get_queue(self) -> Dict[str, Any]:
        """Get playback queue"""
        try:
            queue = self.sp.queue()
            return {
                "success": True,
                "data": queue,
                "message": "Successfully retrieved playback queue"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get queue"
            }
    
    def search_tracks(self, query: str, limit: int = 1) -> Dict[str, Any]:
        """Search for tracks"""
        try:
            results = self.sp.search(q=query, type='track', limit=limit)
            return {
                "success": True,
                "data": results,
                "message": f"Search successful, found {len(results['tracks']['items'])} tracks"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Search failed"
            }
        
    def search_artist(self, query: str, limit: int = 1) -> Dict[str, Any]:
        """Search for artists"""
        try:
            results = self.sp.search(q=query, type='artist', limit=limit)
            return {
                "success": True,
                "data": results,
                "message": f"Search successful, found {len(results['artists']['items'])} artists"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Artist search failed"
            }
    
    def play_track(self, track_uri: str) -> Dict[str, Any]:
        """Play specified track"""
        try:
            self.sp.start_playback(uris=[track_uri])
            return {
                "success": True,
                "message": f"Started playing track: {track_uri}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Playback failed"
            }
    
    def play_playlist(self, playlist_uri: str) -> Dict[str, Any]:
        """Play playlist by URI"""
        try:
            self.sp.start_playback(context_uri=playlist_uri)
            return {
                "success": True,
                "message": f"Started playing playlist: {playlist_uri}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Playlist playback failed"
            }
    
    def pause_playback(self) -> Dict[str, Any]:
        """Pause playback"""
        try:
            self.sp.pause_playback()
            return {
                "success": True,
                "message": "Playback paused"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to pause"
            }
    
    def resume_playback(self) -> Dict[str, Any]:
        """Resume playback"""
        try:
            self.sp.start_playback()
            return {
                "success": True,
                "message": "Playback resumed"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to resume playback"
            }
    
    def skip_to_next(self) -> Dict[str, Any]:
        """Skip to next track"""
        try:
            self.sp.next_track()
            return {
                "success": True,
                "message": "Skipped to next track"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to skip to next track"
            }
    
    def skip_to_previous(self) -> Dict[str, Any]:
        """Skip to previous track"""
        try:
            self.sp.previous_track()
            return {
                "success": True,
                "message": "Skipped to previous track"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to skip to previous track"
            }
    
    def get_recently_played(self, limit: int = 20) -> Dict[str, Any]:
        """Get recently played tracks"""
        try:
            recent = self.sp.current_user_recently_played(limit=limit)
            return {
                "success": True,
                "data": recent,
                "message": f"Successfully retrieved recently played, total: {len(recent['items'])} tracks"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get recently played"
            }
    
    def get_top_tracks(self, time_range: str = 'medium_term', limit: int = 20) -> Dict[str, Any]:
        """Get user's top tracks"""
        try:
            top_tracks = self.sp.current_user_top_tracks(time_range=time_range, limit=limit)
            return {
                "success": True,
                "data": top_tracks,
                "message": f"Successfully retrieved top tracks, total: {len(top_tracks['items'])} tracks"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get top tracks"
            }
    
    def create_playlist(self, name: str, description: str = '', public: bool = False) -> Dict[str, Any]:
        """Create new playlist"""
        try:
            user = self.sp.current_user()
            playlist = self.sp.user_playlist_create(
                user=user['id'],
                name=name,
                description=description,
                public=public
            )
            return {
                "success": True,
                "data": playlist,
                "message": f"Playlist '{name}' created successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create playlist"
            }
    
    def add_tracks_to_playlist(self, playlist_id: str, track_uris: List[str]) -> Dict[str, Any]:
        """Add tracks to playlist"""
        try:
            self.sp.playlist_add_items(playlist_id, track_uris)
            return {
                "success": True,
                "message": f"Successfully added {len(track_uris)} tracks to playlist"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to add tracks"
            }
    
    def get_playlist_tracks(self, playlist_id: str, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        """Get tracks in playlist"""
        try:
            tracks = self.sp.playlist_tracks(playlist_id, limit=limit, offset=offset)
            return {
                "success": True,
                "data": tracks,
                "message": f"Successfully retrieved playlist tracks, total: {len(tracks['items'])} tracks"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get playlist tracks"
            }
    
    def get_available_devices(self) -> Dict[str, Any]:
        """Get available devices"""
        try:
            devices = self.sp.devices()
            return {
                "success": True,
                "data": devices,
                "message": f"Successfully retrieved device list, total: {len(devices['devices'])} devices"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get device list"
            }
    
    def transfer_playback(self, device_id: str, play: bool = False) -> Dict[str, Any]:
        """Transfer playback to specified device"""
        try:
            self.sp.transfer_playback(device_id, play=play)
            return {
                "success": True,
                "message": f"Playback transferred to device: {device_id}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to transfer playback"
            }
    
    def set_volume(self, volume_percent: int) -> Dict[str, Any]:
        """Set volume"""
        try:
            self.sp.volume(volume_percent)
            return {
                "success": True,
                "message": f"Volume set to {volume_percent}%"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to set volume"
            }
    
    def toggle_shuffle(self, state: bool) -> Dict[str, Any]:
        """Toggle shuffle mode"""
        try:
            self.sp.shuffle(state)
            return {
                "success": True,
                "message": f"Shuffle mode {'enabled' if state else 'disabled'}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to toggle shuffle"
            }
    
    def set_repeat_mode(self, state: str) -> Dict[str, Any]:
        """Set repeat mode (track, context, off)"""
        try:
            self.sp.repeat(state)
            return {
                "success": True,
                "message": f"Repeat mode set to: {state}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to set repeat mode"
            }
    
    @staticmethod
    def format_duration(ms: int) -> str:
        """Format duration"""
        seconds = ms // 1000
        minutes = seconds // 60
        seconds = seconds % 60
        return f"{minutes}:{seconds:02d}"
    
    @staticmethod
    def format_track_info(track: Dict[str, Any]) -> str:
        """Format track information"""
        artists = ", ".join([artist['name'] for artist in track['artists']])
        duration = SpotifyClient.format_duration(track['duration_ms'])
        return f"{track['name']} - {artists} ({duration})"
    
    def get_top_artists(self, time_range: str = 'medium_term', limit: int = 20) -> Dict[str, Any]:
        """Get user's top artists"""
        try:
            top_artists = self.sp.current_user_top_artists(time_range=time_range, limit=limit)
            return {
                "success": True,
                "data": top_artists,
                "message": f"Successfully retrieved top artists, total: {len(top_artists['items'])} artists"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get top artists"
            }

    def get_saved_albums(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Get user's saved albums (library)"""
        try:
            albums = self.sp.current_user_saved_albums(limit=limit, offset=offset)
            return {
                "success": True,
                "data": albums,
                "message": f"Successfully retrieved saved albums, total: {len(albums['items'])} albums"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get saved albums"
            }

    def get_saved_tracks(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Get user's saved tracks (library)"""
        try:
            tracks = self.sp.current_user_saved_tracks(limit=limit, offset=offset)
            return {
                "success": True,
                "data": tracks,
                "message": f"Successfully retrieved saved tracks, total: {len(tracks['items'])} tracks"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get saved tracks"
            }

    def get_followed_artists(self, limit: int = 50, after: str = None) -> Dict[str, Any]:
        """Get user's followed artists (supports pagination via 'after')"""
        try:
            kwargs = {"limit": limit, "type": "artist"}
            if after:
                kwargs["after"] = after
            artists = self.sp.current_user_followed_artists(**kwargs)
            return {
                "success": True,
                "data": artists,
                "message": f"Successfully retrieved followed artists, total: {len(artists['artists']['items'])} artists"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get followed artists"
            }

    def get_tracks(self, track_ids: List[str]) -> Dict[str, Any]:
        """Batch get track details by track ids (max 50 per call)"""
        try:
            tracks = self.sp.tracks(track_ids)
            return {
                "success": True,
                "data": tracks,
                "message": f"Successfully retrieved {len(tracks['tracks'])} tracks"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get tracks"
            }

    # NOTE: rate limit
    # def get_artist_top_tracks(self, artist_id: str, country: str = 'US') -> Dict[str, Any]:
    #     """Get top tracks for a given artist (default country US)"""
    #     try:
    #         tracks = self.sp.artist_top_tracks(artist_id, country=country)
    #         return {
    #             "success": True,
    #             "data": tracks,
    #             "message": f"Successfully retrieved top tracks for artist {artist_id}, total: {len(tracks['tracks'])} tracks"
    #         }
    #     except Exception as e:
    #         return {
    #             "success": False,
    #             "error": str(e),
    #             "message": f"Failed to get top tracks for artist {artist_id}"
    #         }
    # NOTE: rate limit
    # def get_artist_albums(self, artist_id: str, limit: int = 5, offset: int = 0, country: str = 'US') -> Dict[str, Any]:
    #     """Get albums for a given artist (default country US)"""
    #     try:
    #         albums = self.sp.artist_albums(artist_id, limit=limit, offset=offset, country=country)
    #         return {
    #             "success": True,
    #             "data": albums,
    #             "message": f"Successfully retrieved albums for artist {artist_id}, total: {len(albums['items'])} albums"
    #         }
    #     except Exception as e:
    #         return {
    #             "success": False,
    #             "error": str(e),
    #             "message": f"Failed to get albums for artist {artist_id}"
    #         }

    def get_album_tracks(self, album_id: str, limit: int = 5, offset: int = 0) -> Dict[str, Any]:
        """Get tracks for a given album"""
        try:
            tracks = self.sp.album_tracks(album_id, limit=limit, offset=offset)
            return {
                "success": True,
                "data": tracks,
                "message": f"Successfully retrieved tracks for album {album_id}, total: {len(tracks['items'])} tracks"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to get tracks for album {album_id}"
            }
        
    async def get_tivo_artist_ids(self, artist_names: List[str]):
        """Get tivo artist ids (async)"""
        artist_ids = []
        async with httpx.AsyncClient() as client:
            for artist_name in tqdm(artist_names):
                artist_name = artist_name.replace(' ', '+')
                url = f'https://tivomusicapi-staging-elb.digitalsmiths.net/sd/tivomusicapi/taps/v3/search/artist?name={artist_name}&limit=1&includeAllFields=false';
                response = await client.get(url)
                data = response.json()
                if data['hits'] and len(data['hits']) > 0:
                    tivo_artist_ids = data['hits'][0]['id']
                else:
                    continue
                artist_ids.append(tivo_artist_ids)
        return artist_ids
    
    async def get_tivo_artist_album_ids(self, artist_ids: List[str]) -> Set[str]:
        """Get tivo album ids for a list of artist ids (async)"""
        artist_album_dict = {}
        async with httpx.AsyncClient() as client:
            for artist_id in tqdm(artist_ids):
                url = f'https://tivomusicapi-staging-elb.digitalsmiths.net/sd/tivomusicapi/taps/v3/lookup/discography?nameId={artist_id}&limit=10&includeAllFields=false';
                response = await client.get(url)
                data = response.json()
                if data['hits'] and len(data['hits']) > 0:
                    artist_album_dict[artist_id] = [hit['id'] for hit in data['hits'][:2]]  # Get first k albums for the artist
                else:
                    continue
        return artist_album_dict
    
    async def get_tivo_tracks_in_albums(self, album_ids: List[str]):
        """Get tivo track ids in a list of album ids (async)"""
        tivo_tracks = []
        async with httpx.AsyncClient() as client:
            for album_id in tqdm(album_ids):
                url = f'https://tivomusicapi-staging-elb.digitalsmiths.net/sd/tivomusicapi/taps/v3/lookup/album?albumId={album_id}&limit=10';            
                response = await client.get(url)
                data = response.json()
                if data['hits'] and len(data['hits']) > 0 and 'tracks' in data['hits'][0]:
                    if len(data['hits'][0]['tracks']) > 10:
                        tivo_tracks.extend(random.sample(data['hits'][0]['tracks'], 10))  # id, title, ...
                    else:
                        tivo_tracks.extend(data['hits'][0]['tracks'])
                else:
                    continue
        return tivo_tracks

    async def get_tivo_tracks_in_artist_album_dict(self, artist_album_dict: Dict[str, List[str]]) -> Set[str]:
        """Get tivo track ids in artist album dict (async)"""
        tivo_tracks = []
        for artist_id, album_ids in tqdm(artist_album_dict.items()):
            tivo_tracks.extend(await self.get_tivo_tracks_in_albums(album_ids))
        return tivo_tracks

    # def get_several_tracks(self, track_ids: List[str]) -> Dict[str, Any]:
    #     """
    #     batch get several tracks by track ids
    #     """
    #     try:
    #         tracks = self.sp.tracks(track_ids)
    #         return {
    #             "success": True,
    #             "data": tracks,
    #             "message": f"Successfully retrieved {len(tracks['tracks'])} tracks"
    #         }
    #     except Exception as e:
    #         return {
    #             "success": False,
    #             "error": str(e),
    #             "message": "Failed to get several tracks"
    #         }

    # def get_several_tracks_batch(self, track_ids: List[str], batch_size: int = 50) -> Dict[str, Any]:
    #     """
    #     Batch get several tracks by track ids with specified batch size
    #     """
    #     all_tracks = []
    #     for i in range(0, len(track_ids), batch_size):
    #         batch_ids = track_ids[i:i + batch_size]
    #         result = self.get_several_tracks(batch_ids)
    #         if result["success"]:
    #             all_tracks.extend(result["data"]["tracks"])
    #         else:
    #             return result
    #     return {
    #         "success": True,
    #         "data": {"tracks": all_tracks},
    #         "message": f"Successfully retrieved {len(all_tracks)} tracks in batches"
    #     }


class SpotifySuperClient(SpotifyClient):
    def recall_artists(self, top_limit: int = 5, recent_limit: int = 5, playlist_limit: int = 5, album_limit: int = 5, saved_tracks_limit: int = 5) -> List[str]:
        """
        Maximize recall of user-related artist ids, including followed artists, all playlists, all saved albums, all saved tracks, top, recently played, etc.
        """
        artist_ids = []
        artist_names = []
        # 1. recently played
        recent = self.get_recently_played(limit=recent_limit)
        if recent["success"]:
            for item in recent["data"]["items"]:
                for artist in item["track"]["artists"]:
                    artist_ids.append(artist["id"])
                    artist_names.append(artist["name"])

        # 2. top tracks
        top_tracks = self.get_top_tracks(time_range="long_term", limit=top_limit)
        if top_tracks["success"]:
            for track in top_tracks["data"]["items"]:
                for artist in track["artists"]:
                    artist_ids.append(artist["id"])
                    artist_names.append(artist["name"])

        # 3. top artists
        top_artists = self.get_top_artists(time_range="long_term", limit=top_limit)
        if top_artists["success"]:
            for artist in top_artists["data"]["items"]:
                artist_ids.append(artist["id"])
                artist_names.append(artist["name"])

        # 4. follow artists
        after = None
        followed = self.get_followed_artists(limit=3, after=after)
        if followed["success"]:
            items = followed["data"]["artists"]["items"]
            for artist in items:
                artist_ids.append(artist["id"])
                artist_names.append(artist["name"])

        # 5. all artist of playlist
        offset = 0
        playlists = self.get_user_playlists(limit=3, offset=offset)
        if playlists["success"]:
            items = playlists["data"]["items"]
            for playlist in items:
                track_offset = 0
                tracks_result = self.get_playlist_tracks(playlist["id"], limit=3, offset=track_offset)
                if tracks_result["success"]:
                    track_items = tracks_result["data"]["items"]
                    for item in track_items:
                        track = item["track"]
                        for artist in track["artists"]:
                            artist_ids.append(artist["id"])
                            artist_names.append(artist["name"])

        # 6. artist of saved albums
        offset = 0
        saved_albums = self.get_saved_albums(limit=3, offset=offset)
        if saved_albums["success"]:
            items = saved_albums["data"]["items"]
            for item in items:
                album = item["album"]
                for artist in album["artists"]:
                    artist_ids.append(artist["id"])
                    artist_names.append(artist["name"])

        # 7. artists of saved tracks
        offset = 0
        saved_tracks = self.get_saved_tracks(limit=3, offset=offset)
        if saved_tracks["success"]:
            items = saved_tracks["data"]["items"]
            for item in items:
                track = item["track"]
                for artist in track["artists"]:
                    artist_ids.append(artist["id"])
                    artist_names.append(artist["name"])

        # 8. third-party crawler to get artists
        # e.g. crawl_music_map_artists, crawl_boil_the_frog_artists_and_tracks
        print('Crawling third-party artists...')
        selected_artists = random.sample(artist_names, min(5, len(artist_names)))  # Randomly select 5 artists for crawling
        # music_map_artists_list, boil_the_frog_artists_list = [], []
        music_map_artists_list = []
        for artist_name in selected_artists:
            # Crawl music map artists
            music_map_artists = crawl_music_map_artists(artist_name)
            selected_music_map_artists = random.sample(music_map_artists, min(6, len(music_map_artists)))  # Randomly select 3 artists
            # boil_the_frog_pairs = crawl_boil_the_frog_artists_and_tracks(artist_name)
            # boil_the_frog_artists = [pair['artist'] for pair in boil_the_frog_pairs]
            music_map_artists_list.extend(selected_music_map_artists)
            # boil_the_frog_artists_list.extend(boil_the_frog_artists)
        # De-duplicate third-party crawled artists
        # third_party_crawled_artists = list(set(music_map_artists_list + boil_the_frog_artists_list))
        third_party_crawled_artists = list(set(music_map_artists_list))
        print('Crawled third-party artists:', third_party_crawled_artists)
        for artist_name in tqdm(third_party_crawled_artists, desc="Crawling third-party artists"):
            # # search spotify artist by name
            # search_artist = self.search_artist(artist_name, limit=1)
            # if search_artist["success"] and len(search_artist["data"]["artists"]["items"]) > 0:
            #     artist = search_artist["data"]["artists"]["items"][0]
            #     artist_ids.append(artist["id"])
            #     artist_names.append(artist["name"])
            artist_names.append(artist_name)
            artist_ids.append("-1")
                


        # de-duplicate artist ids and names
        result_artist_ids = []
        result_artist_names = []
        num_artists = len(artist_ids)
        for (artist_id, artist_name) in zip(artist_ids, artist_names):
            if artist_id not in result_artist_ids:
                result_artist_ids.append(artist_id)
                result_artist_names.append(artist_name)

        return result_artist_ids, result_artist_names

    # async def get_tivo_track_obj(self, tivo_track_id)

    # def recall_tracks(self, artist_ids: Set[str], artist_top_limit: int = 10, album_limit: int = 5) -> Set[str]:
    #     """
    #     Recall track ids based on artist ids.
    #     """
    #     track_set = set()
    #     # random sample 10 artist ids
    #     artist_ids = list(artist_ids)
    #     artist_ids = random.sample(artist_ids, 10)
    #     for artist_id in artist_ids:
    #         # # 1. artist top tracks NOTE: rate limited
    #         # top_tracks = self.get_artist_top_tracks(artist_id)
    #         # if top_tracks["success"]:
    #         #     track_set.update(top_tracks["data"]["tracks"])
    #         # # 2. artist albums NOTE: rate limited
    #         albums = self.get_artist_albums(artist_id, limit=album_limit)
    #         # if albums["success"]:
    #         #     for album in albums["data"]["items"]:
    #         #         album_id = album["id"]
    #         #         album_tracks = self.get_album_tracks(album_id)
    #         #         if album_tracks["success"]:
    #         #             track_set.update(album_tracks["data"]["items"])
    #     return track_set

    async def recall_all_tracks(self) -> List[Dict[str, Any]]:
        """
        Comprehensive recall of tracks, returning detailed track information.
        """
        # 1. recall artist
        _, artist_names = self.recall_artists()
        #### 2. recall track based on artist ids  # NOTE: rate limited
        # track_set = self.recall_tracks(artist_ids, artist_top_limit=10, album_limit=5)
        # 2. spotify id to tivo id, artist to album to tracks
        artist_ids = await self.get_tivo_artist_ids(artist_names[:10])  # third-party API to get tivo artist ids
        artist_album_dict = await self.get_tivo_artist_album_ids(artist_ids)
        tivo_tracks = await self.get_tivo_tracks_in_artist_album_dict(artist_album_dict)
        # tivo_tracks: dict_keys(['id', 'title', 'performers', 'composers', 'duration', 'disc', 'phyTrackNum', 'isPick'])
        random.shuffle(tivo_tracks)  # Shuffle tracks to ensure randomness
        recall_track_titles = [track['title'] for track in tivo_tracks]

        # # 3. third-party crawl to get more tracks by artist names
        # # e.g. crawl_boil_the_frog_artists_and_tracks
        # print('Crawling third-party artists and tracks...')
        # selected_artists = random.sample(artist_names, min(3, len(artist_names)))
        # for artist_name in tqdm(selected_artists, desc="Crawling third-party artists and tracks"):
        #     boil_the_frog_pairs = crawl_boil_the_frog_artists_and_tracks(artist_name)
        #     boil_the_frog_tracks = [pair['track'] for pair in boil_the_frog_pairs]
        #     recall_track_titles.extend(boil_the_frog_tracks)
        # # De-duplicate track titles
        # recall_track_titles = list(set(recall_track_titles))


        search_tracks = []  
        search_track_ids = []
        search_artist_names = []
        # 4. track titles to spotify track by search
        # search_tracks: dict_keys(['album', 'artists', 'available_markets', 'disc_number', 'duration_ms', 'explicit', 'external_ids', 'external_urls', 'href', 'id', 'is_local', 'is_playable', 'name', 'popularity', 'preview_url', 'track_number', 'type', 'uri'])
        for track_title in tqdm(recall_track_titles, desc="Searching tracks"):
            search_track = self.search_tracks(track_title)
            if search_track['success'] and len(search_track['data']['tracks']['items']) > 0:
                search_item = search_track['data']['tracks']['items'][0]
                if search_item['id'] in search_track_ids:
                    continue
                search_tracks.append(search_item)
                search_track_ids.append(search_item['id'])
                search_artist_names.append(', '.join([artist['name'] for artist in search_item['artists']]))

        # recall more from reccobeats with spotify track ids
        random_selected_tracks = random.sample(search_tracks, min(10, len(search_tracks)))
        for seed_spotify_track in tqdm(random_selected_tracks, desc="Getting Reccobeats recommendations"):
            reccobeat_recommendation = await self.recall_reccobeats_tracks(seed_spotify_track['id'], num_tracks=5)
            if reccobeat_recommendation['success']:
                for track in tqdm(reccobeat_recommendation['data']['tracks'], desc="Converting to Reccobeats tracks"):
                    if track['id'] not in search_track_ids:
                        search_tracks.append(track)
                        search_track_ids.append(track['id'])
                        search_artist_names.append(', '.join([artist['name'] for artist in track['artists']]))
        random.shuffle(search_tracks)
        recall_result = {
            'success': True,
            'data': {
                'tracks': search_tracks,
                # 'track_ids': search_track_ids,
                # 'artist_names': search_artist_names,
            },
            'message': "Successfully recall tracks",
        }


        # import pdb; pdb.set_trace()
        reccobeats_tracks = await self.get_reccobeats_tracks_details(search_track_ids)
        recall_all_tracks = []
        recall_all_track_ids = []
        recall_all_artist_names = []
        seen_track_ids = set()
        if reccobeats_tracks['success']:
            for track in tqdm(reccobeats_tracks['data']['tracks'], desc="Adding Reccobeats tracks features"):
                # Skip duplicate tracks
                if track['id'] in seen_track_ids:
                    continue
                seen_track_ids.add(track['id'])
                track['features'] = await self.get_reccobeats_track_audio_features(track['reccobeats_id'])
                recall_all_tracks.append(track)
                recall_all_track_ids.append(track['id'])
                recall_all_artist_names.append(', '.join([artist['name'] for artist in track['artists']]))

        random.shuffle(recall_all_tracks)
        recall_result = {
            'success': True,
            'data': {
                'tracks': recall_all_tracks,
                # 'track_ids': recall_all_track_ids,
                # 'artist_names': recall_all_artist_names,
            },
            'message': "Successfully recall tracks",
        }

        return recall_result


    async def recall_tracks_based_on_artist_name(self, artist_name) -> List[Dict[str, Any]]:
        """
        Comprehensive recall of tracks based on an artist name, returning detailed track information.
        """
        artist_ids = await self.get_tivo_artist_ids([artist_name])  # third-party API to get tivo artist ids
        artist_album_dict = await self.get_tivo_artist_album_ids(artist_ids)
        tivo_tracks = await self.get_tivo_tracks_in_artist_album_dict(artist_album_dict)
        # tivo_tracks: dict_keys(['id', 'title', 'performers', 'composers', 'duration', 'disc', 'phyTrackNum', 'isPick'])
        random.shuffle(tivo_tracks)  # Shuffle tracks to ensure randomness
        recall_track_titles = [track['title'] for track in tivo_tracks]

        # # 3. third-party crawl to get more tracks by artist names
        # # e.g. crawl_boil_the_frog_artists_and_tracks
        # print('Crawling third-party artists and tracks...')
        # selected_artists = random.sample(artist_names, min(3, len(artist_names)))
        # for artist_name in tqdm(selected_artists, desc="Crawling third-party artists and tracks"):
        #     boil_the_frog_pairs = crawl_boil_the_frog_artists_and_tracks(artist_name)
        #     boil_the_frog_tracks = [pair['track'] for pair in boil_the_frog_pairs]
        #     recall_track_titles.extend(boil_the_frog_tracks)
        # # De-duplicate track titles
        # recall_track_titles = list(set(recall_track_titles))


        search_tracks = []  
        search_track_ids = []
        search_artist_names = []
        # 4. track titles to spotify track by search
        # search_tracks: dict_keys(['album', 'artists', 'available_markets', 'disc_number', 'duration_ms', 'explicit', 'external_ids', 'external_urls', 'href', 'id', 'is_local', 'is_playable', 'name', 'popularity', 'preview_url', 'track_number', 'type', 'uri'])
        for track_title in tqdm(recall_track_titles, desc="Searching tracks"):
            search_track = self.search_tracks(track_title)
            if search_track['success'] and len(search_track['data']['tracks']['items']) > 0:
                search_item = search_track['data']['tracks']['items'][0]
                if search_item['id'] in search_track_ids:
                    continue
                search_tracks.append(search_item)
                search_track_ids.append(search_item['id'])
                search_artist_names.append(', '.join([artist['name'] for artist in search_item['artists']]))

        # recall more from reccobeats with spotify track ids
        random_selected_tracks = random.sample(search_tracks, min(10, len(search_tracks)))
        for seed_spotify_track in tqdm(random_selected_tracks, desc="Getting Reccobeats recommendations"):
            reccobeat_recommendation = await self.recall_reccobeats_tracks(seed_spotify_track['id'], num_tracks=5)
            if reccobeat_recommendation['success']:
                for track in tqdm(reccobeat_recommendation['data']['tracks'], desc="Converting to Reccobeats tracks"):
                    if track['id'] not in search_track_ids:
                        search_tracks.append(track)
                        search_track_ids.append(track['id'])
                        search_artist_names.append(', '.join([artist['name'] for artist in track['artists']]))
        random.shuffle(search_tracks)
        recall_result = {
            'success': True,
            'data': {
                'tracks': search_tracks,
                # 'track_ids': search_track_ids,
                # 'artist_names': search_artist_names,
            },
            'message': "Successfully recall tracks",
        }


        # import pdb; pdb.set_trace()
        reccobeats_tracks = await self.get_reccobeats_tracks_details(search_track_ids)
        recall_all_tracks = []
        recall_all_track_ids = []
        recall_all_artist_names = []
        seen_track_ids = set()
        if reccobeats_tracks['success']:
            for track in tqdm(reccobeats_tracks['data']['tracks'], desc="Adding Reccobeats tracks features"):
                # Skip duplicate tracks
                if track['id'] in seen_track_ids:
                    continue
                seen_track_ids.add(track['id'])
                track['features'] = await self.get_reccobeats_track_audio_features(track['reccobeats_id'])
                recall_all_tracks.append(track)
                recall_all_track_ids.append(track['id'])
                recall_all_artist_names.append(', '.join([artist['name'] for artist in track['artists']]))

        random.shuffle(recall_all_tracks)
        recall_result = {
            'success': True,
            'data': {
                'tracks': recall_all_tracks,
                # 'track_ids': recall_all_track_ids,
                # 'artist_names': recall_all_artist_names,
            },
            'message': "Successfully recall tracks",
        }

        return recall_result


    async def random_fill(self, num_tracks=10) -> List[Dict[str, Any]]:
        """
        Randomly fill k tracks for new playlist
        """
        # 1. recall artist
        _, artist_names = self.recall_artists()
        #### 2. recall track based on artist ids  # NOTE: rate limited
        # track_set = self.recall_tracks(artist_ids, artist_top_limit=10, album_limit=5)
        # 2. spotify id to tivo id, artist to album to tracks
        artist_ids = await self.get_tivo_artist_ids(artist_names)  # third-party API to get tivo artist ids
        artist_album_dict = await self.get_tivo_artist_album_ids(artist_ids)
        tivo_tracks = await self.get_tivo_tracks_in_artist_album_dict(artist_album_dict)
        # tivo_tracks: dict_keys(['id', 'title', 'performers', 'composers', 'duration', 'disc', 'phyTrackNum', 'isPick'])
        # random sample 10
        tivo_tracks = random.sample(tivo_tracks, min(num_tracks, len(tivo_tracks)))
        recall_track_titles = [track['title'] for track in tivo_tracks]
        search_tracks = []  
        search_track_ids = []
        search_artist_names = []
        # 3. track titles to spotify track by search
        # search_tracks: dict_keys(['album', 'artists', 'available_markets', 'disc_number', 'duration_ms', 'explicit', 'external_ids', 'external_urls', 'href', 'id', 'is_local', 'is_playable', 'name', 'popularity', 'preview_url', 'track_number', 'type', 'uri'])
        for track_title in tqdm(recall_track_titles, desc="Searching tracks for random fill"):
            search_track = self.search_tracks(track_title)
            if search_track['success'] and len(search_track['data']['tracks']['items']) > 0:
                search_item = search_track['data']['tracks']['items'][0]
                search_tracks.append(search_item)
                search_track_ids.append(search_item['id'])
                search_artist_names.append(', '.join([artist['name'] for artist in search_item['artists']]))
        recall_result = {
            'success': True,
            'data': {
                'tracks': search_tracks,
                'track_ids': search_track_ids,
                'artist_names': search_artist_names,
            },
            'message': "Successfully random fill",
        }
        return recall_result

    async def recall_reccobeats_tracks(self, track_seed, num_tracks=20):
        """
        Get track recommendations from Reccobeats API
        """
        url = f"https://api.reccobeats.com/v1/track/recommendation?size={num_tracks}&seeds={track_seed}"
        
        payload = {}
        headers = {
            'Accept': 'application/json'
        }
        
        try:
            response = requests.request("GET", url, headers=headers, data=payload)
            response.raise_for_status()
            
            data = response.json()['content']

            
            recommended_tracks = []
            if len(data):
                for track in data:
                    spotify_track_id = track.get('href', '').split('/')[-1]
                    spotify_track = {
                        'id': spotify_track_id,
                        'name': track.get('trackTitle', ''),
                        'artists': [{'name': artist['name']} for artist in track.get('artists', [])],
                        'artists_ids': [artist['href'].split('/')[-1] for artist in track.get('artists', [])],
                        'duration_ms': track.get('durationMs', 0),
                        'uri': f"spotify:track:{spotify_track_id}",
                        'album': "",
                        'reccobeats_id': track.get('id', ''),
                    }
                    recommended_tracks.append(spotify_track)
            
            return {
                'success': True,
                'data': {
                    'tracks': recommended_tracks,
                    'track_names': [track['name'] for track in recommended_tracks],
                    'total': len(recommended_tracks)
                },
                'message': f"Successfully got {len(recommended_tracks)} recommendations from Reccobeats"
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'data': None,
                'message': f"Failed to get recommendations from Reccobeats: {str(e)}"
            }
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'data': None,
                'message': f"Failed to parse Reccobeats response: {str(e)}"
            }

    async def get_reccobeats_tracks_details(self, track_ids: List[str]):
        """
        Get detailed track information from Reccobeats API for multiple track IDs
        track_ids should be less than or equal to 40
        """
        if not track_ids:
            return {
                'success': False,
                'data': None,
                'message': "No track IDs provided"
            }
        
        batch_size = 40
        all_tracks_details = []
        all_requested_ids = []
        all_found_ids = []
        
        for i in range(0, len(track_ids), batch_size):
            batch_ids = track_ids[i:i + batch_size]
            all_requested_ids.extend(batch_ids)
            
            track_ids_str = ','.join(batch_ids)
            url = f"https://api.reccobeats.com/v1/track?ids={track_ids_str}"
            
            payload = {}
            headers = {
                'Accept': 'application/json'
            }
            
            try:
                response = requests.request("GET", url, headers=headers, data=payload)
                response.raise_for_status()
                
                data = response.json()
                
                tracks_details = []
                if 'content' in data and len(data['content']):
                    for track in data['content']:
                        spotify_id = track.get('href', '').split('/')[-1]
                        track_detail = {
                            'reccobeats_id': track.get('id', ''),
                            'name': track.get('trackTitle', ''),
                            'artists': [{'name': artist['name'], 'id': artist.get('id', '')} for artist in track.get('artists', [])],
                            'duration_ms': track.get('durationMs', 0),
                            'popularity': track.get('popularity', 0),
                            'external_urls': {
                                'spotify': track.get('href', '')
                            },
                            'id': spotify_id,
                            'uri': f"spotify:track:{spotify_id}",
                        }
                        tracks_details.append(track_detail)
                        all_found_ids.append(track.get('id', ''))
                
                all_tracks_details.extend(tracks_details)
                
            except requests.exceptions.RequestException as e:
                return {
                    'success': False,
                    'data': None,
                    'message': f"Failed to get track details from Reccobeats (batch {i//batch_size + 1}): {str(e)}"
                }
            except json.JSONDecodeError as e:
                return {
                    'success': False,
                    'data': None,
                    'message': f"Failed to parse Reccobeats response (batch {i//batch_size + 1}): {str(e)}"
                }
            except Exception as e:
                return {
                    'success': False,
                    'data': None,
                    'message': f"Unexpected error (batch {i//batch_size + 1}): {str(e)}"
                }
        
        return {
            'success': True,
            'data': {
                'tracks': all_tracks_details,
                'total': len(all_tracks_details),
                'requested_ids': all_requested_ids,
                'found_ids': all_found_ids,
                'batches_processed': (len(track_ids) + batch_size - 1) // batch_size
            },
            'message': f"Successfully retrieved details for {len(all_tracks_details)} tracks from Reccobeats in {(len(track_ids) + batch_size - 1) // batch_size} batches"
        }

    async def get_reccobeats_track_audio_features(self, reccobeats_id: str) -> Dict[str, Any]:
        """
        Get audio features for a single track from Reccobeats API
        """
        if not reccobeats_id:
            return {
                'success': False,
                'data': None,
                'message': "No Reccobeats ID provided"
            }
        
        url = f"https://api.reccobeats.com/v1/track/{reccobeats_id}/audio-features"
        
        payload = {}
        headers = {
            'Accept': 'application/json'
        }
        
        try:
            response = requests.request("GET", url, headers=headers, data=payload)
            response.raise_for_status()
            
            data = response.json()
            
            audio_features = {
                'id': reccobeats_id,
                'acousticness': data.get('acousticness', 0),
                'danceability': data.get('danceability', 0),
                'energy': data.get('energy', 0),
                'instrumentalness': data.get('instrumentalness', 0),
                'liveness': data.get('liveness', 0),
                'loudness': data.get('loudness', 0),
                'speechiness': data.get('speechiness', 0),
                'tempo': data.get('tempo', 0),
                'valence': data.get('valence', 0)
            }
            
            return {
                'success': True,
                'data': audio_features,
                'message': f"Successfully retrieved audio features for track {reccobeats_id}"
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'data': None,
                'message': f"Failed to get audio features from Reccobeats: {str(e)}"
            }
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'data': None,
                'message': f"Failed to parse Reccobeats response: {str(e)}"
            }
        except Exception as e:
            return {
                'success': False,
                'data': None,
                'message': f"Unexpected error: {str(e)}"
            }

  