import { BULLET_PREFIX, normalize, words } from "./text";

export type SectionKey =
  | "resumo"
  | "competencias"
  | "experiencia"
  | "formacao"
  | "idiomas"
  | "certificacoes"
  | "projetos"
  | "outros";

export interface ResumeSection {
  key: SectionKey;
  title: string;
  lines: string[];
}

export interface ResumeExperience {
  /** Linhas de identificação: cargo, empresa, período. */
  titleLines: string[];
  bullets: string[];
  /** Linhas corridas que não são bullets (descrições/parágrafos). */
  paragraphs: string[];
}

export interface ResumeProfile {
  name: string;
  emails: string[];
  phones: string[];
  links: string[];
  locationLines: string[];
  headerLines: string[];
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  sections: ResumeSection[];
  present: Record<SectionKey, boolean>;
  bulletCount: number;
  wordCount: number;
}

const HEADINGS: { key: SectionKey; re: RegExp }[] = [
  {
    key: "resumo",
    re: /^(resumo( profissional)?|objetivo( profissional)?|perfil( profissional)?|sobre( mim)?|apresenta[cç][aã]o|summary|objective|about( me)?)\s*:?$/i,
  },
  {
    key: "competencias",
    re: /^(compet[eê]ncias?( (t[eé]cnicas|comportamentais))?|habilidades?( (t[eé]cnicas|comportamentais))?|conhecimentos?( t[eé]cnicos)?|skills|hard skills|soft skills|tecnologias|stack|qualifica[cç][oõ]es( t[eé]cnicas)?)\s*:?$/i,
  },
  {
    key: "experiencia",
    re: /^(experi[eê]ncias?( profissiona(l|is)| de trabalho)?|hist[oó]rico profissional|trajet[oó]ria profissional|carreira|professional experience|work experience|experience)\s*:?$/i,
  },
  {
    key: "formacao",
    re: /^(forma[cç][aã]o( acad[eê]mica| escolar)?|educa[cç][aã]o|education|academic background)\s*:?$/i,
  },
  {
    key: "idiomas",
    re: /^(idiomas?|l[ií]nguas?|languages?)\s*:?$/i,
  },
  {
    key: "certificacoes",
    re: /^(certifica[cç][oõ]es|certificados?|cursos?( (e|&) (certifica[cç][oõ]es|qualifica[cç][oõ]es))?|certifications?)\s*:?$/i,
  },
  {
    key: "projetos",
    re: /^(projetos?( (pessoais|profissionais))?|portfolio|portf[oó]lio|projects?)\s*:?$/i,
  },
  {
    key: "outros",
    re: /^(informa[cç][oõ]es (adicionais|complementares)|outras informa[cç][oõ]es|atividades (complementares|extracurriculares)|voluntariado|publica[cç][oõ]es|realiza[cç][oõ]es|conquistas|additional information)\s*:?$/i,
  },
];

