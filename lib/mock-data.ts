import { Chapter } from './types';

/**
 * Sample chapters for development and testing
 * These represent realistic Moments in a person's life
 */

export const mockChapters: Chapter[] = [
  {
    id: 'moment-1',
    type: 'moment',
    title: 'Wedding Day',
    date: new Date('2023-06-15'),
    people: [
      { id: 'person-1', name: 'Sarah' },
      { id: 'person-2', name: 'Alex' },
    ],
    items: [],
    createdAt: new Date('2023-06-20'),
    updatedAt: new Date('2023-06-20'),
  },
  {
    id: 'moment-2',
    type: 'moment',
    title: 'Trip to Tokyo',
    date: new Date('2022-11-10'),
    people: [
      { id: 'person-3', name: 'Jamie' },
    ],
    items: [],
    createdAt: new Date('2022-11-25'),
    updatedAt: new Date('2022-11-25'),
  },
  {
    id: 'moment-3',
    type: 'moment',
    title: '30th Birthday Celebration',
    date: new Date('2024-03-22'),
    people: [
      { id: 'person-1', name: 'Sarah' },
      { id: 'person-4', name: 'Morgan' },
      { id: 'person-5', name: 'Taylor' },
    ],
    items: [],
    createdAt: new Date('2024-03-25'),
    updatedAt: new Date('2024-03-25'),
  },
  {
    id: 'moment-4',
    type: 'moment',
    title: 'Graduation Day',
    date: new Date('2019-05-18'),
    people: [
      { id: 'person-6', name: 'Mom' },
      { id: 'person-7', name: 'Dad' },
      { id: 'person-8', name: 'Emma' },
    ],
    items: [],
    createdAt: new Date('2019-05-20'),
    updatedAt: new Date('2019-05-20'),
  },
  {
    id: 'moment-5',
    type: 'moment',
    title: 'First Day at New Job',
    date: new Date('2021-09-01'),
    people: [
      { id: 'person-9', name: 'Chris' },
    ],
    items: [],
    createdAt: new Date('2021-09-05'),
    updatedAt: new Date('2021-09-05'),
  },
];

