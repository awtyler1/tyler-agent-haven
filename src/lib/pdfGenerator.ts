/**
 * TIG Platform PDF Generator Library
 *
 * Centralized PDF generation with consistent branding, typography, and layout.
 * Uses pdf-lib for browser-side generation.
 *
 * @example
 * import { createDocument, drawHeader, drawParagraph, finalize } from '@/lib/pdfGenerator';
 *
 * const doc = await createDocument();
 * const page = doc.addPage();
 * await drawHeader(page, doc, 'My Report');
 * drawParagraph(page, doc, 'Content here...', 700);
 * const pdfBytes = await finalize(doc);
 */

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, RGB } from 'pdf-lib';

// =============================================================================
// BRAND CONSTANTS
// =============================================================================

/** Brand color palette for PDF documents */
export const PDF_COLORS = {
  // Primary brand colors
  gold: rgb(0.62, 0.49, 0.18),           // #9E7D2E - Brand gold
  goldLight: rgb(0.96, 0.94, 0.90),      // #F5F0E5 - Light gold tint
  goldDark: rgb(0.48, 0.38, 0.14),       // #7A6123 - Dark gold

  // Blues
  primary: rgb(0.08, 0.44, 0.94),        // #1570EF - Interactive blue
  primaryLight: rgb(0.91, 0.95, 1),      // #E8F1FF - Light blue tint

  // Neutrals
  charcoal: rgb(0.18, 0.18, 0.18),       // #2E2E2E - Primary text
  darkGray: rgb(0.29, 0.29, 0.29),       // #4A4A4A - Secondary text
  mediumGray: rgb(0.42, 0.42, 0.42),     // #6B6B6B - Tertiary text
  lightGray: rgb(0.91, 0.91, 0.91),      // #E8E8E8 - Borders
  offWhite: rgb(0.98, 0.98, 0.97),       // #FAFAF8 - Backgrounds
  white: rgb(1, 1, 1),                    // #FFFFFF

  // Semantic colors
  success: rgb(0.13, 0.59, 0.33),        // #229954 - Green
  warning: rgb(0.90, 0.58, 0.15),        // #E69426 - Orange
  error: rgb(0.86, 0.21, 0.27),          // #DB3545 - Red
} as const;

/** Page dimensions and spacing */
export const PDF_LAYOUT = {
  // Page size (Letter)
  pageWidth: 612,
  pageHeight: 792,

  // Margins
  marginLarge: 50,
  marginMedium: 36,
  marginSmall: 24,

  // Content area (with large margin)
  contentWidth: 512,  // 612 - 50*2
  contentLeft: 50,
  contentRight: 562,

  // Spacing
  lineHeight: 1.4,
  paragraphSpacing: 16,
  sectionSpacing: 32,

  // Header/Footer
  headerHeight: 80,
  footerHeight: 40,
} as const;

/** Typography settings */
export const PDF_TYPOGRAPHY = {
  // Font sizes
  title: 28,
  h1: 22,
  h2: 18,
  h3: 14,
  body: 11,
  small: 9,
  tiny: 8,

  // Line heights (multipliers)
  titleLineHeight: 1.2,
  headingLineHeight: 1.3,
  bodyLineHeight: 1.5,
} as const;

// =============================================================================
// TYPES
// =============================================================================

export interface PDFDocumentBundle {
  doc: PDFDocument;
  fonts: {
    regular: PDFFont;
    bold: PDFFont;
    italic: PDFFont;
  };
}

export interface DrawTextOptions {
  color?: RGB;
  size?: number;
  font?: PDFFont;
  maxWidth?: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableColumn {
  header: string;
  key: string;
  width: number;  // Percentage (0-100)
  align?: 'left' | 'center' | 'right';
}

export interface TableRow {
  [key: string]: string | number;
}

// Content block types for the block-based editor
export type ContentBlock =
  | { type: 'heading'; text: string; level: 1 | 2 | 3 }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'keyvalue'; pairs: { label: string; value: string }[] }
  | { type: 'table'; columns: { header: string; key: string; align: 'left' | 'right' }[]; rows: Record<string, string>[] }
  | { type: 'callout'; title: string; content: string; variant: 'gold' | 'info' | 'success' | 'warning' }
  | { type: 'divider'; style: 'solid' | 'gold' };

