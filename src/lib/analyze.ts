import {
  CATEGORY_BASE_WEIGHT,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  LEXICON,
} from "./lexicon";
import { parseResume, type ResumeProfile } from "./parseResume";
import {
  ACTION_VERBS,
  BULLET_PREFIX,
  capitalizeFirst,
  containsPhrase,
  countPhrase,
  displayTerm,
  normalize,
  partialCoverage,
  tokenize,
  tokensEquivalent,
  uniqueBy,
  words,
} from "./text";
import type {
  AtsCheck,
  CheckStatus,
  JobKeyword,
  KeywordCategory,
  KeywordMatch,
  Requirement,
} from "./types";

export interface JobProfile {
  title: string;
  company: string;
  keywords: JobKeyword[];
  wordCount: number;
}

export interface CategoryScore {
  category: KeywordCategory;
  label: string;
  found: number;
  partial: number;
  total: number;
  score: number;
}

export interface Analysis {
  job: JobProfile;
  resume: ResumeProfile;
  matches: KeywordMatch[];
  found: KeywordMatch[];
  partial: KeywordMatch[];
  missing: KeywordMatch[];
  score: number;
  grade: { label: string; tone: "low" | "mid" | "high"; note: string };
  categories: CategoryScore[];
  health: AtsCheck[];
  healthScore: number;
}

type SegmentKind = "must" | "nice" | "benefits" | "body";

const BENEFITS_HEADING =
  /(benef[ií]cios|oferecemos|o que oferecemos|remunera[cç][aã]o|sal[aá]rio|sobre a empresa|nossa empresa|quem somos|como se candidatar|etapas do processo|localiza[cç][aã]o|modelo de trabalho|jornada|hor[aá]rio|diversidade|inclus[aã]o)/i;
const NICE_HEADING =
  /(desej[aá]vel|diferencial|diferenciais|nice to have|prefer[ií]vel|ser[aá] um plus|plus|points? extras?|pontos? extras?)/i;
const MUST_HEADING =
  /(requisitos|requisito|obrigat[oó]rio|necess[aá]rio|imprescind[ií]vel|qualifica[cç][oõ]es|o que buscamos|o que esperamos|perfil desejado|viv[eê]ncia|experi[eê]ncia|responsabilidades|atribui[cç][oõ]es|atividades|principais desafios|sobre a vaga)/i;

/** Divide o anúncio em blocos para saber se um termo é requisito ou diferencial. */
function segmentJob(text: string): { lines: string[]; kinds: SegmentKind[] } {
  const lines: string[] = [];
  const kinds: SegmentKind[] = [];
  let kind: SegmentKind = "body";

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const isHeading = line.length <= 90 && !/[.;]$/.test(line);
    if (isHeading) {
      if (BENEFITS_HEADING.test(line)) kind = "benefits";
      else if (NICE_HEADING.test(line)) kind = "nice";
      else if (MUST_HEADING.test(line)) kind = "must";
    }
    lines.push(line);
    kinds.push(kind);
  }
  return { lines, kinds };
}

function kindForTerm(
  norm: string,
  segmented: { lines: string[]; kinds: SegmentKind[] },
): SegmentKind | null {
  for (let i = 0; i < segmented.lines.length; i += 1) {
    if (containsPhrase(normalize(segmented.lines[i]), norm)) return segmented.kinds[i];
  }
  return null;
}

const ACRONYM_RE = /\b([A-Z]{2,6}(?:\/[A-Z]{2,5})?)\b/;

/** "Analista de Dados Pleno — Loggi (São Paulo, híbrido)" → "Analista de Dados Pleno". */
function trimJobTitle(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " " ).trim();
  const head = cleaned.split(/\s+[—–|]\s+|\s+-\s+/)[0].trim();
  return head
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/[,;.]+$/, "")
    .slice(0, 70);
}

