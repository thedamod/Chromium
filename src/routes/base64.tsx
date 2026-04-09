import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, Binary } from "lucide-react";
import {
	blobToDataUrl,
	dataUrlToBlob,
	downloadBlob,
	formatBytes,
	readFileAsDataUrl,
} from "../lib/tool-utils";

type ImageState = {
	dataUrl: string;
	filename: string;
	sizeLabel: string;
};

export const Route = createFileRoute("/base64")({
	component: Base64Page,
});

function Base64Page() {
	const [image, setImage] = useState<ImageState | null>(null);
	const [base64Input, setBase64Input] = useState("");
	const [decodedUrl, setDecodedUrl] = useState("");
	const [decodedName, setDecodedName] = useState("decoded-image");
	const [mimeHint, setMimeHint] = useState("image/png");
	const [error, setError] = useState("");
	const [decodedImage, setDecodedImage] = useState<ImageState | null>(null);

	async function handleUpload(file: File | null) {
		if (!file) return;

		try {
			const dataUrl = await readFileAsDataUrl(file);
			setImage({
				dataUrl,
				filename: file.name,
				sizeLabel: formatBytes(file.size),
			});
			setBase64Input(dataUrl);
			setError("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unable to read image");
		}
	}

	async function handleDecode() {
		try {
			const blob = await dataUrlToBlob(base64Input, mimeHint);
			const dataUrl = await blobToDataUrl(blob);
			setDecodedUrl(dataUrl);
			setDecodedName(`decoded.${extensionFromMime(blob.type || mimeHint)}`);
			setDecodedImage({
				dataUrl,
				filename: `decoded.${extensionFromMime(blob.type || mimeHint)}`,
				sizeLabel: formatBytes(blob.size),
			});
			setError("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Decode failed");
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
						<Binary size={24} />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-[var(--foreground)]">
							Image ↔ Base64
						</h1>
						<p className="text-[var(--muted-foreground)]">
							Encode and decode images to data URLs
						</p>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-xl border border-[var(--border)] p-5">
						<h2 className="mb-4 font-semibold text-[var(--foreground)]">
							Upload Image
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
						{image && (
							<div className="mt-4 space-y-3">
								<div className="flex justify-between text-sm text-[var(--muted-foreground)]">
									<span>{image.filename}</span>
									<span>{image.sizeLabel}</span>
								</div>
								<img
									src={image.dataUrl}
									alt=""
									className="max-h-48 rounded-lg object-contain"
								/>
							</div>
						)}
					</div>

					<div className="rounded-xl border border-[var(--border)] p-5">
						<h2 className="mb-4 font-semibold text-[var(--foreground)]">
							Base64 Output
						</h2>
						<textarea
							className="h-44 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] p-3 text-sm font-mono"
							value={base64Input}
							onChange={(e) => setBase64Input(e.target.value)}
							placeholder="Paste Base64 string or upload image"
						/>
						<div className="mt-4 flex flex-wrap gap-3">
							<button
								type="button"
								className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
								onClick={() => copyText(base64Input)}
								disabled={!base64Input}
							>
								<Copy size={16} /> Copy
							</button>
							<button
								type="button"
								className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--secondary)]"
								onClick={handleDecode}
								disabled={!base64Input}
							>
								<Download size={16} /> Decode to Image
							</button>
						</div>

						<div className="mt-4">
							<label className="block text-sm font-medium text-[var(--foreground)]">
								MIME Type
								<select
									className="mt-1 block w-full rounded-lg border border-[var(--input)] bg-[var(--background)] p-2"
									value={mimeHint}
									onChange={(e) => setMimeHint(e.target.value)}
								>
									<option value="image/png">PNG</option>
									<option value="image/jpeg">JPEG</option>
									<option value="image/webp">WebP</option>
									<option value="image/gif">GIF</option>
								</select>
							</label>
						</div>

						{error && (
							<p className="mt-4 text-sm text-[var(--destructive)]">{error}</p>
						)}

						{decodedImage && (
							<div className="mt-4 space-y-3">
								<div className="flex justify-between text-sm text-[var(--muted-foreground)]">
									<span>{decodedImage.filename}</span>
									<span>{decodedImage.sizeLabel}</span>
								</div>
								<img
									src={decodedImage.dataUrl}
									alt=""
									className="max-h-48 rounded-lg object-contain"
								/>
								<a
									href={decodedUrl}
									download={decodedName}
									className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
								>
									<Download size={16} /> Download
								</a>
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
