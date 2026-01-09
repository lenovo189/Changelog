import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const json = await request.json();

    const {
        theme_name,
        theme_bg,
        theme_text,
        theme_accent,
        theme_secondary,
    } = json;

    const { data, error } = await supabase
        .from("projects")
        .update({
            theme_name,
            theme_bg,
            theme_text,
            theme_accent,
            theme_secondary,
        })
        .eq("id", id)
        .select("slug")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data?.slug) {
        const { revalidatePath } = await import("next/cache");
        revalidatePath(`/changelog/${data.slug}`);
    }

    return NextResponse.json({ success: true });
}