function extractJobTitle(text: string): string {
  const explicit = text.match(
    /(?:^|\n)\s*(?:vaga|t[ií]tulo(?: da vaga)?|cargo|posi[cç][aã]o)\s*[:\-–]\s*([^\n]{3,90})/i,
  );
  if (explicit) return capitalizeFirst(trimJobTitle(explicit[1]));

  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (
    firstLine &&
    firstLine.length <= 90 &&
    !/[.!?]$/.test(firstLine) &&
    !/^(sobre|descri[cç][aã]o|estamos|buscamos|responsabilidades|requisitos)/i.test(firstLine)
  ) {
    return capitalizeFirst(trimJobTitle(firstLine.replace(/^#+\s*/, "")));
  }
  return "";
}

function extractCompany(text: string): string {
  const explicit = text.match(
    /(?:^|\n)\s*(?:empresa|company|contratante|organiza[cç][aã]o)\s*[:\-–]\s*([^\n]{2,60})/i,
  );
  if (explicit) return explicit[1].trim().replace(/[.;]$/, "");
  const headLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";
  const afterSeparator = headLine.split(/\s+[—–|]\s+/)[1];
  return afterSeparator ? afterSeparator.replace(/\s*\([^)]*\)\s*$/, "").trim().slice(0, 60) : "";
}

/** Mais rápido que varrer o léxico inteiro a cada termo: pré-normaliza o anúncio. */
function buildJobKeywords(text: string, normalizedJob: string): JobKeyword[] {
  const segmented = segmentJob(text);
  const keywords: JobKeyword[] = [];

  for (const category of CATEGORY_ORDER) {
    for (const term of LEXICON[category]) {
      const norm = normalize(term);
      const count = countPhrase(normalizedJob, norm);
      if (count === 0) continue;
      const kind = kindForTerm(norm, segmented);
      if (kind === "benefits") continue;
      const requirement: Requirement = kind === "nice" ? "nice" : "must";
      const weight =
        CATEGORY_BASE_WEIGHT[category] *
        (kind === "must" ? 1.1 : kind === "nice" ? 0.75 : 1) *
        Math.min(1.4, 1 + 0.1 * (count - 1));
      keywords.push({
        term: capitalizeTerm(term),
        norm,
        category,
        weight: Math.round(weight * 100) / 100,
        requirement,
        countInJob: count,
        origin: "lexicon",
      });
    }
  }

  // Recupera termos específicos do anúncio que o léxico não cobre.
  const knownNorms = keywords.map((keyword) => keyword.norm);
  const tokenCounts = new Map<string, number>();
  const tokenDisplay = new Map<string, string>();

  for (let i = 0; i < segmented.lines.length; i += 1) {
    if (segmented.kinds[i] === "benefits") continue;
    const original = segmented.lines[i];
    for (const rawToken of original.split(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9+#./-]+/)) {
      const cleaned = rawToken.replace(/^[-–—•*·.)]+|[-–—•*·.(]+$/g, "");
      if (cleaned.length < 3 || cleaned.length > 24) continue;
      const norm = normalize(cleaned);
      if (!norm || norm.includes(" ")) continue;
      if (STOPWORD_LOCAL.has(norm)) continue;
      if (knownNorms.some((known) => containsPhrase(norm, known))) continue;
      tokenCounts.set(norm, (tokenCounts.get(norm) ?? 0) + 1);
      if (!tokenDisplay.has(norm)) tokenDisplay.set(norm, cleaned);
    }
  }

  for (const [norm, count] of tokenCounts) {
    const display = tokenDisplay.get(norm) ?? norm;
    const isAcronym = ACRONYM_RE.test(display);
    if (count < 2 && !isAcronym) continue;
    if (norm.length < 4 && !isAcronym) continue;
    const kind = kindForTerm(norm, segmented);
    if (kind === "benefits") continue;
    const requirement: Requirement = kind === "nice" ? "nice" : "must";
    const weight =
      (isAcronym ? 2.2 : 1.5) * (kind === "must" ? 1 : 0.7) * Math.min(1.3, 1 + 0.1 * (count - 1));
    keywords.push({
      term: isAcronym ? display.toUpperCase() : displayTerm(display),
      norm,
      category: isAcronym ? "tool" : "skill",
      weight: Math.round(weight * 100) / 100,
      requirement,
      countInJob: count,
      origin: "extracted",
    });
  }

  const deduped = uniqueBy(
    keywords.sort((a, b) => b.weight - a.weight),
    (keyword) => keyword.norm,
  );

  // Um termo que já está coberto por outro mais longo não entra de novo.
  const filtered = deduped.filter((keyword) => {
    return !deduped.some(
      (other) =>
        other !== keyword &&
        other.norm !== keyword.norm &&
        other.norm.includes(keyword.norm) &&
        other.weight >= keyword.weight,
    );
  });

  const musts = filtered.filter((keyword) => keyword.requirement === "must");
  const nices = filtered.filter((keyword) => keyword.requirement === "nice");
  return [...musts.slice(0, 24), ...nices.slice(0, 10)].sort((a, b) => b.weight - a.weight);
}

const STOPWORD_LOCAL = new Set(
  `para como mais sobre entre muito ainda todo toda todos todas esse essa este esta isso isto pelo pela pelos pelas seu sua seus suas nosso nossa nossos nossas quando onde qual quais quem cujo seja sejam será sera foram estar está esta estao estão temos tenho fazer feito fazendo pode podem poder deve devem dentro apos após antes durante desde cada outro outra outros outras mesmo mesma apenas ainda também tambem aquilo aquele aquela ate até com sem por que dos das nos nas num numa ao aos à às
  the and for with from that this will you your our their have has been are was were not but all any can may more most other such than there these they what when which while who would should about above after again also
  time times dia dias mes meses ano anos hora horas parte vezes forma trabalho trabalhar empresa empresas vaga vagas cargo area área atividades atividades responsabilidades requisitos perfil profissional desejável desejavel diferencial necessario necessário obrigatório obrigatorio experiência experiencia conhecimentos conhecimento habilidade habilidades competencia competências gestao gestão projeto projetos equipe equipes cliente clientes resultado resultados processo processos negocio negócio mercado dados informacao informação sistema sistemas ferramenta ferramentas
  analista assistente especialista coordenador coordenadora gerente supervisor supervisora diretor diretora pleno junior jr senior sr estagio estagiario estagiária temporario temporária consultor consultora desenvolvedor desenvolvedora engenheiro engenheira tecnico técnica auxiliar atendente vendedor vendedora representante pessoa pessoas time times area áreas setor setores
  intermediario intermediário avancado avançado basico básico fluente completo completa cursando concluido concluído desejavel desejável necessario necessário obrigatorio obrigatório imprescindivel imprescindível
  nossa neste nesta nesse nessa estes estas `
    .split(/\s+/)
    .filter(Boolean),
);

function capitalizeTerm(term: string): string {
  return displayTerm(term);
}

function matchKeyword(keyword: JobKeyword, normalizedResume: string, resumeTokens: string[]): KeywordMatch {
  const exact = countPhrase(normalizedResume, keyword.norm);
  if (exact > 0) {
    return {
      ...keyword,
      strength: "exact",
      countInResume: exact,
      found: true,
      coverage: 1,
    };
  }

  const termTokens = keyword.norm.split(" ").filter((token) => token.length > 1);
  const tokenHits = termTokens.filter((term) =>
    resumeTokens.some((resumeToken) => tokensEquivalent(term, resumeToken)),
  ).length;
  const ratio = termTokens.length > 0 ? tokenHits / termTokens.length : 0;

  if (termTokens.length > 1 && ratio >= 0.6) {
    return {
      ...keyword,
      strength: "partial",
      countInResume: tokenHits,
      found: true,
      coverage: 0.6,
    };
  }

  if (termTokens.length === 1) {
    const partial = partialCoverage(normalizedResume, keyword.norm);
    if (partial >= 0.9) {
      return {
        ...keyword,
        strength: "partial",
        countInResume: 1,
        found: true,
        coverage: 0.6,
      };
    }
  }

  return { ...keyword, strength: "none", countInResume: 0, found: false, coverage: 0 };
}

function weightedScore(matches: KeywordMatch[]): number {
  let numerator = 0;
  let denominator = 0;
  for (const match of matches) {
    const importance = match.weight * (match.requirement === "must" ? 1 : 0.6);
    denominator += importance;
    numerator += importance * match.coverage;
  }
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function categoryScores(matches: KeywordMatch[]): CategoryScore[] {
  return CATEGORY_ORDER.map((category) => {
    const items = matches.filter((match) => match.category === category);
    const found = items.filter((match) => match.strength === "exact").length;
    const partial = items.filter((match) => match.strength === "partial").length;
    return {
      category,
      label: CATEGORY_LABELS[category],
      found,
      partial,
      total: items.length,
      score: items.length ? weightedScore(items) : 0,
    };
  }).filter((entry) => entry.total > 0);
}

function gradeFor(score: number): Analysis["grade"] {
  if (score >= 80)
    return {
      label: "Match forte",
      tone: "high",
      note: "O currículo já fala a língua da vaga. A versão ajustada organiza isso para o ATS ler primeiro.",
    };
  if (score >= 60)
    return {
      label: "Match bom",
      tone: "mid",
      note: "Boa base: as competências principais aparecem. Faltam termos que o filtro pode exigir.",
    };
  if (score >= 40)
    return {
      label: "Match parcial",
      tone: "mid",
      note: "Parte das palavras-chave está no currículo, mas em outra formulação. Ajustar a apresentação ajuda.",
    };
  return {
    label: "Match baixo",
    tone: "low",
    note: "A vaga pede termos que o currículo quase não usa. Revise o conteúdo, não só o formato.",
  };
}

function status(pass: boolean, warn = false): CheckStatus {
  if (pass) return "pass";
  return warn ? "warn" : "fail";
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;

export function checkAts(resumeText: string, resume: ResumeProfile): AtsCheck[] {
  const text = resumeText.replace(/\r\n?/g, "\n");
  const lines = text.split("\n").map((line) => line.trim());
  const bulletLines = lines.filter((line) => BULLET_PREFIX.test(line));
  const numberInBullets = bulletLines.filter((line) => /\d|%/.test(line)).length;
  const actionBullets = bulletLines.filter((line) => {
    const first = line.replace(BULLET_PREFIX, "").split(/\s+/)[0] ?? "";
    return ACTION_VERBS.has(normalize(first));
  }).length;
  const years = text.match(/\b(19|20)\d{2}\b/g)?.length ?? 0;
  const wordCount = resume.wordCount;
  const tabularLines = lines.filter((line) => (line.match(/\|/g)?.length ?? 0) >= 2).length;
  const hasEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text);
  const hasLinks = resume.links.length > 0;

  return [
    {
      id: "email",
      label: "E-mail de contato no topo",
      status: status(EMAIL_RE.test(text)),
      detail: EMAIL_RE.test(text)
        ? "Encontrado. É a primeira coisa que o ATS indexa."
        : "Sem e-mail o ATS não consegue criar o candidato. Coloque o e-mail no cabeçalho.",
      weight: 3,
    },
    {
      id: "phone",
      label: "Telefone com DDD",
      status: status(resume.phones.length > 0, true),
      detail: resume.phones.length
        ? "Telefone legível encontrado."
        : "Inclua telefone com DDD — formato (11) 91234-5678.",
      weight: 2,
    },
    {
      id: "links",
      label: "LinkedIn ou portfólio",
      status: status(hasLinks, true),
      detail: hasLinks
        ? "Link profissional encontrado."
        : "Adicione linkedin.com/in/seu-nome, mesmo que seja só para contexto.",
      weight: 1,
    },
    {
      id: "summary",
      label: "Seção de resumo/objetivo",
      status: status(resume.present.resumo, true),
      detail: resume.present.resumo
        ? "Seção identificada."
        : "Um resumo de 3 linhas com cargo-alvo e competências ajuda o ranqueamento.",
      weight: 2,
    },
    {
      id: "experience",
      label: "Seção de experiência com títulos claros",
      status: status(resume.present.experiencia, true),
      detail: resume.present.experiencia
        ? "Seção identificada — o ATS reconhece o título padrão."
        : "Use o título exato “Experiência Profissional”; títulos criativos não são indexados.",
      weight: 3,
    },
    {
      id: "education",
      label: "Seção de formação",
      status: status(resume.present.formacao, true),
      detail: resume.present.formacao
        ? "Seção identificada."
        : "Inclua “Formação Acadêmica” com curso, instituição e ano de conclusão.",
      weight: 2,
    },
    {
      id: "skills",
      label: "Lista de competências",
      status: status(resume.present.competencias || resume.skills.length >= 5, true),
      detail:
        resume.present.competencias || resume.skills.length >= 5
          ? "Competências listadas de forma pesquisável."
          : "Liste as ferramentas e competências em texto simples, separadas por vírgula.",
      weight: 2,
    },
    {
      id: "bullets",
      label: "Bullets com realizações",
      status: status(bulletLines.length >= 3, true),
      detail:
        bulletLines.length >= 3
          ? `${bulletLines.length} bullets encontrados.`
          : "Descreva cada experiência em 2–4 bullets curtos em vez de parágrafos.",
      weight: 2,
    },
    {
      id: "dates",
      label: "Datas nos cargos",
      status: status(years >= 2, true),
      detail:
        years >= 2
          ? `${years} anos citados — o ATS calcula tempo de casa.`
          : "Informe mês/ano de entrada e saída em cada experiência.",
      weight: 2,
    },
    {
      id: "length",
      label: "Tamanho adequado",
      status: wordCount >= 250 && wordCount <= 900 ? "pass" : wordCount >= 150 && wordCount <= 1200 ? "warn" : "fail",
      detail: `${wordCount} palavras. O ideal é 350–800: suficiente para as palavras-chave, curto para a leitura.`,
      weight: 2,
    },
    {
      id: "layout",
      label: "Sem tabelas, colunas ou emojis",
      status: status(tabularLines < 2 && !hasEmoji, true),
      detail:
        tabularLines < 2 && !hasEmoji
          ? "Layout de uma coluna, sem elementos que quebram a leitura."
          : "Tabelas, colunas e emojis embaralham a extração. Use texto corrido em uma coluna.",
      weight: 2,
    },
    {
      id: "metrics",
      label: "Resultados com números",
      status: status(numberInBullets >= 2, true),
      detail:
        numberInBullets >= 2
          ? `${numberInBullets} bullets com números ou percentuais.`
          : "Números dão credibilidade: “reduzi o tempo de fechamento em 30%”.",
      weight: 1,
    },
    {
      id: "verbs",
      label: "Verbos de ação nos bullets",
      status: status(actionBullets >= Math.max(2, Math.floor(bulletLines.length / 3)), true),
      detail:
        actionBullets >= 2
          ? `${actionBullets} bullets começam com verbo de ação.`
          : "Comece cada bullet com um verbo: liderei, implementei, reduzi, automatizei.",
      weight: 1,
    },
    {
      id: "language",
      label: "Idiomas e nível",
      status: status(resume.present.idiomas, true),
      detail: resume.present.idiomas
        ? "Seção identificada."
        : "Inclua idiomas com nível (ex.: Inglês — avançado).",
      weight: 1,
    },
  ];
}

export function analyze(jobText: string, resumeText: string): Analysis {
  const normalizedJob = normalize(jobText);
  const normalizedResume = normalize(resumeText);
  const resume = parseResume(resumeText);
  const resumeTokens = tokenize(normalizedResume);

  const jobKeywords = buildJobKeywords(jobText, normalizedJob);
  const matches = jobKeywords.map((keyword) => matchKeyword(keyword, normalizedResume, resumeTokens));

  const score = weightedScore(matches);
  const health = checkAts(resumeText, resume);
  const totalWeight = health.reduce((sum, check) => sum + check.weight, 0);
  const earned = health.reduce(
    (sum, check) => sum + check.weight * (check.status === "pass" ? 1 : check.status === "warn" ? 0.5 : 0),
    0,
  );

  const job: JobProfile = {
    title: extractJobTitle(jobText),
    company: extractCompany(jobText),
    keywords: jobKeywords,
    wordCount: words(jobText).length,
  };

  return {
    job,
    resume,
    matches,
    found: matches.filter((match) => match.strength === "exact"),
    partial: matches.filter((match) => match.strength === "partial"),
    missing: matches.filter((match) => match.strength === "none"),
    score,
    grade: gradeFor(score),
    categories: categoryScores(matches),
    health,
    healthScore: Math.round((earned / Math.max(1, totalWeight)) * 100),
  };
}

/** Recalcula o match de um texto contra as mesmas palavras-chave do anúncio. */
export function scoreText(keywords: JobKeyword[], text: string): {
  score: number;
  matches: KeywordMatch[];
  found: number;
  partial: number;
} {
  const normalized = normalize(text);
  const tokens = tokenize(normalized);
  const matches = keywords.map((keyword) => matchKeyword(keyword, normalized, tokens));
  return {
    score: weightedScore(matches),
    matches,
    found: matches.filter((match) => match.strength === "exact").length,
    partial: matches.filter((match) => match.strength === "partial").length,
  };
}
