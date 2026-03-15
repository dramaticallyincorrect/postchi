const FileJavascriptIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  style = {},
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      role="img"
      aria-label="JavaScript file"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      {/* J: top at y=12, curves left at y=17 */}
      <path d="M10 12v5a1.5 1.5 0 0 1-3 0" />
      {/* S: top at y=12, bottom at y=18 */}
      <path d="M16 12h-1.5a1.5 1.5 0 0 0 0 3h0a1.5 1.5 0 0 1 0 3H13" />
    </svg>
  );
};

export default FileJavascriptIcon;