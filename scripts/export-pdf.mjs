/**
 * Gera o PDF do currículo ajustado pelo mesmo caminho do botão "Exportar PDF"
 * (CSS de impressão + Page.printToPDF do Chromium) e audita o resultado:
 * quantidade de páginas, texto selecionável por página e vazamento de interface.
 *
 *   node scripts/export-pdf.mjs [url-do-app]
 *
 * Requer um Chromium instalado (Chrome/Edge) e o app rodando (npm run dev ou npm run preview).
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const APP_URL = process.argv[2] ?? "http://127.0.0.1:5173/";
const OUT_DIR = "docs";
const EXAMPLE_PDF = path.join(OUT_DIR, "curriculo-exemplo.pdf");
const LONG_PDF = path.join(OUT_DIR, "curriculo-paginado.pdf");

const LONG_RESUME = `Mariana Alves Souza
mariana.alves@email.com | (11) 98842-7710 | linkedin.com/in/marianaalves | São Paulo, SP

Objetivo
Profissional de dados com 5 anos de experiência em varejo, da coleta à entrega de relatórios para diretoria.

Experiência
Analista de BI — Grupo Vestir (2021 - atual)
- Criei painéis em Power BI usados por 120 pessoas todos os meses.
- Estruturei o processo de coleta de vendas em planilhas e banco de dados interno.
- Padronizei indicadores de vendas por loja, reduzindo 30% do tempo de fechamento mensal.
- Atuei com times de compras e marketing em campanhas sazonais.
- Documentei o dicionário de dados das áreas comercial e financeira.
- Apoiei a diretoria em apresentações mensais de resultado.

Analista de Dados — Grupo Vestir (2019 - 2021)
- Extraí dados do ERP com consultas SQL para as áreas comercial e financeira.
- Automatizei com Excel e VBA dois relatórios que consumiam 12 horas por semana.
- Apoiei a migração do banco de dados para a nuvem junto ao time de TI.
- Treinei 15 pessoas do time comercial no uso dos relatórios.
- Mantive a documentação das rotinas de extração.

Assistente Administrativo — Grupo Vestir (2017 - 2019)
- Organizei o acompanhamento de metas por loja em planilhas padronizadas.
- Preparei relatórios semanais de vendas para a gerência regional.
- Acompanhei o fechamento mensal ao lado do time financeiro.
- Atendi solicitações de informação das áreas de compras e logística.

Formação
Bacharelado em Administração — Universidade Presbiteriana Mackenzie (2018)

Competências
Power BI, SQL, Excel avançado, VBA, estatística descritiva, modelagem de dados, comunicação, trabalho em equipe

Idiomas
Inglês — intermediário

Cursos e certificações
Power BI para Análise de Dados — Alura (2022)
Google Data Analytics — Coursera (2021)`;

const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

/** Texto que nunca pode aparecer no PDF do currículo. */
const UI_LEAKS = [
  "Currículo bom que nunca chega",
  "Analisar compatibilidade",
  "Encontradas no currículo",
  "Faltando no currículo",
  "Exportar PDF",
  "Carregar exemplo",
  "01 · Entrada",
  "02 · Diagnóstico",
];

async function extractPages(pdfPath) {
  const data = new Uint8Array(await readFile(pdfPath));
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({ data, useSystemFonts: false, isEvalSupported: false }).promise;
    const pages = [];
    for (let index = 1; index <= doc.numPages; index += 1) {
      const page = await doc.getPage(index);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
      const viewport = page.getViewport({ scale: 1 });
      let minX = Infinity;
      let maxX = -Infinity;
      let top = -Infinity;
      let bottom = Infinity;
      let minFont = Infinity;
      for (const item of content.items) {
        if (!item.str.trim()) continue;
        const [a, b, c, d, e, f] = item.transform;
        if (!Number.isFinite(e) || !Number.isFinite(f)) continue;
        const size = Math.hypot(c, d) || item.height || 0;
        minX = Math.min(minX, e);
        maxX = Math.max(maxX, e + (item.width ?? 0));
        bottom = Math.min(bottom, f);
        top = Math.max(top, f + size);
        if (size > 0) minFont = Math.min(minFont, size);
      }
      pages.push({
        text,
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
        bounds: Number.isFinite(minX) ? { minX, maxX, top, bottom } : null,
        minFont: Number.isFinite(minFont) ? minFont : 0,
      });
    }
    return { pages, engine: "pdfjs" };
  } catch (error) {
    const raw = Buffer.from(data).toString("latin1");
    const pageCount = (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    return {
      pages: Array.from({ length: pageCount }, () => ({ text: "", width: 0, height: 0 })),
      engine: `regex (pdfjs falhou: ${error.message})`,
    };
  }
}

