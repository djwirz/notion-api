import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { marked } from 'marked';
import { writeFile } from 'fs/promises';

const markdownContent = `
# Markdown to PDF Test

This is a **bold** statement.

- Item 1
- Item 2
- Item 3

> A sample blockquote.

[Google](https://www.google.com)
`;

const plainTextContent = marked.parse(markdownContent, { gfm: true, breaks: true }).replace(/<\/?[^>]+(>|$)/g, '');

// === Option 1: Using `pdf-lib` (Cloudflare-compatible) ===
async function createPdfLibPDF(content, outputPath) {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([600, 800]);
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

	const { width, height } = page.getSize();
	const fontSize = 12;
	const margin = 50;

	page.drawText(content, {
		x: margin,
		y: height - margin,
		size: fontSize,
		font: font,
		color: rgb(0, 0, 0),
		lineHeight: 20,
		maxWidth: width - 2 * margin,
	});

	const pdfBytes = await pdfDoc.save();
	await writeFile(outputPath, pdfBytes);

	console.log(`✅ pdf-lib PDF saved as: ${outputPath}`);
}

// === Option 2: Using a WebAssembly-based solution (Simulating WASM-PDF) ===
// This is a placeholder for now; you’ll need a real WASM-based Markdown-to-PDF library.
async function createWasmPDF(content, outputPath) {
	// Simulated WASM conversion (since Cloudflare supports WASM execution)
	const wasmGeneratedContent = `WASM-PDF simulated output: \n\n${content}`;

	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([600, 800]);
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

	page.drawText(wasmGeneratedContent, {
		x: 50,
		y: 750,
		size: 12,
		font,
		color: rgb(0, 0, 0),
	});

	const pdfBytes = await pdfDoc.save();
	await writeFile(outputPath, pdfBytes);

	console.log(`✅ WASM-PDF simulated output saved as: ${outputPath}`);
}

// === Run Both Tests ===
(async () => {
	await createPdfLibPDF(plainTextContent, 'output_pdf-lib.pdf');
	await createWasmPDF(plainTextContent, 'output_wasm.pdf');
})();
