import { resumeFileName, type GeneratedResume } from "./generate";

/**
 * Exportação .docx sem biblioteca: um pacote OOXML mínimo (ZIP + document.xml).
 *
 * O conteúdo vem exclusivamente de `GeneratedResume` — o mesmo objeto que alimenta
 * a prévia e o PDF. Não existe caminho aqui para acrescentar competência, cargo ou
 * experiência que não esteja no currículo original.
 */

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function resumeDocxFileName(name: string): string {
  return resumeFileName(name).replace(/\.txt$/, ".docx");
}

/* ------------------------------------------------------------------ ZIP ---- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** ZIP sem compressão (método 0): válido para OOXML e independente de dependências. */
function zipStore(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const now = new Date();
  const time = ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xffff;
  const date = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);

    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, time, true);
    localView.setUint16(12, date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, entry.data.length, true);
    localView.setUint32(22, entry.data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);

    localParts.push(local, entry.data);
    centralParts.push(central);
    offset += local.length + entry.data.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  const output = new Uint8Array(offset + centralSize + end.length);
  let position = 0;
  for (const part of [...localParts, ...centralParts, end]) {
    output.set(part, position);
    position += part.length;
  }
  return output;
}

/* --------------------------------------------------------------- OOXML ---- */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ParagraphOptions {
  style?: "Title" | "Heading1";
  bold?: boolean;
  /** Tamanho em meios-pontos: 21 = 10,5 pt. */
  size?: number;
  color?: string;
  spaceAfter?: number;
  indent?: number;
  hanging?: number;
  keepNext?: boolean;
}

function paragraph(text: string, options: ParagraphOptions = {}): string {
  const properties: string[] = [];
  if (options.style) properties.push(`<w:pStyle w:val="${options.style}"/>`);
  if (options.keepNext) properties.push("<w:keepNext/>");
  if (options.spaceAfter !== undefined) properties.push(`<w:spacing w:after="${options.spaceAfter}"/>`);
  if (options.indent !== undefined) {
    properties.push(
      `<w:ind w:left="${options.indent}"${options.hanging !== undefined ? ` w:hanging="${options.hanging}"` : ""}/>`,
    );
  }

  const run: string[] = [];
  if (options.bold) run.push("<w:b/>");
  if (options.size !== undefined) run.push(`<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>`);
  if (options.color) run.push(`<w:color w:val="${options.color}"/>`);

  const content = text
    ? `<w:r>${run.length ? `<w:rPr>${run.join("")}</w:rPr>` : ""}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`
    : "";
  return `<w:p>${properties.length ? `<w:pPr>${properties.join("")}</w:pPr>` : ""}${content}</w:p>`;
}

/** Títulos em caixa alta com os mesmos nomes usados no texto puro e no PDF. */
function heading(title: string): string {
  return paragraph(title.toUpperCase(), { style: "Heading1" });
}

function bullet(text: string): string {
  // Bullet como caractere + recuo pendente: extração de texto previsível em qualquer parser.
  return paragraph(`• ${text}`, { indent: 360, hanging: 180, spaceAfter: 40 });
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="1A1A1A"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="40"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/><w:szCs w:val="40"/><w:color w:val="111111"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="80"/><w:outlineLvl w:val="0"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="BFBFBF"/></w:pBdr></w:pPr><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="111111"/></w:rPr></w:style></w:styles>`;

function coreProps(resume: GeneratedResume): string {
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const title = `Currículo — ${resume.name || "candidato"}`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(title)}</dc:title><dc:creator>JobMatch ATS</dc:creator><cp:lastModifiedBy>JobMatch ATS</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified></cp:coreProperties>`;
}

const APP_PROPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>JobMatch ATS</Application></Properties>`;

function documentXml(resume: GeneratedResume): string {
  const body: string[] = [];

  body.push(paragraph(resume.name || "Seu nome completo", { style: "Title" }));
  if (resume.contactLines.length) {
    body.push(paragraph(resume.contactLines.join("  ·  "), { size: 18, color: "3A3A3A", spaceAfter: 200 }));
  }

  if (resume.summary) {
    body.push(heading("Resumo Profissional"));
    body.push(paragraph(resume.summary, { spaceAfter: 120 }));
  }

  if (resume.skills.length) {
    body.push(heading("Competências"));
    body.push(paragraph(resume.skills.join(" · "), { spaceAfter: 120 }));
  }

  if (resume.experiences.length) {
    body.push(heading("Experiência Profissional"));
    for (const experience of resume.experiences) {
      experience.titleLines.forEach((line, index) => {
        body.push(paragraph(line, { bold: index === 0, keepNext: true, spaceAfter: 20 }));
      });
      for (const item of experience.bullets) body.push(bullet(item));
      for (const item of experience.paragraphs) body.push(paragraph(item, { spaceAfter: 80 }));
    }
  }

  if (resume.education.length) {
    body.push(heading("Formação Acadêmica"));
    for (const line of resume.education) body.push(paragraph(line, { spaceAfter: 60 }));
  }

  if (resume.certifications.length) {
    body.push(heading("Cursos e Certificações"));
    for (const line of resume.certifications) body.push(paragraph(line, { spaceAfter: 60 }));
  }

  if (resume.languages.length) {
    body.push(heading("Idiomas"));
    body.push(paragraph(resume.languages.join(" · "), { spaceAfter: 120 }));
  }

  if (resume.projects.length) {
    body.push(heading("Projetos"));
    for (const line of resume.projects) body.push(paragraph(line, { spaceAfter: 60 }));
  }

  for (const extra of resume.extras) {
    if (!extra.lines.length) continue;
    body.push(heading(extra.title));
    for (const line of extra.lines) body.push(paragraph(line, { spaceAfter: 60 }));
  }

  const section =
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="794" w:bottom="850" w:left="794" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join("")}${section}</w:body></w:document>`;
}

export function buildDocx(resume: GeneratedResume): Uint8Array {
  const encoder = new TextEncoder();
  const files: ZipEntry[] = [
    { name: "[Content_Types].xml", data: encoder.encode(CONTENT_TYPES) },
    { name: "_rels/.rels", data: encoder.encode(ROOT_RELS) },
    { name: "word/document.xml", data: encoder.encode(documentXml(resume)) },
    { name: "word/styles.xml", data: encoder.encode(STYLES) },
    { name: "word/_rels/document.xml.rels", data: encoder.encode(DOCUMENT_RELS) },
    { name: "docProps/core.xml", data: encoder.encode(coreProps(resume)) },
    { name: "docProps/app.xml", data: encoder.encode(APP_PROPS) },
  ];
  return zipStore(files);
}
