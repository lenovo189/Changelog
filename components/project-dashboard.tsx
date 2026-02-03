"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ExternalLink, Download, Globe, Palette, Check, Code, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PRESET_THEMES, DEFAULT_THEME, Theme, ThemeColors, getThemeColors } from "@/lib/changelog-themes";

interface Project {
    id: string;
    repo_owner: string;
    repo_name: string;
    slug: string;
    webhook_secret?: string;
    theme_name?: string;
    theme_bg?: string;
    theme_text?: string;
    theme_accent?: string;
    theme_secondary?: string;
}

interface Changelog {
    id: string;
    version: string;
    markdown_content: string;
    published_at: string;
}

export function ProjectDashboard({ project, onReset }: { project: Project, onReset: () => void }) {
    const [changelogs, setChangelogs] = useState<Changelog[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Theme state
    const [currentTheme, setCurrentTheme] = useState<string>(project.theme_name || DEFAULT_THEME);
    const [customColors, setCustomColors] = useState<ThemeColors>({
        bg: project.theme_bg || "#ffffff",
        text: project.theme_text || "#000000",
        accent: project.theme_accent || "#3b82f6",
        secondary: project.theme_secondary || "#64748b",
    });
    const [savingTheme, setSavingTheme] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [pickingColorFor, setPickingColorFor] = useState<keyof ThemeColors | null>(null);

    // Calculate active theme for preview
    const activeTheme = getThemeColors({
        theme_name: currentTheme,
        theme_bg: customColors.bg,
        theme_text: customColors.text,
        theme_accent: customColors.accent,
        theme_secondary: customColors.secondary,
    });

    const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/changelog/${project.slug}` : '';

    const fetchChangelogs = async () => {
        try {
            const response = await fetch("/api/changelogs");
            if (response.ok) {
                const data = await response.json();
                setChangelogs(data);
            }
        } catch (err) {
            console.error("Failed to fetch changelogs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChangelogs();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const response = await fetch("/api/changelogs/sync", {
                method: "POST",
            });
            if (response.ok) {
                await fetchChangelogs();
            } else {
                const data = await response.json();
                alert(data.error || "Failed to sync releases");
            }
        } catch (err) {
            alert("Failed to sync releases");
        } finally {
            setSyncing(false);
        }
    };

    const saveTheme = async () => {
        setSavingTheme(true);
        setSaveSuccess(false);
        try {
            const body = {
                theme_name: currentTheme,
                ...(currentTheme === 'custom' ? {
                    theme_bg: customColors.bg,
                    theme_text: customColors.text,
                    theme_accent: customColors.accent,
                    theme_secondary: customColors.secondary,
                } : {
                    theme_bg: null,
                    theme_text: null,
                    theme_accent: null,
                    theme_secondary: null,
                })
            };

            const response = await fetch(`/api/projects/${project.id}/theme`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error("Failed to save theme");

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err) {
            alert("Failed to save theme settings");
        } finally {
            setSavingTheme(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create local preview URL
        const url = URL.createObjectURL(file);
        setUploadedImageUrl(url);

        setGeneratingAI(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("/api/theme/generate", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to generate theme");
            }

            const colors = await response.json();
            setCustomColors(colors);
            setCurrentTheme('custom');
        } catch (err: any) {
            alert(err.message || "Failed to generate theme from image");
        } finally {
            setGeneratingAI(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create local preview URL
        const url = URL.createObjectURL(file);
        setUploadedImageUrl(url);
        setCurrentTheme('custom');

        // Reset input
        e.target.value = '';
    };

    const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
        if (!pickingColorFor) return;

        // Try EyeDropper API first (Chromium only)
        if ('EyeDropper' in window) {
            try {
                // @ts-ignore - EyeDropper is not in standard TS types yet
                const eyeDropper = new window.EyeDropper();
                const result = await eyeDropper.open();
                setCustomColors(prev => ({ ...prev, [pickingColorFor]: result.sRGBHex }));
                setPickingColorFor(null);
                return;
            } catch (err) {
                // User cancelled or error, fall back to canvas
                console.log("EyeDropper cancelled or failed, falling back to canvas");
            }
        }

        const img = e.currentTarget;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        // Calculate coordinates relative to the image
        const rect = img.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * img.naturalWidth;
        const y = ((e.clientY - rect.top) / rect.height) * img.naturalHeight;

        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;

        setCustomColors(prev => ({ ...prev, [pickingColorFor]: hex }));
        setPickingColorFor(null);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const downloadPageCode = () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.repo_name} | Changelog</title>
    <style>
        body, html { 
            margin: 0; 
            padding: 0; 
            height: 100%; 
            width: 100%; 
            overflow: hidden; 
            background: #020617;
        }
        iframe { 
            width: 100%; 
            height: 100%; 
            border: none; 
            display: block;
        }
    </style>
</head>
<body>
    <iframe src="${origin}/embed/${project.slug}" title="Changelog"></iframe>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'changelog.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border bg-card shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {project.repo_name}
                        <a
                            href={`https://github.com/${project.repo_owner}/${project.repo_name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ExternalLink size={18} />
                        </a>
                    </h2>
                    <p className="text-muted-foreground">
                        {project.repo_owner} / {project.repo_name}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                        {syncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Sync Releases
                    </button>
                    <button
                        onClick={onReset}
                        className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                    >
                        Change Repo
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div
                    className="p-8 rounded-2xl border shadow-2xl space-y-6 relative overflow-hidden group transition-colors duration-300"
                    style={{
                        backgroundColor: activeTheme.bg,
                        color: activeTheme.text,
                        borderColor: `${activeTheme.accent}33`
                    }}
                >
                    <div
                        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl transition-all duration-500"
                        style={{
                            backgroundColor: activeTheme.accent,
                            opacity: 0.1
                        }}
                    />

                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-lg"
                            style={{
                                backgroundColor: `${activeTheme.accent}1A`,
                                color: activeTheme.accent
                            }}
                        >
                            <Globe size={20} />
                        </div>
                        <h3 className="font-bold text-xl">Public Changelog</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-slate-400">Your public page is live at:</p>
                            <div
                                className="flex items-center gap-2 p-3 rounded-xl border overflow-hidden"
                                style={{
                                    backgroundColor: `${activeTheme.text}0D`, // 5% opacity
                                    borderColor: `${activeTheme.text}1A` // 10% opacity
                                }}
                            >
                                <code
                                    className="text-xs truncate flex-1"
                                    style={{ color: activeTheme.accent }}
                                >
                                    {publicUrl}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(publicUrl, 'url')}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                        backgroundColor: `${activeTheme.text}1A`,
                                        color: activeTheme.text
                                    }}
                                >
                                    {copied === 'url' ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl transition-all text-sm font-medium hover:opacity-80"
                                style={{
                                    backgroundColor: `${activeTheme.text}0D`,
                                    borderColor: `${activeTheme.text}1A`,
                                    color: activeTheme.text
                                }}
                            >
                                View Page <ExternalLink size={14} />
                            </a>
                            <button
                                onClick={downloadPageCode}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold shadow-lg hover:opacity-90"
                                style={{
                                    backgroundColor: activeTheme.accent,
                                    color: activeTheme.bg, // Contrast text
                                    boxShadow: `0 0 20px ${activeTheme.accent}4D`
                                }}
                            >
                                <Download size={16} />
                                Download Code
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-2xl border border-gray-200 bg-white text-black shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                            <RefreshCw size={20} />
                        </div>
                        <h3 className="font-bold text-xl">Auto-Sync</h3>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full border border-amber-200">Beta</span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">GitHub Webhook URL:</p>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                <code className="text-xs truncate flex-1 text-gray-600">{typeof window !== 'undefined' ? `${window.location.origin}/api/github/webhook` : ''}</code>
                                <button
                                    onClick={() => copyToClipboard(`${window.location.origin}/api/github/webhook`, 'webhook')}
                                    className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all"
                                >
                                    {copied === 'webhook' ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 italic">
                            Add this URL to your GitHub repository settings and select "Releases" events.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl border border-gray-200 bg-white text-black shadow-sm space-y-6 lg:col-span-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    <Code size={20} />
                                </div>
                                <h3 className="font-bold text-xl">React Embed</h3>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Integrate your changelog directly into your React application with a single component.
                                    This creates a full-page experience that stays in sync with your GitHub releases.
                                </p>
                                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 w-fit">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                    Always in sync
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">React Component</p>
                                <button
                                    onClick={() => copyToClipboard(`import React from 'react';

const Changelog = () => {
  return (
    <iframe 
      src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${project.slug}" 
      style={{ width: '100%', height: '100vh', border: 'none' }} 
      title="Changelog"
    />
  );
};

export default Changelog;`, 'react-snippet')}
                                    className="text-xs font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all flex items-center gap-2"
                                >
                                    {copied === 'react-snippet' ? (
                                        <>
                                            <Check size={12} />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Download size={12} />
                                            Copy Code
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="relative group">
                                <pre className="p-6 bg-[#1e1e1e] text-[#d4d4d4] rounded-2xl text-[13px] overflow-x-auto font-mono leading-relaxed shadow-2xl border border-gray-800">
                                    <code>
                                        <span className="text-[#569cd6]">import</span> React <span className="text-[#569cd6]">from</span> <span className="text-[#ce9178]">'react'</span>;<br /><br />
                                        <span className="text-[#569cd6]">const</span> <span className="text-[#dcdcaa]">Changelog</span> = () =&gt; &#123;<br />
                                        &nbsp;&nbsp;<span className="text-[#569cd6]">return</span> (<br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#808080]">&lt;</span><span className="text-[#569cd6]">iframe</span> <br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#9cdcfe]">src</span>=<span className="text-[#ce9178]">"{typeof window !== 'undefined' ? window.location.origin : ''}/embed/{project.slug}"</span> <br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#9cdcfe]">style</span>=&#123;&#123; <span className="text-[#9cdcfe]">width</span>: <span className="text-[#ce9178]">'100%'</span>, <span className="text-[#9cdcfe]">height</span>: <span className="text-[#ce9178]">'100vh'</span>, <span className="text-[#9cdcfe]">border</span>: <span className="text-[#ce9178]">'none'</span> &#125;&#125; <br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#9cdcfe]">title</span>=<span className="text-[#ce9178]">"Changelog"</span><br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#808080]">/&gt;</span><br />
                                        &nbsp;&nbsp;);<br />
                                        &#125;;<br /><br />
                                        <span className="text-[#569cd6]">export default</span> Changelog;
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Settings */}
            <div className="p-6 rounded-xl border bg-card shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Palette size={20} />
                        </div>
                        <h3 className="font-bold text-xl">Theme Settings</h3>
                    </div>
                    <button
                        onClick={saveTheme}
                        disabled={savingTheme}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {savingTheme ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : saveSuccess ? (
                            <>
                                <Check className="h-4 w-4" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Save Theme
                            </>
                        )}
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <label className="text-sm font-medium">Select Theme</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PRESET_THEMES.map((theme) => (
                                <button
                                    key={theme.name}
                                    onClick={() => setCurrentTheme(theme.name)}
                                    className={`relative p-3 rounded-lg border-2 text-left transition-all ${currentTheme === theme.name
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-transparent hover:border-border bg-muted/50"
                                        }`}
                                >
                                    <div className="w-full h-12 rounded mb-2 flex overflow-hidden border border-border/50">
                                        <div className="w-1/2 h-full" style={{ backgroundColor: theme.colors.bg }}></div>
                                        <div className="w-1/2 h-full flex flex-col">
                                            <div className="h-1/2" style={{ backgroundColor: theme.colors.text }}></div>
                                            <div className="h-1/2" style={{ backgroundColor: theme.colors.accent }}></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium">{theme.label}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentTheme('custom')}
                                className={`relative p-3 rounded-lg border-2 text-left transition-all ${currentTheme === 'custom'
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-transparent hover:border-border bg-muted/50"
                                    }`}
                            >
                                <div className="w-full h-12 rounded mb-2 flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white">
                                    <Palette size={16} />
                                </div>
                                <span className="text-sm font-medium">Custom</span>
                            </button>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    disabled={generatingAI}
                                />
                                <button
                                    className={`w-full h-full p-3 rounded-lg border-2 text-left transition-all border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 flex flex-col items-center justify-center gap-2 ${generatingAI ? 'opacity-50' : ''}`}
                                >
                                    {generatingAI ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    ) : (
                                        <Sparkles className="h-6 w-6 text-primary" />
                                    )}
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                        {generatingAI ? "Analyzing..." : "AI Theme"}
                                    </span>
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleManualImageUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <button
                                    className="w-full h-full p-3 rounded-lg border-2 text-left transition-all border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 bg-muted/5 flex flex-col items-center justify-center gap-2"
                                >
                                    <Download className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Manual Picker
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {currentTheme === 'custom' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-medium">Custom Colors</label>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                                    <label className="text-sm text-muted-foreground">Background</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.bg}
                                            onChange={(e) => setCustomColors({ ...customColors, bg: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={customColors.bg}
                                            onChange={(e) => setCustomColors({ ...customColors, bg: e.target.value })}
                                            className="flex-1 h-8 rounded-md border bg-background px-3 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                                    <label className="text-sm text-muted-foreground">Text</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.text}
                                            onChange={(e) => setCustomColors({ ...customColors, text: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={customColors.text}
                                            onChange={(e) => setCustomColors({ ...customColors, text: e.target.value })}
                                            className="flex-1 h-8 rounded-md border bg-background px-3 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                                    <label className="text-sm text-muted-foreground">Accent</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.accent}
                                            onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={customColors.accent}
                                            onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                                            className="flex-1 h-8 rounded-md border bg-background px-3 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                                    <label className="text-sm text-muted-foreground">Secondary</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.secondary}
                                            onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={customColors.secondary}
                                            onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                                            className="flex-1 h-8 rounded-md border bg-background px-3 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {uploadedImageUrl && (
                                <div className="mt-6 space-y-4 p-4 rounded-xl border bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pick from Image</h4>
                                        <button
                                            onClick={() => setUploadedImageUrl(null)}
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Clear Image
                                        </button>
                                    </div>
                                    <div className="relative group cursor-crosshair overflow-hidden rounded-lg border shadow-inner bg-black/5">
                                        <img
                                            src={uploadedImageUrl}
                                            alt="Uploaded preview"
                                            className="w-full h-auto max-h-[600px] object-contain"
                                            onClick={handleImageClick}
                                        />
                                        {!pickingColorFor && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <p className="text-white text-sm font-medium">Select a color type below to start picking</p>
                                            </div>
                                        )}
                                        {pickingColorFor && (
                                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none border-2 border-primary animate-pulse">
                                                <p className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                    Picking {pickingColorFor}...
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['bg', 'text', 'accent', 'secondary'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setPickingColorFor(type)}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${pickingColorFor === type
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                                    : "bg-background hover:bg-accent border-border"
                                                    }`}
                                            >
                                                {type === 'bg' ? 'Background' : type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-semibold">Changelogs</h3>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : changelogs.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl border-dashed">
                        <p className="text-muted-foreground">No changelogs found. Click "Sync Releases" to fetch them from GitHub.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {changelogs.map((log, index) => (
                            <div key={log.id} className="p-6 rounded-xl border bg-card shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-bold">{log.version}</h4>
                                    <span className="text-sm text-muted-foreground">
                                        {new Date(log.published_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                        {log.markdown_content}
                                    </ReactMarkdown>
                                </div>
                                {index < changelogs.length - 1 && (
                                    <div className="pt-4 border-t">
                                        <a
                                            href={`https://github.com/${project.repo_owner}/${project.repo_name}/compare/${changelogs[index + 1].version}...${log.version}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                        >
                                            View code changes <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