export interface HeaderOptions {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  showDate?: boolean;
  showPageNumber?: boolean;
  pageNumber?: number;
  totalPages?: number;
}

export interface FooterOptions {
  showPageNumber?: boolean;
  pageNumber?: number;
  totalPages?: number;
  leftText?: string;
  centerText?: string;
  rightText?: string;
}

// =============================================================================
// DOCUMENT CREATION
// =============================================================================

/**
 * Creates a new PDF document with embedded fonts
 */
export async function createDocument(): Promise<PDFDocumentBundle> {
  const doc = await PDFDocument.create();

  // Embed standard fonts
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Set document metadata
  doc.setTitle('TIG Platform Document');
  doc.setAuthor('Tyler Insurance Group');
  doc.setCreator('TIG Platform PDF Generator');
  doc.setProducer('pdf-lib');
  doc.setCreationDate(new Date());

  return { doc, fonts: { regular, bold, italic } };
}

/**
 * Adds a new page to the document
 */
export function addPage(bundle: PDFDocumentBundle): PDFPage {
  return bundle.doc.addPage([PDF_LAYOUT.pageWidth, PDF_LAYOUT.pageHeight]);
}

/**
 * Finalizes the document and returns the PDF bytes
 */
export async function finalize(bundle: PDFDocumentBundle): Promise<Uint8Array> {
  return await bundle.doc.save();
}

/**
 * Converts PDF bytes to a data URL for preview
 */
export function toDataUrl(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return `data:application/pdf;base64,${base64}`;
}

/**
 * Downloads PDF bytes as a file
 */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

/**
 * Calculates text width
 */
