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

    const { data: githubAccount, error: dbError } = await supabase
        .from("github_accounts")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

    if (dbError || !githubAccount) {
        return NextResponse.json(
            { error: "GitHub account not connected" },
            { status: 404 }
        );
    }

    try {
        // First, get the authenticated user's GitHub info to get their login
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${githubAccount.access_token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!userResponse.ok) {
            throw new Error(`GitHub API error (user): ${userResponse.statusText}`);
        }

        const githubUser = await userResponse.json();
        const githubLogin = githubUser.login;

        const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100&type=owner", {
            headers: {
                Authorization: `Bearer ${githubAccount.access_token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API error (repos): ${response.statusText}`);
        }

        const repos = await response.json();

        // Filter: owner.login === authenticated_user AND fork === false
        const filteredRepos = repos.filter((repo: any) =>
            repo.owner.login === githubLogin && !repo.fork
        );

        return NextResponse.json(filteredRepos);
    } catch (error) {
        console.error("Error fetching repos:", error);
        return NextResponse.json(
            { error: "Failed to fetch repositories" },
            { status: 500 }
        );
    }
}
