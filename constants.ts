
import { LibraryItem } from './types';

export const SAMPLE_LIBRARY: LibraryItem[] = [
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    progress: 75,
    coverUrl: 'https://picsum.photos/id/24/300/400',
    lastRead: '12:45 / 16:20',
    content: [
      "Success is the product of daily habits—not once-in-a-lifetime transformations.",
      "You do not rise to the level of your goals. You fall to the level of your systems.",
      "The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become.",
      "Habits are the compound interest of self-improvement.",
      "The 1% Rule: Getting 1 percent better every day counts for a lot in the long-run."
    ]
  },
  {
    id: '2',
    title: 'Physics 101 Notes',
    author: 'Class 2024',
    progress: 30,
    coverUrl: 'https://picsum.photos/id/10/300/400',
    lastRead: '2 days ago',
    content: [
      "Newton's First Law: An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.",
      "Kinetic energy is the energy of motion. Potential energy is stored energy.",
      "Entropy always increases in a closed system."
    ]
  },
  {
    id: '3',
    title: 'UX Principles',
    author: 'Design Dept',
    progress: 10,
    coverUrl: 'https://picsum.photos/id/26/300/400',
    lastRead: '5 days ago',
    content: [
      "Hick's Law: The time it takes to make a decision increases with the number and complexity of choices.",
      "Fitts's Law: The time to acquire a target is a function of the distance to and size of the target."
    ]
  }
];

export const SUGGESTED_QUESTIONS = [
  "Explain the 1% rule in simpler terms?",
  "How do systems differ from goals?",
  "Can you quiz me on Chapter 1?",
  "What are the four laws of behavior change?"
];
