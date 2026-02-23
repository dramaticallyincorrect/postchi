

export const Bullet = (props: React.HTMLAttributes<HTMLDivElement>) => {
    const { className } = props;
    return (
        <span className={`text-muted-foreground select-none ${className || ''}`}>•</span>
    );
}