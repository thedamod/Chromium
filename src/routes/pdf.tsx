import { createFileRoute } from "@tanstack/react-router";
import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import markedKatex from "marked-katex-extension";
import { startTransition, useEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";
// @ts-expect-error
import html2pdf from "html2pdf.js";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import HomeLink from "#/components/HomeLink";
import { Textarea } from "#/components/ui/textarea";
import { downloadBlob } from "#/lib/tool-utils";

marked.use(gfmHeadingId());
marked.use(markedKatex({ throwOnError: false }));

const defaultMarkdown = `# Release Notes

Convert internal markdown into a PDF easily.

- Keep the content focused
- Export a shareable document
- Support GFM tables:

| Feature | Support |
|---|---|
| GFM | Yes |
| LaTeX | Yes |

Einstein's equation: $E=mc^2$

$$ 
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$
`;

export const Route = createFileRoute("/pdf")({
	component: PdfPage,
});

function PdfPage() {
	const [markdown, setMarkdown] = useState(defaultMarkdown);
	const [status, setStatus] = useState("Ready");
	const [htmlContent, setHtmlContent] = useState("");
	const [pdfUrl, setPdfUrl] = useState("");
	const [sourceName, setSourceName] = useState("markdown-export");
	const [isRendering, setIsRendering] = useState(false);
	const exportRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const pdfUrlRef = useRef<string | null>(null);
	const renderVersionRef = useRef(0);

	useEffect(() => {
		async function parseMarkdown() {
			const parsed = await marked.parse(markdown);
			startTransition(() => {
				setHtmlContent(parsed);
			});
		}

		void parseMarkdown();
	}, [markdown]);

	useEffect(() => {
		return () => {
			if (pdfUrlRef.current) {
				URL.revokeObjectURL(pdfUrlRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!htmlContent) {
			return;
		}

		const timer = window.setTimeout(() => {
			void buildPdf("preview");
		}, 450);

		return () => window.clearTimeout(timer);
	}, [htmlContent]);

	async function buildPdf(mode: "preview" | "download") {
		if (!exportRef.current) {
			return null;
		}

		const version = renderVersionRef.current + 1;
		renderVersionRef.current = version;
		setIsRendering(true);
		setStatus(mode === "download" ? "Building PDF..." : "Refreshing preview...");

		const options = {
			margin: 10,
			filename: `${sourceName}.pdf`,
			image: { type: "jpeg", quality: 0.98 },
			html2canvas: { scale: 2, backgroundColor: "#ffffff" },
			jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
		};

		try {
			const worker = html2pdf().set(options).from(exportRef.current).toPdf();
			const blob = (await worker.outputPdf("blob")) as Blob;

			if (version !== renderVersionRef.current) {
				return null;
			}

			const nextUrl = URL.createObjectURL(blob);
			if (pdfUrlRef.current) {
				URL.revokeObjectURL(pdfUrlRef.current);
			}

			pdfUrlRef.current = nextUrl;
			setPdfUrl(nextUrl);

			if (mode === "download") {
				downloadBlob(blob, `${sourceName}.pdf`);
				setStatus("PDF downloaded.");
			} else {
				setStatus("Preview ready.");
			}

			return blob;
		} catch (e) {
			setStatus(e instanceof Error ? e.message : "Export failed.");
			return null;
		} finally {
			if (version === renderVersionRef.current) {
				setIsRendering(false);
			}
		}
	}

	async function handleMarkdownUpload(file: File | null) {
		if (!file) {
			return;
		}

		try {
			const content = await file.text();
			setMarkdown(content);
			setSourceName(file.name.replace(/\.[^.]+$/, "") || "markdown-export");
			setStatus(`Loaded ${file.name}`);
		} catch (e) {
			setStatus(e instanceof Error ? e.message : "Upload failed.");
		}
	}

	return (
		<main className="p-4 flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
			<div className="w-full max-w-5xl flex flex-col gap-6">
				<HomeLink />
				<Card className="w-full border-0 shadow-none bg-transparent">
				<CardContent className="flex flex-col gap-8 p-0">
					<div className="space-y-2">
						<h1 className="text-3xl font-semibold tracking-tight">
							Markdown to PDF
						</h1>
						<p className="max-w-3xl text-sm leading-7 text-muted-foreground">
							Upload markdown, edit it in place, and preview the generated PDF
							directly in an iframe before downloading.
						</p>
					</div>
					<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
						<div className="flex flex-col gap-4">
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="outline"
									onClick={() => fileInputRef.current?.click()}
									type="button"
								>
									Upload markdown
								</Button>
								<input
									ref={fileInputRef}
									type="file"
									accept=".md,.markdown,.txt,text/markdown,text/plain"
									className="hidden"
									onChange={(event) => {
										void handleMarkdownUpload(event.target.files?.[0] ?? null);
										event.currentTarget.value = "";
									}}
								/>
								<Button
									variant="outline"
									onClick={() => void buildPdf("preview")}
									type="button"
								>
									Refresh preview
								</Button>
								<Button onClick={() => void buildPdf("download")} type="button">
									Download PDF
								</Button>
								<span className="ml-2 text-sm text-muted-foreground">
									{status}
								</span>
							</div>
							<Textarea
								className="min-h-[60vh] w-full resize-none border-input font-mono text-sm"
								value={markdown}
								onChange={(e) => setMarkdown(e.target.value)}
								placeholder="Type your markdown here..."
							/>
							<div className="rounded-md border bg-muted/10 p-4 text-sm text-muted-foreground">
								Current export name:{" "}
								<span className="font-medium">{sourceName}.pdf</span>
							</div>
						</div>

						<div className="flex flex-col gap-4">
							<div className="min-h-[70vh] overflow-hidden rounded border bg-white">
								{pdfUrl ? (
									<iframe
										src={pdfUrl}
										title="PDF preview"
										className="h-full min-h-[70vh] w-full"
									/>
								) : (
									<div className="flex min-h-[70vh] items-center justify-center p-8 text-center">
										<div className="space-y-3">
											<p className="text-lg font-semibold text-foreground">
												{isRendering ? "Rendering preview..." : "No preview yet"}
											</p>
											<p className="max-w-md text-sm leading-6 text-muted-foreground">
												The exported PDF will appear here once the markdown has
												been rendered.
											</p>
										</div>
									</div>
								)}
							</div>
							<div className="text-xs text-muted-foreground opacity-70">
								PDF rendering supports Markdown, GFM tables, and LaTeX.
							</div>
						</div>
					</div>
					<div className="fixed left-[-9999px] top-0 w-[210mm] pointer-events-none opacity-0">
						<div
							ref={exportRef}
							className="prose prose-sm max-w-none bg-white p-8 text-black"
							dangerouslySetInnerHTML={{ __html: htmlContent }}
						/>
					</div>
				</CardContent>
				</Card>
			</div>
		</main>
	);
}
