"use client";

import { useScroll, MotionValue } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { Component as EtherealShadow } from "./ui/etheral-shadow";

const features = [
    {
        title: "Automated GitHub Sync",
        description:
            "Connect your repository and let us handle the rest. We automatically pull your releases, pull requests, and commits to generate beautiful changelogs instantly.",
        image: "/feature-github.png",
        color: "rgba(80,150,255,1)", // BLUE
    },
    {
        title: "Custom Branding & Theming",
        description:
            "Your changelog should look like your product. Customize colors, fonts, and layouts to match your brand identity perfectly without writing a single line of code.",
        image: "/feature-branding.png",
        color: "rgba(210,80,255,1)", // PURPLE / PINK
    },
    {
        title: "Great Dashboard",
        description:
            "A powerful and intuitive dashboard to manage all your changelogs. Organize projects, customize themes, and track your releases with ease.",
        image: "/feature-analytics.png",
        color: "rgba(80,220,140,1)", // GREEN
    },
];

export function Features() {
    const container = useRef(null);
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ["start start", "end end"],
    });

    return (
        <section
            id="features"
            ref={container}
            className="relative w-full flex flex-col items-center justify-center bg-white"
        >
            {features.map((feature, i) => (
                <Card key={i} {...feature} i={i} progress={scrollYProgress} />
            ))}
        </section>
    );
}

interface CardProps {
    i: number;
    title: string;
    description: string;
    image: string;
    color: string;
    progress: MotionValue<number>;
}

const Card = ({ title, description, image, color }: CardProps) => {
    return (
        <div className="h-screen flex items-center justify-center sticky top-0 w-full px-4 py-4">
            <div className="relative h-full w-full max-w-7xl rounded-3xl p-10 
                      border border-black/10 bg-white/60 backdrop-blur-xl 
                      overflow-hidden flex flex-col justify-between">

                {/* Glow */}
                <div className="absolute inset-0 -z-10">
                    <EtherealShadow
                        color={color}
                        animation={{ scale: 70, speed: 80 }}
                        noise={{ opacity: 0.5, scale: 1.2 }}
                        spread={120}
                        sizing="fill"
                    />
                </div>

                {/* IMAGE — positioned under card, aligned right */}
                <div className="absolute right-0 bottom-0 top-0 w-1/2">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover opacity-90"
                    />
                </div>

                {/* TEXT — bottom-left */}
                <div className="relative z-10 flex flex-col justify-end h-full max-w-xl pb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-black mb-4 leading-tight">
                        {title}
                    </h2>
                    <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
};

