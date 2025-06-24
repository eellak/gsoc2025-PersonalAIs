'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { getQueue, getCurrentPlayback, getUserSubscription } from '@/lib/spotify';
import Image from 'next/image';
import { RefreshCw, Play, Pause, SkipBack, SkipForward, Crown, LogOut, Shuffle, Repeat } from 'lucide-react';
import { Button } from 'ui/button';
import * as Slider from '@radix-ui/react-slider';
import { toast } from 'sonner';
import { MusicIcon } from 'lucide-react';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface QueueItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
  duration_ms: number;
  uri: string;
}

interface Queue {
  currently_playing: QueueItem;
  queue: QueueItem[];
}

interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: QueueItem;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
}

interface Subscription {
  isPremium: boolean;
  country: string;
}

export default function Queue() {
  const { data: session } = useSession();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize Web Playback SDK
  useEffect(() => {
    if (!session?.accessToken || !subscription?.isPremium) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Spotify Client Player',
        getOAuthToken: (cb: (token: string) => void) => {
          if (session.accessToken) {
            cb(session.accessToken);
          }
        },
        volume: 0.5
      });

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Initialization error:', message);
        toast.error('Initialization error', {
          description: message,
        });
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Authentication error:', message);
        toast.error('Authentication error', {
          description: message,
        });
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Account error:', message);
        toast.error('Account error', {
          description: message,
        });
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Playback error:', message);
        toast.error('Playback error', {
          description: message,
        });
      });

      // Playback state updates
      player.addListener('player_state_changed', (state: any) => {
        console.log('Playback state updated:', state);
        if (state && state.track_window && state.track_window.current_track) {
          setPlaybackState({
            is_playing: !state.paused,
            progress_ms: state.position,
            item: {
              id: state.track_window.current_track.id,
              name: state.track_window.current_track.name,
              artists: state.track_window.current_track.artists,
              album: {
                images: state.track_window.current_track.album.images
              },
              duration_ms: state.track_window.current_track.duration_ms,
              uri: state.track_window.current_track.uri
            },
            shuffle_state: state.shuffle_state,
            repeat_state: state.repeat_state
          });
        } else {
          setPlaybackState(null);
        }
      });

      // Device ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ready:', device_id);
        setDeviceId(device_id);
        
        toast.success('Device connected', {
          description: 'Preparing playback...',
        });
        
        if (!session?.accessToken) return;
        
        // Transfer playback to this device
        transferPlayback(device_id).then(() => {
          setTimeout(() => {
            fetchData();
          }, 3000);
        });
      });

      // Device offline
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device offline:', device_id);
        toast.error('Device offline');
      });

      // Connect player
      player.connect().then((success: boolean) => {
        if (success) {
          console.log('Player connected successfully');
          setPlayer(player);
          toast.info('Connecting player...');
        } else {
          toast.error('Player connection failed');
        }
      });
    };

    return () => {
      if (player) {
        player.disconnect();
        toast.info('Player disconnected');
      }
    };
  }, [session?.accessToken, subscription?.isPremium]);


  // Fetch data on initial load
  useEffect(() => {
    if (session?.accessToken) {
      fetchData();
    }
  }, [session?.accessToken]);

  // Add progress bar update timer
  useEffect(() => {
    if (playbackState?.is_playing) {
      progressInterval.current = setInterval(() => {
        setPlaybackState(prev => {
          if (!prev) return null;
          const newProgress = prev.progress_ms + 1000;
          return {
            ...prev,
            progress_ms: newProgress > (prev.item?.duration_ms || 0) ? 0 : newProgress
          };
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [playbackState?.is_playing]);

  // Transfer playback to specified device
  const transferPlayback = async (deviceId: string) => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transfer playback');
      }
    } catch (err) {
      console.error('Failed to transfer playback:', err);
    }
  };

  const fetchData = async () => {
    if (!session?.accessToken) return;

    try {
      setRefreshing(true);
      toast.loading('Loading queue...');
      const [queueData, playbackData, subscriptionData] = await Promise.all([
        getQueue(session.accessToken),
        getCurrentPlayback(session.accessToken),
        getUserSubscription(session.accessToken)
      ]);
      setQueue(queueData);
      setPlaybackState(playbackData);
      setSubscription(subscriptionData);
      toast.dismiss();
    } catch (err) {
      setError('Failed to get queue');
      console.error(err);
      toast.error('Failed to get queue', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const ensurePlaylistLoaded = async () => {
    if (!session?.accessToken || !subscription?.isPremium || !player) return false;
    
    try {
      const state = await player.getCurrentState();
      if (!state) {
        // Get first track from queue
        const queueData = await getQueue(session.accessToken);
        if (queueData?.queue?.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const newState = await player.getCurrentState();
          return !!newState;
        }
      }
      return !!state;
    } catch (err) {
      console.error('Failed to check playlist status:', err);
      return false;
    }
  };

  const togglePlayback = async () => {
    if (!session?.accessToken || !subscription?.isPremium || !player) return;
    try {
      const isLoaded = await ensurePlaylistLoaded();
      if (!isLoaded) {
        throw new Error('Playlist not loaded');
      }
      await player.togglePlay();
    } catch (err) {
      console.error('Failed to toggle playback:', err);
      await fetchData();
    }
  };

  const skipToNext = async () => {
    if (!session?.accessToken || !subscription?.isPremium || !player) return;
    try {
      const isLoaded = await ensurePlaylistLoaded();
      if (!isLoaded) {
        throw new Error('Playlist not loaded');
      }
      await player.nextTrack();
      // Wait for 3 second before refreshing
      setTimeout(() => {
        fetchData();
      }, 3000);
    } catch (err) {
      console.error('Failed to skip to next track:', err);
      await fetchData();
    }
  };

  const skipToPrevious = async () => {
    if (!session?.accessToken || !subscription?.isPremium || !player) return;
    try {
      const isLoaded = await ensurePlaylistLoaded();
      if (!isLoaded) {
        throw new Error('Playlist not loaded');
      }
      await player.previousTrack();
      // Wait for 3 second before refreshing
      setTimeout(() => {
        fetchData();
      }, 3000);
    } catch (err) {
      console.error('Failed to skip to previous track:', err);
      await fetchData();
    }
  };

  const seekToPosition = async (position: number) => {
    if (!session?.accessToken || !subscription?.isPremium || !player) return;
    try {
      await player.seek(position);
    } catch (err) {
      console.error('Failed to seek position:', err);
    }
  };

//   const toggleShuffle = async () => {
//     if (!session?.accessToken || !subscription?.isPremium || !player) return;
//     try {
//       await player.toggleShuffle();
//     } catch (err) {
//       console.error('Failed to toggle shuffle:', err);
//     }
//   };

//   const toggleRepeat = async () => {
//     if (!session?.accessToken || !subscription?.isPremium || !player) return;
//     try {
//       // Cycle through repeat modes: off -> context -> track -> off
//       const nextState = playbackState?.repeat_state === 'off' ? 'context' :
//                        playbackState?.repeat_state === 'context' ? 'track' : 'off';
//       await player.toggleRepeat(nextState);
//     } catch (err) {
//       console.error('Failed to toggle repeat:', err);
//     }
//   };

//   useEffect(() => {
//     if (playbackState) {
//       const timer = setTimeout(() => {
//         fetchData();
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [playbackState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button
            variant="outline"
            onClick={fetchData}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!queue || !playbackState || !subscription) {
    return null;
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const uniqueTracks = new Map<string, QueueItem>();
  
  // Only use tracks from queue
  queue.queue.forEach(track => {
    if (!uniqueTracks.has(track.id)) {
      uniqueTracks.set(track.id, track);
    }
  });

  const allTracks = Array.from(uniqueTracks.values());

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MusicIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Queue</h2>
            {!subscription.isPremium && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Crown className="h-3 w-3" />
                <span>Premium required</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={refreshing}
              className="h-8 w-8 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="h-8 w-8 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="p-4 border-b">
        {playbackState?.item ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                <Image
                  src={playbackState.item.album.images[0]?.url || '/placeholder.png'}
                  alt={playbackState.item.name}
                  fill
                  sizes="(max-width: 768px) 64px, 64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{playbackState.item.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {playbackState.item.artists.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>

            {subscription.isPremium ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1" />
                  <div className="flex items-center justify-between w-full max-w-[200px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipToPrevious}
                      className="h-8 w-8 cursor-pointer"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayback}
                      className="h-10 w-10 cursor-pointer"
                    >
                      {playbackState.is_playing ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipToNext}
                      className="h-8 w-8 cursor-pointer"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(playbackState.progress_ms)}
                  </span>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[playbackState.progress_ms]}
                    max={playbackState.item.duration_ms}
                    step={1000}
                    onValueChange={([value]) => seekToPosition(value)}
                  >
                    <Slider.Track className="bg-black/20 relative grow rounded-full h-[2px]">
                      <Slider.Range 
                        className="absolute rounded-full h-[3px]" 
                        style={{ 
                          width: `${(playbackState.progress_ms / playbackState.item.duration_ms) * 100}%`,
                          backgroundColor: 'black'
                        }} 
                      />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block w-3 h-3 bg-background border-2 border-black rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label="Progress"
                    />
                  </Slider.Root>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(playbackState.item.duration_ms)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Now Playing
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            No track playing
          </div>
        )}
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
        <div className="p-4 space-y-4">
          {allTracks.map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-md overflow-hidden relative flex-shrink-0 transition-transform duration-300 hover:scale-110">
                <Image
                  src={track.album.images[0]?.url || '/placeholder.png'}
                  alt={track.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artists.map(artist => artist.name).join(', ')}
                </p>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {formatDuration(track.duration_ms)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 