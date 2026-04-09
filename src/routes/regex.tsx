import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import HomeLink from "#/components/HomeLink";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";

const defaultDsl = `and(
  startsWith("user_"),
  repeat(charRange("a", "z"), 3, 12),
  optional(and("-", digits())),
  endsWith("")
)`;

export const Route = createFileRoute("/regex")({
	component: RegexPage,
});

function RegexPage() {
	const [dsl, setDsl] = useState(defaultDsl);
	const [sample, setSample] = useState("user_delta-42");

	const [regexOutput, setRegexOutput] = useState("");
	const [regexError, setRegexError] = useState("");
	const [matches, setMatches] = useState(false);
	const workerRef = useRef<Worker | null>(null);

	function getWorker() {
		if (!workerRef.current) {
			workerRef.current = new Worker(
				new URL("../lib/worker.ts", import.meta.url),
				{ type: "module" },
			);
		}
		return workerRef.current;
	}

	useEffect(() => {
		const worker = getWorker();
		worker.onmessage = (e) => {
			if (e.data.error) {
				setRegexError(e.data.error);
			} else {
				setRegexError("");
				setRegexOutput(e.data.result.regexOutput);
				setMatches(e.data.result.matches);
			}
		};
		worker.postMessage({ type: "COMPILE_REGEX", payload: { dsl, sample } });
	}, [dsl, sample]);

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
					<div className="flex flex-col gap-4">
						<Label className="sr-only">DSL Input</Label>
						<Textarea
							className="min-h-[60vh] w-full font-mono text-sm resize-none border-input"
							value={dsl}
							onChange={(e) => setDsl(e.target.value)}
							placeholder="Type your regex DSL here..."
						/>
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Input
								placeholder="Test Input"
								value={sample}
								onChange={(e) => setSample(e.target.value)}
								className="border-input"
							/>
						</div>

						{regexError ? (
							<p className="text-sm text-destructive min-h-[50vh] p-4 border border-destructive/20 bg-destructive/10 rounded">
								{regexError}
							</p>
						) : (
							<div className="flex flex-col gap-4">
								<Textarea
									className="min-h-[50vh] w-full font-mono text-sm resize-none border-input"
									value={regexOutput}
									readOnly
								/>
								<div className="flex items-center gap-3">
									<Button
										variant="outline"
										onClick={() => copyText(regexOutput)}
									>
										Copy Regex
									</Button>
									<span
										className={`text-sm tracking-tight ${matches ? "text-foreground font-semibold" : "text-muted-foreground"}`}
									>
										{matches
											? `Matches "${sample}"`
											: `No match for "${sample}"`}
									</span>
								</div>
							</div>
						)}
					</div>
				</CardContent>
				</Card>
			</div>
		</main>
	);
}
