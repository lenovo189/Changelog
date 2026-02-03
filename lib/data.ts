import { createAnonClient } from "./supabase/anon";
import { cache } from "react";

export const getProjectBySlug = cache(async (slug: string) => {
    const supabase = createAnonClient();
    const { data: project, error } = await supabase
        .from("projects")
        .select("id, repo_name, slug, theme_name, theme_bg, theme_text, theme_accent, theme_secondary")
        .eq("slug", slug)
        .single();

    if (error || !project) return null;
    return project;
});

export const getChangelogsByProjectId = cache(async (projectId: string) => {
    const supabase = createAnonClient();
    const { data: changelogs, error } = await supabase
        .from("changelogs")
        .select("id, version, markdown_content, published_at")
        .eq("project_id", projectId)
        .order("published_at", { ascending: false });

    if (error) return [];
    return changelogs;
});
