let styleEl: HTMLStyleElement | null = null;

export function applyThemeToCSSVars(theme: PostchiTheme) {
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "active-theme";
        document.head.appendChild(styleEl);
    }

    const declarations = Object.entries(theme.vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join("\n");

    // Injecting on :root means Tailwind's var() references resolve automatically
    styleEl.textContent = `:root {\n${declarations}\n}`;
}