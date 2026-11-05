import { BULLET_PREFIX, words } from "./text";

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

  const joined = text;
  const emails = Array.from(new Set(joined.match(EMAIL_RE) ?? []));
  const phones = Array.from(
    new Set((joined.match(PHONE_RE) ?? []).map((p) => p.trim()).filter((p) => p.replace(/\D/g, "").length >= 10)),
  );
  const links = Array.from(new Set((joined.match(LINK_RE) ?? []).map((l) => l.replace(/\/$/, ""))));

  const locationLines = headerLines.filter((line) => {
    if (line === pickName(headerLines)) return false;
    if (/@|https?:|www\.|linkedin\.com|github\.com/.test(line)) return false;
    const digits = line.replace(/\D/g, "").length;
    if (digits >= 8) return false;
    return line.length <= 60;
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
    name: pickName(headerLines),
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
