"""
MCP Server Class
Using fastmcp library to manage Spotify MCP tools
"""
import json
from typing import Dict, List, Any, Optional
from fastmcp import FastMCP

# from spotify_client import SpotifyClient
from spotify_client import SpotifySuperClient as SpotifyClient
import os
import sys
import numpy as np
import random
from lastfm_client import LastfmClient
from llm_client import LLMClient
import math
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

class SpotifyMCPServer:
    """Spotify MCP Server Class"""
    
    def __init__(self, spotify_client: SpotifyClient):
        """
        Initialize MCP server
        
        Args:
            spotify_client: Spotify client instance
        """
        self.spotify_client = spotify_client
        self.mcp = FastMCP("spotify-mcp-server")
        self.setup_tools()
    
    def setup_tools(self):
        """Setup MCP tools"""
        
        @self.mcp.tool()
        def get_user_profile() -> str:
            """Get current user's Spotify profile information"""
            result = self.spotify_client.get_user_profile()
            if result["success"]:
                user = result["data"]
                content = f"""# Spotify User Profile

**Username:** {user['display_name']}

**Email:** {user.get('email', 'Not provided')}

**Country:** {user.get('country', 'Not provided')}

**Account Type:** {user.get('product', 'Unknown')}

**Followers:** {user.get('followers', {}).get('total', 0)}

**User ID:** {user['id']}

**External Links:**"""
                
                if user.get('external_urls'):
                    for platform, url in user['external_urls'].items():
                        content += f"\n- {platform}: {url}"
                
                if user.get('images'):
                    content += "\n\n**Profile Images:**"
                    for img in user['images']:
                        content += f"\n- {img['url']} (Size: {img['width']}x{img['height']})"
                
                return content
            else:
                return f"Failed to get user profile: {result['message']}"
        
        @self.mcp.tool()
        def get_current_playback() -> str:
            """Get current playback status and currently playing track information"""
            result = self.spotify_client.get_current_playback()
            if not result["success"]:
                return f"Failed to get playback status: {result['message']}"
            
            if result["data"] is None:
                return "No content is currently playing"
            
            playback = result["data"]
            track = playback['item']
            device = playback.get('device', {})
            
            content = f"""# Current Playback Status

**Device Name:** {device.get('name', 'Unknown Device')}

**Device Type:** {device.get('type', 'Unknown')}

**Volume:** {device.get('volume_percent', 0)}%

**Is Active:** {'Yes' if device.get('is_active') else 'No'}

## Currently Playing

**Track:** {track['name']}

**Artist:** {', '.join([artist['name'] for artist in track['artists']])}

**Album:** {track['album']['name']}

**Duration:** {self.spotify_client.format_duration(track['duration_ms'])}

**Progress:** {self.spotify_client.format_duration(playback['progress_ms'])} / {self.spotify_client.format_duration(track['duration_ms'])}

**Repeat Mode:** {playback.get('repeat_state', 'off')}

**Shuffle:** {'On' if playback.get('shuffle_state') else 'Off'}

**Spotify URI:** {track['uri']}

**External Link:** {track['external_urls'].get('spotify', 'None')}"""
            
            return content
        
        @self.mcp.tool()
        def get_user_playlists(limit: int = 20, offset: int = 0) -> str:
            """Get all user playlists"""
            result = self.spotify_client.get_user_playlists(limit=limit, offset=offset)
            if not result["success"]:
                return f"Failed to get playlists: {result['message']}"
            
            playlists = result["data"]
            content = f"# User Playlists (Showing {len(playlists['items'])} playlists)\n\n"
            
            for playlist in playlists['items']:
                content += f"""## {playlist['name']}

- **Owner:** {playlist['owner']['display_name']}

- **Track Count:** {playlist['tracks']['total']}

- **Public:** {'Yes' if playlist['public'] else 'No'}

- **Collaborative:** {'Yes' if playlist.get('collaborative') else 'No'}

- **Spotify URI:** {playlist['uri']}

- **External Link:** {playlist['external_urls'].get('spotify', 'None')}

"""
            
            return content
        
        @self.mcp.tool()
        def get_queue() -> str:
            """Get current playback queue"""
            result = self.spotify_client.get_queue()
            if not result["success"]:
                return f"Failed to get queue: {result['message']}"
            
            queue = result["data"]
            content = "# Playback Queue\n\n"
            
            if queue.get('currently_playing'):
                track = queue['currently_playing']
                content += f"""## Currently Playing

**Track:** {track['name']}

**Artist:** {', '.join([artist['name'] for artist in track['artists']])}

**Album:** {track['album']['name']}

"""
            
            if queue.get('queue'):
                content += "## Songs in Queue\n\n"
                for i, track in enumerate(queue['queue'], 1):
                    content += f"{i}. **{track['name']}** - {', '.join([artist['name'] for artist in track['artists']])} ({track['album']['name']})\n"
            else:
                content += "No other songs in queue\n"
            
            return content
        
        @self.mcp.tool()
        def search_tracks(query: str, artist: str = "", limit: int = 10) -> str:
            """Search for tracks with optional artist filter"""
            # If artist is provided, combine it with the query
            search_query = f"{query} artist:{artist}" if artist else query
            result = self.spotify_client.search_tracks(search_query, limit)
            if not result["success"]:
                return f"Search failed: {result['message']}"
            
            results = result["data"]
            content = f"# Search Results: '{query}'"
            if artist:
                content += f" by '{artist}'"
            content += f"\n\n"
            
            for i, track in enumerate(results['tracks']['items'], 1):
                content += f"""{i}. **{track['name']}**

   - **Artist:** {', '.join([artist['name'] for artist in track['artists']])}
   - **Album:** {track['album']['name']}
   - **Duration:** {self.spotify_client.format_duration(track['duration_ms'])}
   - **Spotify URI:** {track['uri']}
   - **External Link:** {track['external_urls'].get('spotify', 'None')}

"""
            
            return content
        
        @self.mcp.tool()
        def play_track(track_name: str, artist_name: str = "") -> str:
            """Play a track by searching for its name and artist"""
            # Search for the track
            search_query = f"{track_name} artist:{artist_name}" if artist_name else track_name
            search_result = self.spotify_client.search_tracks(search_query, 1)
            
            if not search_result["success"]:
                return f"Failed to search for track: {search_result['message']}"
            
            tracks = search_result["data"]["tracks"]["items"]
            if not tracks:
                return f"No tracks found for '{track_name}'"
            
            # Get the first (most relevant) track
            track = tracks[0]
            track_uri = track["uri"]
            
            # Play the track
            play_result = self.spotify_client.play_track(track_uri)
            if play_result["success"]:
                return f"Now playing: **{track['name']}** by {', '.join([artist['name'] for artist in track['artists']])}"
            else:
                return f"Failed to play track: {play_result['message']}"
        
        @self.mcp.tool()
        def play_playlist(playlist_name: str) -> str:
            """Play a playlist by searching for its name"""
            # First, get user's playlists to find the one by name
            playlists_result = self.spotify_client.get_user_playlists(limit=50, offset=0)
            
            if not playlists_result["success"]:
                return f"Failed to get playlists: {playlists_result['message']}"
            
            playlists = playlists_result["data"]["items"]
            
            # Find playlist by name (case-insensitive)
            target_playlist = None
            for playlist in playlists:
                if playlist["name"].lower() == playlist_name.lower():
                    target_playlist = playlist
                    break
            
            if not target_playlist:
                available_playlists = [p["name"] for p in playlists[:10]]  # Show first 10
                return f"Playlist '{playlist_name}' not found. Available playlists: {', '.join(available_playlists)}"
            
            # Play the playlist
            play_result = self.spotify_client.play_playlist(target_playlist["uri"])
            if play_result["success"]:
                return f"Now playing playlist: **{target_playlist['name']}** ({target_playlist['tracks']['total']} tracks)"
            else:
                return f"Failed to play playlist: {play_result['message']}"
        
        @self.mcp.tool()
        def pause_playback() -> str:
            """Pause playback"""
            result = self.spotify_client.pause_playback()
            return result["message"]
        
        @self.mcp.tool()
        def resume_playback() -> str:
            """Resume playback"""
            result = self.spotify_client.resume_playback()
            return result["message"]
        
        @self.mcp.tool()
        def skip_to_next() -> str:
            """Skip to next track"""
            result = self.spotify_client.skip_to_next()
            return result["message"]
        
        @self.mcp.tool()
        def skip_to_previous() -> str:
            """Skip to previous track"""
            result = self.spotify_client.skip_to_previous()
            return result["message"]
        
        @self.mcp.tool()
        def get_recently_played(limit: int = 20) -> str:
            """Get recently played tracks"""
            result = self.spotify_client.get_recently_played(limit)
            if not result["success"]:
                return f"Failed to get recently played: {result['message']}"
            
            recent = result["data"]
            content = f"# Recently Played Tracks (Showing {len(recent['items'])} tracks)\n\n"
            
            for item in recent['items']:
                track = item['track']
                played_at = item['played_at']
                content += f"""**{track['name']}** - {', '.join([artist['name'] for artist in track['artists']])}

- **Album:** {track['album']['name']}
- **Played At:** {played_at}
- **Spotify URI:** {track['uri']}

"""
            
            return content
        
        @self.mcp.tool()
        def get_top_tracks(time_range: str = 'medium_term', limit: int = 20) -> str:
            """Get user's top tracks"""
            result = self.spotify_client.get_top_tracks(time_range, limit)
            if not result["success"]:
                return f"Failed to get top tracks: {result['message']}"
            
            top_tracks = result["data"]
            time_range_map = {
                'short_term': 'Last 4 weeks',
                'medium_term': 'Last 6 months',
                'long_term': 'All time'
            }
            
            content = f"# Top Tracks ({time_range_map.get(time_range, time_range)})\n\n"
            
            for i, track in enumerate(top_tracks['items'], 1):
                content += f"""{i}. **{track['name']}** - {', '.join([artist['name'] for artist in track['artists']])}

   - **Album:** {track['album']['name']}
   - **Duration:** {self.spotify_client.format_duration(track['duration_ms'])}
   - **Spotify URI:** {track['uri']}

"""
            
            return content
        
        @self.mcp.tool()
        async def create_playlist(name: str, description: str, public: bool = False, random_fill: bool = False, num_tracks=10) -> str:
            """Create new playlist"""
            result = self.spotify_client.create_playlist(name, description, public)
            if not result["success"]:
                return f"{result['message']}"
            
            playlist = result["data"]
            content = f"""# Playlist Created Successfully

**Name:** {playlist['name']}

**Description:** {playlist.get('description', 'None')}

**Public:** {'Yes' if playlist['public'] else 'No'}

**Spotify URI:** {playlist['uri']}

**External Link:** {playlist['external_urls'].get('spotify', 'None')}

**Auto random fill:** {'Enabled' if random_fill else 'Disabled'}"""
            

            if random_fill:
                # Fill playlist with random tracks
                random_tracks_result = await self.spotify_client.random_fill(num_tracks=num_tracks)  # Default to 10 random tracks
                if not random_tracks_result["success"]:
                    return f"Failed to fill playlist with random tracks: {random_tracks_result['message']}"
                
                track_uris = [track['uri'] for track in random_tracks_result['data']['tracks']]
                add_result = self.spotify_client.add_tracks_to_playlist(playlist['id'], track_uris)
                if not add_result["success"]:
                    return f"Failed to add random tracks to playlist: {add_result['message']}"
                
                content += f"\n\nAdded {len(track_uris)} random tracks to the playlist."
            return content
        
        @self.mcp.tool()
        def add_tracks_to_playlist(playlist_name: str, track_names: List[str], artist_names: List[str] = None) -> str:
            """Add tracks to playlist by searching for track names"""
            # First, find the playlist by name
            playlists_result = self.spotify_client.get_user_playlists(limit=50, offset=0)
            
            if not playlists_result["success"]:
                return f"Failed to get playlists: {playlists_result['message']}"
            
            playlists = playlists_result["data"]["items"]
            
            # Find playlist by name (case-insensitive)
            target_playlist = None
            for playlist in playlists:
                if playlist["name"].lower() == playlist_name.lower():
                    target_playlist = playlist
                    break
            
            if not target_playlist:
                available_playlists = [p["name"] for p in playlists[:10]]
                return f"Playlist '{playlist_name}' not found. Available playlists: {', '.join(available_playlists)}"
            
            # Search for each track and collect URIs
            track_uris = []
            added_tracks = []
            
            for i, track_name in enumerate(track_names):
                artist_name = artist_names[i] if artist_names and i < len(artist_names) else ""
                search_query = f"{track_name} artist:{artist_name}" if artist_name else track_name
                
                search_result = self.spotify_client.search_tracks(search_query, 1)
                if search_result["success"] and search_result["data"]["tracks"]["items"]:
                    track = search_result["data"]["tracks"]["items"][0]
                    track_uris.append(track["uri"])
                    added_tracks.append(f"**{track['name']}** by {', '.join([artist['name'] for artist in track['artists']])}")
                else:
                    return f"Track '{track_name}' not found"
            
            # Add tracks to playlist
            result = self.spotify_client.add_tracks_to_playlist(target_playlist["id"], track_uris)
            if result["success"]:
                content = f"Successfully added {len(track_uris)} tracks to playlist **{target_playlist['name']}**:\n\n"
                for track_info in added_tracks:
                    content += f"- {track_info}\n"
                return content
            else:
                return f"Failed to add tracks: {result['message']}"
        
        @self.mcp.tool()
        def get_playlist_tracks(playlist_name: str, limit: int = 100, offset: int = 0) -> str:
            """Get tracks in playlist by playlist name"""
            # First, find the playlist by name
            playlists_result = self.spotify_client.get_user_playlists(limit=50, offset=0)
            
            if not playlists_result["success"]:
                return f"Failed to get playlists: {playlists_result['message']}"
            
            playlists = playlists_result["data"]["items"]
            
            # Find playlist by name (case-insensitive)
            target_playlist = None
            for playlist in playlists:
                if playlist["name"].lower() == playlist_name.lower():
                    target_playlist = playlist
                    break
            
            if not target_playlist:
                available_playlists = [p["name"] for p in playlists[:10]]
                return f"Playlist '{playlist_name}' not found. Available playlists: {', '.join(available_playlists)}"
            
            # Get tracks from playlist
            result = self.spotify_client.get_playlist_tracks(target_playlist["id"], limit, offset)
            if not result["success"]:
                return f"Failed to get playlist tracks: {result['message']}"
            
            tracks = result["data"]
            content = f"# Playlist: {target_playlist['name']} (Showing {len(tracks['items'])} tracks)\n\n"
            
            for i, item in enumerate(tracks['items'], 1):
                track = item['track']
                content += f"""{i}. **{track['name']}** - {', '.join([artist['name'] for artist in track['artists']])}

   - **Album:** {track['album']['name']}
   - **Duration:** {self.spotify_client.format_duration(track['duration_ms'])}
   - **Spotify URI:** {track['uri']}

"""
            
            return content

    def run(self):
        """Run MCP server"""
        self.mcp.run()


