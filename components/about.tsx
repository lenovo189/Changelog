"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Example images
const images = ["/theminh.png", "/themes1.png", "/123.png"];

export function SecondPage() {
    const [current, setCurrent] = useState(0);

    // Auto slide every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div id="about" className="relative w-full max-w-7xl mx-auto py-20 px-6 overflow-hidden min-h-[600px]">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12 h-full">
                {/* Left Column: Text */}
                <div className="flex-1 max-w-xl flex flex-col justify-end text-left space-y-6">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black leading-tight">
                        Create Changelog pages from releases
                    </h2>
                    <p className="text-lg md:text-xl text-gray-700">
                        Generate changelog pages from your releases with ease. All in one beautiful interface.
                    </p>
                    <button className="bg-black text-white hover:bg-black/80 rounded-full px-8 py-4 text-lg font-medium transition-transform hover:scale-105 w-max" onClick={() => window.location.href = "/protected"}>
                        Get Started
                    </button>
                </div>

                {/* Right Column: Image Carousel */}
                <div className="flex-1 flex justify-center items-center w-full relative">
                    <div className="w-full max-w-md h-80 md:h-96 bg-gray-100 rounded-xl border border-black/10 overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={current}
                                src={images[current]}
                                alt={`Feature ${current + 1}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.5 }}
                                className="w-full h-full object-cover"
                            />
                        </AnimatePresence>

                        {/* Dots */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={`w-3 h-3 rounded-full transition-all ${index === current ? "bg-black" : "bg-black/30"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
