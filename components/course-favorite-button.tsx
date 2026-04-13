'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

type CourseFavoriteButtonProps = {
  courseId: string;
  initialFavorite?: boolean;
  className?: string;
  onChange?: (next: boolean) => void;
};

export default function CourseFavoriteButton({
  courseId,
  initialFavorite = false,
  className = '',
  onChange,
}: CourseFavoriteButtonProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFavorite(initialFavorite);
  }, [initialFavorite]);

  const toggleFavorite = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (pending) return;
    setPending(true);

    try {
      const res = await fetch('/api/student/favorites', {
        method: favorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(data?.message || 'Failed to update favorite');
        return;
      }

      const next = !favorite;
      setFavorite(next);
      onChange?.(next);
    } catch (error) {
      console.error('Failed to update favorite', error);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-pressed={favorite}
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      className={`inline-flex items-center justify-center rounded-full border border-white/40 bg-black/30 text-white hover:bg-black/50 transition ${className}`}
    >
      {favorite ? (
        <HeartSolidIcon className="w-4 h-4 text-rose-400" />
      ) : (
        <HeartOutlineIcon className="w-4 h-4 text-white" />
      )}
    </button>
  );
}
