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

// Convert Markdown while preserving links
const plainTextContent = marked.parse(markdownContent, { gfm: true, breaks: true });

async function createPdfLibPDF(content, outputPath) {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([600, 800]);
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const { width, height } = page.getSize();

	let y = height - 50;
	const fontSize = 12;
	const margin = 50;
	const maxWidth = width - 2 * margin;

	const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
	let match;
	let lastIndex = 0;

	while ((match = linkRegex.exec(content)) !== null) {
		const textBeforeLink = content.substring(lastIndex, match.index);
		const linkText = match[1];
		const linkUrl = match[2];

		// Draw the text before the link
		page.drawText(textBeforeLink, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0), maxWidth });

		// Calculate the text width to place the link correctly
		const textWidth = font.widthOfTextAtSize(textBeforeLink, fontSize);

		// Draw the hyperlink
		const linkX = margin + textWidth;
		const linkWidth = font.widthOfTextAtSize(linkText, fontSize);
		page.drawText(linkText, { x: linkX, y, size: fontSize, font, color: rgb(0, 0, 1) });

		// Add an annotation for the link
		page.doc.addAnnotation({
			type: 'link',
			x: linkX,
			y: y - fontSize,
			width: linkWidth,
			height: fontSize,
			url: linkUrl,
		});

		lastIndex = match.index + match[0].length;
		y -= fontSize * 1.5; // Move to the next line
	}

	// Draw remaining text after the last link
	if (lastIndex < content.length) {
		page.drawText(content.substring(lastIndex), { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0), maxWidth });
	}

	const pdfBytes = await pdfDoc.save();
	await writeFile(outputPath, pdfBytes);

	console.log(`✅ pdf-lib PDF saved as: ${outputPath}`);
}

// Run the updated PDF generation
(async () => {
	await createPdfLibPDF(plainTextContent, 'output_pdf-lib-with-links.pdf');
})();
