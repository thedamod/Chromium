import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import HomeLink from "#/components/HomeLink";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
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
	const [error, setError] = useState("");

	async function handleUpload(file: File | null) {
		if (!file) return;

		try {
			const dataUrl = await readFileAsDataUrl(file);
			// Process using the pure utility structure; since it uses DOM (Canvas),
			// it runs safely on the main thread
			const icoBlob = await createIcoBlobFromDataUrl(dataUrl);
			setSource({
				dataUrl,
				filename: file.name,
				sizeLabel: formatBytes(file.size),
			});
			setIcoReady(icoBlob);
			setError("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Conversion failed.");
		}
	}

	return (
		<main className="flex items-center justify-center p-4 min-h-screen bg-background text-foreground">
			<div className="w-full max-w-sm flex flex-col gap-6">
				<HomeLink />
				<Card className="w-full border-0 shadow-none bg-transparent">
				<CardContent className="flex flex-col gap-6 p-0">
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

					{source && (
						<div className="flex flex-col gap-2">
							<div className="flex justify-between text-xs text-muted-foreground opacity-70">
								<span className="truncate max-w-[200px]">
									{source.filename}
								</span>
								<span>{source.sizeLabel}</span>
							</div>
							<img
								src={source.dataUrl}
								alt="Preview"
								className="max-h-48 w-full object-contain rounded-md border bg-muted/20"
							/>
						</div>
					)}

					{error && <p className="text-sm text-destructive">{error}</p>}

					{icoReady && source && (
						<Button
							className="w-full"
							onClick={() => {
								downloadBlob(
									icoReady,
									`${fileNameWithoutExtension(source.filename)}.ico`,
								);
							}}
						>
							Download ICO
						</Button>
					)}
				</CardContent>
				</Card>
			</div>
		</main>
	);
}