export function getTextWidth(text: string, font: PDFFont, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

/**
 * Wraps text to fit within a maximum width
 */
export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Draws text with optional wrapping and alignment
 */
export function drawText(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  text: string,
  x: number,
  y: number,
  options: DrawTextOptions = {}
): number {
  const {
    color = PDF_COLORS.charcoal,
    size = PDF_TYPOGRAPHY.body,
    font = bundle.fonts.regular,
    maxWidth,
    lineHeight = PDF_TYPOGRAPHY.bodyLineHeight,
    align = 'left',
  } = options;

  const actualLineHeight = size * lineHeight;
  let currentY = y;

  // Handle text wrapping
  const lines = maxWidth
    ? wrapText(text, font, size, maxWidth)
    : [text];

  for (const line of lines) {
    let drawX = x;

    // Handle alignment
    if (align === 'center' && maxWidth) {
      const textWidth = font.widthOfTextAtSize(line, size);
      drawX = x + (maxWidth - textWidth) / 2;
    } else if (align === 'right' && maxWidth) {
      const textWidth = font.widthOfTextAtSize(line, size);
      drawX = x + maxWidth - textWidth;
    }

    page.drawText(line, {
      x: drawX,
      y: currentY,
      size,
      font,
      color,
    });

    currentY -= actualLineHeight;
  }

  return currentY; // Return final Y position
}

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

/**
 * Draws a premium header with title, optional subtitle, and decorative elements
 */
export function drawHeader(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  options: HeaderOptions
): number {
  const { title, subtitle, showDate = true } = options;
  const { pageWidth, marginLarge, contentWidth } = PDF_LAYOUT;

  let y = PDF_LAYOUT.pageHeight - marginLarge;

  // Gold accent line at top
  page.drawRectangle({
    x: marginLarge,
    y: y + 10,
    width: contentWidth,
    height: 3,
    color: PDF_COLORS.gold,
  });

  // Title
  y -= 10;
  drawText(page, bundle, title, marginLarge, y, {
    font: bundle.fonts.bold,
    size: PDF_TYPOGRAPHY.title,
    color: PDF_COLORS.charcoal,
  });

  y -= PDF_TYPOGRAPHY.title * 1.2;

  // Subtitle if provided
  if (subtitle) {
    drawText(page, bundle, subtitle, marginLarge, y, {
      font: bundle.fonts.regular,
      size: PDF_TYPOGRAPHY.h3,
      color: PDF_COLORS.mediumGray,
    });
    y -= PDF_TYPOGRAPHY.h3 * 1.4;
  }

  // Date on right side
  if (showDate) {
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dateWidth = bundle.fonts.regular.widthOfTextAtSize(dateStr, PDF_TYPOGRAPHY.small);

    page.drawText(dateStr, {
      x: pageWidth - marginLarge - dateWidth,
      y: PDF_LAYOUT.pageHeight - marginLarge - 10,
      size: PDF_TYPOGRAPHY.small,
      font: bundle.fonts.regular,
      color: PDF_COLORS.mediumGray,
    });
  }

  // Separator line
  y -= 8;
  page.drawLine({
    start: { x: marginLarge, y },
    end: { x: pageWidth - marginLarge, y },
    thickness: 0.5,
    color: PDF_COLORS.lightGray,
  });

  return y - PDF_LAYOUT.sectionSpacing;
}

/**
 * Draws a footer with optional page numbers and text
 */
export function drawFooter(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  options: FooterOptions = {}
): void {
  const {
    showPageNumber = true,
    pageNumber,
    totalPages,
    leftText,
    centerText = 'Tyler Insurance Group',
    rightText,
  } = options;

  const { marginLarge, pageWidth } = PDF_LAYOUT;
  const y = marginLarge - 10;

  // Separator line
  page.drawLine({
    start: { x: marginLarge, y: y + 15 },
    end: { x: pageWidth - marginLarge, y: y + 15 },
    thickness: 0.5,
    color: PDF_COLORS.lightGray,
  });

  // Left text
  if (leftText) {
    page.drawText(leftText, {
      x: marginLarge,
      y,
      size: PDF_TYPOGRAPHY.tiny,
      font: bundle.fonts.regular,
      color: PDF_COLORS.mediumGray,
    });
  }

  // Center text (brand)
  if (centerText) {
    const centerWidth = bundle.fonts.regular.widthOfTextAtSize(centerText, PDF_TYPOGRAPHY.tiny);
    page.drawText(centerText, {
      x: (pageWidth - centerWidth) / 2,
      y,
      size: PDF_TYPOGRAPHY.tiny,
      font: bundle.fonts.regular,
      color: PDF_COLORS.gold,
    });
  }

  // Right text or page number
  const rightContent = rightText || (showPageNumber && pageNumber
    ? (totalPages ? `Page ${pageNumber} of ${totalPages}` : `Page ${pageNumber}`)
    : '');

  if (rightContent) {
    const rightWidth = bundle.fonts.regular.widthOfTextAtSize(rightContent, PDF_TYPOGRAPHY.tiny);
    page.drawText(rightContent, {
      x: pageWidth - marginLarge - rightWidth,
      y,
      size: PDF_TYPOGRAPHY.tiny,
      font: bundle.fonts.regular,
      color: PDF_COLORS.mediumGray,
    });
  }
}

/**
 * Draws a section heading with optional gold accent
 */
export function drawSectionHeading(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  title: string,
  y: number,
  options: { accent?: boolean; level?: 1 | 2 | 3 } = {}
): number {
  const { accent = true, level = 1 } = options;
  const { marginLarge } = PDF_LAYOUT;

  const sizes = {
    1: PDF_TYPOGRAPHY.h1,
    2: PDF_TYPOGRAPHY.h2,
    3: PDF_TYPOGRAPHY.h3,
  };
  const size = sizes[level];

  // Gold accent bar for level 1
  if (accent && level === 1) {
    page.drawRectangle({
      x: marginLarge,
      y: y - 2,
      width: 4,
      height: size + 4,
      color: PDF_COLORS.gold,
    });
  }

  const xOffset = accent && level === 1 ? 12 : 0;

  drawText(page, bundle, title, marginLarge + xOffset, y, {
    font: bundle.fonts.bold,
    size,
    color: PDF_COLORS.charcoal,
  });

  return y - size * 1.5;
}

/**
 * Draws a paragraph of body text
 */
export function drawParagraph(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  text: string,
  y: number,
  options: { indent?: boolean } = {}
): number {
  const { indent = false } = options;
  const x = PDF_LAYOUT.marginLarge + (indent ? 20 : 0);
  const maxWidth = PDF_LAYOUT.contentWidth - (indent ? 20 : 0);

  const finalY = drawText(page, bundle, text, x, y, {
    maxWidth,
    size: PDF_TYPOGRAPHY.body,
    lineHeight: PDF_TYPOGRAPHY.bodyLineHeight,
  });

  return finalY - PDF_LAYOUT.paragraphSpacing;
}

/**
 * Draws a bullet point list
 */
export function drawBulletList(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  items: string[],
  y: number,
  options: { bulletChar?: string; indent?: number } = {}
): number {
  const { bulletChar = '•', indent = 20 } = options;
  const { marginLarge, contentWidth } = PDF_LAYOUT;

  let currentY = y;

  for (const item of items) {
    // Draw bullet
    page.drawText(bulletChar, {
      x: marginLarge + indent - 12,
      y: currentY,
      size: PDF_TYPOGRAPHY.body,
      font: bundle.fonts.regular,
      color: PDF_COLORS.gold,
    });

    // Draw text
    currentY = drawText(page, bundle, item, marginLarge + indent, currentY, {
      maxWidth: contentWidth - indent,
      size: PDF_TYPOGRAPHY.body,
      lineHeight: PDF_TYPOGRAPHY.bodyLineHeight,
    });

    currentY -= 4; // Extra spacing between items
  }

  return currentY - PDF_LAYOUT.paragraphSpacing;
}

/**
 * Draws a data table
 */
export function drawTable(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  columns: TableColumn[],
  rows: TableRow[],
  y: number,
  options: {
    headerBg?: RGB;
    stripedRows?: boolean;
    borderColor?: RGB;
  } = {}
): number {
  const {
    headerBg = PDF_COLORS.goldLight,
    stripedRows = true,
    borderColor = PDF_COLORS.lightGray,
  } = options;

  const { marginLarge, contentWidth } = PDF_LAYOUT;
  const rowHeight = 24;
  const cellPadding = 8;

  let currentY = y;

  // Calculate column widths in points
  const colWidths = columns.map(col => (col.width / 100) * contentWidth);

  // Draw header row
  page.drawRectangle({
    x: marginLarge,
    y: currentY - rowHeight,
    width: contentWidth,
    height: rowHeight,
    color: headerBg,
  });

  let colX = marginLarge;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const textX = col.align === 'right'
      ? colX + colWidths[i] - cellPadding
      : col.align === 'center'
        ? colX + colWidths[i] / 2
        : colX + cellPadding;

    page.drawText(col.header, {
      x: textX - (col.align === 'center' ? bundle.fonts.bold.widthOfTextAtSize(col.header, PDF_TYPOGRAPHY.small) / 2 : 0)
        - (col.align === 'right' ? bundle.fonts.bold.widthOfTextAtSize(col.header, PDF_TYPOGRAPHY.small) : 0),
      y: currentY - rowHeight + 8,
      size: PDF_TYPOGRAPHY.small,
      font: bundle.fonts.bold,
      color: PDF_COLORS.charcoal,
    });
    colX += colWidths[i];
  }

  currentY -= rowHeight;

  // Draw data rows
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    // Striped background
    if (stripedRows && rowIndex % 2 === 1) {
      page.drawRectangle({
        x: marginLarge,
        y: currentY - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: PDF_COLORS.offWhite,
      });
    }

    // Row border
    page.drawLine({
      start: { x: marginLarge, y: currentY },
      end: { x: marginLarge + contentWidth, y: currentY },
      thickness: 0.5,
      color: borderColor,
    });

    colX = marginLarge;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const value = String(row[col.key] ?? '');
      const textWidth = bundle.fonts.regular.widthOfTextAtSize(value, PDF_TYPOGRAPHY.small);

      let textX = colX + cellPadding;
      if (col.align === 'right') {
        textX = colX + colWidths[i] - cellPadding - textWidth;
      } else if (col.align === 'center') {
        textX = colX + (colWidths[i] - textWidth) / 2;
      }

      page.drawText(value, {
        x: textX,
        y: currentY - rowHeight + 8,
        size: PDF_TYPOGRAPHY.small,
        font: bundle.fonts.regular,
        color: PDF_COLORS.darkGray,
      });
      colX += colWidths[i];
    }

    currentY -= rowHeight;
  }

  // Bottom border
  page.drawLine({
    start: { x: marginLarge, y: currentY },
    end: { x: marginLarge + contentWidth, y: currentY },
    thickness: 0.5,
    color: borderColor,
  });

  return currentY - PDF_LAYOUT.sectionSpacing;
}

