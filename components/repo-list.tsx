"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Globe } from "lucide-react";
import Link from "next/link";

interface Repository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    updated_at: string;
    owner: {
        login: string;
    };
}

export function RepoList({ onSelect }: { onSelect?: () => void }) {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selecting, setSelecting] = useState<number | null>(null);

    useEffect(() => {
        async function fetchRepos() {
            try {
                const response = await fetch("/api/github/repos");
                if (response.status === 404) {
                    // Not connected, just stop loading
                    setLoading(false);
                    return;
                }
                if (!response.ok) {
                    throw new Error("Failed to fetch repositories");
                }
                const data = await response.json();
                setRepos(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchRepos();
    }, []);

    const handleSelect = async (repo: Repository) => {
        setSelecting(repo.id);
        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repo_owner: repo.owner.login,
                    repo_name: repo.name,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to select repository");
            }

            if (onSelect) {
                onSelect();
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to select repository");
        } finally {
            setSelecting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-sm text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
                Error: {error}
            </div>
        );
    }

    if (repos.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4">
                No repositories found or GitHub not connected.
            </div>
        )
    }

    return (
        <div className="w-full space-y-4">
            <h3 className="font-semibold text-lg">Select a Repository</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {repos.map((repo) => (
                    <div
                        key={repo.id}
                        className="block p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="font-medium truncate pr-2" title={repo.name}>
                                {repo.name}
                            </div>
                            {repo.private ? (
                                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                            {repo.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Updated {new Date(repo.updated_at).toLocaleDateString()}
                            </div>
                            <button
                                onClick={() => handleSelect(repo)}
                                disabled={selecting !== null}
                                className="text-xs font-medium px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {selecting === repo.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    "Select"
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
