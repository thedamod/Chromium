import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileImage } from "lucide-react";
import {
	blobToDataUrl,
	createIcoBlobFromDataUrl,
	downloadBlob,
	fileNameWithoutExtension,
	formatBytes,
	readFileAsDataUrl,
} from "../lib/tool-utils";

type ImageState = {
	dataUrl: string;
	filename: string;
	sizeLabel: string;
};

export const Route = createFileRoute("/ico")({
	component: IcoPage,
});

function IcoPage() {
	const [source, setSource] = useState<ImageState | null>(null);
	const [icoReady, setIcoReady] = useState<Blob | null>(null);
	const [status, setStatus] = useState(
		"Upload a source image to generate a favicon-ready ICO file.",
	);
	const [error, setError] = useState("");

	async function handleUpload(file: File | null) {
		if (!file) return;

		try {
			const dataUrl = await readFileAsDataUrl(file);
			const icoBlob = await createIcoBlobFromDataUrl(dataUrl);
			setSource({
				dataUrl,
				filename: file.name,
				sizeLabel: formatBytes(file.size),
			});
			setIcoReady(icoBlob);
			setStatus(`ICO ready at 256x256 from ${file.name}.`);
			setError("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "ICO conversion failed.");
		}
	}

	return (
		<main className="page-wrap px-4 py-8">
			<div className="mx-auto max-w-2xl">
				<div className="mb-8 flex items-center gap-4">
					<div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
						<FileImage size={24} />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-[var(--foreground)]">
							Image to ICO
						</h1>
						<p className="text-[var(--muted-foreground)]">
							Convert images to ICO format for favicons
						</p>
					</div>
				</div>

				<div className="rounded-xl border border-[var(--border)] p-6">
					<h2 className="mb-4 font-semibold text-[var(--foreground)]">
						Upload Source Image
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

					<div className="mt-6">
						<p className="text-sm text-[var(--muted-foreground)]">{status}</p>
						<p className="mt-2 text-sm text-[var(--muted-foreground)]">
							This exporter wraps a 256x256 PNG payload inside an ICO container,
							which works well for modern favicon and desktop icon use cases.
						</p>
					</div>

					{error && (
						<p className="mt-4 text-sm text-[var(--destructive)]">{error}</p>
					)}

					{icoReady && source && (
						<button
							type="button"
							className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
							onClick={() => {
								if (icoReady && source) {
									downloadBlob(
										icoReady,
										`${fileNameWithoutExtension(source.filename)}.ico`,
									);
								}
							}}
						>
							<Download size={16} /> Download ICO
						</button>
					)}
				</div>
			</div>
		</main>
	);
}
