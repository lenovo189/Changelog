import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Changelog Generator",
  description: "Generate changelog pages from your releases with ease.",
  openGraph: {
    title: "Changelog Generator",
    description: "Generate changelog pages from your releases with ease.",
    url: defaultUrl,
    siteName: "Changelog Generator",
    locale: "en_US",
    type: "website",
    images: ["https://i.ibb.co/Gfx2gkDH/Screenshot-2026-01-09-213805.png"], // Update this with your image link
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog Generator",
    description: "Generate changelog pages from your releases with ease.",
    creator: "@changelog_gen",
    images: ["https://i.ibb.co/Gfx2gkDH/Screenshot-2026-01-09-213805.png"], // Update this with your image link
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
