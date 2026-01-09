import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    // 1. Get the current project
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, repo_owner, repo_name")
        .eq("user_id", user.id)
        .single();

    if (projectError || !project) {
        return NextResponse.json([]);
    }

    // 2. Get changelogs for the project
    const { data: changelogs, error: dbError } = await supabase
        .from("changelogs")
        .select("*")
        .eq("project_id", project.id)
        .order("published_at", { ascending: false });

    if (dbError) {
        console.error("Error fetching changelogs:", dbError);
        return NextResponse.json(
            { error: "Failed to fetch changelogs" },
            { status: 500 }
        );
    }

    return NextResponse.json(changelogs);
}
