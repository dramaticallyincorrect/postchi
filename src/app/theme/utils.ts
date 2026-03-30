export function isDarkTheme(): boolean {
    return document.documentElement.classList.contains('dark');
}

export function getCSSVar(name: string) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}
