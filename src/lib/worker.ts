/// <reference lib="webworker" />

import {
	buildPdfFromMarkdown,
	compileRegexDsl,
	createIcoBlobFromDataUrl,
} from "./tool-utils";

self.addEventListener("message", async (event) => {
	const { type, payload, id } = event.data;

	try {
		let result: any;

		switch (type) {
			case "BUILD_PDF":
				result = buildPdfFromMarkdown(payload);
				break;
			case "CREATE_ICO":
				result = await createIcoBlobFromDataUrl(payload);
				break;
			case "COMPILE_REGEX": {
				const regexOutput = compileRegexDsl(payload.dsl);
				const matches = new RegExp(regexOutput).test(payload.sample);
				result = { regexOutput, matches };
				break;
			}
			default:
				throw new Error("Unknown worker task type");
		}

		self.postMessage({ id, result });
	} catch (error) {
		self.postMessage({
			id,
			error: error instanceof Error ? error.message : "Worker error",
		});
	}
});
