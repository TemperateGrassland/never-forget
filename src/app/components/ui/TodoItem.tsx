import { useState } from "react";

export default function TodoItem({
    task,
    initialCompleted,
    onToggle,
  }: {
    task: string;
    initialCompleted?: boolean;
    onToggle?: (newState: boolean) => void;
  }) {
    const [completed, setCompleted] = useState(initialCompleted || false);
  
    const handleToggle = () => {
      const newState = !completed;
      setCompleted(newState);
      onToggle?.(newState);
  
      if (navigator.vibrate) navigator.vibrate(30);
  
      const tickSound = new Audio("/bing.wav");
      tickSound.volume = 0.4;
      tickSound.currentTime = 0;
      console.log('playing bing.')
      tickSound.play().catch(() => {});
    };
  
    return (
      <td
        className="border p-2 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          {!completed && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
          )}
          {task}
        </div>
      </td>
    );
  }