/**
 * Draws a highlight box (callout)
 */
export function drawCalloutBox(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  content: string,
  y: number,
  options: {
    type?: 'info' | 'success' | 'warning' | 'gold';
    title?: string;
  } = {}
): number {
  const { type = 'gold', title } = options;
  const { marginLarge, contentWidth } = PDF_LAYOUT;

  const colors = {
    info: { bg: PDF_COLORS.primaryLight, accent: PDF_COLORS.primary },
    success: { bg: rgb(0.9, 0.96, 0.9), accent: PDF_COLORS.success },
    warning: { bg: rgb(1, 0.97, 0.9), accent: PDF_COLORS.warning },
    gold: { bg: PDF_COLORS.goldLight, accent: PDF_COLORS.gold },
  };

  const { bg, accent } = colors[type];
  const padding = 16;

  // Calculate content height
  const lines = wrapText(content, bundle.fonts.regular, PDF_TYPOGRAPHY.body, contentWidth - padding * 2 - 8);
  const textHeight = lines.length * PDF_TYPOGRAPHY.body * PDF_TYPOGRAPHY.bodyLineHeight;
  const titleHeight = title ? PDF_TYPOGRAPHY.h3 * 1.4 : 0;
  const boxHeight = textHeight + titleHeight + padding * 2;

  // Background
  page.drawRectangle({
    x: marginLarge,
    y: y - boxHeight,
    width: contentWidth,
    height: boxHeight,
    color: bg,
    borderColor: accent,
    borderWidth: 0,
  });

  // Accent bar
  page.drawRectangle({
    x: marginLarge,
    y: y - boxHeight,
    width: 4,
    height: boxHeight,
    color: accent,
  });

  let contentY = y - padding;

  // Title
  if (title) {
    drawText(page, bundle, title, marginLarge + padding + 8, contentY, {
      font: bundle.fonts.bold,
      size: PDF_TYPOGRAPHY.h3,
      color: PDF_COLORS.charcoal,
    });
    contentY -= titleHeight;
  }

  // Content
  drawText(page, bundle, content, marginLarge + padding + 8, contentY, {
    maxWidth: contentWidth - padding * 2 - 8,
    size: PDF_TYPOGRAPHY.body,
    color: PDF_COLORS.darkGray,
  });

  return y - boxHeight - PDF_LAYOUT.paragraphSpacing;
}

