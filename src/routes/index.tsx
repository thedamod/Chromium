import { createFileRoute, Link } from "@tanstack/react-router";
import { Binary, FileImage, FileText, ImageUpscale, Regex } from "lucide-react";

const tools = [
	{
		name: "Image ↔ Base64",
		description: "Encode and decode images to Base64 data URLs",
		icon: Binary,
		href: "/base64",
	},
	{
		name: "Image to ICO",
		description: "Convert images to ICO format for favicons",
		icon: FileImage,
		href: "/ico",
	},
	{
		name: "Markdown to PDF",
		description: "Write markdown and export as PDF document",
		icon: FileText,
		href: "/pdf",
	},
	{
		name: "Image Converter",
		description: "Convert between PNG, JPEG, and WebP formats",
		icon: ImageUpscale,
		href: "/convert",
	},
	{
		name: "Regex DSL",
		description: "Build regex patterns from readable functions",
		icon: Regex,
		href: "/regex",
	},
];

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<main className="page-wrap px-4 py-12">
			<div className="mx-auto max-w-3xl">
				<h1 className="mb-8 text-center text-2xl font-bold text-[var(--foreground)]">
					Workshop Tools
				</h1>

				<div className="grid gap-3 sm:grid-cols-2">
					{tools.map((tool) => (
						<Link
							key={tool.name}
							to={tool.href}
							className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-4 transition hover:bg-[var(--secondary)]"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
								<tool.icon size={18} />
							</div>
							<div>
								<h2 className="font-medium text-[var(--foreground)]">
									{tool.name}
								</h2>
								<p className="text-xs text-[var(--muted-foreground)]">
									{tool.description}
								</p>
							</div>
						</Link>
					))}
				</div>
			</div>
		</main>
	);
}
