import React, { useRef, useEffect, useState } from 'react';
import { getCurrentPlayback } from '@/lib/spotify';
import { useSession } from 'next-auth/react';
import logger from 'lib/logger';

export type Point = {
  x: number;
  y: number;
};

export type PointType = 'start' | 'end';

export type PointWithType = Point & {
  type: PointType;
};

type CartesianPlaneProps = {
  points?: PointWithType[];
  onAddPoint?: (point: PointWithType) => void | Promise<void>;
  onAddStartPoint?: () => void;
  onAddEndPoint?: () => void;
  setStartPoint?: (point: PointWithType) => void;
  setEndPoint?: (point: PointWithType) => void;
  savePointMeta?: (startPoint: PointWithType | null, endPoint: PointWithType | null) => void | Promise<void>;
};

const CartesianPlane: React.FC<CartesianPlaneProps> = ({ points = [], onAddPoint, onAddStartPoint, onAddEndPoint, setStartPoint, setEndPoint, savePointMeta }) => {
  const { data: session } = useSession();
  const [currentSpotifyId, setCurrentSpotifyId] = useState<string | null>(null);
  const [songName, setSongName] = useState<string | null>(null);
  const [reccobeatsId, setReccobeatsId] = useState<string | null>(null);
  const [valence, setValence] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reccobeatsError, setReccobeatsError] = useState<string | null>(null);
  const [audioFeaturesError, setAudioFeaturesError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState(400);
  const [currentPointType, setCurrentPointType] = useState<PointType>('start');

  const paddingRatio = 0.6;
  const tickLength = 6;
  const tickValues = [0, 0.25, 0.5, 0.75, 1];


  // get current Spotify ID
  useEffect(() => {
    const fetchCurrentPlayback = async () => {
      if (!session?.accessToken) {
        setError('No access token available');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const playbackData = await getCurrentPlayback(session.accessToken);

        if (playbackData && playbackData.item) {
          // change when spotify id changes
          if (playbackData.item.id !== currentSpotifyId) {
            setCurrentSpotifyId(playbackData.item.id);
            setSongName(playbackData.item.name);
            console.log('Current Spotify ID:', playbackData.item.id);
            console.log('Current Song Name:', playbackData.item.name);
          }
        } else if (currentSpotifyId !== null) {
          setCurrentSpotifyId(null);
          setSongName(null);
          setError('No song is currently playing');
        }
      } catch (err) {
        setError(`Failed to fetch playback: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Error fetching playback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentPlayback();

    
    const intervalId = setInterval(fetchCurrentPlayback, 10000);

    return () => clearInterval(intervalId);
  }, [session, currentSpotifyId]);

  // use Spotify ID to get ReccoBeats ID
  useEffect(() => {
    const fetchReccobeatsId = async (spotifyId: string) => {
      try {
        setIsLoading(true);
        setReccobeatsError(null);

        const requestOptions = {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          redirect: 'follow' as RequestRedirect
        };

        const response = await fetch(`https://api.reccobeats.com/v1/track?ids=${spotifyId}`, requestOptions);
        const result = await response.text();
        console.log('Reccobeats API response:', result);

        // spotify id to reccobeats id
        try {
          const data = JSON.parse(result);
          console.log('data: ', data)
          //  get 'content'
          // reccobeats id
          if (data?.content?.[0]?.id) {
            setReccobeatsId(data?.content?.[0]?.id);
          } else {
            setReccobeatsError('No reccobeats ID found in response');
          }
        } catch (jsonError) {
          setReccobeatsError(`Failed to parse response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
      } catch (err) {
        setReccobeatsError(`Failed to fetch reccobeats ID: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Error fetching reccobeats ID:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentSpotifyId) {
      fetchReccobeatsId(currentSpotifyId);
    } else {
      setReccobeatsId(null);
      setReccobeatsError('No Spotify ID available');
    }
  }, [currentSpotifyId]);

  // 使用Reccobeats ID获取音频特征(valence和energy)
  useEffect(() => {
    const fetchAudioFeatures = async (reccobeatsId: string) => {
      try {
        setIsLoading(true);
        setAudioFeaturesError(null);

        const requestOptions = {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          redirect: 'follow' as RequestRedirect
        };

        const response = await fetch(`https://api.reccobeats.com/v1/track/${reccobeatsId}/audio-features`, requestOptions);
        const result = await response.text();
        console.log('Audio features response:', result);

        try {
          const data = JSON.parse(result);
          if (data && typeof data.valence === 'number' && typeof data.energy === 'number') {
            setValence(data.valence);
            setEnergy(data.energy);
          } else {
            setAudioFeaturesError('Invalid audio features data');
          }
        } catch (jsonError) {
          setAudioFeaturesError(`Failed to parse audio features response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
      } catch (err) {
        setAudioFeaturesError(`Failed to fetch audio features: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Error fetching audio features:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (reccobeatsId) {
      fetchAudioFeatures(reccobeatsId);
    } else {
      setValence(null);
      setEnergy(null);
      setAudioFeaturesError('No Reccobeats ID available');
    }
  }, [reccobeatsId]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        const maxSize = Math.min(parentWidth, window.innerWidth - 32);
        const size = Math.max(200, maxSize);
        setCanvasSize(size);
      }
    };
    updateSize();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvasSize;
    const h = canvasSize;
    const padding = (w * (1 - paddingRatio)) / 2;
    const unit = w * paddingRatio;


    const toCanvasX = (x: number) => padding + x * unit;
    const toCanvasY = (y: number) => h - (padding + y * unit);

    ctx.clearRect(0, 0, w, h);

    // Draw quadrant backgrounds with gradient transparency (darker at extremes)
    // Ensure backgrounds are only drawn within 0-1 range
    const minX = toCanvasX(0);
    const maxX = toCanvasX(1);
    const minY = toCanvasY(1); // Y is inverted
    const maxY = toCanvasY(0);
    const centerX = toCanvasX(0.5);
    const centerY = toCanvasY(0.5);

    // relax - green
    const relaxGradient = ctx.createLinearGradient(centerX, centerY, maxX, maxY);
    relaxGradient.addColorStop(0, 'rgba(74, 222, 128, 0)');
    relaxGradient.addColorStop(1, 'rgba(74, 222, 128, 0.3)');
    ctx.fillStyle = relaxGradient;
    ctx.fillRect(centerX, maxY, maxX - centerX, centerY - maxY);


    // sad - blue
    const sadGradient = ctx.createLinearGradient(centerX, centerY, minX, maxY);
    sadGradient.addColorStop(0, 'rgba(37, 99, 235, 0)'); // 透明
    sadGradient.addColorStop(1, 'rgba(37, 99, 235, 0.3)'); // 蓝色
    ctx.fillStyle = sadGradient;
    ctx.fillRect(minX, maxY, centerX - minX, centerY - maxY);

    // angry - red
    const angryGradient = ctx.createLinearGradient(centerX, centerY, minX, minY);
    angryGradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
    angryGradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)');
    ctx.fillStyle = angryGradient;
    ctx.fillRect(minX, centerY, centerX - minX, minY - centerY);

    // happy - yellow
    const happyGradient = ctx.createLinearGradient(centerX, centerY, maxX, minY);
    happyGradient.addColorStop(0, 'rgba(251, 191, 36, 0)');
    happyGradient.addColorStop(1, 'rgba(251, 191, 36, 0.3)');
    ctx.fillStyle = happyGradient;
    ctx.fillRect(centerX, centerY, maxX - centerX, minY - centerY);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();

    // 设置虚线样式
    ctx.strokeStyle = '#aaa';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    const dashedX = toCanvasX(0.5);
    ctx.beginPath();
    ctx.moveTo(dashedX, 0);
    ctx.lineTo(dashedX, h);
    ctx.stroke();

    const dashedY = toCanvasY(0.5);
    ctx.beginPath();
    ctx.moveTo(0, dashedY);
    ctx.lineTo(w, dashedY);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('valence', w / 2, h - padding + 30);

    ctx.save();
    ctx.translate(padding - 40, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('energy', 0, 0);
    ctx.restore();

    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.lineWidth = 1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    tickValues.forEach((x) => {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, h - padding - tickLength);
      ctx.lineTo(cx, h - padding + tickLength);
      ctx.stroke();
      ctx.fillText(x.toString(), cx, h - padding + tickLength + 2);
    });

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    tickValues.forEach((y) => {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(padding - tickLength, cy);
      ctx.lineTo(padding + tickLength, cy);
      ctx.stroke();
      ctx.fillText(y.toString(), padding - tickLength - 4, cy);
    });

    // Add emotion labels for each quadrant with transparency
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'rgba(85, 85, 85, 0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // happy
    ctx.fillText('happy', toCanvasX(0.75), toCanvasY(0.75) - 15);
    // angry
    ctx.fillText('angry', toCanvasX(0.25), toCanvasY(0.75) - 15);
    // sad
    ctx.fillText('sad', toCanvasX(0.25), toCanvasY(0.25) + 15);
    // relax
    ctx.fillText('relax', toCanvasX(0.75), toCanvasY(0.25) + 15);

    points.forEach(({ x, y, type }) => {
      const renderX = x === null ? 0.5 : x;
      const renderY = y === null ? 0.5 : y;
      if (renderX < 0 || renderX > 1 || renderY < 0 || renderY > 1) return;
      ctx.fillStyle = type === 'start' ? 'blue' : 'red';
      ctx.beginPath();
      ctx.arc(toCanvasX(renderX), toCanvasY(renderY), 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = type === 'start' ? 'blue' : 'red';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const label = type === 'start' ? 'S' : 'E';
      ctx.fillText(label, toCanvasX(renderX) + 8, toCanvasY(renderY));
    });

    // Draw audio features point (valence and energy)
    if (valence !== null && energy !== null) {
      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.arc(toCanvasX(valence), toCanvasY(energy), 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'green';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Now', toCanvasX(valence) + 8, toCanvasY(energy));
    }
  }, [points, canvasSize]);

  const handleClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onAddPoint) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const padding = (canvasSize * (1 - paddingRatio)) / 2;
    const unit = canvasSize * paddingRatio;

    let x = (e.clientX - rect.left - padding) / unit;
    let y = (rect.bottom - e.clientY - padding) / unit; // rect.bottom 是元素底部，y坐标反转

    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    console.log(`🖱️ Clicked at: x=${clampedX.toFixed(3)}, y=${clampedY.toFixed(3)}`); // ✅ 打印坐标
    await onAddPoint({ x: clampedX, y: clampedY, type: currentPointType });
  };

  return (
    <div className="cartesian-plane-container">
    {/* <div className="spotify-info mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Current Playing Track</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : currentSpotifyId ? (
          <div>
            <p><strong>Song Name:</strong> {songName}</p>
            <p><strong>Spotify ID:</strong> {currentSpotifyId}</p>
            {reccobeatsError ? (
              <p className="text-red-500"><strong>Error:</strong> {reccobeatsError}</p>
            ) : reccobeatsId ? (
              <div>
                <p><strong>Reccobeats ID:</strong> {reccobeatsId}</p>
                {audioFeaturesError ? (
                  <p className="text-red-500"><strong>Audio Features Error:</strong> {audioFeaturesError}</p>
                ) : valence !== null && energy !== null ? (
                  <div>
                    <p><strong>Valence:</strong> {valence.toFixed(2)}</p>
                    <p><strong>Energy:</strong> {energy.toFixed(2)}</p>
                  </div>
                ) : (
                  <p>Loading audio features...</p>
                )}
              </div>
            ) : (
              <p>Loading Reccobeats ID...</p>
            )}
          </div>
        ) : (
          <p>No song is currently playing</p>
        )}
      </div> */}

      <div ref={containerRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onClick={handleClick}
        style={{
          border: '1px solid #ccc',
          width: '100%',
          height: 'auto',
          display: 'block',
          cursor: 'crosshair',
        }}
      />
      <div className="mt-2 flex gap-2">
        <button
          className={`flex-1 ${currentPointType === 'start' ? 'bg-blue-700' : 'bg-blue-500'} text-white py-1 px-2 rounded text-sm`}
          onClick={() => setCurrentPointType('start')}
        >
          Set Start Point
        </button>
        <button
          className={`flex-1 ${currentPointType === 'end' ? 'bg-red-700' : 'bg-red-500'} text-white py-1 px-2 rounded text-sm`}
          onClick={() => setCurrentPointType('end')}
        >
          Set End Point
        </button>
        <button
          // clean all points
          className={`flex-1 bg-gray-500 text-white py-1 px-2 rounded text-sm`}
          onClick={async () => {
            if (setStartPoint) setStartPoint(null as any);
            if (setEndPoint) setEndPoint(null as any);
            if (savePointMeta) await savePointMeta(null, null);
          }}
        >
          Clean
        </button>
      </div>
    </div>
    </div>
  );
};

export default CartesianPlane;