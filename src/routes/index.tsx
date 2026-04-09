import { createFileRoute, Link } from "@tanstack/react-router";

const tools = [
	{ name: "Image ↔ Base64", href: "/base64" },
	{ name: "Image to ICO", href: "/ico" },
	{ name: "Markdown to PDF", href: "/pdf" },
	{ name: "Image Converter", href: "/convert" },
	{ name: "Image Compressor", href: "/compressor" },
	{ name: "Regex DSL", href: "/regex" },
];

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
			<div className="w-full max-w-sm flex flex-col gap-4">
				<h1 className="text-xl font-medium tracking-tight mb-4">
					Chromium Tools
				</h1>
				<nav className="flex flex-col gap-2">
					{tools.map((tool) => (
						<Link
							key={tool.name}
							to={tool.href}
							className="group flex justify-between items-center py-3 border-b border-border hover:border-foreground transition-colors"
						>
							<span className="text-sm font-mono tracking-tight">
								{tool.name}
							</span>
							<span className="text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs">
								→
							</span>
						</Link>
					))}
				</nav>
			</div>
		</main>
	);
}
