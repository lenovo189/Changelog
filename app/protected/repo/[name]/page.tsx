import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
    const { name } = await params;
    return {
        title: `${decodeURIComponent(name)} - Repository`,
    };
}

export default async function RepoPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;
    return (
        <div className="flex-1 w-full flex flex-col gap-12 p-4">
            <h1 className="text-2xl font-bold">testing</h1>
            <p>Repository: {name}</p>
        </div>
    );
}
