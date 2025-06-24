'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Shuffle, Repeat } from 'lucide-react';
import { Button } from 'ui/button';
import * as Slider from '@radix-ui/react-slider';
import { getQueue } from '@/lib/spotify';
import Image from 'next/image';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface PlayerProps {
  onPlayerReady: (player: any) => void;
  onPlayerStateChange: (state: any) => void;
  onPlayerError: (error: any) => void;
}

export function SpotifyPlayer({ onPlayerReady, onPlayerStateChange, onPlayerError }: PlayerProps) {
  const { data: session } = useSession();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [queue, setQueue] = useState<any>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'track' | 'context'>('off');
  const progressInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const refreshInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // 获取队列
  const fetchQueue = async () => {
    if (!session?.accessToken) return;
    try {
      const queueData = await getQueue(session.accessToken);
      setQueue(queueData);
      return queueData;
    } catch (err) {
      console.error('获取队列失败:', err);
      return null;
    }
  };

  // 设置定时刷新队列
  const setupQueueRefresh = () => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    refreshInterval.current = setInterval(fetchQueue, 5000);
  };

  // 初始化时设置定时刷新
  useEffect(() => {
    if (session?.accessToken) {
      fetchQueue();
      setupQueueRefresh();
    }
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [session?.accessToken]);

  // 播放队列中的第一首歌
  const playFirstTrack = async () => {
    if (!playerRef.current || !queue?.queue?.length) return;
    try {
      await playerRef.current.load(queue.queue[0].uri);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await playerRef.current.play();
      fetchQueue();
    } catch (err) {
      console.error('播放失败:', err);
    }
  };

  // 播放控制函数
  const togglePlay = async () => {
    if (!playerRef.current) return;
    try {
      if (!currentTrack && queue?.queue?.length > 0) {
        await playFirstTrack();
      } else {
        await playerRef.current.togglePlay();
      }
    } catch (err) {
      console.error('切换播放状态失败:', err);
    }
  };

  const skipToNext = async () => {
    if (!playerRef.current) return;
    try {
      if (!currentTrack && queue?.queue?.length > 0) {
        await playFirstTrack();
      } else {
        await playerRef.current.nextTrack();
      }
      fetchQueue();
    } catch (err) {
      console.error('切换下一首失败:', err);
    }
  };

  const skipToPrevious = async () => {
    if (!playerRef.current) return;
    try {
      if (!currentTrack && queue?.queue?.length > 0) {
        await playFirstTrack();
      } else {
        await playerRef.current.previousTrack();
      }
      fetchQueue();
    } catch (err) {
      console.error('切换上一首失败:', err);
    }
  };

  const seekToPosition = async (position: number) => {
    if (!playerRef.current) return;
    try {
      await playerRef.current.seek(position);
      setProgress(position);
    } catch (err) {
      console.error('调整播放位置失败:', err);
    }
  };

  const toggleShuffle = async () => {
    if (!playerRef.current) return;
    try {
      await playerRef.current.toggleShuffle();
      setShuffle(!shuffle);
    } catch (err) {
      console.error('切换随机播放失败:', err);
    }
  };

  const toggleRepeat = async () => {
    if (!playerRef.current) return;
    try {
      const nextState = repeat === 'off' ? 'context' :
                       repeat === 'context' ? 'track' : 'off';
      await playerRef.current.toggleRepeat(nextState);
      setRepeat(nextState);
    } catch (err) {
      console.error('切换重复播放失败:', err);
    }
  };

  const setVolumeLevel = async (value: number) => {
    if (!playerRef.current) return;
    setVolume(value);
    await playerRef.current.setVolume(value / 100);
  };

  // 初始化 Web Playback SDK
  useEffect(() => {
    if (!session?.accessToken) return;

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
        volume: volume / 100
      });

      // 错误处理
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('初始化错误:', message);
        onPlayerError({ type: 'initialization_error', message });
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('认证错误:', message);
        onPlayerError({ type: 'authentication_error', message });
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('账户错误:', message);
        onPlayerError({ type: 'account_error', message });
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('播放错误:', message);
        onPlayerError({ type: 'playback_error', message });
      });

      // 播放状态更新
      player.addListener('player_state_changed', (state: any) => {
        console.log('播放状态更新:', state);
        if (state) {
          setIsPlaying(!state.paused);
          setCurrentTrack(state.track_window.current_track);
          setProgress(state.position);
          setDuration(state.duration);
          setShuffle(state.shuffle);
          setRepeat(state.repeat_mode);
          
          if (state.track_window.current_track?.id !== currentTrack?.id) {
            fetchQueue();
          }
        }
        onPlayerStateChange(state);
      });

      // 设备就绪
      player.addListener('ready', async ({ device_id }: { device_id: string }) => {
        console.log('设备就绪:', device_id);
        setDeviceId(device_id);
        
        try {
          // 立即刷新队列
          await fetchQueue();
          
          // 获取当前播放状态
          const response = await fetch('https://api.spotify.com/v1/me/player', {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });

          if (response.status === 204) {
            console.log('没有正在播放的内容，尝试播放队列第一首');
            const queueData = await fetchQueue();
            if (queueData?.queue?.length > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              await playFirstTrack();
            }
            return;
          }

          if (!response.ok) {
            throw new Error('获取播放状态失败');
          }

          const data = await response.json();
          if (data.item) {
            try {
              await fetch('https://api.spotify.com/v1/me/player/pause', {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              });

              await new Promise(resolve => setTimeout(resolve, 1000));

              await player.load(data.item.uri, {
                play: false
              });

              await new Promise(resolve => setTimeout(resolve, 1000));

              await fetch('https://api.spotify.com/v1/me/player/play', {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              });
            } catch (err) {
              console.error('加载播放内容失败:', err);
            }
          }
        } catch (err) {
          console.error('获取播放状态失败:', err);
        }

        // 将播放转移到当前设备
        try {
          const response = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_ids: [device_id],
              play: false
            }),
          });

          if (response.status === 204) {
            console.log('播放已转移到当前设备');
          } else if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`转移播放失败: ${errorText}`);
          }
        } catch (err) {
          console.error('转移播放失败:', err);
        }
        
        playerRef.current = player;
        onPlayerReady(player);
      });

      // 设备离线
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('设备离线:', device_id);
      });

      // 连接播放器
      player.connect().then((success: boolean) => {
        if (success) {
          console.log('播放器连接成功');
        }
      });
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [session?.accessToken, onPlayerReady, onPlayerStateChange, onPlayerError, volume]);

  // 添加定时器更新进度
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 100;
          return newProgress > duration ? duration : newProgress;
        });
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, duration]);

  // 格式化时长
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
      {/* 主播放器 */}
      <div className="container mx-auto flex flex-col p-4">
        {/* 进度条 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">
            {formatDuration(progress)}
          </span>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[progress]}
            max={duration}
            step={1000}
            onValueChange={([value]) => seekToPosition(value)}
          >
            <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
              <Slider.Range 
                className="absolute rounded-full h-full" 
                style={{ 
                  width: `${(progress / duration) * 100}%`,
                  backgroundColor: 'black'
                }} 
              />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 bg-background border-2 border-black rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Progress"
            />
          </Slider.Root>
          <span className="text-xs text-muted-foreground">
            {formatDuration(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          {/* 当前播放信息 */}
          <div className="flex items-center gap-4 w-1/3">
            {currentTrack && (
              <>
                <img
                  src={currentTrack.album.images[0]?.url}
                  alt={currentTrack.name}
                  className="w-12 h-12 rounded"
                />
                <div>
                  <p className="font-medium truncate">{currentTrack.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* 播放控制 */}
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleShuffle}
                className={`h-8 w-8 ${shuffle ? 'text-primary' : ''}`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipToPrevious}
                className="h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-10 w-10"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipToNext}
                className="h-8 w-8"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRepeat}
                className={`h-8 w-8 ${repeat !== 'off' ? 'text-primary' : ''}`}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 右侧控制区 */}
          <div className="flex items-center gap-4 w-1/3 justify-end">
            {/* 音量控制 */}
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Slider.Root
                className="relative flex items-center select-none touch-none w-24 h-5"
                value={[volume]}
                max={100}
                step={1}
                onValueChange={([value]) => setVolumeLevel(value)}
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
                  <Slider.Range 
                    className="absolute rounded-full h-full" 
                    style={{ 
                      width: `${volume}%`,
                      backgroundColor: 'black'
                    }} 
                  />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-4 h-4 bg-background border-2 border-black rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Volume"
                />
              </Slider.Root>
            </div>

            {/* 队列按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQueue(!showQueue)}
              className="h-8"
            >
              队列 ({queue?.queue?.length || 0})
            </Button>
          </div>
        </div>
      </div>

      {/* 队列面板 */}
      {showQueue && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-background border-l shadow-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">播放队列</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQueue(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-8rem)]">
            {queue?.queue?.map((track: any, index: number) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
              >
                <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0">
                  <Image
                    src={track.album.images[0]?.url || '/placeholder.png'}
                    alt={track.name}
                    fill
                    sizes="(max-width: 768px) 48px, 48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artists.map((artist: any) => artist.name).join(', ')}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground shrink-0">
                  {formatDuration(track.duration_ms)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}