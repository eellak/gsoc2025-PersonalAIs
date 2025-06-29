"""
Spotify Client Class
Wrapper for spotipy library functionality
"""

import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from typing import Dict, List, Optional, Any
from datetime import datetime


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
    
    def search_tracks(self, query: str, limit: int = 10) -> Dict[str, Any]:
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