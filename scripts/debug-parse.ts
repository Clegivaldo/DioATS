/**
 * Diagnóstico do parser de currículo: mostra como cada linha é classificada.
 *
 *   npx esbuild scripts/debug-parse.ts --bundle --platform=node --format=esm --outfile=.debug.mjs && node .debug.mjs
 */
import { EXAMPLES } from "../src/data/examples";
import { matchHeading, parseResume } from "../src/lib/parseResume";

for (const example of EXAMPLES) {
  const resume = parseResume(example.resume);
  console.log(`\n=== ${example.id}`);
  console.log(`palavras: ${resume.wordCount} | experiencias: ${resume.experience.length}`);
  console.log(`presentes: ${JSON.stringify(resume.present)}`);
  console.log(`skils: ${JSON.stringify(resume.skills)}`);
  console.log(`secoes: ${resume.sections.map((section) => `${section.key}(${section.lines.length})`).join(" ")}`);
  console.log("-- linhas reconhecidas como titulo:");
  for (const line of example.resume.split("\n")) {
    const heading = matchHeading(line.trim());
    if (heading) console.log(`   "${line.trim()}" → ${heading}`);
  }
}