/**
 * Draws a horizontal divider line
 */
export function drawDivider(
  page: PDFPage,
  y: number,
  options: { style?: 'solid' | 'dashed' | 'gold' } = {}
): number {
  const { style = 'solid' } = options;
  const { marginLarge, contentWidth } = PDF_LAYOUT;

  if (style === 'gold') {
    // Gold gradient-like divider
    page.drawRectangle({
      x: marginLarge,
      y: y - 1,
      width: contentWidth,
      height: 2,
      color: PDF_COLORS.gold,
    });
  } else {
    page.drawLine({
      start: { x: marginLarge, y },
      end: { x: marginLarge + contentWidth, y },
      thickness: style === 'dashed' ? 0.5 : 1,
      color: PDF_COLORS.lightGray,
      dashArray: style === 'dashed' ? [4, 4] : undefined,
    });
  }

  return y - PDF_LAYOUT.paragraphSpacing;
}

/**
 * Draws a key-value pair (label: value)
 */
export function drawKeyValue(
  page: PDFPage,
  bundle: PDFDocumentBundle,
  label: string,
  value: string,
  y: number,
  options: { labelWidth?: number } = {}
): number {
  const { labelWidth = 120 } = options;
  const { marginLarge } = PDF_LAYOUT;

  // Label
  page.drawText(label, {
    x: marginLarge,
    y,
    size: PDF_TYPOGRAPHY.body,
    font: bundle.fonts.bold,
    color: PDF_COLORS.mediumGray,
  });

  // Value
  page.drawText(value, {
    x: marginLarge + labelWidth,
    y,
    size: PDF_TYPOGRAPHY.body,
    font: bundle.fonts.regular,
    color: PDF_COLORS.charcoal,
  });

  return y - PDF_TYPOGRAPHY.body * PDF_TYPOGRAPHY.bodyLineHeight - 4;
}

