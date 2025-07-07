const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function getSpotifyUser(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Fail to get user info');
  }

  return response.json();
}

export async function getCurrentPlayback(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204) {
    // nothing to play
    return null;
  }

  if (!response.ok) {
    throw new Error('Fail to get current playback');
  }

  return response.json();
}

export async function getUserPlaylists(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Fail to get user playlists');
  }

  return response.json();
}

export async function getQueue(accessToken: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me/player/queue`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 204) {
        // 没有正在播放的内容
        return {
          currently_playing: null,
          queue: []
        };
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed, please check your access token');
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          await new Promise(resolve => setTimeout(resolve, (parseInt(retryAfter || '5') * 1000)));
          continue;
        }
        throw new Error(`Fail to get queue: ${response.status}`);
      }

      const data = await response.json();
      console.log('Queue data:', data);
      return data;
    } catch (err) {
      console.error(`Fail to get queue (try ${i + 1}/${retries}):`, err);
      if (i === retries - 1) {
        throw err;
      }
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Fail to get queue after multiple retries');
}

export async function getRecentlyPlayed(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/player/recently-played?limit=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recently played');
  }

  return response.json();
}

export async function getUserSubscription(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user subscription data');
  }

  const data = await response.json();
  console.log('User subscription data:', data);
  return {
    isPremium: data.product === 'premium',
    country: data.country,
  };
}

export async function getOrCreateRecommendPlaylist(accessToken: string): Promise<string> {
  // get all playlists
  const userId = await getCurrentUserId(accessToken);
  const playlistsRes = await fetch(`${SPOTIFY_API_BASE}/me/playlists?`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const playlists = await playlistsRes.json();
  console.log('playlists: ', playlists)

  let recommend = playlists.items.find((p: any) => p.name === 'recommend');
  console.log('recommend: ', recommend)
  let playlistId = recommend?.id;
  if (playlistId) return playlistId;
  // create if not found
  console.log('userId: ', userId)

  if (!userId) throw new Error('No user id found');
  const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'recommend', public: false, description: 'Recommended tracks' })
  });
  const created = await createRes.json();
  console.log('created: ', created)

  return created.id;
}

export async function addTrackToPlaylist(accessToken: string, playlistId: string, trackUri: string): Promise<void> {
  await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris: [trackUri] })
  });
}

export async function getCurrentUserId(accessToken: string): Promise<string> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Fail to get user id');
  const data = await res.json();
  return data.id;
} 