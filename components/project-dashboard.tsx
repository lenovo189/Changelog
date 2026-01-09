"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ExternalLink, Download, Globe, Palette, Check } from "lucide-react";
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
