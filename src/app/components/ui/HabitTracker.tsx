'use client'; // Mark as a client component if you need interactivity or hooks

import React from 'react';

type Habit = {
  name: string;
  currentStreak: number;
  longestStreak: number;
};

const habits: Habit[] = [
  { name: 'Meditate', currentStreak: 10, longestStreak: 10 },
  { name: 'Stretch', currentStreak: 5, longestStreak: 10 },
  { name: 'Write in journal about thoughts', currentStreak: 18, longestStreak: 24 },
  { name: 'Run outside', currentStreak: 44, longestStreak: 114 },
];

export default function HabitTracker() {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded shadow w-full max-w-xl mx-auto">
      <h1 className="text-center font-bold text-2xl mb-4">Never Forget</h1>

      {habits.map((habit) => (
        <div key={habit.name} className="flex items-center space-x-4 mb-4">
          {/* A placeholder green “scribble” bullet. You can replace this with an SVG or custom background */}
          <div className="w-8 h-8 rounded-full bg-green-300" />

          {/* The habit title */}
          <div className="flex-1">
            <span className="font-semibold text-black">{habit.name}</span>
          </div>

          {/* Current Streak */}
          <div className="flex flex-col items-center w-16">
            <span className="handwritten text-lg text-black">
              {habit.currentStreak}
            </span>
            <span className="text-xs text-gray-500">Current</span>
          </div>

          {/* Longest Streak */}
          <div className="flex flex-col items-center w-16">
            <span className="handwritten text-lg text-black">
              {habit.longestStreak}
            </span>
            <span className="text-xs text-gray-500">Longest</span>
          </div>
        </div>
      ))}
    </div>
  );
}