const SECTION_TITLES: Record<SectionKey, string> = {
  resumo: "Resumo Profissional",
  competencias: "Competências",
  experiencia: "Experiência Profissional",
  formacao: "Formação Acadêmica",
  idiomas: "Idiomas",
  certificacoes: "Cursos e Certificações",
  projetos: "Projetos",
  outros: "Informações Adicionais",
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;
/** Telefone com DDD — evita confundir período de cargo ("2019 - 2021") com contato. */
const CONTACT_PHONE = /(\+55\s?)?(\(?\d{2,3}\)?[\s-]?)?9?\d{4}[\s-]\d{4}/;
const PHONE_RE = /(\+?55[\s-]?)?(\(?\d{2,3}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g;
const LINK_RE = /((https?:\/\/)?(www\.)?(linkedin\.com|github\.com|gitlab\.com|behance\.net|medium\.com)\/[\w\-./?=&#%]+)/gi;

function stripMarkdown(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*>\s?/, "")
    .trim();
}

export function matchHeading(line: string): SectionKey | null {
  const cleaned = stripMarkdown(line)
    .replace(/[:\-–—\s]+$/, "")
    .replace(/^[•*·-]\s*/, "")
    .trim();
  if (!cleaned || cleaned.length > 48) return null;
  for (const heading of HEADINGS) {
    if (heading.re.test(cleaned)) return heading.key;
  }
  return null;
}

function splitSkills(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const cleaned = line.replace(BULLET_PREFIX, "").trim();
    if (!cleaned) continue;
    for (const chunk of cleaned.split(/[,;•·|]+/)) {
      const item = chunk.replace(/^[\s\-–—]+/, "").replace(/[.\s]+$/, "").trim();
      if (item.length < 2 || item.length > 48) continue;
      if (/\b(https?:|@)\b/.test(item)) continue;
      items.push(item);
    }
  }
  return items;
}

const DATE_RANGE = /\b(19|20)\d{2}\b/;
const ROLE_LINE = /(20\d{2}|19\d{2})\s*[-–—a]+\s*(\d{2,4}|atual|o momento|presente|hoje)/i;
const EDUCATION_HINT =
  /(bacharelado|licenciatura|tecn[óo]logo|gradua[cç][aã]o|ensino superior|universidade|faculdade|centro universit[aá]rio|mestrado|doutorado|p[óo]s-gradua[cç][aã]o)/i;

/**
 * Currículo colado de PDF/DOCX costuma vir sem títulos de seção. Quando nenhum bloco de
 * conteúdo foi reconhecido, separa o texto corrido por padrões: linha de período inicia
 * uma experiência; linha de formação com ano vira Formação; o resto vira competências.
 */
function splitUntitledContent(
  lines: string[],
  buckets: Record<SectionKey, string[]>,
  order: SectionKey[],
): void {
  const clean = lines.filter((line) => line.trim());
  const firstPeriod = clean.findIndex(
    (line) => ROLE_LINE.test(line) || /\(\s*(19|20)\d{2}\s*[-–—]/.test(line),
  );
  if (firstPeriod < 0) return;

  const preamble = clean.slice(0, firstPeriod);
  const body = clean.slice(firstPeriod);
  const educationIndex = body.findIndex(
    (line) => EDUCATION_HINT.test(line) && /(19|20)\d{2}/.test(line),
  );

  buckets.experiencia = educationIndex >= 0 ? body.slice(0, educationIndex) : body;
  if (!order.includes("experiencia")) order.push("experiencia");

  if (educationIndex >= 0) {
    const tail = body.slice(educationIndex);
    buckets.formacao = [tail[0]];
    if (!order.includes("formacao")) order.push("formacao");
    const tailSkills = tail.slice(1).filter((line) => !/@|https?:|www\./.test(line));
    const listSkills = tailSkills.filter((line) => /[,;|]/.test(line));
    const skills = listSkills.length > 0 ? listSkills : tailSkills;
    if (skills.length > 0) {
      buckets.competencias = skills;
      if (!order.includes("competencias")) order.push("competencias");
    }
  }

  buckets.resumo = preamble.filter((line) => line.length > 30);
}

function parseExperience(lines: string[]): ResumeExperience[] {
  const blocks: string[][] = [];
  let current: string[] = [];

  const pushBlock = () => {
    if (current.some((line) => line.trim())) blocks.push(current);
    current = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      pushBlock();
      continue;
    }
    // Quando o texto colado perde as linhas em branco, uma linha de período
    // (ex.: "Analista — Acme, 2021 - 2024") marca o começo de uma nova experiência.
    if (
      current.length > 0 &&
      ROLE_LINE.test(line) &&
      !BULLET_PREFIX.test(line) &&
      line.length < 120
    ) {
      pushBlock();
    }
    current.push(line);
  }
  pushBlock();

  const experiences: ResumeExperience[] = [];
  for (const block of blocks) {
    const titleLines: string[] = [];
    const bullets: string[] = [];
    const paragraphs: string[] = [];
    for (const line of block) {
      if (BULLET_PREFIX.test(line)) {
        bullets.push(line.replace(BULLET_PREFIX, "").trim());
      } else if (bullets.length === 0 && paragraphs.length === 0) {
        titleLines.push(line);
      } else {
        paragraphs.push(line);
      }
    }
    // Bullets soltos no começo e período depois: reorganiza identificação.
    if (bullets.length === 0 && paragraphs.length > 0) {
      const first = paragraphs.shift();
      if (first) titleLines.push(first);
    }
    experiences.push({
      titleLines: titleLines.filter(Boolean),
      bullets: bullets.filter(Boolean),
      paragraphs: paragraphs.filter(Boolean),
    });
  }
  return experiences.filter(
    (exp) => exp.titleLines.length > 0 || exp.bullets.length > 0 || exp.paragraphs.length > 0,
  );
}

function pickName(headerLines: string[]): string {
  for (const line of headerLines) {
    const cleaned = line.replace(/^#+\s*/, "").trim();
    if (!cleaned) continue;
    if (/@|https?:|www\.|\d{3}/.test(cleaned)) continue;
    if (cleaned.length > 60) continue;
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ.'\s]{2,}$/.test(cleaned)) continue;
    return cleaned;
  }
  return "";
}

export function parseResume(raw: string): ResumeProfile {
  const text = raw.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ");
  const lines = text.split("\n");

  const buckets: Record<SectionKey, string[]> = {
    resumo: [],
    competencias: [],
    experiencia: [],
    formacao: [],
    idiomas: [],
    certificacoes: [],
    projetos: [],
    outros: [],
  };
  const order: SectionKey[] = [];
  let current: SectionKey | null = null;
  const headerLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = line ? matchHeading(line) : null;
    if (heading) {
      current = heading;
      if (!order.includes(heading)) order.push(heading);
      continue;
    }
    if (!line) {
      if (current) buckets[current].push("");
      continue;
    }
    if (current) buckets[current].push(line);
    else if (headerLines.length < 8) headerLines.push(line);
    else {
      current = "resumo";
      order.push("resumo");
      buckets.resumo.push(line);
    }
  }

  const hasContentSection =
    buckets.experiencia.some(Boolean) || buckets.formacao.some(Boolean) || buckets.competencias.some(Boolean);

  if (!hasContentSection && headerLines.length > 2) {
    const nameLine = pickName(headerLines);
    let lastContact = 0;
    headerLines.forEach((line, index) => {
      if (EMAIL_RE.test(line) || LINK_RE.test(line) || CONTACT_PHONE.test(line)) lastContact = index;
    });
    const nameIndex = headerLines.findIndex(
      (line) => nameLine !== "" && normalize(line.replace(/^#+\s*/, "")) === normalize(nameLine),
    );
    const cut = Math.max(lastContact, nameIndex, 0) + 1;
    const overflow = headerLines.splice(cut);
    if (overflow.length > 0) splitUntitledContent([...overflow, ...buckets.resumo], buckets, order);
  }

  const joined = text;
  const emails = Array.from(new Set(joined.match(EMAIL_RE) ?? []));
  const phones = Array.from(
    new Set((joined.match(PHONE_RE) ?? []).map((p) => p.trim()).filter((p) => p.replace(/\D/g, "").length >= 10)),
  );
  const links = Array.from(new Set((joined.match(LINK_RE) ?? []).map((l) => l.replace(/\/$/, ""))));

  const detectedName = pickName(headerLines);
  const locationLines = headerLines.filter((line) => {
    const cleanedLine = line.replace(/^#+\s*/, "").trim();
    if (!cleanedLine) return false;
    if (normalize(cleanedLine) === normalize(detectedName)) return false;
    if (/@|https?:|www\.|linkedin\.com|github\.com/.test(cleanedLine)) return false;
    if (CONTACT_PHONE.test(cleanedLine)) return false;
    return cleanedLine.length <= 60;
  });

  const summary = buckets.resumo
    .map((line) => line.replace(BULLET_PREFIX, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const skills = splitSkills(buckets.competencias);
  const experience = parseExperience(buckets.experiencia);

  const sections: ResumeSection[] = order.map((key) => ({
    key,
    title: SECTION_TITLES[key],
    lines: buckets[key].filter(Boolean),
  }));

  const present = Object.fromEntries(
    (Object.keys(buckets) as SectionKey[]).map((key) => [key, buckets[key].filter(Boolean).length > 0]),
  ) as Record<SectionKey, boolean>;

  const bulletCount = lines.filter((line) => BULLET_PREFIX.test(line)).length;

  return {
    name: detectedName,
    emails,
    phones,
    links,
    locationLines,
    headerLines,
    summary,
    skills,
    experience,
    sections,
    present,
    bulletCount,
    wordCount: words(text).length,
  };
}

export { SECTION_TITLES, DATE_RANGE };
