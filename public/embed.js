(function () {
    const script = document.currentScript;
    const projectSlug = script.getAttribute('data-project');
    const containerId = script.getAttribute('data-container') || 'changelog-embed';

    if (!projectSlug) {
        console.error('Changelog Embed: data-project attribute is missing');
        return;
    }

    const baseUrl = new URL(script.src).origin;
    const apiUrl = `${baseUrl}/api/changelog/${projectSlug}`;

    async function init() {
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            script.parentNode.insertBefore(container, script.nextSibling);
        }

        container.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">Loading changelog...</div>';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch changelog');
            const data = await response.json();
            render(container, data);
        } catch (error) {
            container.innerHTML = `<div style="color:red;padding:20px;">Error: ${error.message}</div>`;
        }
    }

    function render(container, data) {
        const styles = `
            #${containerId} {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
            }
            #${containerId} .cl-entry {
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
            }
            #${containerId} .cl-entry:last-child {
                border-bottom: none;
            }
            #${containerId} .cl-header {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                margin-bottom: 15px;
            }
            #${containerId} .cl-version {
                font-size: 1.5rem;
                font-weight: bold;
                margin: 0;
            }
            #${containerId} .cl-date {
                color: #666;
                font-size: 0.875rem;
            }
            #${containerId} .cl-content {
                font-size: 1rem;
            }
            #${containerId} .cl-content h1,
            #${containerId} .cl-content h2,
            #${containerId} .cl-content h3 {
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                font-weight: 600;
            }
            #${containerId} .cl-content h1 { font-size: 1.5em; }
            #${containerId} .cl-content h2 { font-size: 1.3em; }
            #${containerId} .cl-content h3 { font-size: 1.1em; }
            #${containerId} .cl-content p {
                margin: 0.75em 0;
            }
            #${containerId} .cl-content ul,
            #${containerId} .cl-content ol {
                margin: 0.75em 0;
                padding-left: 2em;
            }
            #${containerId} .cl-content li {
                margin: 0.25em 0;
            }
            #${containerId} .cl-content code {
                background: #f4f4f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
                font-size: 0.9em;
            }
            #${containerId} .cl-content pre {
                background: #f4f4f4;
                padding: 12px;
                border-radius: 6px;
                overflow-x: auto;
                margin: 1em 0;
            }
            #${containerId} .cl-content pre code {
                background: none;
                padding: 0;
            }
            #${containerId} .cl-content img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 1em 0;
            }
            #${containerId} .cl-content a {
                color: #0066cc;
                text-decoration: none;
            }
            #${containerId} .cl-content a:hover {
                text-decoration: underline;
            }
            #${containerId} .cl-content blockquote {
                border-left: 4px solid #ddd;
                padding-left: 1em;
                margin: 1em 0;
                color: #666;
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        container.innerHTML = data.changelogs.map(log => `
            <div class="cl-entry">
                <div class="cl-header">
                    <h3 class="cl-version">${escapeHtml(log.version)}</h3>
                    <span class="cl-date">${new Date(log.published_at).toLocaleDateString()}</span>
                </div>
                <div class="cl-content">${parseMarkdown(log.markdown_content)}</div>
            </div>
        `).join('') || '<p>No changelogs found.</p>';
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Simple markdown parser for basic formatting
    function parseMarkdown(md) {
        let html = md;

        // Code blocks (must be before inline code)
        html = html.replace(/```([\\s\\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Images
        html = html.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, '<img src="$2" alt="$1" />');

        // Links
        html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\\*(.+?)\\*/g, '<em>$1</em>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Unordered lists
        html = html.replace(/^\\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\\/li >) / s, '<ul>$1</ul>');

        // Ordered lists
        html = html.replace(/^\\d+\\. (.+)$/gm, '<li>$1</li>');

        // Line breaks
        html = html.replace(/\\n\\n/g, '</p><p>');
        html = html.replace(/\\n/g, '<br>');

        // Wrap in paragraph if not already wrapped
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
