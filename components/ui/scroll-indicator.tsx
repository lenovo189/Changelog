"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ThemeColors } from "@/lib/changelog-themes";

interface ScrollIndicatorProps {
    itemsCount: number;
    theme: ThemeColors;
}

export function ScrollIndicator({ itemsCount, theme }: ScrollIndicatorProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            // Support both 'article' (preview page) and 'section' (embed page)
            const sections = document.querySelectorAll("article, section[data-changelog-item]");
            let current = 0;
            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                // If the top of the section is above the middle of the viewport
                if (rect.top < window.innerHeight / 2) {
                    current = index;
                }
            });
            setActiveIndex(current);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (itemsCount <= 0) return null;

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 items-end pointer-events-none">
            {Array.from({ length: itemsCount }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        width: activeIndex === i ? 32 : 16,
                        height: activeIndex === i ? 3 : 2,
                        opacity: activeIndex === i ? 1 : 0.2,
                        backgroundColor: activeIndex === i ? theme.accent : theme.text,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="rounded-full"
                />
            ))}
        </div>
    );
}
