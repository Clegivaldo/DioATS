/**
 * Utilitário de diagnóstico do motor de análise.
 * Roda o par vaga/currículo de exemplo e imprime o resultado completo no terminal.
 *
 *   npx esbuild scripts/eval-engine.ts --bundle --platform=node --format=esm --outfile=.eval.mjs && node .eval.mjs
 */
import { analyze } from "../src/lib/analyze";
import { EXAMPLES } from "../src/data/examples";
import { generateResume } from "../src/lib/generate";

for (const example of EXAMPLES) {
  const analysis = analyze(example.job, example.resume);
  const generated = generateResume(analysis);

  console.log(`\n=== ${example.id} ===`);
  console.log(`vaga: ${analysis.job.title || "(sem título detectado)"}`);
  console.log(`nome: ${analysis.resume.name || "(sem nome detectado)"}`);
  console.log(`palavras-chave: ${analysis.job.keywords.length}`);
  console.log(`score: ${analysis.score} (${analysis.grade.label}) | saude ATS: ${analysis.healthScore}`);
  console.log(`encontradas: ${analysis.found.map((item) => item.term).join(", ")}`);
  console.log(`variacoes: ${analysis.partial.map((item) => item.term).join(", ")}`);
  console.log(
    `faltando: ${analysis.missing.map((item) => `${item.term}[${item.requirement}]`).join(", ")}`,
  );
  console.log(`categorias: ${analysis.categories.map((c) => `${c.label} ${c.score}%`).join(" | ")}`);
  console.log(`checagens falhando: ${analysis.health.filter((c) => c.status !== "pass").map((c) => c.id).join(", ") || "nenhuma"}`);
  console.log(`depois do ajuste: ${generated.metrics.after}% (antes ${generated.metrics.before}%)`);
  console.log(`competencias geradas: ${generated.skills.join(" | ")}`);
  console.log(`mudancas: ${generated.changes.map((change) => change.title).join(" / ")}`);
  console.log("--- curriculo gerado ---");
  console.log(generated.plainText);
}
