import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export type ExportFormat = 'TXT' | 'PDF' | 'DOCX' | 'EPUB';

interface ExportOptions {
  title: string;
  content: string;
  author?: string;
}

export class ExportService {
  static async exportDocument(format: ExportFormat, options: ExportOptions) {
    const { title, content, author } = options;

    switch (format) {
      case 'TXT':
        return this.exportTXT(title, content);
      case 'PDF':
        return this.exportPDF(title, content, author);
      case 'DOCX':
        return this.exportDOCX(title, content, author);
      case 'EPUB':
        return this.exportEPUB(title, content, author);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private static exportTXT(title: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title}.txt`);
  }

  private static exportPDF(title: string, content: string, author?: string) {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 20);

    // Add author if provided
    if (author) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`By ${author}`, 20, 30);
    }

    // Add content
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const startY = author ? 40 : 30;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margins = 20;
    const maxWidth = pageWidth - (margins * 2);

    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(content, maxWidth);

    // Add lines with pagination
    let y = startY;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.getHeight();

    lines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margins) {
        doc.addPage();
        y = margins;
      }
      doc.text(line, margins, y);
      y += lineHeight;
    });

    doc.save(`${title}.pdf`);
  }

  private static async exportDOCX(title: string, content: string, author?: string) {
    const paragraphs: Paragraph[] = [];

    // Add title
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
      })
    );

    // Add author
    if (author) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `By ${author}`,
              italics: true,
            }),
          ],
        })
      );
      paragraphs.push(new Paragraph({ text: '' })); // Empty line
    }

    // Split content by paragraphs and process markdown-like formatting
    const contentParagraphs = content.split('\n\n');

    contentParagraphs.forEach(para => {
      const trimmed = para.trim();
      if (!trimmed) return;

      // Check for markdown headers
      if (trimmed.startsWith('# ')) {
        paragraphs.push(
          new Paragraph({
            text: trimmed.substring(2),
            heading: HeadingLevel.HEADING_1,
          })
        );
      } else if (trimmed.startsWith('## ')) {
        paragraphs.push(
          new Paragraph({
            text: trimmed.substring(3),
            heading: HeadingLevel.HEADING_2,
          })
        );
      } else if (trimmed.startsWith('### ')) {
        paragraphs.push(
          new Paragraph({
            text: trimmed.substring(4),
            heading: HeadingLevel.HEADING_3,
          })
        );
      } else {
        // Process bold and italic
        const textRuns: TextRun[] = [];
        let currentText = trimmed;

        // Simple bold/italic parsing (simplified - doesn't handle nested)
        const boldRegex = /\*\*(.*?)\*\*/g;
        const italicRegex = /\*(.*?)\*/g;

        // For simplicity, just add as normal text
        paragraphs.push(
          new Paragraph({
            text: currentText,
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title}.docx`);
  }

  private static exportEPUB(title: string, content: string, author?: string) {
    // EPUB is a zipped XML format. For a full implementation, we'd need a library like epub-gen
    // For now, we'll create a simple HTML export as a placeholder

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: Georgia, serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      font-size: 2em;
      margin-bottom: 0.5em;
    }
    .author {
      font-style: italic;
      color: #666;
      margin-bottom: 2em;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${author ? `<p class="author">By ${author}</p>` : ''}
  <div>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'application/epub+zip' });
    saveAs(blob, `${title}.epub`);
  }
}
