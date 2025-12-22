'use client';

import Link from 'next/link';
import { Chapter } from '@/lib/types';

interface MonthTileProps {
  monthName: string;
  monthIndex: number;
  year: number;
  moments: Chapter[];
}

export default function MonthTile({
  monthName,
  monthIndex,
  year,
  moments,
}: MonthTileProps) {
  const hasMoments = moments.length > 0;
  const isCurrentMonth =
    new Date().getFullYear() === year &&
    new Date().getMonth() === monthIndex;

  // For months with multiple Moments, navigate to first one
  // In future, could show a picker or list
  const firstMomentId = moments[0]?.id;

  const content = (
    <div
      className={`relative h-32 sm:h-36 rounded-lg border-2 transition-all ${
        hasMoments
          ? 'border-foreground/20 bg-background hover:border-foreground/40 hover:shadow-md cursor-pointer active:scale-[0.98]'
          : 'border-grid bg-transparent'
      } ${isCurrentMonth ? 'ring-1 ring-foreground/10' : ''}`}
    >
      <div className="p-3 h-full flex flex-col">
        <div className="text-xs font-medium text-foreground/50 mb-2 uppercase tracking-wide">
          {monthName}
        </div>
        
        {hasMoments ? (
          <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
            {moments.slice(0, 2).map((moment) => (
              <div
                key={moment.id}
                className="text-sm text-foreground leading-tight line-clamp-2 font-normal"
              >
                {moment.title}
              </div>
            ))}
            {moments.length > 2 && (
              <div className="text-xs text-foreground/40 mt-auto">
                +{moments.length - 2} more
              </div>
            )}
            {moments.length === 2 && moments.length > 1 && (
              <div className="text-xs text-foreground/40 mt-auto opacity-0">
                placeholder
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-grid" />
          </div>
        )}
      </div>
    </div>
  );

  if (hasMoments && firstMomentId) {
    return (
      <Link href={`/chapter/${firstMomentId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
