import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (!signature) {
        return NextResponse.json({ error: "No signature" }, { status: 401 });
    }

    // 1. Find the project by repo_owner and repo_name from the payload
    const body = JSON.parse(payload);
    const repo_owner = body.repository.owner.login;
    const repo_name = body.repository.name;

    const supabase = await createClient();
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("repo_owner", repo_owner)
        .eq("repo_name", repo_name)
        .single();

    if (projectError || !project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Verify signature if webhook_secret is set
    if (project.webhook_secret) {
        const hmac = crypto.createHmac("sha256", project.webhook_secret);
        const digest = "sha256=" + hmac.update(payload).digest("hex");
        if (signature !== digest) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
    }

    // 3. Handle release.published event
    const event = request.headers.get("x-github-event");
    if (event === "release" && body.action === "published") {
        const release = body.release;

        const { error: insertError } = await supabase
            .from("changelogs")
            .upsert({
                project_id: project.id,
                version: release.tag_name,
                markdown_content: release.body,
                published_at: release.published_at,
            }, { onConflict: "project_id, version" });

        if (insertError) {
            console.error("Error saving changelog from webhook:", insertError);
            return NextResponse.json({ error: "Failed to save changelog" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Event ignored" });
}
