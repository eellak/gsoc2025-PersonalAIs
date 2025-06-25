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