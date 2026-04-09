import { createFileRoute } from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import HomeLink from "#/components/HomeLink";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Slider } from "#/components/ui/slider";
import { formatBytes } from "../lib/tool-utils";

type ImageState = {
	file: File;
	dataUrl: string;
	filename: string;
	size: number;
	sizeLabel: string;
};

export const Route = createFileRoute("/compressor")({
	component: CompressorPage,
});

function CompressorPage() {
	const [source, setSource] = useState<ImageState | null>(null);
	const [output, setOutput] = useState<ImageState | null>(null);

	const [maxSizeMB, setMaxSizeMB] = useState(1);
	const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);

	const [status, setStatus] = useState("Ready");
	const [error, setError] = useState("");
	const [isCompressing, setIsCompressing] = useState(false);

	async function handleUpload(file: File | null) {
		if (!file) return;

		try {
			const dataUrl = await readFileUrl(file);
			setSource({
				file,
				dataUrl,
				filename: file.name,
				size: file.size,
				sizeLabel: formatBytes(file.size),
			});
			setOutput(null);
			setStatus("Ready");
			setError("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unable to read image.");
		}
	}

	async function handleCompress() {
		if (!source) {
			setError("Upload an image first.");
			return;
		}

		setIsCompressing(true);
		setStatus("Compressing...");
		setError("");

		try {
			const options = {
				maxSizeMB: maxSizeMB,
				maxWidthOrHeight: maxWidthOrHeight,
				useWebWorker: true,
			};

			const compressedFile = await imageCompression(source.file, options);
			const dataUrl = await readFileUrl(compressedFile);

			setOutput({
				file: compressedFile,
				dataUrl,
				filename: `compressed_${source.filename}`,
				size: compressedFile.size,
				sizeLabel: formatBytes(compressedFile.size),
			});

			const ratio = ((1 - compressedFile.size / source.size) * 100).toFixed(1);
			setStatus(`Compressed. Saved ${ratio}%`);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Compression failed.");
		} finally {
			setIsCompressing(false);
		}
	}

	function readFileUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	return (
		<main className="p-4 flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
			<div className="w-full max-w-4xl flex flex-col gap-6">
				<HomeLink />
				<Card className="w-full border-0 shadow-none bg-transparent">
				<CardContent className="flex flex-col gap-8 p-0">
					<div className="grid gap-6 md:grid-cols-2 bg-muted/5 p-6 rounded-xl border border-border">
						<div className="flex flex-col gap-6">
							<div className="flex flex-col gap-2">
								<Label htmlFor="image-upload" className="font-medium">
									Source Image
								</Label>
								<Input
									id="image-upload"
									type="file"
									accept="image/*"
									onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
									className="cursor-pointer"
								/>
							</div>

							<div className="flex flex-col gap-2">
								<div className="flex flex-wrap items-center gap-2">
									<Button
										onClick={handleCompress}
										disabled={!source || isCompressing}
									>
										{isCompressing ? "Compressing..." : "Compress Image"}
									</Button>
									{output && (
										<Button variant="secondary" asChild>
											<a href={output.dataUrl} download={output.filename}>
												Download
											</a>
										</Button>
									)}
									<span className="text-xs text-muted-foreground ml-2">
										{status}
									</span>
								</div>

								{error && <p className="text-sm text-destructive">{error}</p>}
							</div>
						</div>

						<div className="flex flex-col gap-6">
							<div className="flex flex-col gap-3">
								<div className="flex justify-between items-center text-sm">
									<Label htmlFor="max-size-slider">Max Size (MB)</Label>
									<span className="tabular-nums font-mono text-muted-foreground">
										{maxSizeMB.toFixed(2)} MB
									</span>
								</div>
								<Slider
									id="max-size-slider"
									min={0.1}
									max={10}
									step={0.1}
									value={[maxSizeMB]}
									onValueChange={(val) => setMaxSizeMB(val[0])}
									className="pt-2"
								/>
							</div>

							<div className="flex flex-col gap-3">
								<div className="flex justify-between items-center text-sm">
									<Label htmlFor="max-dim-slider">Max Width / Height</Label>
									<span className="tabular-nums font-mono text-muted-foreground">
										{maxWidthOrHeight} px
									</span>
								</div>
								<Slider
									id="max-dim-slider"
									min={100}
									max={4000}
									step={100}
									value={[maxWidthOrHeight]}
									onValueChange={(val) => setMaxWidthOrHeight(val[0])}
									className="pt-2"
								/>
							</div>
						</div>
					</div>

					{(source || output) && (
						<div className="grid gap-6 md:grid-cols-2">
							{source ? (
								<div className="flex flex-col gap-2">
									<div className="flex justify-between text-xs text-muted-foreground opacity-70 px-1">
										<span className="truncate max-w-[200px]">
											{source.filename}
										</span>
										<span>{source.sizeLabel}</span>
									</div>
									<div className="aspect-video w-full rounded-md border bg-muted/20 flex items-center justify-center p-2">
										<img
											src={source.dataUrl}
											alt="Source Preview"
											className="max-h-full max-w-full object-contain"
										/>
									</div>
								</div>
							) : (
								<div />
							)}

							{output ? (
								<div className="flex flex-col gap-2">
									<div className="flex justify-between text-xs text-emerald-500/80 px-1">
										<span className="truncate max-w-[200px]">
											{output.filename}
										</span>
										<span className="font-bold">{output.sizeLabel}</span>
									</div>
									<div className="aspect-video w-full rounded-md border bg-primary/5 flex items-center justify-center p-2">
										<img
											src={output.dataUrl}
											alt="Output Preview"
											className="max-h-full max-w-full object-contain"
										/>
									</div>
								</div>
							) : (
								<div />
							)}
						</div>
					)}
				</CardContent>
				</Card>
			</div>
		</main>
	);
}
