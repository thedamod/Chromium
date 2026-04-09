import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 backdrop-blur-lg">
			<nav className="page-wrap flex items-center justify-between">
				<h2 className="text-base font-semibold tracking-tight">
					<Link
						to="/"
						className="flex items-center gap-2 text-[var(--foreground)] no-underline"
					>
						<span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
						Workshop Tools
					</Link>
				</h2>

				<ThemeToggle />
			</nav>
		</header>
	);
}
