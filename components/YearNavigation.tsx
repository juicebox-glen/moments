'use client';

import { useRef, useEffect } from 'react';

interface YearNavigationProps {
  years: number[];
  selectedYear: number;
  onYearSelect: (year: number) => void;
}

export default function YearNavigation({
  years,
  selectedYear,
  onYearSelect,
}: YearNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll to selected year on mount or when selectedYear changes
  useEffect(() => {
    if (selectedButtonRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const button = selectedButtonRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      
      const scrollLeft =
        buttonRect.left -
        containerRect.left +
        container.scrollLeft -
        containerRect.width / 2 +
        buttonRect.width / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [selectedYear]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-grid transition-colors"
        aria-label="Scroll left"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {years.map((year) => (
          <button
            key={year}
            ref={year === selectedYear ? selectedButtonRef : null}
            onClick={() => onYearSelect(year)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              year === selectedYear
                ? 'bg-foreground text-background'
                : 'text-foreground/60 hover:text-foreground hover:bg-grid'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-grid transition-colors"
        aria-label="Scroll right"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 12L10 8L6 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

