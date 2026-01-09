"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Icons } from "./icons";
import { Button } from "@/components/ui/button";

function Footer() {
    const [year, setYear] = useState<number>();

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="py-12 px-4 md:px-6 bg-background text-foreground rounded-xl border border-border">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-8 md:mb-0">
                        <Link href="/" className="flex items-center gap-2">
                            <Icons.logo className="w-8 h-8" />
                            <h2 className="text-lg font-bold">Changelog</h2>
                        </Link>

                        <div className="mt-2">
                            <Link href="https://x.com/compose/tweet?text=I%27ve%20been%20using%20%23Changelog%20 share%20yourtought%20%40Qabdikadirov">
                                <Button variant="secondary">
                                    Share Your Thoughts On
                                    <Icons.twitter className="ml-1 w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>

                        <p className="text-sm mt-5">
                            © {year || ""} Changelog. All rights reserved.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* Pages */}
                        <div>
                            <h3 className="font-semibold mb-4">Pages</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/" className="hover:text-black">Home</Link>
                                </li>
                                <li>
                                    <Link href="/features" className="hover:text-black">Features</Link>
                                </li>
                                <li>
                                    <Link href="/pricing" className="hover:text-black">Pricing</Link>
                                </li>
                                <li>
                                    <Link href="https://blog.arihant.us/" className="hover:text-black">Blog</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Socials */}
                        <div>
                            <h3 className="font-semibold mb-4">Socials</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="https://github.com/lenovo189" className="hover:text-black">Github</Link>
                                </li>
                                <li>
                                    <Link href="https://www.linkedin.com/in/quwanish_pi" className="hover:text-black">LinkedIn</Link>
                                </li>
                                <li>
                                    <Link href="https://x.com/Qabdikadirov" className="hover:text-black">X</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/privacy-policy" className="hover:text-black">Privacy Policy</Link>
                                </li>
                                <li>
                                    <Link href="/tos" className="hover:text-black">Terms of Service</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="w-full flex mt-4 items-center justify-center">
                    <h1
                        className="text-center text-3xl md:text-5xl lg:text-[10rem] font-bold bg-clip-text text-transparent select-none"
                        style={{
                            backgroundImage: 'linear-gradient(to bottom, hsl(0, 0%, 20%), hsl(0, 0%, 60%))',
                        }}
                    >
                        Changelog
                    </h1>
                </div>
            </div>
        </footer>
    );
}

export { Footer };
