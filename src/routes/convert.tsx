import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import HomeLink from "#/components/HomeLink";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Slider } from "#/components/ui/slider";
import {
	blobToDataUrl,
	canvasToBlob,
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
	const [status, setStatus] = useState("Ready");
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
			setOutputUrl("");
			setOutputName("");
			setStatus("Ready");
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
			setStatus(`Converted ${canvas.width}x${canvas.height}`);
			setError("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Image conversion failed.");
		}
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
									<Button onClick={handleConvert}>ConvertImage</Button>
									{outputUrl && (
										<Button variant="secondary" asChild>
											<a href={outputUrl} download={outputName}>
												Download {extensionFromMime(targetFormat).toUpperCase()}
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
							<div className="flex flex-col gap-2">
								<Label htmlFor="target-format" className="font-medium">
									Target Format
								</Label>
								<Select value={targetFormat} onValueChange={setTargetFormat}>
									<SelectTrigger id="target-format">
										<SelectValue placeholder="Select target format" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="image/png">PNG</SelectItem>
										<SelectItem value="image/jpeg">JPEG</SelectItem>
										<SelectItem value="image/webp">WebP</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{targetFormat !== "image/png" && (
								<div className="flex flex-col gap-3">
									<div className="flex justify-between items-center text-sm">
										<Label htmlFor="quality-slider">Quality</Label>
										<span className="tabular-nums font-mono text-muted-foreground">
											{Math.round(quality * 100)}%
										</span>
									</div>
									<Slider
										id="quality-slider"
										min={0.4}
										max={1}
										step={0.02}
										value={[quality]}
										onValueChange={(val) => setQuality(val[0])}
										className="pt-2"
									/>
								</div>
							)}
						</div>
					</div>

					{(source || outputUrl) && (
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

							{outputUrl ? (
								<div className="flex flex-col gap-2">
									<div className="flex justify-between text-xs text-muted-foreground opacity-70 px-1">
										<span className="truncate max-w-[200px]">{outputName}</span>
									</div>
									<div className="aspect-video w-full rounded-md border bg-primary/5 flex items-center justify-center p-2">
										<img
											src={outputUrl}
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

function extensionFromMime(mime: string) {
	if (mime === "image/jpeg") return "jpg";
	if (mime === "image/svg+xml") return "svg";
	return mime.split("/")[1] || "bin";
}
