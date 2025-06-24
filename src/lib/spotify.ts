const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function getSpotifyUser(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('获取用户信息失败');
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
    // 没有正在播放的内容
    return null;
  }

  if (!response.ok) {
    throw new Error('获取当前播放信息失败');
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
    throw new Error('获取播放列表失败');
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
          throw new Error('认证已过期，请重新登录');
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          await new Promise(resolve => setTimeout(resolve, (parseInt(retryAfter || '5') * 1000)));
          continue;
        }
        throw new Error(`获取队列失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('Queue data:', data);
      return data;
    } catch (err) {
      console.error(`获取队列失败 (尝试 ${i + 1}/${retries}):`, err);
      if (i === retries - 1) {
        throw err;
      }
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('获取队列失败，已达到最大重试次数');
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
    throw new Error('获取用户订阅信息失败');
  }

  const data = await response.json();
  console.log('User subscription data:', data);
  return {
    isPremium: data.product === 'premium',
    country: data.country,
  };
} 