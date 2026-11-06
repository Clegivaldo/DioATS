/**
 * Gera o .docx pelo mesmo código do botão "Baixar .docx" e valida o pacote fora
 * do navegador: integridade do ZIP, XML de todas as partes, A4/uma coluna,
 * títulos com estilo e — principalmente — conteúdo idêntico ao texto puro,
 * provando que nada foi inventado na exportação.
 *
 *   npm run verify:docx
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { analyze } from "../src/lib/analyze";
import { EXAMPLES } from "../src/data/examples";
import { buildDocx } from "../src/lib/docx";
import { generateResume } from "../src/lib/generate";
import { normalize } from "../src/lib/text";

let failures = 0;

function check(label: string, condition: boolean, detail = ""): void {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FALHA"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

const squash = (value: string) => normalize(value).replace(/[^a-z0-9]/g, "");

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

const PYTHON_CHECK = `import sys, zipfile, xml.etree.ElementTree as ET
with zipfile.ZipFile(sys.argv[1]) as archive:
    names = archive.namelist()
    for name in names:
        if name.endswith((".xml", ".rels")):
            ET.fromstring(archive.read(name))
    print("|".join(names))`;

function validate(file: string, plainText: string, name: string): void {
  const parts = execFileSync("python", ["-c", PYTHON_CHECK, file], { encoding: "utf8" }).trim().split("|");
  check("ZIP íntegro e XML válido em todas as partes", parts.length === 7, `${parts.length} partes`);

  const documentXml = execFileSync("unzip", ["-p", file, "word/document.xml"], { encoding: "utf8" });
  const coreXml = execFileSync("unzip", ["-p", file, "docProps/core.xml"], { encoding: "utf8" });
  const text = [...documentXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((match) => unescapeXml(match[1]))
    .join("");

  check(
    "conteúdo idêntico ao texto puro (nada inventado)",
    squash(text) === squash(plainText),
    `${text.length} vs ${plainText.length} caracteres`,
  );
  check(
    "A4, uma coluna, sem tabela nem caixa de texto",
    documentXml.includes('w:w="11906"') && documentXml.includes('w:h="16838"') && !documentXml.includes("<w:tbl>") && !documentXml.includes("txbxContent"),
  );
  const headings = (documentXml.match(/<w:pStyle w:val="Heading1"\/>/g) ?? []).length;
  check("títulos de seção com estilo Heading1", headings >= 4, `${headings} títulos`);
  check("nome do candidato nos metadados", coreXml.includes(name), name);
  check("e-mail no corpo do documento", text.includes("@"));
}

mkdirSync("docs", { recursive: true });

EXAMPLES.forEach((example, index) => {
  const analysis = analyze(example.job, example.resume);
  const generated = generateResume(analysis);
  const bytes = buildDocx(generated);
  const kept = index === 0;
  const file = kept ? path.join("docs", "curriculo-exemplo.docx") : path.join("docs", `.check-${example.id}.docx`);

  writeFileSync(file, bytes);
  console.log(`\n=== ${example.id} — ${Math.round(bytes.length / 1024)} kB${kept ? ` (${file})` : ""}`);
  validate(file, generated.plainText, generated.name);

  const invented = analysis.missing.filter((match) =>
    generated.skills.some((skill) => normalize(skill) === match.norm),
  );
  check("termos ausentes não entram como competência", invented.length === 0, invented.map((match) => match.term).join(", "));

  if (!kept) rmSync(file);
});

console.log(`\n${failures === 0 ? "Todos os casos passaram" : `${failures} verificação(ões) falharam`}`);
process.exitCode = failures === 0 ? 0 : 1;
