"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ScrollText } from "lucide-react";

export function Navbar() {
    return (
        <nav className="w-full flex items-center justify-between p-6 max-w-7xl mx-auto 
                        bg-white text-black z-50 relative">
            {/* Logo */}
            <div className="flex items-center gap-2 font-bold text-xl">
                <ScrollText className="w-6 h-6 fill-black/20 stroke-black" />
                <span>CHANGELOG</span>
            </div>

            {/* Menu Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
                <Link href="#features" className="hover:text-black transition-colors">Features</Link>
                <Link href="#about" className="hover:text-black transition-colors">About</Link>

            </div>

            {/* Sign-in / CTA */}
            <div className="flex items-center gap-4">

                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-5 font-medium" onClick={() => window.location.href = "/protected"}>
                    Get Started
                </Button>
            </div>
        </nav>
    );
}
