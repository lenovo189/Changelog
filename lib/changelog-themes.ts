// Changelog Theme Configuration
// 5 preset themes + custom option

export interface ThemeColors {
    bg: string;
    text: string;
    accent: string;
    secondary: string;
}

export interface Theme {
    name: string;
    label: string;
    colors: ThemeColors;
}

export const PRESET_THEMES: Theme[] = [
    {
        name: "midnight",
        label: "Midnight",
        colors: {
            bg: "#020617",
            text: "#e2e8f0",
            accent: "#3b82f6",
            secondary: "#475569",
        },
    },
    {
        name: "light",
        label: "Light",
        colors: {
            bg: "#ffffff",
            text: "#1e293b",
            accent: "#3b82f6",
            secondary: "#64748b",
        },
    },
    {
        name: "ocean",
        label: "Ocean",
        colors: {
            bg: "#0c1929",
            text: "#e0f2fe",
            accent: "#0ea5e9",
            secondary: "#0284c7",
        },
    },
    {
        name: "forest",
        label: "Forest",
        colors: {
            bg: "#0f1f17",
            text: "#dcfce7",
            accent: "#22c55e",
            secondary: "#16a34a",
        },
    },
    {
        name: "sunset",
        label: "Sunset",
        colors: {
            bg: "#1c1210",
            text: "#fef3c7",
            accent: "#f59e0b",
            secondary: "#d97706",
        },
    },
];

export const DEFAULT_THEME = "midnight";

// Project type with theme fields
export interface ProjectTheme {
    theme_name?: string | null;
    theme_bg?: string | null;
    theme_text?: string | null;
    theme_accent?: string | null;
    theme_secondary?: string | null;
}

/**
 * Get theme colors from project settings
 * Falls back to preset theme if custom colors not set
 */
export function getThemeColors(project: ProjectTheme): ThemeColors {
    const themeName = project.theme_name || DEFAULT_THEME;

    if (themeName === "custom") {
        // Use custom colors, falling back to midnight preset for any missing values
        const fallback = PRESET_THEMES[0].colors;
        return {
            bg: project.theme_bg || fallback.bg,
            text: project.theme_text || fallback.text,
            accent: project.theme_accent || fallback.accent,
            secondary: project.theme_secondary || fallback.secondary,
        };
    }

    // Use preset theme
    const preset = PRESET_THEMES.find(t => t.name === themeName);
    return preset?.colors || PRESET_THEMES[0].colors;
}

/**
 * Check if a theme is a light theme (for text contrast)
 */
export function isLightTheme(bgColor: string): boolean {
    // Remove # if present
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}