class SpotifyMCPSuperServer(SpotifyMCPServer):
    """Super MCP Server with recall tools"""
    def __init__(self, spotify_client: SpotifyClient, lastfm_client: LastfmClient = None):
        """
        Initialize MCP server
        
        Args:
            spotify_client: Spotify client instance
        """
        self.spotify_client = spotify_client
        self.lastfm_client = lastfm_client
        self.mcp = FastMCP("spotify-mcp-server")
        self.setup_tools()

    def setup_tools(self):
        # 先注册父类的工具
        super().setup_tools()

        # 注册 recall 相关工具
        @self.mcp.tool()
        def recall_artists(
            top_limit: int = 30,
            recent_limit: int = 50,
            playlist_limit: int = 50,
            album_limit: int = 50,
            saved_tracks_limit: int = 50
        ) -> list:
            artist_ids = self.spotify_client.recall_artists(
                top_limit=top_limit,
                recent_limit=recent_limit,
                playlist_limit=playlist_limit,
                album_limit=album_limit,
                saved_tracks_limit=saved_tracks_limit
            )
            return {
                "artist_ids": artist_ids,
                "message": f"Successfully recalled {len(artist_ids)} artists"
            }

        @self.mcp.tool()
        async def recall_all_tracks() -> str:
            """
            Recall and filter all available Spotify tracks.

            Fetches all cached tracks and their audio features from Spotify, removes duplicates,
            and optionally filters tracks along a valence-energy vector defined in 'point_meta.json'.

            Returns:
                dict: {
                    "success": bool,
                    "message": str,
                    "recall_tracks": List[dict], each containing:
                        - id (str): Spotify track ID
                        - name (str): Track title
                        - artists (List[str]): Artist names
                        - duration_ms (int): Track duration
                        - uri (str): Spotify URI
                        - valence (float): Positivity measure of the track
                        - energy (float): Intensity/energy measure of the track
                }

            Note:
                If 'point_meta.json' with 'start' and 'end' points exists, tracks are projected and filtered
                along the valence-energy direction for relevance in MPC applications.
            """
            tracks = await self.spotify_client.recall_all_tracks(lastfm_client=self.lastfm_client)
            data = tracks['data']
            search_tracks = data.get('tracks', [])
            search_track_ids = data.get('track_ids', [])
            search_artist_names = data.get('artist_names', [])
            

            # markdown
            # content = "# Recalled Tracks\n\n"
            # content += f"**Total Tracks:** {len(search_tracks)}\n\n"
            # content += "## Tracks:\n\n"
            recall_tracks = []
            flag_id = []
            for i, track in enumerate(search_tracks, 1):
                # content += f"{i}. **{track['name']}** - {', '.join([artist['name'] for artist in track['artists']])}\n"
                # content += f"- **Album:** {track['album']['name']}\n"
                # content += f"- **Duration:** {self.spotify_client.format_duration(track['duration_ms'])}\n"
                # content += f"- **Spotify URI:** {track['uri']}\n"
                if track['id'] in flag_id:
                    continue
                flag_id.append(track['id'])
                # acousticness, danceability, energy, \
                # instrumentalness, liveness, loudness, \
                # speechiness, tempo, valence = track['features']['data']['acousticness'], \
                # track['features']['data']['danceability'], track['features']['data']['energy'], \
                # track['features']['data']['instrumentalness'], track['features']['data']['liveness'], \
                # track['features']['data']['loudness'], track['features']['data']['speechiness'], \
                # track['features']['data']['tempo'], track['features']['data']['valence']
                acousticness = track['features']['data']['acousticness']
                danceability = track['features']['data']['danceability']
                energy = track['features']['data']['energy']
                instrumentalness = track['features']['data']['instrumentalness']
                liveness = track['features']['data']['liveness']
                loudness = track['features']['data']['loudness']
                speechiness = track['features']['data']['speechiness']
                tempo = track['features']['data']['tempo']
                valence = track['features']['data']['valence']
                # import pdb; pdb.set_trace()
                recall_tracks.append({
                    "id": track['id'],
                    "name": track['name'],
                    "artists": [artist['name'] for artist in track['artists']],
                    # "album": track['album']['name'],
                    "duration_ms": track['duration_ms'],
                    "uri": track['uri'],
                    "valence": valence,
                    "energy": energy,
                })

            # load point_meta
            point_meta_path = 'point_meta.json'
            point_start, point_end = None, None
            if os.path.exists(point_meta_path):
                with open(point_meta_path, 'r') as f:
                    point_meta = json.load(f)
                    point_start = point_meta.get('start', None)
                    point_end = point_meta.get('end', None)
            else:
                point_meta = {}
            if point_start and point_end:
                point_start = np.array([point_start['x'], point_start['y']])
                point_end = np.array([point_end['x'], point_end['y']])
                recall_tracks_valence = [t['valence'] for t in recall_tracks]
                recall_tracks_energy = [t['energy'] for t in recall_tracks]
                recall_tracks_valence = np.array(recall_tracks_valence)
                recall_tracks_energy = np.array(recall_tracks_energy)
                recall_tracks_points = np.column_stack((recall_tracks_valence, recall_tracks_energy))
                direction = point_end - point_start
                direction = direction / np.linalg.norm(direction)
                relative_vecs = recall_tracks_points - point_start
                proj_dis = np.dot(relative_vecs, direction)
                valid_mask = (proj_dis >= 0) & (proj_dis <= 1)
                valid_recall_tracks = [recall_tracks[i] for i in range(len(recall_tracks)) if valid_mask[i]]
                valid_proj_dis = proj_dis[valid_mask]
                sorted_indices = np.argsort(valid_proj_dis)
                sorted_recall_tracks = [valid_recall_tracks[i] for i in sorted_indices]
                recall_tracks = sorted_recall_tracks
            # content += "\n\n"
            return {
                "success": True,
                # "content": content,
                "message": f"Successfully recalled {len(search_tracks)} tracks",
                # "recall_tracks": search_tracks,  # NOTE: Do not add here, would cause much context in history
                "recall_tracks": recall_tracks,
            }

        @self.mcp.tool()
        async def recall_tracks_based_on_artist_names(artists: List[str]) -> str:
            """
            Recalls tracks based on artist names.

            Args:
                artists (List[str]): List of artist names.

            Returns:
                str: JSON string containing the recalled tracks.
            """
            logger.info(f'artists: {artists}')

            similar_artists = await self.lastfm_client.get_similar_artists(artists, limit=10, include_original=True)
            # similar_artists = [similar_artists[0]]
            logger.info(f'similar_artists: {similar_artists}')
            tracks = await self.spotify_client.recall_tracks_based_on_artist_names(lastfm_similar_artists=similar_artists)
            data = tracks['data']
            search_tracks = data.get('tracks', [])
            search_track_ids = data.get('track_ids', [])
            search_artist_names = data.get('artist_names', [])
            

            # markdown
            # content = "# Recalled Tracks\n\n"
            # content += f"**Total Tracks:** {len(search_tracks)}\n\n"
            # content += "## Tracks:\n\n"
            recall_tracks = []
            flag_id = []
            for i, track in enumerate(search_tracks, 1):
                # content += f"{i}. **{track['name']}** - {', '.join([artist['name'] for artist in track['artists']])}\n"
                # content += f"- **Album:** {track['album']['name']}\n"
                # content += f"- **Duration:** {self.spotify_client.format_duration(track['duration_ms'])}\n"
                # content += f"- **Spotify URI:** {track['uri']}\n"
                if track['id'] in flag_id:
                    continue
                if track['features']['success'] is False:
                    continue
                flag_id.append(track['id'])
                # acousticness, danceability, energy, \
                # instrumentalness, liveness, loudness, \
                # speechiness, tempo, valence = track['features']['data']['acousticness'], \
                # track['features']['data']['danceability'], track['features']['data']['energy'], \
                # track['features']['data']['instrumentalness'], track['features']['data']['liveness'], \
                # track['features']['data']['loudness'], track['features']['data']['speechiness'], \
                # track['features']['data']['tempo'], track['features']['data']['valence']
                acousticness = track['features']['data']['acousticness']
                danceability = track['features']['data']['danceability']
                energy = track['features']['data']['energy']
                instrumentalness = track['features']['data']['instrumentalness']
                liveness = track['features']['data']['liveness']
                loudness = track['features']['data']['loudness']
                speechiness = track['features']['data']['speechiness']
                tempo = track['features']['data']['tempo']
                valence = track['features']['data']['valence']
                # import pdb; pdb.set_trace()
                recall_tracks.append({
                    "id": track['id'],
                    "name": track['name'],
                    "artists": [artist['name'] for artist in track['artists']],
                    # "album": track['album']['name'],
                    "duration_ms": track['duration_ms'],
                    "uri": track['uri'],
                    "valence": valence,
                    "energy": energy,
                })

            # load point_meta
            point_meta_path = 'point_meta.json'
            point_start, point_end = None, None
            if os.path.exists(point_meta_path):
                with open(point_meta_path, 'r') as f:
                    point_meta = json.load(f)
                    point_start = point_meta.get('start', None)
                    point_end = point_meta.get('end', None)
            else:
                point_meta = {}
            if point_start and point_end:
                point_start = np.array([point_start['x'], point_start['y']])
                point_end = np.array([point_end['x'], point_end['y']])
                recall_tracks_valence = [t['valence'] for t in recall_tracks]
                recall_tracks_energy = [t['energy'] for t in recall_tracks]
                recall_tracks_valence = np.array(recall_tracks_valence)
                recall_tracks_energy = np.array(recall_tracks_energy)
                recall_tracks_points = np.column_stack((recall_tracks_valence, recall_tracks_energy))
                direction = point_end - point_start
                direction = direction / np.linalg.norm(direction)
                relative_vecs = recall_tracks_points - point_start
                proj_dis = np.dot(relative_vecs, direction)
                logger.info('proj_dis: ', proj_dis)
                valid_mask = (proj_dis >= 0) & (proj_dis <= 1)
                valid_recall_tracks = [recall_tracks[i] for i in range(len(recall_tracks)) if valid_mask[i]]
                logger.info('valid_recall_tracks: ', valid_recall_tracks)
                valid_proj_dis = proj_dis[valid_mask]
                logger.info('valid_proj_dis: ', valid_proj_dis)
                sorted_indices = np.argsort(valid_proj_dis)
                sorted_recall_tracks = [valid_recall_tracks[i] for i in sorted_indices]
                recall_tracks = sorted_recall_tracks
            # content += "\n\n"
            logger.info('start: ', point_start, 'end: ', point_end)
            return {
                "success": True,
                # "content": content,
                "message": f"Successfully recalled {len(search_tracks)} tracks",
                # "recall_tracks": search_tracks,  # NOTE: Do not add here, would cause much context in history
                "recall_tracks": recall_tracks,
                "present_artists": artists,
                "similar_artists": similar_artists,
            }


