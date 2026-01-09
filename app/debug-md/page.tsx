import ReactMarkdown from "react-markdown";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Debug Markdown - Changelog Generator",
};
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function DebugPage() {
    const markdown = `
# Debugging Images

1. **Standard Markdown Image:**
![Markdown Image](https://placehold.co/100x100/orange/white)

2. **HTML Image:**
<img src="https://placehold.co/100x100/green/white" alt="HTML Image" width="100" height="100" />

3. **HTML Div:**
<div style="background: blue; color: white; padding: 10px;">
  This is a blue raw div.
</div>
    `;

    return (
        <div className="p-10 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Debug Markdown V2</h1>
            <div className="border p-4 rounded">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                >
                    {markdown}
                </ReactMarkdown>
            </div>
        </div>
    );
}
