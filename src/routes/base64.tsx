import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import HomeLink from "#/components/HomeLink";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
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
		<main className="p-4 flex items-center justify-center min-h-screen bg-background text-foreground">
			<div className="w-full max-w-4xl flex flex-col gap-6">
				<HomeLink />
				<Card className="w-full border-0 shadow-none bg-transparent">
				<CardContent className="grid gap-6 lg:grid-cols-2 p-0">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-2">
							<Label htmlFor="image-upload" className="font-medium">
								Upload Image
							</Label>
							<Input
								id="image-upload"
								type="file"
								accept="image/*"
								onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
							/>
						</div>
						{image && (
							<div className="flex flex-col gap-2">
								<div className="flex justify-between text-xs text-muted-foreground opacity-70">
									<span className="truncate max-w-[200px]">
										{image.filename}
									</span>
									<span>{image.sizeLabel}</span>
								</div>
								<img
									src={image.dataUrl}
									alt="Source"
									className="max-h-64 object-contain rounded-md border bg-muted/20 w-full"
								/>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-6">
						<Textarea
							className="h-44 w-full font-mono text-sm resize-none border-input"
							value={base64Input}
							onChange={(e) => setBase64Input(e.target.value)}
							placeholder="Paste Base64 string or upload image..."
						/>

						<div className="flex flex-col gap-2">
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="default"
									onClick={() => copyText(base64Input)}
									disabled={!base64Input}
								>
									Copy Base64
								</Button>
								<Button
									variant="outline"
									onClick={handleDecode}
									disabled={!base64Input}
								>
									Decode
								</Button>
							</div>

							<div className="flex flex-col gap-2 mt-4">
								<Label htmlFor="mime-hint" className="font-medium">
									MIME Type Hint
								</Label>
								<Select value={mimeHint} onValueChange={setMimeHint}>
									<SelectTrigger id="mime-hint">
										<SelectValue placeholder="Select MIME Type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="image/png">PNG</SelectItem>
										<SelectItem value="image/jpeg">JPEG</SelectItem>
										<SelectItem value="image/webp">WebP</SelectItem>
										<SelectItem value="image/gif">GIF</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{error && (
								<p className="text-sm text-destructive mt-2">{error}</p>
							)}
						</div>

						{decodedImage && (
							<div className="flex flex-col gap-2 mt-auto">
								<div className="flex justify-between items-center text-xs text-muted-foreground opacity-70">
									<span className="truncate max-w-[200px]">
										{decodedImage.filename}
									</span>
									<a
										href={decodedUrl}
										download={decodedName}
										className="text-foreground hover:underline"
									>
										Download
									</a>
								</div>
								<img
									src={decodedImage.dataUrl}
									alt="Decoded output"
									className="max-h-64 object-contain rounded-md border bg-muted/20 w-full"
								/>
							</div>
						)}
					</div>
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