// =============================================================================
// TEMPLATE GENERATORS
// =============================================================================

/**
 * Creates a blank branded document with header and footer
 */
export async function createBlankDocument(
  title: string,
  subtitle?: string
): Promise<{ bundle: PDFDocumentBundle; page: PDFPage; contentY: number }> {
  const bundle = await createDocument();
  const page = addPage(bundle);

  const contentY = drawHeader(page, bundle, { title, subtitle });
  drawFooter(page, bundle, { pageNumber: 1 });

  return { bundle, page, contentY };
}

/**
 * Sample: Creates a simple agent summary report
 */
export async function createAgentSummaryReport(data: {
  agentName: string;
  npn: string;
  email: string;
  status: string;
  carriers: string[];
  bookSize: number;
  monthlyGoal: number;
}): Promise<Uint8Array> {
  const bundle = await createDocument();
  const page = addPage(bundle);

  // Header
  let y = drawHeader(page, bundle, {
    title: 'Agent Summary Report',
    subtitle: data.agentName,
  });

  // Agent details section
  y = drawSectionHeading(page, bundle, 'Agent Information', y);
  y = drawKeyValue(page, bundle, 'Name:', data.agentName, y);
  y = drawKeyValue(page, bundle, 'NPN:', data.npn, y);
  y = drawKeyValue(page, bundle, 'Email:', data.email, y);
  y = drawKeyValue(page, bundle, 'Status:', data.status, y);

  y -= PDF_LAYOUT.sectionSpacing;

  // Performance section
  y = drawSectionHeading(page, bundle, 'Performance Metrics', y);
  y = drawKeyValue(page, bundle, 'Book Size:', `$${data.bookSize.toLocaleString()}`, y);
  y = drawKeyValue(page, bundle, 'Monthly Goal:', `$${data.monthlyGoal.toLocaleString()}`, y);

  y -= PDF_LAYOUT.sectionSpacing;

  // Carriers section
  y = drawSectionHeading(page, bundle, 'Contracted Carriers', y);
  y = drawBulletList(page, bundle, data.carriers, y);

  // Callout
  y = drawCalloutBox(page, bundle,
    'This report was generated automatically by the TIG Platform. For questions or concerns, contact your manager.',
    y,
    { type: 'gold' }
  );

  // Footer
  drawFooter(page, bundle, { pageNumber: 1 });

  return await finalize(bundle);
}

/**
 * Sample: Creates a data table report
 */
export async function createTableReport(
  title: string,
  columns: TableColumn[],
  rows: TableRow[]
): Promise<Uint8Array> {
  const bundle = await createDocument();
  const page = addPage(bundle);

  let y = drawHeader(page, bundle, { title });

  y = drawParagraph(page, bundle,
    `This report contains ${rows.length} records as of ${new Date().toLocaleDateString()}.`,
    y
  );

  y = drawTable(page, bundle, columns, rows, y);

  drawFooter(page, bundle, { pageNumber: 1 });

  return await finalize(bundle);
}

// =============================================================================
// MULTI-PAGE DOCUMENT RENDERER
// =============================================================================

/**
 * Renders blocks across multiple pages with automatic page breaks
 */
