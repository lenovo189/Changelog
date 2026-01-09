import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
            { error: "GitHub OAuth environment variables are not configured" },
            { status: 500 }
        );
    }

    try {
        // 1. Exchange code for access token
        const tokenResponse = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    redirect_uri: redirectUri,
                }),
            }
        );

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return NextResponse.json(
                { error: tokenData.error_description || "Failed to exchange code" },
                { status: 400 }
            );
        }

        const accessToken = tokenData.access_token;

        // 2. Fetch GitHub user profile
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
                "User-Agent": "Changelog-App",
            },
        });

        const userData = await userResponse.json();

        // 3. Get the authenticated user from Supabase
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Not authenticated with Supabase" },
                { status: 401 }
            );
        }

        // 4. Check if this GitHub account is already linked to another user
        const { data: existingAccount, error: checkError } = await supabase
            .from("github_accounts")
            .select("user_id")
            .eq("github_user_id", userData.id.toString())
            .single();

        if (existingAccount && existingAccount.user_id !== user.id) {
            return NextResponse.json(
                { error: "This GitHub account is already linked to another user" },
                { status: 400 }
            );
        }

        // 5. Store the access token and user info in the database
        // We use upsert to update the token if the user already connected GitHub
        const { error: dbError } = await supabase.from("github_accounts").upsert(
            {
                user_id: user.id,
                github_user_id: userData.id.toString(),
                github_username: userData.login,
                github_avatar_url: userData.avatar_url,
                access_token: accessToken,
            },
            { onConflict: "user_id" }
        );

        if (dbError) {
            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to store GitHub token" },
                { status: 500 }
            );
        }

        // 5. Redirect to dashboard or success page
        return NextResponse.redirect(new URL("/protected", request.url));
    } catch (error) {
        console.error("OAuth error:", error);
        return NextResponse.json(
            { error: "Internal server error during OAuth flow" },
            { status: 500 }
        );
    }
}
