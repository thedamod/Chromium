import { Link } from "@tanstack/react-router";

export default function HomeLink() {
	return (
		<Link
			to="/"
			className="group flex justify-between items-center py-3 border-b border-border hover:border-foreground transition-colors"
		>
			<span className="text-sm font-mono tracking-tight">Home</span>
			<span className="text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs">
				←
			</span>
		</Link>
	);
}
