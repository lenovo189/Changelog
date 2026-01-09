export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";


import { createAnonClient } from "@/lib/supabase/anon";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Suspense } from "react";

// Separate component for the main content to allow Suspense streaming
async function ChangelogContent({ slug }: { slug: string }) {
    const supabase = createAnonClient();

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();

    if (projectError || !project) {
        notFound();
    }

    const { data: changelogs } = await supabase
        .from("changelogs")
        .select("*")
        .eq("project_id", project.id)
        .order("published_at", { ascending: false });

    return (
        <div className="min-h-screen bg-white">
            {/* Main content area */}
            <div className="max-w-4xl mx-auto py-12 px-6">
                <h1 className="text-4xl font-bold mb-12 text-gray-700">Changelog</h1>

                {changelogs && changelogs.length > 0 ? (
                    <div className="space-y-16">
                        {changelogs.map((log) => (
                            <section key={log.id}>
                                <h2 className="text-2xl font-semibold mb-6 text-gray-700">
                                    {new Date(log.published_at).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </h2>
                                <div className="prose prose-lg max-w-none text-gray-700">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            img: ({ node, ...props }) => <img style={{ maxWidth: "100%" }} {...props} />,
                                        }}
                                    >
                                        {log.markdown_content}
                                    </ReactMarkdown>
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-600 py-20 text-lg">No changelogs published yet.</p>
                )}
            </div>
        </div>
    );
}


export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const supabase = createAnonClient();

    const { data: project } = await supabase
        .from("projects")
        .select("repo_name")
        .eq("slug", slug)
        .single();

    if (!project) {
        return {
            title: "Changelog Not Found",
        };
    }

    return {
        title: `${project.repo_name} - Embedded Changelog`,
    };
}

export default async function EmbedPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p>Loading...</p></div>}>
            <ChangelogContent slug={slug} />
        </Suspense>
    );
}