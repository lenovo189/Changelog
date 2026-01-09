"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface GithubAccount {
    github_username: string;
    github_avatar_url: string;
}

export function GithubConnect() {
    const [account, setAccount] = useState<GithubAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkConnection() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from("github_accounts")
                    .select("github_username, github_avatar_url")
                    .eq("user_id", user.id)
                    .single();

                if (data && !error) {
                    setAccount(data);
                }
            }
            setIsLoading(false);
        }

        checkConnection();
    }, []);

    const handleConnect = () => {
        window.location.href = "/api/github/connect";
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect your GitHub account?")) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/github/disconnect", {
                method: "POST",
            });

            if (response.ok) {
                setAccount(null);
            } else {
                const data = await response.json();
                alert(data.error || "Failed to disconnect");
            }
        } catch (error) {
            console.error("Disconnect error:", error);
            alert("An error occurred while disconnecting");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Button variant="outline" disabled>
                <Github className="mr-2 h-4 w-4 animate-pulse" />
                Processing...
            </Button>
        );
    }

    if (account) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-accent p-1 pr-3 rounded-full border">
                    {account.github_avatar_url && (
                        <img
                            src={account.github_avatar_url}
                            alt={account.github_username}
                            className="w-7 h-7 rounded-full"
                        />
                    )}
                    <span className="text-sm font-medium">@{account.github_username}</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleConnect}>
                        Reconnect
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        Disconnect
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Button variant="default" onClick={handleConnect}>
            <Github className="mr-2 h-4 w-4" />
            Connect GitHub
        </Button>
    );
}
