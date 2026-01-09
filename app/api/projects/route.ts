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

    const { data: project, error: dbError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (dbError && dbError.code !== "PGRST116") { // PGRST116 is "no rows returned"
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }

    return NextResponse.json(project || null);
}

export async function POST(request: Request) {
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

    const { repo_owner, repo_name } = await request.json();

    if (!repo_owner || !repo_name) {
        return NextResponse.json(
            { error: "Missing repo_owner or repo_name" },
            { status: 400 }
        );
    }

    // Generate unique slug from owner and repo name (e.g., "facebook-react")
    const slug = `${repo_owner}-${repo_name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // STEP 1: Check if user has an existing project
    const { data: existingProject } = await supabase
        .from("projects")
        .select("id, repo_owner, repo_name")
        .eq("user_id", user.id)
        .single();

    // STEP 2: If changing repo, DELETE EVERYTHING
    if (existingProject) {
        // Delete all changelogs first (foreign key constraint)
        await supabase
            .from("changelogs")
            .delete()
            .eq("project_id", existingProject.id);

        // Delete the project
        await supabase
            .from("projects")
            .delete()
            .eq("id", existingProject.id);
    }

    // STEP 3: Create fresh new project
    const { data: project, error: insertError } = await supabase
        .from("projects")
        .insert({
            user_id: user.id,
            repo_owner,
            repo_name,
            slug,
        })
        .select()
        .single();

    if (insertError) {
        console.error("Error creating project:", insertError);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }

    return NextResponse.json(project);
}
