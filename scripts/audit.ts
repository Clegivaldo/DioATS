/**
 * Auditoria de robustez do motor: casos reais de currículo colado (PDF, DOCX, texto solto)
 * e verificação programática da regra "nunca inventar".
 *
 *   npx esbuild scripts/audit.ts --bundle --platform=node --format=esm --outfile=.audit.mjs && node .audit.mjs
 */
import { analyze } from "../src/lib/analyze";
import { EXAMPLES } from "../src/data/examples";
import { generateResume } from "../src/lib/generate";
import { parseResume } from "../src/lib/parseResume";
import { normalize } from "../src/lib/text";

const JOB = `Vaga: Analista de Suporte Pleno
Empresa: Contoso

Responsabilidades
- Atender chamados de clientes no Zendesk com SLA de 4 horas.
- Documentar soluções na base de conhecimento.

Requisitos
- Experiência com atendimento ao cliente e Zendesk.
- Excel intermediário.
- Inglês intermediário.

Diferenciais
- Conhecimento em SQL.
- Certificação ITIL.

Benefícios
- Vale refeição, plano de saúde e gympass.`;

const CASES: { name: string; resume: string }[] = [
  {
    name: "sem nenhum título de seção",
    resume: `João Pedro Lima
joao.lima@email.com | (21) 98888-7777 | linkedin.com/in/joaolima | Rio de Janeiro, RJ

Analista de Suporte na Contoso (2021 - atual)
Atendimento de 50 chamados por semana no Zendesk, com 92% de satisfação.
Documentei 30 artigos na base de conhecimento.

Assistente de Suporte na Contoso (2019 - 2021)
Suporte por telefone e chat para clientes pequenos.

Bacharelado em Sistemas de Informação - Estácio (2018)
Excel intermediário, inglês intermediário, comunicação, organização.`,
  },
  {
    name: "títulos em CAIXA ALTA e bullets com hífen",
    resume: `MARIA SOUZA
maria@email.com | (11) 97777-6666 | São Paulo, SP

RESUMO
Profissional de suporte com 6 anos de experiência.

EXPERIÊNCIA PROFISSIONAL
Analista de Suporte - Contoso (2020 - atual)
- Atendimento ao cliente via Zendesk.
- Documentação de processos.

FORMAÇÃO
Tecnólogo em Gestão de TI - Fatec (2019)

COMPETÊNCIAS
Zendesk | Excel intermediário | Inglês intermediário | Comunicação`,
  },
  {
    name: "markdown com ## e tabela colada",
    resume: `# Carlos Andrade
carlos@email.com · (31) 96666-5555 · Belo Horizonte, MG

## Objetivo
Atuar em suporte técnico.

## Experiência Profissional
### Analista de Suporte — Contoso
2022 – atual
- Atendimento ao cliente no Zendesk, 40 tickets/semana.
- Suporte a produtos digitais.

## Formação Acadêmica
Sistemas de Informação — PUC Minas (2021)

## Habilidades
Zendesk, Excel intermediário, inglês intermediário, comunicação`,
  },
];

let failures = 0;

function check(label: string, condition: boolean, detail = ""): void {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FALHA"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("=== casos de currículo ===");
for (const testCase of CASES) {
  const analysis = analyze(JOB, testCase.resume);
  const generated = generateResume(analysis);
  const resume = parseResume(testCase.resume);

  console.log(`\n--- ${testCase.name}`);
  console.log(`nome: ${JSON.stringify(resume.name)} | experiencias: ${resume.experience.length} | secoes: ${resume.sections.map((s) => s.key).join(",")}`);
  console.log(`score: ${analysis.score}% | depois: ${generated.metrics.after}% | keywords: ${analysis.job.keywords.map((k) => k.term).join(", ")}`);
  console.log(`nao incluidas: ${analysis.missing.map((k) => k.term).join(", ") || "nenhuma"}`);
  console.log(`gerado (inicio): ${generated.plainText.slice(0, 180).replace(/\n/g, " / ")}`);

  check("nome detectado", resume.name.length > 3, resume.name);
  check("experiência reconhecida", resume.experience.length >= 1, `${resume.experience.length} bloco(s)`);
  check("e-mail preservado", generated.contactLines.some((line) => line.includes("@")));
  check("empresa preservada", normalize(generated.plainText).includes("contoso"));
  check("seção de experiência no texto gerado", normalize(generated.plainText).includes("experiencia profissional"));
  check(
    "nenhum termo ausente apresentado como competência",
    analysis.missing
      .filter((match) => !normalize(generated.summary).includes(match.norm))
      .every((match) => !generated.skills.some((skill) => normalize(skill) === match.norm)),
  );
}

console.log("\n=== regra de não inventar (exemplos oficiais) ===");
for (const example of EXAMPLES) {
  const analysis = analyze(example.job, example.resume);
  const generated = generateResume(analysis);
  const missingTerms = analysis.missing.filter((match) => normalize(generated.plainText).includes(match.norm));
  check(
    `${example.id}: termos ausentes não entram como competência`,
    missingTerms.every((match) => !generated.skills.some((skill) => normalize(skill) === match.norm)),
    missingTerms.map((match) => match.term).join(", "),
  );
  check(
    `${example.id}: palavras-chave ausentes fora do corpo (só em objetivo)`,
    missingTerms.every((match) => normalize(generated.summary).includes(match.norm)),
    missingTerms.map((match) => match.term).join(", "),
  );
  console.log(`   skills: ${generated.skills.join(" | ")}`);
}

console.log(`\n${failures === 0 ? "Todos os casos passaram" : `${failures} verificação(ões) falharam`}`);
process.exitCode = failures === 0 ? 0 : 1;
