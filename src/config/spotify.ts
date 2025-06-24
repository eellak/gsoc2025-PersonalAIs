export const SPOTIFY_CONFIG = {
  API_BASE: 'https://api.spotify.com/v1',
  IMAGE_DOMAINS: [
    'i.scdn.co',
    'platform-lookaside.fbsbx.com',
    'profile-images.scdn.co',
  ],
  SCOPES: [
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
  ].join(' '),
} as const;

export type SpotifyConfig = typeof SPOTIFY_CONFIG; 