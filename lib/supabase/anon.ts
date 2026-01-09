import { createClient } from "@supabase/supabase-js";

/**
 * Anon client for public access (no auth required).
 * Use this for public pages that don't need user authentication.
 */
export function createAnonClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
}
