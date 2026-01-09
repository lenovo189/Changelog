"use client";



import { Button } from "./ui/button";
import { Github } from "lucide-react";
import { Component as EtheralShadow } from "./ui/etheral-shadow";

export function Hero() {
  return (
    <div className="flex flex-col items-center rounded-xl text-center pt-20 pb-10 px-4 w-full max-w-7xl mx-auto z-10 relative overflow-hidden">
      {/* Soft light shadow */}
      <div className="absolute inset-0 -z-10 opacity-60">
        <EtheralShadow
          color="rgba(200, 200, 200, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.5, scale: 1.2 }}
          spread={100}
          sizing="fill"
        />
      </div>

      <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-black max-w-5xl mb-8 leading-tight flex flex-wrap items-center justify-center gap-3 md:gap-4">
        Generate Changelog page from
        <span className="inline-flex items-center justify-center bg-black/5 rounded-xl p-2 md:p-3">
          <Github className="w-8 h-8 md:w-12 md:h-12 text-black" />
        </span>
        releases
      </h1>

      <Button className="bg-black text-white hover:bg-black/80 rounded-full px-8 py-6 text-lg font-medium mb-16 transition-transform hover:scale-105" onClick={() => window.location.href = "/protected"}>
        Get Started
      </Button>

      {/* Editor Window Mockup Container */}
      <div className="relative w-full max-w-6xl group">
        {/* Light gradient */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/30 to-purple-300/30 rounded-xl blur-2xl opacity-60 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>

        <div className="w-full rounded-xl overflow-hidden shadow-2xl border border-black/10 bg-white relative">
          <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
            <iframe
              src="https://www.youtube.com/embed/IYTLd8itnUo?autoplay=1&mute=1&loop=1&playlist=IYTLd8itnUo&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&vq=hd1080"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scale(1.25)' }}
              title="preview"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
