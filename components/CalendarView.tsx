'use client';

import { useState, useMemo, useEffect } from 'react';
import { Chapter } from '@/lib/types';
import { useChapterStore } from '@/stores/chapter-store';
import YearNavigation from './YearNavigation';
import MonthTile from './MonthTile';

export default function CalendarView() {
  const chapters = useChapterStore((state) => state.chapters);
  const currentYear = new Date().getFullYear();

  // Filter to only Moments and group by year/month
  const momentsByYearMonth = useMemo(() => {
    const moments = chapters.filter((ch) => ch.type === 'moment' && ch.date);
    const grouped: Record<number, Record<number, Chapter[]>> = {};

    moments.forEach((moment) => {
      if (!moment.date) return;
      // Ensure date is a Date object
      const date = moment.date instanceof Date ? moment.date : new Date(moment.date);
      // Check if date is valid
      if (isNaN(date.getTime())) return;
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(moment);
    });

    return grouped;
  }, [chapters]);

  // Get available years - only years that contain Moments
  const availableYears = useMemo(() => {
    const years = Object.keys(momentsByYearMonth)
      .map(Number)
      .sort((a, b) => b - a); // Sort descending (newest first)
    
    // If no Moments exist yet, show current year as starting point
    if (years.length === 0) {
      return [currentYear];
    }
    
    return years;
  }, [momentsByYearMonth, currentYear]);

  // Set selected year to newest year (or current year if empty)
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Update selected year when available years change (e.g., new Moment added or data loads)
  useEffect(() => {
    if (availableYears.length > 0) {
      // If current selected year is not in available years, select the newest year
      setSelectedYear((prevYear) => {
        if (!availableYears.includes(prevYear)) {
          return availableYears[0]; // Select newest year
        }
        return prevYear; // Keep current selection if it's still valid
      });
    }
  }, [availableYears]); // Only depend on availableYears to avoid loops when user manually changes year

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  const momentsForYear = momentsByYearMonth[selectedYear] || {};

  return (
    <div className="flex flex-col h-full">
      <YearNavigation
        years={availableYears}
        selectedYear={selectedYear}
        onYearSelect={setSelectedYear}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {months.map((monthName, monthIndex) => {
          const moments = momentsForYear[monthIndex] || [];
          return (
            <MonthTile
              key={monthIndex}
              monthName={monthName}
              monthIndex={monthIndex}
              year={selectedYear}
              moments={moments}
            />
          );
        })}
      </div>
    </div>
  );
}

