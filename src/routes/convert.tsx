import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, WandSparkles, ImageUpscale } from "lucide-react";
import {
	blobToDataUrl,
	canvasToBlob,
	downloadBlob,
	fileNameWithoutExtension,
	formatBytes,
	loadImageElement,
	readFileAsDataUrl,
} from "../lib/tool-utils";

type ImageState = {
	dataUrl: string;
	filename: string;
	sizeLabel: string;
};

export const Route = createFileRoute("/convert")({
	component: ConvertPage,
});

function ConvertPage() {
	const [source, setSource] = useState<ImageState | null>(null);
	const [targetFormat, setTargetFormat] = useState("image/png");
	const [quality, setQuality] = useState(0.92);
	const [outputUrl, setOutputUrl] = useState("");
	const [outputName, setOutputName] = useState("");
	const [status, setStatus] = useState(
		"Choose a source image and target format.",
	);
	const [error, setError] = useState("");

	async function handleUpload(file: File | null) {
		if (!file) return;

		try {
			const dataUrl = await readFileAsDataUrl(file);
			setSource({
				dataUrl,
				filename: file.name,
				sizeLabel: formatBytes(file.size),
			});
			setError("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unable to read image.");
		}
	}

	async function handleConvert() {
		if (!source) {
			setError("Upload an image before converting it.");
			return;
		}

		try {
			const image = await loadImageElement(source.dataUrl);
			const canvas = document.createElement("canvas");
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext("2d");

			if (!context) {
				throw new Error("2D canvas context is unavailable.");
			}

			if (targetFormat === "image/jpeg") {
				context.fillStyle = "#ffffff";
				context.fillRect(0, 0, canvas.width, canvas.height);
			}

			context.drawImage(image, 0, 0);
			const blob = await canvasToBlob(
				canvas,
				targetFormat,
				targetFormat === "image/png" ? undefined : quality,
			);
			const dataUrl = await blobToDataUrl(blob);
			const extension = extensionFromMime(targetFormat);

			setOutputUrl(dataUrl);
			setOutputName(
				`${fileNameWithoutExtension(source.filename)}.${extension}`,
			);
			setStatus(
				`Converted ${source.filename} to ${extension.toUpperCase()} at ${canvas.width}x${canvas.height}.`,
			);
			setError("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Image conversion failed.");
		}
	}

	return (
		<main className="page-wrap px-4 py-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8 flex items-center gap-4">
					<div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
						<ImageUpscale size={24} />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-[var(--foreground)]">
							Image Converter
						</h1>
						<p className="text-[var(--muted-foreground)]">
							Convert between PNG, JPEG, and WebP formats
						</p>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-xl border border-[var(--border)] p-5">
						<h2 className="mb-4 font-semibold text-[var(--foreground)]">
							Source Image
						</h2>
						<label className="block">
							<span className="sr-only">Choose image</span>
							<input
								type="file"
								accept="image/*"
								className="block w-full rounded-lg border border-[var(--input)] bg-[var(--background)] p-2 text-sm"
								onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
							/>
						</label>
						{source && (
							<div className="mt-4 space-y-3">
								<div className="flex justify-between text-sm text-[var(--muted-foreground)]">
									<span>{source.filename}</span>
									<span>{source.sizeLabel}</span>
								</div>
								<img
									src={source.dataUrl}
									alt=""
									className="max-h-48 rounded-lg object-contain"
								/>
							</div>
						)}
					</div>

					<div className="rounded-xl border border-[var(--border)] p-5">
						<h2 className="mb-4 font-semibold text-[var(--foreground)]">
							Conversion Settings
						</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-[var(--foreground)]">
									Target Format
									<select
										className="mt-1 block w-full rounded-lg border border-[var(--input)] bg-[var(--background)] p-2"
										value={targetFormat}
										onChange={(e) => setTargetFormat(e.target.value)}
									>
										<option value="image/png">PNG</option>
										<option value="image/jpeg">JPEG</option>
										<option value="image/webp">WebP</option>
									</select>
								</label>
							</div>
							{targetFormat !== "image/png" && (
								<div>
									<label className="block text-sm font-medium text-[var(--foreground)]">
										Quality: {Math.round(quality * 100)}%
										<input
											type="range"
											className="mt-1 block w-full"
											min="0.4"
											max="1"
											step="0.02"
											value={quality}
											onChange={(e) => setQuality(Number(e.target.value))}
										/>
									</label>
								</div>
							)}
						</div>

						<div className="mt-6 flex flex-wrap gap-3">
							<button
								type="button"
								className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
								onClick={handleConvert}
							>
								<WandSparkles size={16} /> Convert
							</button>
							{outputUrl && (
								<a
									href={outputUrl}
									download={outputName}
									className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--secondary)]"
								>
									<Download size={16} /> Download
								</a>
							)}
						</div>

						<p className="mt-3 text-sm text-[var(--muted-foreground)]">
							{status}
						</p>
						{error && (
							<p className="mt-3 text-sm text-[var(--destructive)]">{error}</p>
						)}

						{outputUrl && (
							<div className="mt-4 space-y-3">
								<div className="flex justify-between text-sm text-[var(--muted-foreground)]">
									<span>{outputName}</span>
								</div>
								<img
									src={outputUrl}
									alt=""
									className="max-h-48 rounded-lg object-contain"
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}

function extensionFromMime(mime: string) {
	if (mime === "image/jpeg") return "jpg";
	if (mime === "image/svg+xml") return "svg";
	return mime.split("/")[1] || "bin";
}
