import { createAnonClient } from "@/lib/supabase/anon";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = createAnonClient();

    // 1. Fetch project by slug
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, repo_name, repo_owner")
        .eq("slug", slug)
        .single();

    if (projectError || !project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Fetch changelogs for the project
    const { data: changelogs, error: changelogsError } = await supabase
        .from("changelogs")
        .select("version, markdown_content, published_at")
        .eq("project_id", project.id)
        .order("published_at", { ascending: false });

    if (changelogsError) {
        return NextResponse.json({ error: "Failed to fetch changelogs" }, { status: 500 });
    }

    return NextResponse.json({
        project: {
            name: project.repo_name,
            owner: project.repo_owner,
        },
        changelogs,
    });
}