export async function renderDocument(
  config: {
    title: string;
    subtitle?: string;
    showDate?: boolean;
    showPageNumbers?: boolean;
  },
  blocks: ContentBlock[]
): Promise<Uint8Array> {
  const bundle = await createDocument();

  // Track pages and current position
  const pages: PDFPage[] = [];
  let currentPageIndex = 0;
  let y = 0;

  const FOOTER_SPACE = 60; // Space reserved for footer

  // Helper to add a new page
  const addNewPage = (isFirst: boolean) => {
    const page = addPage(bundle);
    pages.push(page);

    if (isFirst) {
      y = drawHeader(page, bundle, {
        title: config.title,
        subtitle: config.subtitle,
        showDate: config.showDate ?? true,
      });
    } else {
      // Continuation header - smaller, just shows title
      y = PDF_LAYOUT.pageHeight - PDF_LAYOUT.marginLarge;
      page.drawText(`${config.title} (continued)`, {
        x: PDF_LAYOUT.marginLarge,
        y,
        size: PDF_TYPOGRAPHY.h3,
        font: bundle.fonts.italic,
        color: PDF_COLORS.mediumGray,
      });
      y -= 30;
      page.drawLine({
        start: { x: PDF_LAYOUT.marginLarge, y },
        end: { x: PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginLarge, y },
        thickness: 0.5,
        color: PDF_COLORS.lightGray,
      });
      y -= PDF_LAYOUT.sectionSpacing;
    }

    return page;
  };

  // Helper to check if we need a new page
  const checkPageBreak = (neededHeight: number): PDFPage => {
    const minY = PDF_LAYOUT.marginLarge + FOOTER_SPACE;
    if (y - neededHeight < minY) {
      currentPageIndex++;
      return addNewPage(false);
    }
    return pages[currentPageIndex];
  };

  // Estimate block height (rough)
  const estimateBlockHeight = (block: ContentBlock): number => {
    switch (block.type) {
      case 'heading':
        return block.level === 1 ? 40 : block.level === 2 ? 32 : 24;
      case 'paragraph': {
        const lines = Math.ceil(block.text.length / 80);
        return lines * PDF_TYPOGRAPHY.body * PDF_TYPOGRAPHY.bodyLineHeight + PDF_LAYOUT.paragraphSpacing;
      }
      case 'bullets':
        return block.items.length * 20 + PDF_LAYOUT.paragraphSpacing;
      case 'keyvalue':
        return block.pairs.length * 20 + PDF_LAYOUT.paragraphSpacing;
      case 'table':
        return (block.rows.length + 1) * 24 + PDF_LAYOUT.sectionSpacing;
      case 'callout': {
        const calloutLines = Math.ceil(block.content.length / 70);
        return calloutLines * 16 + (block.title ? 24 : 0) + 40;
      }
      case 'divider':
        return 24;
      default:
        return 40;
    }
  };

  // Start first page
  let currentPage = addNewPage(true);

  // Render blocks
  for (const block of blocks) {
    const estimatedHeight = estimateBlockHeight(block);
    currentPage = checkPageBreak(estimatedHeight);

    switch (block.type) {
      case 'heading':
        y = drawSectionHeading(currentPage, bundle, block.text, y, { level: block.level });
        break;
      case 'paragraph':
        y = drawParagraph(currentPage, bundle, block.text, y);
        break;
      case 'bullets':
        y = drawBulletList(currentPage, bundle, block.items, y);
        break;
      case 'keyvalue':
        for (const pair of block.pairs) {
          currentPage = checkPageBreak(20);
          y = drawKeyValue(currentPage, bundle, pair.label + ':', pair.value, y);
        }
        y -= 16;
        break;
      case 'table':
        y = drawTable(
          currentPage,
          bundle,
          block.columns.map((col) => ({
            header: col.header,
            key: col.key,
            width: 100 / block.columns.length,
            align: col.align,
          })),
          block.rows,
          y
        );
        break;
      case 'callout':
        y = drawCalloutBox(currentPage, bundle, block.content, y, {
          type: block.variant,
          title: block.title || undefined,
        });
        break;
      case 'divider':
        y = drawDivider(currentPage, y, { style: block.style });
        break;
    }
  }

  // Add footers with page numbers to all pages
  const totalPages = pages.length;
  pages.forEach((page, index) => {
    drawFooter(page, bundle, {
      showPageNumber: config.showPageNumbers ?? true,
      pageNumber: index + 1,
      totalPages,
    });
  });

  return await finalize(bundle);
}