function report(label, result, expectations) {
  const { pages } = result;
  console.log(`\n=== ${label}`);
  console.log(`páginas: ${pages.length} | extração: ${result.engine}`);
  console.log(`tamanho da página: ${pages[0]?.width}x${pages[0]?.height} pt (A4 = 595x842)`);
  pages.forEach((page, index) => {
    const bounds = page.bounds
      ? ` | x ${page.bounds.minX.toFixed(0)}–${page.bounds.maxX.toFixed(0)} pt, y ${page.bounds.bottom.toFixed(0)}–${page.bounds.top.toFixed(0)} pt`
      : "";
    console.log(
      `  p${index + 1}: ${page.text.length} caracteres | fonte mín. ${page.minFont.toFixed(1)}pt${bounds} | início: "${page.text.slice(0, 70)}"`,
    );
  });

  const fullText = pages.map((page) => page.text).join("\n");
  const problems = [];

  if (pages.length === 0) problems.push("PDF sem páginas");
  if (!fullText.includes("Mariana Alves Souza")) problems.push("nome ausente do texto do PDF (texto não selecionável?)");
  if (!fullText.toUpperCase().includes("EXPERIÊNCIA PROFISSIONAL")) problems.push("seção de experiência ausente");
  if (!fullText.toLowerCase().includes("grupo vestir")) problems.push("histórico do currículo ausente");
  for (const leak of UI_LEAKS) {
    if (fullText.includes(leak)) problems.push(`vazamento de interface: "${leak}"`);
  }
  if (pages.some((page) => page.text.length < 120)) {
    problems.push("página quase vazia (quebra de página ruim)");
  }
  pages.forEach((page, index) => {
    if (!page.bounds) return;
    const edge = 24;
    if (page.bounds.minX < edge) problems.push(`p${index + 1}: texto colado na borda esquerda`);
    if (page.bounds.maxX > page.width - edge) problems.push(`p${index + 1}: texto colado na borda direita`);
    if (page.bounds.bottom < edge) problems.push(`p${index + 1}: texto abaixo da margem inferior`);
    if (page.bounds.top > page.height - edge) problems.push(`p${index + 1}: texto acima da margem superior`);
    if (page.minFont && page.minFont < 8.5) problems.push(`p${index + 1}: fonte de ${page.minFont.toFixed(1)}pt pequena demais para impressão`);
  });
  if (pages.length > expectations.maxPages) {
    problems.push(`${pages.length} páginas (esperado até ${expectations.maxPages})`);
  }
  if (!/[.!?]$/.test(pages[pages.length - 1].text)) {
    // só informativo: a última página pode terminar em lista
    console.log("  (nota) última página termina sem ponto final — pode ser lista");
  }

  if (problems.length === 0) {
    console.log("RESULTADO: ok");
  } else {
    console.log("RESULTADO: problemas encontrados");
    problems.forEach((problem) => console.log(`  - ${problem}`));
    process.exitCode = 1;
  }
  return problems;
}

async function main() {
  const executablePath = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!executablePath) {
    console.error("Chromium não encontrado. Defina CHROME_PATH apontando para o executável.");
    process.exitCode = 1;
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const problems = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(APP_URL, { waitUntil: "networkidle0", timeout: 60000 });

    const setTextarea = async (index, value) => {
      await page.evaluate(
        (position, text) => {
          const area = document.querySelectorAll("textarea")[position];
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
          setter.call(area, text);
          area.dispatchEvent(new Event("input", { bubbles: true }));
        },
        index,
        value,
      );
    };

    const clickText = async (needle) => {
      await page.evaluate((label) => {
        const button = [...document.querySelectorAll("button")].find((item) => item.textContent.includes(label));
        button?.click();
      }, needle);
      await new Promise((resolve) => setTimeout(resolve, 250));
    };

    // O botão real de exportação: confere que ele dispara a impressão e que o
    // título do documento vira o nome do arquivo/metadados do PDF.
    const verifyExportButton = async () => {
      await page.evaluate(() => {
        window.__printCalls = 0;
        window.print = () => {
          window.__printCalls += 1;
        };
      });
      await clickText("Exportar PDF");
      const state = await page.evaluate(() => ({ calls: window.__printCalls, title: document.title }));
      console.log(`botão Exportar PDF: window.print() chamado ${state.calls}x, título "${state.title}"`);
      if (state.calls !== 1) problems.push("botão Exportar PDF não chamou window.print()");
      if (!state.title.startsWith("Currículo —")) problems.push("título do PDF não recebeu o nome do currículo");
    };

    await clickText("Carregar exemplo");
    await page.waitForFunction(() => [...document.querySelectorAll("textarea")].every((area) => area.value.length > 100));
    await clickText("Analisar compatibilidade");
    await page.waitForSelector("#resume-paper");

    await verifyExportButton();

    // O botão .docx monta o pacote OOXML no próprio navegador e baixa como Blob.
    await page.evaluate(() => {
      window.__docx = null;
      const create = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        window.__docx = { type: blob.type, size: blob.size };
        return create(blob);
      };
    });
    await clickText(".docx");
    const docxState = await page.evaluate(() => window.__docx);
    console.log(
      `botão .docx: ${docxState ? `${Math.round(docxState.size / 1024)} kB, ${docxState.type}` : "nada baixado"}`,
    );
    if (!docxState || docxState.size < 5000) problems.push("botão .docx não gerou o arquivo");
    if (docxState?.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      problems.push("MIME do .docx incorreto");
    }

    const printOptions = { printBackground: true, preferCSSPageSize: true };
    const examplePdf = await page.pdf(printOptions);
    await writeFile(EXAMPLE_PDF, examplePdf);
    console.log(`PDF gerado: ${EXAMPLE_PDF} (${Math.round(examplePdf.length / 1024)} kB)`);
    problems.push(...report("currículo do exemplo", await extractPages(EXAMPLE_PDF), { maxPages: 2 }));

    await setTextarea(1, LONG_RESUME);
    await clickText("Analisar compatibilidade");
    await page.waitForSelector("#resume-paper");

    await verifyExportButton();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const longPdf = await page.pdf(printOptions);
    await writeFile(LONG_PDF, longPdf);
    console.log(`\nPDF gerado: ${LONG_PDF} (${Math.round(longPdf.length / 1024)} kB)`);
    problems.push(...report("currículo longo (paginação)", await extractPages(LONG_PDF), { maxPages: 3 }));
  } finally {
    await browser.close();
  }

  console.log(problems.length === 0 ? "\nTudo certo." : `\n${problems.length} problema(s) de PDF.`);
}

await main();
