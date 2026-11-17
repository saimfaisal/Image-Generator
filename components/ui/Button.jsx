import Link from "next/link";

export function Button({ children, href, variant = "primary", className = "", ...props }) {
  const styles = variant === "secondary" ? "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-violet-400" : "bg-violet-500 text-white shadow-lg shadow-violet-500/15 hover:bg-violet-400";
  const classes = `inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles} ${className}`;
  return href ? <Link href={href} className={classes}>{children}</Link> : <button className={classes} {...props}>{children}</button>;
}
