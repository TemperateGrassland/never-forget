import React from "react";
import Link from "next/link"; // Use Next.js Link for navigation

const Navbar: React.FC = () => {
  return (
    <nav className="bg-blue-500 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-white text-xl font-bold">
          <Link href="/">MyApp</Link>
        </div>

        {/* Navigation Links */}
        <ul className="flex space-x-6">
          <li>
            <Link href="/" className="text-white hover:underline">
              Home
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-white hover:underline">
              About
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-white hover:underline">
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;