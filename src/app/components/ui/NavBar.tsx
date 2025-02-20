"use client";

import React, { useState } from "react";
import Link from "next/link";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-blue-500 p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between relative">
        {/* Left Spacer to balance the center */}
        <div className="w-1/3"></div>

        {/* Centered Title */}
        <div className="text-white text-xl font-bold absolute left-1/2 transform -translate-x-1/2">
          <Link href="/">Never Forget</Link>
        </div>

        {/* Navigation Links (Right Aligned) */}
        <ul className="flex space-x-6 w-1/3 justify-end">
          <li>
            <Link href="/" className="text-white hover:underline">
              Home
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-white hover:underline">
              What you can expect
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;