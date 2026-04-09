import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Regex } from "lucide-react";
import { compileRegexDsl } from "../lib/tool-utils";

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

	let regexOutput = "";
	let regexError = "";
	let matches = false;

	try {
		regexOutput = compileRegexDsl(dsl);
		matches = new RegExp(regexOutput).test(sample);
	} catch (e) {
		regexError =
			e instanceof Error ? e.message : "The DSL could not be compiled.";
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
						<Regex size={24} />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-[var(--foreground)]">
							Regex DSL
						</h1>
						<p className="text-[var(--muted-foreground)]">
							Build regex patterns from readable functions
						</p>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-xl border border-[var(--border)] p-5">
						<h2 className="mb-4 font-semibold text-[var(--foreground)]">
							DSL Input
						</h2>
						<textarea
							className="h-72 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] p-3 text-sm font-mono"
							value={dsl}
							onChange={(e) => setDsl(e.target.value)}
						/>
						<p className="mt-3 text-sm text-[var(--muted-foreground)]">
							Supported functions: and, or, not, group, optional, zeroOrMore,
							oneOrMore, repeat, literal, startsWith, endsWith, digit, digits,
							word, whitespace, any, charIn, charRange.
						</p>
					</div>

					<div className="rounded-xl border border-[var(--border)] p-5">
						<h2 className="mb-4 font-semibold text-[var(--foreground)]">
							Test & Output
						</h2>

						<div className="mb-4">
							<label className="block text-sm font-medium text-[var(--foreground)]">
								Test Input
								<input
									className="mt-1 block w-full rounded-lg border border-[var(--input)] bg-[var(--background)] p-2"
									value={sample}
									onChange={(e) => setSample(e.target.value)}
								/>
							</label>
						</div>

						{regexError ? (
							<p className="text-sm text-[var(--destructive)]">{regexError}</p>
						) : (
							<>
								<div>
									<label className="block text-sm font-medium text-[var(--foreground)]">
										Generated Regex
										<textarea
											className="mt-1 h-32 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] p-3 font-mono text-sm"
											value={regexOutput}
											readOnly
										/>
									</label>
								</div>

								<div className="mt-4 flex items-center gap-3">
									<button
										type="button"
										className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--secondary)]"
										onClick={() => copyText(regexOutput)}
									>
										<Copy size={16} /> Copy
									</button>
									<span
										className={`text-sm ${matches ? "text-[var(--success)]" : "text-[var(--destructive)]"}`}
									>
										{matches
											? `"${sample}" matches`
											: `"${sample}" does not match`}
									</span>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
