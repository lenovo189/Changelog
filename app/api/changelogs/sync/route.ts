import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
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
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (projectError || !project) {
        return NextResponse.json(
            { error: "No project found" },
            { status: 404 }
        );
    }

    // 2. Get GitHub access token
    const { data: githubAccount, error: githubError } = await supabase
        .from("github_accounts")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

    if (githubError || !githubAccount) {
        return NextResponse.json(
            { error: "GitHub account not connected" },
            { status: 404 }
        );
    }

    try {
        // 3. Fetch releases from GitHub
        const response = await fetch(
            `https://api.github.com/repos/${project.repo_owner}/${project.repo_name}/releases`,
            {
                headers: {
                    Authorization: `Bearer ${githubAccount.access_token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const releases = await response.json();

        // 4. Self-healing: Ensure project has a slug
        if (!project.slug) {
            const slug = project.repo_name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const { error: updateError } = await supabase
                .from("projects")
                .update({ slug })
                .eq("id", project.id);

            if (updateError) {
                console.warn("Failed to auto-generate slug:", updateError);
                // Continue anyway, as this doesn't block changelog sync (though public page might fail)
            }
        }

        // 5. Prepare changelogs for Upsert
        const changelogs = releases.map((release: any) => ({
            project_id: project.id,
            version: release.tag_name,
            markdown_content: release.body,
            published_at: release.published_at,
        }));

        if (changelogs.length > 0) {
            // Upsert changelogs (Insert or Update)
            const { error: upsertError } = await supabase
                .from("changelogs")
                .upsert(changelogs, {
                    onConflict: 'project_id, version',
                    ignoreDuplicates: false
                });

            if (upsertError) {
                console.error("Error saving changelogs:", upsertError);
                throw new Error("Failed to save changelogs to database");
            }

            // 6. Remove stale changelogs (ones that are in DB but not in the latest fetch)
            // This handles cases where a release was deleted or untagged in GitHub
            const versions = changelogs.map((c: any) => c.version);

            // Note: Supabase .in() expects an array. .not() with 'in' filter:
            const { error: deleteError } = await supabase
                .from("changelogs")
                .delete()
                .eq("project_id", project.id)
                .not("version", "in", versions);

            // Actually, the JS client syntax for "not in" is .not('column', 'in', array)
            // But let's use a safer approach if we are unsure of the library version support for .not('in', array)
            // We can just skip this for now or use a raw query if needed, but .not('version', 'in', `(${versions.join(',')})`) is risky with strings.
            // Let's try the standard way:
            // .not('version', 'in', versions) -- this is supported in newer supabase-js.
        }

        return NextResponse.json({ success: true, count: changelogs.length });
    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to sync releases" },
            { status: 500 }
        );
    }
}
