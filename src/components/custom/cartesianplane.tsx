import React, { useRef, useEffect, useState } from 'react';

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState(400);
  const [currentPointType, setCurrentPointType] = useState<PointType>('start');

  const paddingRatio = 0.6;
  const tickLength = 6;
  const tickValues = [0, 0.25, 0.5, 0.75, 1];


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


    points.forEach(({ x, y, type }) => {
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      ctx.fillStyle = type === 'start' ? 'blue' : 'red';
      ctx.beginPath();
      ctx.arc(toCanvasX(x), toCanvasY(y), 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = type === 'start' ? 'blue' : 'red';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const label = type === 'start' ? 'S' : 'E';
      ctx.fillText(label, toCanvasX(x) + 8, toCanvasY(y));
    });
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
    // 使用当前点类型
    await onAddPoint({ x: clampedX, y: clampedY, type: currentPointType });
  };

  return (
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
  );
};

export default CartesianPlane;