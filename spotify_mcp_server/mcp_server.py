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
import numpy as np

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
                return f"Failed to create playlist: {result['message']}"
            
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
            tracks = await self.spotify_client.recall_all_tracks()
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

        async def recall_tracks_based_on_artist_name(artist_name: str) -> str:
            """
            Recall and filter Spotify tracks by artist name.

            Fetches tracks and their audio features from Spotify, removes duplicates,
            and optionally filters them along a valence-energy vector defined in 'point_meta.json'.

            Args:
                artist_name (str): The name of the artist to search for relevant tracks.

            Returns:
                dict: A result dictionary with the following fields:
                    - success (bool): Whether the recall operation succeeded.
                    - message (str): A short status message.
                    - recall_tracks (List[dict]): A list of recalled track dictionaries, each containing:
                        - id (str): Spotify track ID.
                        - name (str): Track name.
                        - artists (List[str]): Names of contributing artists.
                        - duration_ms (int): Track duration in milliseconds.
                        - uri (str): Spotify URI.
                        - valence (float): Valence score (positivity of the track).
                        - energy (float): Energy level of the track.

            Note:
                If a local 'point_meta.json' file exists and contains start/end points,
                tracks are projected onto the valence-energy plane and filtered along that direction.
                The output is suitable for use in downstream MPC planning or decision modules.
            """
            tracks = await self.spotify_client.recall_tracks_based_on_artist_name(artist_name)
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