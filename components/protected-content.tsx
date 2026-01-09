"use client";

import { useState, useEffect } from "react";
import { RepoList } from "@/components/repo-list";
import { ProjectDashboard } from "@/components/project-dashboard";
import { Loader2 } from "lucide-react";

export function ProtectedContent() {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchProject = async () => {
        try {
            const response = await fetch("/api/projects");
            if (response.ok) {
                const data = await response.json();
                setProject(data);
            }
        } catch (err) {
            console.error("Failed to fetch project:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, []);

    const handleReset = async () => {
        // For now, we just clear the local state to show the list again
        // In a real app, we might want to delete the project from DB or keep it
        setProject(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (project) {
        return <ProjectDashboard project={project} onReset={handleReset} />;
    }

    return <RepoList onSelect={fetchProject} />;
}
