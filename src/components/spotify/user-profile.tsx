'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { getSpotifyUser } from '@/lib/spotify';
import Image from 'next/image';

interface SpotifyUser {
  display_name: string;
  images: { url: string }[];
  followers: { total: number };
  country: string;
  product: string;
}

export default function UserProfile() {
  const { data: session } = useSession();
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!session?.accessToken) return;

      try {
        setLoading(true);
        const userData = await getSpotifyUser(session.accessToken);
        setUser(userData);
      } catch (err) {
        setError('Fail to get user profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [session?.accessToken]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!dragRef.current) return;

    const rect = dragRef.current.getBoundingClientRect();
    startPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    lastPos.current = { x: e.clientX, y: e.clientY };
    lastTime.current = Date.now();
    velocity.current = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      
      const now = Date.now();
      const deltaTime = now - lastTime.current;
      if (deltaTime > 0) {
        const deltaX = e.clientX - lastPos.current.x;
        const deltaY = e.clientY - lastPos.current.y;
        velocity.current = {
          x: deltaX / deltaTime * 3,
          y: deltaY / deltaTime * 3
        };
      }

      const newX = e.clientX - startPos.current.x;
      const newY = e.clientY - startPos.current.y;
      
      // 限制在窗口范围内
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      dragRef.current.style.transform = `translate3d(${Math.max(0, Math.min(newX, maxX))}px, ${Math.max(0, Math.min(newY, maxY))}px, 0)`;
      lastPos.current = { x: e.clientX, y: e.clientY };
      lastTime.current = now;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 应用惯性
      const applyInertia = () => {
        if (!dragRef.current) return;
        
        if (Math.abs(velocity.current.x) < 0.1 && Math.abs(velocity.current.y) < 0.1) {
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
          }
          return;
        }

        const rect = dragRef.current.getBoundingClientRect();
        const currentX = rect.left;
        const currentY = rect.top;
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        // 计算新位置
        let newX = currentX + velocity.current.x;
        let newY = currentY + velocity.current.y;

        // 检查边界碰撞
        if (newX <= 0 || newX >= maxX) {
          velocity.current.x *= -0.5; // 反弹时损失一些能量
          newX = Math.max(0, Math.min(newX, maxX));
        }
        if (newY <= 0 || newY >= maxY) {
          velocity.current.y *= -0.5; // 反弹时损失一些能量
          newY = Math.max(0, Math.min(newY, maxY));
        }

        dragRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;

        // 减速
        velocity.current = {
          x: velocity.current.x * 0.95,
          y: velocity.current.y * 0.95
        };

        animationFrameId.current = requestAnimationFrame(applyInertia);
      };

      animationFrameId.current = requestAnimationFrame(applyInertia);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (loading) {
    return <div className="text-center"></div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div 
      ref={dragRef}
      className="flex items-center gap-5 p-5 min-w-[260px] max-w-[320px] cursor-move rounded-2xl shadow-2xl border border-white/30 dark:border-zinc-800/60 bg-gradient-to-br from-white/80 via-green-100/80 to-green-200/60 dark:from-zinc-900/80 dark:via-zinc-800/80 dark:to-green-900/60 backdrop-blur-lg"
      style={{
        position: 'fixed',
        zIndex: 1000,
        userSelect: 'none',
        touchAction: 'none',
        willChange: 'transform',
        top: 0,
        left: 0,
      }}
      onMouseDown={handleMouseDown}
    >
      {user.images[0] && (
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* 动态渐变光圈 */}
          <div className="absolute w-full h-full rounded-full animate-spin-slow bg-gradient-to-tr from-green-400 via-emerald-400 to-lime-300 opacity-60 blur-[2px]" style={{zIndex:1}} />
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-lg z-10">
            <Image
              src={user.images[0].url}
              alt={user.display_name}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-extrabold truncate text-zinc-900 dark:text-white drop-shadow-sm">{user.display_name}</h2>
          {/* 会员徽章 */}
          {user.product === 'premium' ? (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-pink-400 text-xs font-bold text-white flex items-center gap-1 shadow">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/></svg>
              Premium
            </span>
          ) : (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-zinc-300/80 dark:bg-zinc-700/80 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1 shadow">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>
              Free
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {user.followers.total} Followers
          </span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            {user.country}
          </span>
        </div>
      </div>
    </div>
  );
} 