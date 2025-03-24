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
        className={`border p-2 cursor-pointer ${
          completed ? "line-through text-gray-400" : ""
        }`}
        onClick={handleToggle}
      >
        {task}
      </td>
    );
  }