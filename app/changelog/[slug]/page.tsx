import { createAnonClient } from "@/lib/supabase/anon";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getThemeColors, ProjectTheme } from "@/lib/changelog-themes";

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
        title: `${project.repo_name} - Changelog`,
        description: `Latest updates and changes for ${project.repo_name}`,
    };
}

export default async function ChangelogPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = createAnonClient();

    // 1. Fetch project by slug
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();

    if (projectError || !project) {
        notFound();
    }

    // 2. Fetch changelogs for the project
    const { data: changelogs, error: changelogsError } = await supabase
        .from("changelogs")
        .select("*")
        .eq("project_id", project.id)
        .order("published_at", { ascending: false });

    // 3. Get theme colors
    const theme = getThemeColors(project as ProjectTheme);

    return (
        <div
            className="min-h-screen selection:bg-blue-500/30 selection:text-blue-200"
            style={{
                backgroundColor: theme.bg,
                color: theme.text,
            }}
        >
            {/* Background decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-10"
                    style={{ backgroundColor: theme.accent }}
                />
                <div
                    className="absolute -bottom-[25%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-10"
                    style={{ backgroundColor: theme.secondary }}
                />
            </div>

            <div className="relative max-w-3xl mx-auto px-6 py-24">
                <header className="mb-24 text-center space-y-4">
                    <div
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 animate-fade-in"
                        style={{
                            backgroundColor: `${theme.accent}1A`, // 10% opacity
                            borderColor: `${theme.accent}33`, // 20% opacity
                            borderWidth: '1px',
                            color: theme.accent
                        }}
                    >
                        Latest Updates
                    </div>
                    <h1
                        className="text-5xl font-extrabold tracking-tight lg:text-6xl"
                        style={{ color: theme.text }}
                    >
                        {project.repo_name}
                    </h1>
                    <p
                        className="text-xl max-w-xl mx-auto leading-relaxed opacity-70"
                        style={{ color: theme.text }}
                    >
                        Stay up to date with the latest changes, improvements, and bug fixes.
                    </p>
                </header>

                <div className="space-y-16">
                    {changelogs?.map((log, index) => (
                        <article
                            key={log.id}
                            className="group relative pl-12 border-l pb-16 last:pb-0 transition-all"
                            style={{ borderColor: `${theme.text}1A` }} // 10% opacity
                        >
                            {/* Timeline dot */}
                            <div
                                className="absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform"
                                style={{ backgroundColor: theme.accent }}
                            />

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div className="space-y-1">
                                    <h2
                                        className="text-3xl font-bold tracking-tight transition-colors"
                                        style={{ color: theme.text }}
                                    >
                                        {log.version}
                                    </h2>
                                    <time
                                        className="block text-sm font-medium opacity-60"
                                        style={{ color: theme.text }}
                                    >
                                        {new Date(log.published_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </time>
                                </div>
                            </div>

                            <div
                                className="prose max-w-none prose-headings:text-inherit prose-a:text-blue-400 prose-strong:text-inherit prose-code:text-blue-300 prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10"
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
                                        img: ({ node, ...props }) => <img style={{ maxWidth: "100%" }} {...props} />,
                                    }}
                                >
                                    {log.markdown_content}
                                </ReactMarkdown>
                            </div>

                            {index < (changelogs?.length || 0) - 1 && (
                                <div className="mt-10">
                                    <a
                                        href={`https://github.com/${project.repo_owner}/${project.repo_name}/compare/${changelogs[index + 1].version}...${log.version}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity group/link"
                                        style={{ color: theme.text }}
                                    >
                                        <span>View code changes</span>
                                        <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </a>
                                </div>
                            )}
                        </article>
                    ))}
                </div>

                {(!changelogs || changelogs.length === 0) && (
                    <div
                        className="text-center py-20 border-2 border-dashed rounded-3xl"
                        style={{ borderColor: `${theme.text}33` }}
                    >
                        <p className="text-lg opacity-60" style={{ color: theme.text }}>No changelogs published yet.</p>
                    </div>
                )}

                <footer
                    className="mt-32 pt-12 border-t text-center"
                    style={{ borderColor: `${theme.text}1A` }}
                >
                    <p className="text-sm opacity-50" style={{ color: theme.text }}>
                        Powered by <a href="/" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: theme.text }}>Changelog</a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
