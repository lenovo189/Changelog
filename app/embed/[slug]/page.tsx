import { getProjectBySlug, getChangelogsByProjectId } from "@/lib/data";
import type { Metadata } from "next";
import Image from "next/image";

import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Suspense } from "react";
import { getThemeColors, ProjectTheme } from "@/lib/changelog-themes";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";

export const revalidate = 3600; // Revalidate every hour

// Separate component for the main content to allow Suspense streaming
async function ChangelogContent({ slug }: { slug: string }) {
    const project = await getProjectBySlug(slug);

    if (!project) {
        notFound();
    }

    const changelogs = await getChangelogsByProjectId(project.id);
    const theme = getThemeColors(project as ProjectTheme);

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: theme.bg,
                color: theme.text
            }}
        >
            <ScrollIndicator itemsCount={changelogs?.length || 0} theme={theme} />
            {/* Main content area */}
            <div className="max-w-4xl mx-auto py-12 px-6">
                <h1 className="text-4xl font-bold mb-12" style={{ color: theme.text }}>Changelog</h1>

                {changelogs && changelogs.length > 0 ? (
                    <div className="space-y-16">
                        {changelogs.map((log) => (
                            <section key={log.id} data-changelog-item>
                                <h2 className="text-2xl font-semibold mb-6" style={{ color: theme.text }}>
                                    {new Date(log.published_at).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </h2>
                                <div
                                    className="prose prose-lg max-w-none"
                                    style={{
                                        color: theme.text,
                                        '--tw-prose-body': theme.text,
                                        '--tw-prose-headings': theme.text,
                                        '--tw-prose-links': theme.accent,
                                        '--tw-prose-bold': theme.text,
                                        '--tw-prose-counters': theme.text,
                                        '--tw-prose-bullets': theme.text,
                                        '--tw-prose-hr': `${theme.text}33`,
                                        '--tw-prose-quotes': theme.text,
                                        '--tw-prose-quote-borders': theme.accent,
                                        '--tw-prose-captions': `${theme.text}99`,
                                        '--tw-prose-code': theme.accent,
                                        '--tw-prose-pre-code': theme.text,
                                        '--tw-prose-pre-bg': `${theme.secondary}33`,
                                        '--tw-prose-th-borders': `${theme.text}33`,
                                        '--tw-prose-td-borders': `${theme.text}33`,
                                    } as React.CSSProperties}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            img: ({ node, ...props }) => (
                                                <div className="relative w-full aspect-video my-8">
                                                    <Image
                                                        src={props.src as string}
                                                        alt={props.alt || ""}
                                                        fill
                                                        className="object-contain rounded-2xl"
                                                        unoptimized
                                                    />
                                                </div>
                                            ),

                                        }}
                                    >
                                        {log.markdown_content}
                                    </ReactMarkdown>
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-20 text-lg opacity-60">No changelogs published yet.</p>
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
    const project = await getProjectBySlug(slug);

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