export function isDarkTheme(): boolean {
    // check if the html element has a dark theme class
    return document.documentElement.classList.contains('theme-midnight')
        || document.documentElement.classList.contains('dark');
}

export function getCSSVar(name: string) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}