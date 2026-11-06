/**
 * Gera os prints do README com a interface atual do app.
 *
 *   npm run shots [url-do-app]
 *
 * Requer um Chromium instalado (Chrome/Edge) e o app rodando (npm run dev ou npm run preview).
 * Usa o exemplo oficial ("Carregar exemplo") para que os prints mostrem dados reais do fluxo.
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const APP_URL = process.argv[2] ?? "http://127.0.0.1:5173/";
const OUT_DIR = "docs/screenshots";
/** 2× para texto legível em tela retina, sem inflar demais o arquivo. */
const VIEWPORT = { width: 1280, height: 1000, deviceScaleFactor: 2 };

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    await page.setViewport(VIEWPORT);
    await page.goto(APP_URL, { waitUntil: "networkidle0", timeout: 60000 });
    // Barra de rolagem do Windows aparece no print e não faz parte da interface.
    await page.addStyleTag({
      content: "::-webkit-scrollbar{display:none!important}html{scrollbar-width:none}",
    });
    await page.evaluate(() => document.fonts.ready);
    await wait(600);

    const shoot = async (file) => {
      await wait(400);
      const target = `${OUT_DIR}/${file}`;
      await page.screenshot({ path: target });
      console.log(`print: ${target}`);
    };

    const clickText = async (needle) => {
      await page.evaluate((label) => {
        const button = [...document.querySelectorAll("button")].find((item) => item.textContent.includes(label));
        button?.click();
      }, needle);
      await wait(300);
    };

    const scrollToSection = async (selector, offset) => {
      await page.evaluate(
        (target, top) => {
          const element = document.querySelector(target);
          window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - top);
        },
        selector,
        offset,
      );
      await wait(500);
    };

    // 1. Hero, sem análise: a proposta e a regra da casa.
    await page.evaluate(() => window.scrollTo(0, 0));
    await shoot("01-hero.png");

    await clickText("Carregar exemplo");
    await page.waitForFunction(() =>
      [...document.querySelectorAll("textarea")].every((area) => area.value.length > 100),
    );
    await clickText("Analisar compatibilidade");
    await page.waitForSelector("#resume-paper");

    // 2. Diagnóstico: score, cobertura por categoria e palavras-chave.
    await scrollToSection("#resultado", 135);
    await shoot("02-analise.png");

    // 3. Saída: barra de exportação (incluindo o .docx) e a prévia em uma coluna.
    const docxButton = await page.evaluate(() => {
      const button = [...document.querySelectorAll("#curriculo button")].find((item) =>
        item.textContent.includes(".docx"),
      );
      return button ? button.textContent.trim() : null;
    });
    console.log(`botão .docx na saída: ${docxButton ?? "não encontrado"}`);
    if (!docxButton) problems.push("botão .docx ausente na seção do currículo");

    await scrollToSection("#curriculo", 135);
    await shoot("03-curriculo.png");
  } finally {
    await browser.close();
  }

  console.log(problems.length === 0 ? "\nPrints gerados." : `\n${problems.length} problema(s).`);
  if (problems.length) process.exitCode = 1;
}

await main();
