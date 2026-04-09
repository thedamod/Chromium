import {
	Binary,
	Copy,
	Download,
	FileImage,
	FileText,
	ImageUpscale,
	Regex,
	RotateCw,
	WandSparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
	blobToDataUrl,
	buildPdfFromMarkdown,
	canvasToBlob,
	compileRegexDsl,
	createIcoBlobFromDataUrl,
	dataUrlToBlob,
	downloadBlob,
	fileNameWithoutExtension,
	formatBytes,
	loadImageElement,
	markdownToHtml,
	readFileAsDataUrl,
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

const defaultDsl = `and(
  startsWith("user_"),
  repeat(charRange("a", "z"), 3, 12),
  optional(and("-", digits())),
  endsWith("")
)`;

type ImageSourceState = {
	dataUrl: string;
	filename: string;
	sizeLabel: string;
};

export default function ToolWorkbench() {
	const [base64Image, setBase64Image] = useState<ImageSourceState | null>(null);
	const [base64Input, setBase64Input] = useState("");
	const [base64DecodedUrl, setBase64DecodedUrl] = useState("");
	const [base64DecodedName, setBase64DecodedName] = useState("decoded-image");
	const [base64MimeHint, setBase64MimeHint] = useState("image/png");
	const [base64Error, setBase64Error] = useState("");

	const [icoSource, setIcoSource] = useState<ImageSourceState | null>(null);
	const [icoReady, setIcoReady] = useState<Blob | null>(null);
	const [icoStatus, setIcoStatus] = useState(
		"Upload a source image to generate a favicon-ready ICO file.",
	);
	const [icoError, setIcoError] = useState("");

	const [markdown, setMarkdown] = useState(defaultMarkdown);
	const [pdfStatus, setPdfStatus] = useState("Ready to export.");

	const [formatSource, setFormatSource] = useState<ImageSourceState | null>(
		null,
	);
	const [formatTarget, setFormatTarget] = useState("image/png");
	const [formatQuality, setFormatQuality] = useState(0.92);
	const [formatOutputUrl, setFormatOutputUrl] = useState("");
	const [formatOutputName, setFormatOutputName] = useState("");
	const [formatStatus, setFormatStatus] = useState(
		"Choose a source image and target format.",
	);
	const [formatError, setFormatError] = useState("");

	const [dsl, setDsl] = useState(defaultDsl);
	const [regexSample, setRegexSample] = useState("user_delta-42");

	const markdownPreview = markdownToHtml(markdown);
	let regexOutput = "";
	let regexError = "";
	let regexMatches = false;

	try {
		regexOutput = compileRegexDsl(dsl);
		regexMatches = new RegExp(regexOutput).test(regexSample);
	} catch (error) {
		regexError =
			error instanceof Error ? error.message : "The DSL could not be compiled.";
	}

	async function handleBase64Upload(file: File | null) {
		if (!file) {
			return;
		}

		try {
			const dataUrl = await readFileAsDataUrl(file);
			setBase64Image({
				dataUrl,
				filename: file.name,
				sizeLabel: formatBytes(file.size),
			});
			setBase64Input(dataUrl);
			setBase64Error("");
		} catch (error) {
			setBase64Error(
				error instanceof Error ? error.message : "Unable to read the image.",
			);
		}
	}

	async function handleDecodeBase64() {
		try {
			const blob = await dataUrlToBlob(base64Input, base64MimeHint);
			const dataUrl = await blobToDataUrl(blob);
			setBase64DecodedUrl(dataUrl);
			setBase64DecodedName(
				`decoded.${extensionFromMime(blob.type || base64MimeHint)}`,
			);
			setBase64Error("");
		} catch (error) {
			setBase64Error(error instanceof Error ? error.message : "Decode failed.");
		}
	}

	async function handleCreateIco(file: File | null) {
		if (!file) {
			return;
		}

		try {
			const dataUrl = await readFileAsDataUrl(file);
			const icoBlob = await createIcoBlobFromDataUrl(dataUrl);
			setIcoSource({
				dataUrl,
				filename: file.name,
				sizeLabel: formatBytes(file.size),
			});
			setIcoReady(icoBlob);
			setIcoStatus(`ICO ready at 256x256 from ${file.name}.`);
			setIcoError("");
		} catch (error) {
			setIcoError(
				error instanceof Error ? error.message : "ICO conversion failed.",
			);
		}
	}

	async function handleConvertImage() {
		if (!formatSource) {
			setFormatError("Upload an image before converting it.");
			return;
		}

		try {
			const image = await loadImageElement(formatSource.dataUrl);
			const canvas = document.createElement("canvas");
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext("2d");

			if (!context) {
				throw new Error("2D canvas context is unavailable.");
			}

			if (formatTarget === "image/jpeg") {
				context.fillStyle = "#ffffff";
				context.fillRect(0, 0, canvas.width, canvas.height);
			}

			context.drawImage(image, 0, 0);
			const blob = await canvasToBlob(
				canvas,
				formatTarget,
				formatTarget === "image/png" ? undefined : formatQuality,
			);
			const dataUrl = await blobToDataUrl(blob);
			const extension = extensionFromMime(formatTarget);

			setFormatOutputUrl(dataUrl);
			setFormatOutputName(
				`${fileNameWithoutExtension(formatSource.filename)}.${extension}`,
			);
			setFormatStatus(
				`Converted ${formatSource.filename} to ${extension.toUpperCase()} at ${canvas.width}x${canvas.height}.`,
			);
			setFormatError("");
		} catch (error) {
			setFormatError(
				error instanceof Error ? error.message : "Image conversion failed.",
			);
		}
	}

	async function handleExportPdf() {
		try {
			const pdf = buildPdfFromMarkdown(markdown);
			downloadBlob(pdf, "markdown-export.pdf");
			setPdfStatus("PDF downloaded.");
		} catch (error) {
			setPdfStatus(
				error instanceof Error ? error.message : "PDF export failed.",
			);
		}
	}

	async function copyText(value: string) {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			window.prompt("Clipboard access failed. Copy manually:", value);
		}
	}

	return (
		<section className="mt-8 space-y-6">
			<div className="grid gap-4 xl:grid-cols-2">
				<article
					id="tool-grid"
					className="tool-card rounded-[1.7rem] p-5 sm:p-6"
				>
					<SectionHeading
						icon={<Binary size={18} />}
						title="Image <> Base64"
						description="Encode uploaded images into data URLs, then decode pasted Base64 back into a previewable file."
					/>

					<div className="tool-layout">
						<div className="tool-surface">
							<label className="tool-label">
								Upload image
								<input
									className="tool-input"
									type="file"
									accept="image/*"
									onChange={(event) =>
										void handleBase64Upload(event.target.files?.[0] ?? null)
									}
								/>
							</label>
							{base64Image ? (
								<div className="space-y-3">
									<div className="tool-meta">
										<span>{base64Image.filename}</span>
										<span>{base64Image.sizeLabel}</span>
									</div>
									<img
										src={base64Image.dataUrl}
										alt=""
										className="tool-preview-image"
									/>
								</div>
							) : (
								<EmptyState message="No source image loaded yet." />
							)}
						</div>

						<div className="tool-surface">
							<label className="tool-label">
								Base64 / data URL
								<textarea
									className="tool-textarea h-44"
									value={base64Input}
									onChange={(event) => setBase64Input(event.target.value)}
									placeholder="Paste a Base64 string or upload an image."
								/>
							</label>
							<div className="flex flex-wrap gap-3">
								<button
									type="button"
									className="tool-button"
									onClick={() => void copyText(base64Input)}
									disabled={!base64Input}
								>
									<Copy size={16} />
									Copy text
								</button>
								<button
									type="button"
									className="tool-button tool-button--quiet"
									onClick={() => void handleDecodeBase64()}
								>
									<RotateCw size={16} />
									Decode back to image
								</button>
							</div>
							<label className="tool-label mt-4">
								MIME hint for raw Base64
								<select
									className="tool-input"
									value={base64MimeHint}
									onChange={(event) => setBase64MimeHint(event.target.value)}
								>
									<option value="image/png">PNG</option>
									<option value="image/jpeg">JPEG</option>
									<option value="image/webp">WebP</option>
									<option value="image/gif">GIF</option>
								</select>
							</label>
							{base64Error ? <p className="tool-error">{base64Error}</p> : null}
							{base64DecodedUrl ? (
								<div className="mt-4 space-y-3">
									<img
										src={base64DecodedUrl}
										alt=""
										className="tool-preview-image"
									/>
									<a
										className="tool-button"
										href={base64DecodedUrl}
										download={base64DecodedName}
									>
										<Download size={16} />
										Download decoded file
									</a>
								</div>
							) : null}
						</div>
					</div>
				</article>

				<article className="tool-card rounded-[1.7rem] p-5 sm:p-6">
					<SectionHeading
						icon={<FileImage size={18} />}
						title="Image to ICO"
						description="Create a browser-friendly `.ico` file from PNG, JPEG, WebP, or other uploaded images."
					/>

					<div className="tool-layout">
						<div className="tool-surface">
							<label className="tool-label">
								Upload source image
								<input
									className="tool-input"
									type="file"
									accept="image/*"
									onChange={(event) =>
										void handleCreateIco(event.target.files?.[0] ?? null)
									}
								/>
							</label>
							{icoSource ? (
								<>
									<div className="tool-meta">
										<span>{icoSource.filename}</span>
										<span>{icoSource.sizeLabel}</span>
									</div>
									<img
										src={icoSource.dataUrl}
										alt=""
										className="tool-preview-image"
									/>
								</>
							) : (
								<EmptyState message="Upload an image to generate an icon." />
							)}
						</div>

						<div className="tool-surface">
							<p className="tool-status">{icoStatus}</p>
							<p className="tool-caption">
								This exporter wraps a 256x256 PNG payload inside an ICO
								container, which works well for modern favicon and desktop icon
								use cases.
							</p>
							{icoError ? <p className="tool-error">{icoError}</p> : null}
							<button
								type="button"
								className="tool-button"
								disabled={!icoReady || !icoSource}
								onClick={() => {
									if (icoReady && icoSource) {
										downloadBlob(
											icoReady,
											`${fileNameWithoutExtension(icoSource.filename)}.ico`,
										);
									}
								}}
							>
								<Download size={16} />
								Download ICO
							</button>
						</div>
					</div>
				</article>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<article className="tool-card rounded-[1.7rem] p-5 sm:p-6">
					<SectionHeading
						icon={<FileText size={18} />}
						title="Markdown to PDF"
						description="Draft markdown on the left, inspect the rendered preview on the right, then export a lightweight PDF."
					/>

					<div className="tool-layout">
						<div className="tool-surface">
							<label className="tool-label">
								Markdown
								<textarea
									className="tool-textarea h-[24rem]"
									value={markdown}
									onChange={(event) => setMarkdown(event.target.value)}
								/>
							</label>
							<div className="flex flex-wrap gap-3">
								<button
									type="button"
									className="tool-button"
									onClick={() => void handleExportPdf()}
								>
									<Download size={16} />
									Export PDF
								</button>
								<button
									type="button"
									className="tool-button tool-button--quiet"
									onClick={() => void copyText(markdown)}
								>
									<Copy size={16} />
									Copy markdown
								</button>
							</div>
							<p className="tool-status mt-3">{pdfStatus}</p>
						</div>

						<div className="tool-surface">
							<p className="tool-label">Preview</p>
							<div
								className="tool-prose"
								dangerouslySetInnerHTML={{ __html: markdownPreview }}
							/>
						</div>
					</div>
				</article>

				<article className="tool-card rounded-[1.7rem] p-5 sm:p-6">
					<SectionHeading
						icon={<ImageUpscale size={18} />}
						title="Image format converter"
						description="Convert a source image into PNG, JPEG, or WebP directly in the browser."
					/>

					<div className="tool-layout">
						<div className="tool-surface">
							<label className="tool-label">
								Upload source image
								<input
									className="tool-input"
									type="file"
									accept="image/*"
									onChange={(event) => {
										const file = event.target.files?.[0] ?? null;
										if (!file) {
											return;
										}

										void readFileAsDataUrl(file)
											.then((dataUrl) => {
												setFormatSource({
													dataUrl,
													filename: file.name,
													sizeLabel: formatBytes(file.size),
												});
												setFormatError("");
											})
											.catch((error) => {
												setFormatError(
													error instanceof Error
														? error.message
														: "Unable to read the image.",
												);
											});
									}}
								/>
							</label>
							{formatSource ? (
								<>
									<div className="tool-meta">
										<span>{formatSource.filename}</span>
										<span>{formatSource.sizeLabel}</span>
									</div>
									<img
										src={formatSource.dataUrl}
										alt=""
										className="tool-preview-image"
									/>
								</>
							) : (
								<EmptyState message="No source image selected." />
							)}
						</div>

						<div className="tool-surface">
							<div className="grid gap-4 sm:grid-cols-2">
								<label className="tool-label">
									Target format
									<select
										className="tool-input"
										value={formatTarget}
										onChange={(event) => setFormatTarget(event.target.value)}
									>
										<option value="image/png">PNG</option>
										<option value="image/jpeg">JPEG</option>
										<option value="image/webp">WebP</option>
									</select>
								</label>
								<label className="tool-label">
									Quality
									<input
										className="tool-input"
										type="range"
										min="0.4"
										max="1"
										step="0.02"
										value={formatQuality}
										onChange={(event) =>
											setFormatQuality(Number(event.target.value))
										}
									/>
									<span className="tool-caption">
										{Math.round(formatQuality * 100)}%
									</span>
								</label>
							</div>
							<div className="mt-4 flex flex-wrap gap-3">
								<button
									type="button"
									className="tool-button"
									onClick={() => void handleConvertImage()}
								>
									<WandSparkles size={16} />
									Convert image
								</button>
								{formatOutputUrl ? (
									<a
										className="tool-button tool-button--quiet"
										href={formatOutputUrl}
										download={formatOutputName}
									>
										<Download size={16} />
										Download output
									</a>
								) : null}
							</div>
							<p className="tool-status mt-3">{formatStatus}</p>
							{formatError ? <p className="tool-error">{formatError}</p> : null}
							{formatOutputUrl ? (
								<div className="mt-4 space-y-3">
									<img
										src={formatOutputUrl}
										alt=""
										className="tool-preview-image"
									/>
									<p className="tool-caption">{formatOutputName}</p>
								</div>
							) : null}
						</div>
					</div>
				</article>
			</div>

			<article className="tool-card rounded-[1.7rem] p-5 sm:p-6">
				<SectionHeading
					icon={<Regex size={18} />}
					title="Regex DSL"
					description="Compose regular expressions using readable functions such as `and()`, `or()`, `not()`, and `repeat()`."
				/>

				<div className="tool-layout">
					<div className="tool-surface">
						<label className="tool-label">
							DSL input
							<textarea
								className="tool-textarea h-72"
								value={dsl}
								onChange={(event) => setDsl(event.target.value)}
							/>
						</label>
						<p className="tool-caption">
							Supported functions: `and`, `or`, `not`, `group`, `optional`,
							`zeroOrMore`, `oneOrMore`, `repeat`, `literal`, `startsWith`,
							`endsWith`, `digit`, `digits`, `word`, `whitespace`, `any`,
							`charIn`, `charRange`.
						</p>
					</div>

					<div className="tool-surface">
						<label className="tool-label">
							Test input
							<input
								className="tool-input"
								value={regexSample}
								onChange={(event) => setRegexSample(event.target.value)}
							/>
						</label>
						{regexError ? (
							<p className="tool-error">{regexError}</p>
						) : (
							<>
								<label className="tool-label mt-4">
									Generated regex
									<textarea
										className="tool-textarea h-32 font-mono"
										value={regexOutput}
										readOnly
									/>
								</label>
								<div className="mt-4 flex flex-wrap gap-3">
									<button
										type="button"
										className="tool-button"
										onClick={() => void copyText(regexOutput)}
									>
										<Copy size={16} />
										Copy regex
									</button>
									<p
										className={`tool-status ${regexMatches ? "text-[var(--palm)]" : ""}`}
									>
										{regexMatches
											? `"${regexSample}" matches the generated regex.`
											: `"${regexSample}" does not match the generated regex.`}
									</p>
								</div>
							</>
						)}
					</div>
				</div>
			</article>
		</section>
	);
}

function SectionHeading({
	description,
	icon,
	title,
}: {
	description: string;
	icon: ReactNode;
	title: string;
}) {
	return (
		<div className="mb-5 flex items-start justify-between gap-4">
			<div>
				<p className="island-kicker mb-2">Live tool</p>
				<h2 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--sea-ink)]">
					{title}
				</h2>
				<p className="m-0 max-w-2xl text-sm leading-6 text-[var(--sea-ink-soft)]">
					{description}
				</p>
			</div>
			<div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.65)] p-3 text-[var(--sea-ink)] shadow-[0_12px_24px_rgba(23,58,64,0.06)] dark:bg-[rgba(8,17,20,0.78)]">
				{icon}
			</div>
		</div>
	);
}

function EmptyState({ message }: { message: string }) {
	return <p className="tool-caption">{message}</p>;
}

function extensionFromMime(mime: string) {
	if (mime === "image/jpeg") {
		return "jpg";
	}

	if (mime === "image/svg+xml") {
		return "svg";
	}

	return mime.split("/")[1] || "bin";
}
