'use client';

import { useEffect, useState } from 'react';

type AnimatedRowProps = {
  id: string;
  isDeleting: boolean;
  onAnimationEnd: () => void;
  children: React.ReactNode;
};

export default function AnimatedRow({
  id,
  isDeleting,
  onAnimationEnd,
  children,
}: AnimatedRowProps) {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (isDeleting) {
      // Wait for animation to finish before unmounting
      const timeout = setTimeout(() => {
        setShouldRender(false);
        onAnimationEnd();
      }, 400); // Match your CSS duration

      return () => clearTimeout(timeout);
    }
  }, [isDeleting, onAnimationEnd]);

  if (!shouldRender) return null;

  return (
    <tr
      className={`transition-all duration-500 ease-in-out ${
        isDeleting ? 'line-through opacity-0 -translate-x-4' : ''
      }`}
      data-id={id}
    >
      {children}
    </tr>
  );
}