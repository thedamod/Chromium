import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, FileText } from "lucide-react";
import {
	buildPdfFromMarkdown,
	downloadBlob,
	markdownToHtml,
} from "../lib/tool-utils";

const defaultMarkdown = `# Release Notes

Convert internal markdown into a PDF without leaving the browser.

- Keep the content focused
- Export a shareable document
- Preserve code blocks for technical notes

## Example

\`\`\`ts
const total = items.reduce((sum, item) => sum + item.price, 0)
\`\`\`

> This preview is rendered in-app before export.
`;

export const Route = createFileRoute("/pdf")({
	component: PdfPage,
});

function PdfPage() {
	const [markdown, setMarkdown] = useState(defaultMarkdown);
	const [pdfUrl, setPdfUrl] = useState<string>("");
	const [status, setStatus] = useState("Ready to export.");

	const previewHtml = markdownToHtml(markdown);

	async function handleExport() {
		try {
			const pdf = buildPdfFromMarkdown(markdown);
			downloadBlob(pdf, "markdown-export.pdf");
			setStatus("PDF downloaded.");
		} catch (e) {
			setStatus(e instanceof Error ? e.message : "PDF export failed.");
		}
	}

	async function handlePreview() {
		try {
			const pdf = buildPdfFromMarkdown(markdown);
			const url = URL.createObjectURL(pdf);
			setPdfUrl(url);
			setStatus("PDF generated for preview.");
		} catch (e) {
			setStatus(e instanceof Error ? e.message : "PDF preview failed.");
		}
	}

	async function copyText(value: string) {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			window.prompt("Copy manually:", value);
		}
	}

	return (
		<main className="page-wrap px-4 py-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8 flex items-center gap-4">
					<div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
						<FileText size={24} />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-[var(--foreground)]">
							Markdown to PDF
						</h1>
						<p className="text-[var(--muted-foreground)]">
							Write markdown and export as PDF document
						</p>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-xl border border-[var(--border)] p-5">
						<h2 className="mb-4 font-semibold text-[var(--foreground)]">
							Markdown
						</h2>
						<textarea
							className="h-[24rem] w-full rounded-lg border border-[var(--input)] bg-[var(--background)] p-3 text-sm font-mono"
							value={markdown}
							onChange={(e) => setMarkdown(e.target.value)}
						/>
						<div className="mt-4 flex flex-wrap gap-3">
							<button
								type="button"
								className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
								onClick={handleExport}
							>
								<Download size={16} /> Export PDF
							</button>
							<button
								type="button"
								className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--secondary)]"
								onClick={() => copyText(markdown)}
							>
								<Copy size={16} /> Copy
							</button>
						</div>
						<p className="mt-3 text-sm text-[var(--muted-foreground)]">
							{status}
						</p>
					</div>

					<div className="rounded-xl border border-[var(--border)] p-5">
						<h2 className="mb-4 font-semibold text-[var(--foreground)]">
							Preview
						</h2>
						<div
							className="prose prose-sm max-h-[24rem] overflow-auto rounded-lg border border-[var(--input)] p-4"
							dangerouslySetInnerHTML={{ __html: previewHtml }}
						/>
						<button
							type="button"
							className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--secondary)]"
							onClick={handlePreview}
						>
							<FileText size={16} /> Preview PDF
						</button>
						{pdfUrl && (
							<div className="mt-4 h-[400px] rounded-lg border border-[var(--border)] overflow-hidden">
								<iframe
									src={pdfUrl}
									className="w-full h-full"
									title="PDF Preview"
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
