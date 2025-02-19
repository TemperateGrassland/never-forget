"use client";

import React, { useState } from "react";
import Link from "next/link";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-blue-500 p-4 shadow-md">
      <div className="container mx-auto flex justify-center items-center relative">
        <div className="text-white text-xl font-bold absolute left-1/2 transform -translate-x-1/2">
          <Link href="/">Never Forget</Link>
        </div>

        {/* Hamburger Button (Mobile) */}
        <button className="text-white md:hidden absolute right-4" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>

        {/* Navigation Links */}
        <ul className={`md:flex space-x-6 ${isOpen ? "block" : "hidden"} md:block`}>
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