class SpotifyMCPSuperServerV2(SpotifyMCPServer):
    """Super MCP Server with recommendation tools"""
    def __init__(self, spotify_client: SpotifyClient, lastfm_client: LastfmClient, llm_client: LLMClient):
        """
        Initialize MCP server
        
        Args:
            spotify_client: Spotify client instance
            lastfm_client: Last.fm client instance
            llm_client: LLM client instance for activity to valence/energy mapping
        """
        self.spotify_client = spotify_client
        self.lastfm_client = lastfm_client
        self.llm_client = llm_client
        self.mcp = FastMCP("spotify-mcp-server")
        self.setup_tools()

    def setup_tools(self):
        """Setup MCP tools"""
        # @self.mcp.tool(enabled=False)
        # async def recommend_tracks_with_artist_names(artists: List[str], limit: int = 20) -> Dict[str, Any]:
        #     """
        #     Recommend tracks based on artist names.

        #     Args:
        #         artists (List[str]): List of artist names.
        #         limit (int): Maximum number of tracks to recommend.

        #     Returns:
        #         dict: {"success": bool, "message": str, "recommended_tracks": List[dict]}
        #     """
        #     logger.info(f'artists: {artists}')

        #     similar_artists = await self.lastfm_client.get_similar_artists(artists, limit=10, include_original=True)
        #     logger.info(f'similar_artists: {similar_artists}')
        #     tracks = await self.spotify_client.recall_tracks_based_on_artist_names(lastfm_similar_artists=similar_artists)
        #     data = tracks['data']
        #     search_tracks = data.get('tracks', [])
            
        #     recall_tracks = []
        #     flag_id = []
        #     for track in search_tracks:
        #         if track['id'] in flag_id:
        #             continue
        #         if track.get('features', {}).get('success', False) is False:
        #             continue
        #         flag_id.append(track['id'])
                
        #         acousticness = track['features']['data']['acousticness']
        #         danceability = track['features']['data']['danceability']
        #         energy = track['features']['data']['energy']
        #         valence = track['features']['data']['valence']
                
        #         recall_tracks.append({
        #             "id": track['id'],
        #             "name": track['name'],
        #             "artists": [artist['name'] for artist in track['artists']],
        #             "duration_ms": track['duration_ms'],
        #             "uri": track['uri'],
        #             "valence": valence,
        #             "energy": energy,
        #         })
            
        #     # Default to random selection if no specific valence/energy range is provided
        #     random.shuffle(recall_tracks)
        #     recommended_tracks = recall_tracks[:limit]
            
        #     return {
        #         "success": True,
        #         "message": f"Successfully recommended {len(recommended_tracks)} tracks",
        #         "recommended_tracks": recommended_tracks,
        #         "present_artists": artists,
        #         "similar_artists": similar_artists
        #     }

        @self.mcp.tool()
        async def recommend_tracks(activity: str, limit: int = 20, genres: List[str] = [], specific_wanted_artists_in_prompt: List[str] = [], add_to_playlist_or_create: bool = False, playlist_name: Optional[str] = None) -> Dict[str, Any]:
            """
            IMPORTANT: This tool is ONLY triggered when the user EXPLICITLY requests music/song recommendations!
            
            DO NOT trigger this tool for:
            - General mood expression (use mood_detection instead)
            - Emotional state updates
            - Playlist management requests
            - Any other non-recommendation requests
            
            ONLY trigger when user says things like:
            - "Recommend me some songs for..."
            - "I want music for..."
            - "Suggest tracks for..."
            - "Give me music recommendations for..."
            - "Find songs for..."
            - "I need music for..."
            
            This tool creates personalized music recommendations based on activity context and emotional coordinates, then automatically creates or updates playlists.
            
            Args:
                activity (str): The specific activity or context for music recommendation
                    Examples: "working out", "relaxing", "driving", "studying", "running", "meditation"
                limit (int): Maximum number of tracks to recommend (default: 20)
                genres (List[str]): Preferred music genres (e.g., ["pop", "rock", "hip hop", "jazz"])
                specific_wanted_artists_in_prompt (List[str]): Specific artists to include in recommendations
                    Note: Only use when user explicitly mentions specific artists in their request
                add_to_playlist_or_create (bool): Playlist management strategy
                    - False: Create new playlist with activity name
                    - True: Add to existing playlist (playlist_name required)
                playlist_name (Optional[str]): Name of existing playlist to add tracks to
                    Required when add_to_playlist_or_create is True
            
            Returns:
                str: Success message with playlist details and track count
            
            How it works:
            1. Maps activity to emotional coordinates (valence/energy) using LLM
            2. Recalls tracks from user's music library and similar artists
            3. Filters tracks based on emotional coordinates and preferences
            4. Creates new playlist or adds to existing one
            5. Returns confirmation message with playlist details
            
            Note: This tool automatically uses emotional coordinates from point_meta.json if available, 
            or generates appropriate defaults based on the activity type.
            """
            logger.info(f'activity: {activity}')
            logger.info(f'limit: {limit}')
            logger.info(f'genres: {genres}')
            logger.info(f'specific_wanted_artists_in_prompt: {specific_wanted_artists_in_prompt}')
            logger.info(f'add_to_playlist_or_create: {add_to_playlist_or_create}')
            logger.info(f'playlist_name: {playlist_name}')
            
            # Map activity to valence and energy ranges using LLM
            logger.info(f'Using LLM to determine valence and energy ranges for activity: {activity}')
            
            # # Prepare prompt for LLM
            prompt = ""
            with open('spotify_mcp_server/prompt.txt', 'r') as f:
                prompt = f.read()


            # Call LLM to get start and end points
            try:
                # Assuming we have an llm_client available
                llm_response = self.llm_client.generate(prompt)["output"]["text"]
                logger.info(f'LLM response: {llm_response}')
                # Parse LLM response
                points = json.loads(llm_response)
                start_point = (points['start_valence'], points['start_energy'])
                end_point = (points['end_valence'], points['end_energy'])
                logger.info(f'Determined points: start={start_point}, end={end_point}')

                # Derive ranges from points
                valence_min = min(start_point[0], end_point[0])
                valence_max = max(start_point[0], end_point[0])
                energy_min = min(start_point[1], end_point[1])
                energy_max = max(start_point[1], end_point[1])
                valence_range = (valence_min, valence_max)
                energy_range = (energy_min, energy_max)
                
                # Validate ranges
                if not (0 <= valence_range[0] <= valence_range[1] <= 1 and 0 <= energy_range[0] <= energy_range[1] <= 1):
                    raise ValueError("LLM returned invalid valence or energy ranges")
                
                logger.info(f'Determined ranges: valence={valence_range}, energy={energy_range}')
            except Exception as e:
                logger.error(f'Failed to determine ranges with LLM: {str(e)}')
                # Fallback to default ranges and points based on activity type
                # Check if activity involves mood change or emotional journey
                mood_change_keywords = ['mood changing', 'emotional journey', 'from sad to happy', 'from happy to sad', 'relaxing after', 'calming down', 'getting energetic', 'winding down']
                continuous_activity_keywords = ['working out', 'study', 'driving', 'running', 'walking', 'reading', 'coding', 'cycling', 'yoga', 'meditating']
                
                is_mood_change = any(keyword in activity.lower() for keyword in mood_change_keywords)
                is_continuous = any(keyword in activity.lower() for keyword in continuous_activity_keywords)
                
                if is_mood_change:
                    # For mood change activities, set different start and end points
                    # Default for 'mood changing from sad to happy'
                    start_point = (0.3, 0.2)
                    end_point = (0.9, 0.7)
                elif is_continuous:
                    # For continuous activities, set same start and end points
                    start_point = (0.7, 0.8)
                    end_point = (0.7, 0.8)
                else:
                    # For other activities, use general default
                    start_point = (0.5, 0.5)
                    end_point = (0.5, 0.5)
                
                valence_range = (min(start_point[0], end_point[0]), max(start_point[0], end_point[0]))
                energy_range = (min(start_point[1], end_point[1]), max(start_point[1], end_point[1]))
                logger.info(f'Using default ranges: valence={valence_range}, energy={energy_range}')
                logger.info(f'Using default points: start={start_point}, end={end_point}')
            
            # # Recall tracks and filter by valence and energy
            if specific_wanted_artists_in_prompt and len(specific_wanted_artists_in_prompt) > 0:
                similar_artists = await self.lastfm_client.get_similar_artists(specific_wanted_artists_in_prompt, limit=10, include_original=True)
                tracks = await self.spotify_client.recall_tracks_based_on_artist_names(lastfm_similar_artists=similar_artists)
            else:
                tracks = await self.spotify_client.recall_all_tracks(self.lastfm_client)
            # tracks = await self.spotify_client.recall_all_tracks(self.lastfm_client)
            data = tracks['data']
            search_tracks = data.get('tracks', [])
            logger.info(f'Found {len(search_tracks)} tracks')
            logger.info(f'search_tracks[:10]: {search_tracks[:10]}')
            
            filtered_tracks = []
            flag_id = []
            for track in search_tracks:
                if track['id'] in flag_id:
                    continue
                if track.get('features', {}).get('success', False) is False:
                    continue
                
                valence = track['features']['data']['valence']
                energy = track['features']['data']['energy']
                
                # Check if track is within the desired valence and energy ranges
                if valence_range[0] == valence_range[1] and energy_range[0] == energy_range[1]:
                    # sort by distance to the point
                    distance = math.sqrt((valence - start_point[0])**2 + (energy - start_point[1])**2)
                    filtered_tracks.append({
                        "id": track['id'],
                        "name": track['name'],
                        "artists": [artist['name'] for artist in track['artists']],
                        "duration_ms": track['duration_ms'],
                        "uri": track['uri'],
                        "valence": valence,
                        "energy": energy,
                        "distance": distance,
                    })
                    continue
                # Check if track is within the desired valence and energy ranges
                if valence_range[0] <= valence <= valence_range[1] and energy_range[0] <= energy <= energy_range[1]:
                    flag_id.append(track['id'])
                    filtered_tracks.append({
                        "id": track['id'],
                        "name": track['name'],
                        "artists": [artist['name'] for artist in track['artists']],
                        "duration_ms": track['duration_ms'],
                        "uri": track['uri'],
                        "valence": valence,
                        "energy": energy,
                    })
            if len(filtered_tracks) < limit:
                range_center_x = (valence_range[0] + valence_range[1]) / 2
                range_center_y = (energy_range[0] + energy_range[1]) / 2
                # get tracks in search_tracks but not in filtered_tracks
                unselected_tracks = [track for track in search_tracks if track['id'] not in flag_id and track.get('features', {}).get('success', False) is True]
                logger.info(f'filtered_tracks[:10]: {filtered_tracks[:10]}')
                logger.info(f'unselected_tracks[:10]: {unselected_tracks[:10]}')
                # calc distance to the center
                for idx, track in enumerate(unselected_tracks):
                    unselected_tracks[idx]['distance'] = math.sqrt((track['features']['data']['valence'] - range_center_x)**2 + (track['features']['data']['energy'] - range_center_y)**2)
                for idx, track in enumerate(filtered_tracks):
                    filtered_tracks[idx]['distance'] = math.sqrt((track['valence'] - range_center_x)**2 + (track['energy'] - range_center_y)**2)
                # sort by distance to the center
                unselected_tracks.sort(key=lambda x: x['distance'])
                # add unselected_tracks to filtered_tracks
                filtered_tracks.extend(unselected_tracks)
                # sort by distance
                filtered_tracks.sort(key=lambda x: x['distance'])
            
            # # Shuffle and limit the results
            # random.shuffle(filtered_tracks)
            # logger.info(f'Number of tracks of filtered_tracks: {len(filtered_tracks)}')
            # logger.info(f'filtered_tracks: {filtered_tracks}')
            # if 'distance' in filtered_tracks[0]:
            #     filtered_tracks.sort(key=lambda x: x['distance'])
            #     recommended_tracks = filtered_tracks[:limit]
            # else:
            #     recommended_tracks = filtered_tracks[:limit]
            
            if add_to_playlist_or_create:
                # find the playlist id
                find_playlist_result = self.spotify_client.get_user_playlists(limit=50)
                if not find_playlist_result["success"]:
                    return {
                        "success": False,
                        "message": f"Failed to find playlist: {find_playlist_result['message']}",
                    }
                playlist_id = None
                playlists = find_playlist_result["data"]["items"]
                for playlist in playlists:
                    if playlist["name"] == playlist_name:
                        playlist_id = playlist["id"]
                        break
                if not playlist_id: # create playlist
                    create_playlist_result = self.spotify_client.create_playlist(playlist_name, description=f"Playlist for {activity}")
                    if not create_playlist_result["success"]:
                        return {
                            "success": False,
                            "message": f"{create_playlist_result['message']}",
                            # "recommended_tracks": recommended_tracks
                        }
                    playlist_id = create_playlist_result["data"]["id"]
            else:
                # create playlist
                create_playlist_result = self.spotify_client.create_playlist(activity, description=f"Playlist for {activity}")
                if not create_playlist_result["success"]:
                    return {
                        "success": False,
                        "message": f"{create_playlist_result['message']}",
                        # "recommended_tracks": recommended_tracks
                    }
                playlist_id = create_playlist_result["data"]["id"]

            # check track names in playlist
            track_names_in_playlist = self.spotify_client.get_playlist_tracks(playlist_id)
            # json.dump(track_names_in_playlist, open('track_names_in_playlist.json', 'w'), indent=4)
            exist_tracks = [track['track']['name'] for track in track_names_in_playlist['data']['items']]
            filtered_tracks = [track for track in filtered_tracks if track['name'] not in exist_tracks]
            # Shuffle and limit the results
            random.shuffle(filtered_tracks)
            logger.info(f'Number of tracks of filtered_tracks: {len(filtered_tracks)}')
            logger.info(f'filtered_tracks[:10]: {filtered_tracks[:10]}')
            if 'distance' in filtered_tracks[0]:
                filtered_tracks.sort(key=lambda x: x['distance'])
                recommended_tracks = filtered_tracks[:limit]
            else:
                recommended_tracks = filtered_tracks[:limit]

            # logger.info(f'track_names_in_playlist: {track_names_in_playlist}')
            # Add tracks to the playlist
            track_uris = [track['uri'] for track in recommended_tracks]
            logger.info(f"Number of tracks to add: {len(track_uris)}")
            if not track_uris:
                return {
                    "success": False,
                    "message": "No tracks to add to playlist: recommended_tracks is empty",
                    "playlist_id": playlist_id
                }
            add_tracks_result = self.spotify_client.add_tracks_to_playlist(playlist_id, track_uris)
            
            if not add_tracks_result["success"]:
                return {
                    "success": False,
                    "message": f"Failed to add tracks to playlist: {add_tracks_result['message']}",
                    "playlist_id": playlist_id,
                    # "recommended_tracks": recommended_tracks
                }
            
            if add_to_playlist_or_create:   
                message = f"Successfully added tracks to playlist '{playlist_name}' with {len(recommended_tracks)} tracks"
                if specific_wanted_artists_in_prompt:
                    message += f" related to {specific_wanted_artists_in_prompt}"
                # return {
                #     "success": True,
                #     "message": message,
                #     "playlist_id": playlist_id,
                #     "recommended_tracks": recommended_tracks,
                #     "start_point": start_point,
                #     "end_point": end_point
                # }
                return message
            else:
                message = f"Successfully created playlist '{activity}' with {len(recommended_tracks)} tracks"
                if specific_wanted_artists_in_prompt:
                    message += f" related to {specific_wanted_artists_in_prompt}"
                # return {
                #     "success": True,
                #     "message": message,
                #     "playlist_id": playlist_id,
                #     "recommended_tracks": recommended_tracks,
                #     "start_point": start_point,
                #     "end_point": end_point
                # }
                return message

        @self.mcp.tool()
        async def mood_detection(user_mood_expression: str) -> dict:
            """
            Detect user's mood from natural language expression and generate valence/energy coordinates for emotional state tracking.
            
            This tool is triggered when:
            1. User wants to express their current emotional state (e.g., "I feel sad", "I'm hyped", "in a chill mood")
            2. User wants to set up an emotional journey/transition (e.g., "I want to go from feeling down to feeling energetic", "help me transition from stressed to relaxed")
            3. User wants to update their emotional baseline for music recommendations
            
            The tool maps natural language to valence (positivity: 0=sad/negative, 1=happy/positive) and energy (intensity: 0=calm/relaxed, 1=energetic/excited) coordinates.
            
            Args:
                user_mood_expression (str): Natural language description of mood or emotional transition
                    Examples:
                    - Current state: "I feel sad", "I'm hyped", "feeling anxious", "in a good mood"
                    - Emotional journey: "help me go from stressed to calm", "I want to transition from sad to happy"
                    - Activity-based: "I need music for working out", "help me relax after a long day"
            
            Returns:
                dict: JSON object containing:
                    - success (bool): Whether the operation was successful
                    - type (str): "single_mood" or "mood_transition"
                    - message (str): Human-readable status message
                    - coordinates (dict): Start and end valence/energy coordinates
                    - file_path (str): Path to saved point_meta.json file
            
            Note:
                - Single mood: Only updates the start point, preserves existing end point if available
                - Mood transition: Updates both start and end points for emotional journey mapping
                - Coordinates are saved to point_meta.json for use in music recommendation algorithms
                - Valence and energy values range from 0.0 to 1.0
            """
            logger.info(f'User mood expression: {user_mood_expression}')
            
            try:
                # Read the mood detection prompt
                prompt_path = 'spotify_mcp_server/mood_detection_prompt.txt'
                if not os.path.exists(prompt_path):
                    return {
                        "success": False,
                        "error": "prompt_file_not_found",
                        "message": f"Mood detection prompt file not found at {prompt_path}"
                    }
                
                with open(prompt_path, 'r') as f:
                    prompt = f.read()
                
                # Add the user's mood expression to the prompt
                full_prompt = f"{prompt}\n\nUser: {user_mood_expression}\n"
                
                # Call LLM to get mood coordinates
                logger.info('Using LLM to detect mood coordinates')
                llm_response = self.llm_client.generate(full_prompt)["output"]["text"]
                logger.info(f'LLM response: {llm_response}')
                
                # Parse LLM response to extract coordinates
                coordinates = None
                try:
                    # Clean the response and parse as JSON
                    # Remove any extra whitespace and newlines
                    cleaned_response = llm_response.strip()
                    coordinates = json.loads(cleaned_response)
                    
                    # Validate coordinates
                    required_keys = ['start_valence', 'start_energy', 'end_valence', 'end_energy']
                    coordinates_valid = True
                    
                    for key in required_keys:
                        if key not in coordinates:
                            logger.warning(f"LLM response missing required key '{key}', using default values")
                            coordinates_valid = False
                            break
                        if not isinstance(coordinates[key], (int, float)):
                            logger.warning(f"Invalid coordinate value for '{key}': {coordinates[key]}, using default values")
                            coordinates_valid = False
                            break
                        if not (0.0 <= coordinates[key] <= 1.0):
                            logger.warning(f"Coordinate value for '{key}' must be between 0.0 and 1.0, got {coordinates[key]}, using default values")
                            coordinates_valid = False
                            break
                    
                    if not coordinates_valid:
                        coordinates = None
                        
                except json.JSONDecodeError as e:
                    logger.error(f'Failed to parse LLM response as JSON: {e}, using default values')
                    coordinates = None
                
                # Use default coordinates if parsing failed or validation failed
                if coordinates is None:
                    logger.info('Using default mood coordinates')
                    # Default to neutral mood (0.5, 0.5)
                    default_coordinates = {
                        'start_valence': 0.5,
                        'start_energy': 0.5,
                        'end_valence': 0.5,
                        'end_energy': 0.5
                    }
                    coordinates = default_coordinates
                
                # Determine if it's a single mood or mood transition
                is_transition = (coordinates['start_valence'] != coordinates['end_valence'] or 
                               coordinates['start_energy'] != coordinates['end_energy'])
                
                # Load existing point_meta.json if it exists
                existing_point_meta = {}
                point_meta_path = 'point_meta.json'
                if os.path.exists(point_meta_path):
                    try:
                        with open(point_meta_path, 'r') as f:
                            existing_point_meta = json.load(f)
                        logger.info(f'Loaded existing point_meta from {point_meta_path}')
                    except Exception as e:
                        logger.warning(f'Failed to load existing point_meta: {e}, starting fresh')
                        existing_point_meta = {}
                
                # Prepare data for point_meta.json based on transition type
                if is_transition:
                    # For mood transition, update both start and end
                    point_meta_data = {
                        "start": {
                            "x": coordinates['start_valence'],
                            "y": coordinates['start_energy'],
                            "type": "start"
                        },
                        "end": {
                            "x": coordinates['end_valence'],
                            "y": coordinates['end_energy'],
                            "type": "end"
                        }
                    }
                    logger.info('Mood transition detected: updating both start and end points')
                else:
                    # For single mood, only update start point, keep existing end if available
                    point_meta_data = {
                        "start": {
                            "x": coordinates['start_valence'],
                            "y": coordinates['start_energy'],
                            "type": "start"
                        }
                    }
                    
                    # Keep existing end point if it exists
                    if 'end' in existing_point_meta:
                        point_meta_data["end"] = existing_point_meta["end"]
                        logger.info('Single mood detected: updating start point, keeping existing end point')
                    else:
                        # If no existing end point, set it same as start
                        point_meta_data["end"] = {
                            "x": coordinates['start_valence'],
                            "y": coordinates['start_energy'],
                            "type": "end"
                        }
                        logger.info('Single mood detected: setting both start and end to same point')
                
                logger.info(f'Point meta data prepared: {point_meta_data}')
                # Save to point_meta.json
                with open(point_meta_path, 'w') as f:
                    json.dump(point_meta_data, f, indent=2)
                
                logger.info(f'Successfully saved mood coordinates to {point_meta_path}')
                
                if is_transition:
                    result = {
                        "success": True,
                        "type": "mood_transition",
                        "message": "Mood transition detected and coordinates saved!",
                        "coordinates": {
                            "start": {
                                "valence": coordinates['start_valence'],
                                "energy": coordinates['start_energy']
                            },
                            "end": {
                                "valence": coordinates['end_valence'],
                                "energy": coordinates['end_energy']
                            }
                        },
                        "file_path": "point_meta.json"
                    }
                else:
                    result = {
                        "success": True,
                        "type": "single_mood",
                        "message": "Current mood detected and coordinates saved!",
                        "coordinates": {
                            "start": {
                                "valence": coordinates['start_valence'],
                                "energy": coordinates['start_energy']
                            },
                            "end": {
                                "valence": coordinates['end_valence'],
                                "energy": coordinates['end_energy']
                            }
                        },
                        "file_path": "point_meta.json"
                    }
                
                return result
                
            except Exception as e:
                logger.error(f'Error in mood detection: {str(e)}')
                return {
                    "success": False,
                    "error": "general_error",
                    "message": f"Failed to detect mood: {str(e)}"
                }