import { scoreText, type Analysis } from "./analyze";
import { CATEGORY_LABELS } from "./lexicon";
import { BULLET_PREFIX, capitalizeFirst, containsPhrase, neatSkill, normalize } from "./text";
import type { KeywordMatch, Requirement } from "./types";

export interface ResumeChange {
  title: string;
  detail: string;
}

export interface ResumeGap {
  term: string;
  category: string;
  requirement: Requirement;
  hint: string;
}

export interface GeneratedExperience {
  titleLines: string[];
  bullets: string[];
  paragraphs: string[];
}

export interface GeneratedResume {
  name: string;
  headline: string;
  contactLines: string[];
  summary: string;
  skills: string[];
  experiences: GeneratedExperience[];
  education: string[];
  languages: string[];
  certifications: string[];
  projects: string[];
  extras: { title: string; lines: string[] }[];
  plainText: string;
  changes: ResumeChange[];
  gaps: ResumeGap[];
  metrics: {
    before: number;
    after: number;
    keywordsBefore: number;
    keywordsAfter: number;
    keywordTotal: number;
  };
}

function joinList(items: string[], conjunction = "e"): string {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  if (list.length === 2) return `${list[0]} ${conjunction} ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} ${conjunction} ${list[list.length - 1]}`;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);
}

function hintFor(match: KeywordMatch): string {
  const term = match.term;
  switch (match.category) {
    case "tool":
      return `Se você já usou ${term}, diga onde e para quê — “relatórios semanais em ${term}”.`;
    case "soft":
      return `Não liste ${term} como adjetivo: mostre em um bullet com resultado concreto.`;
    case "certification":
      return `Inclua ${term} apenas se a certificação existir, com instituição e ano.`;
    case "education":
      return `Se for o caso, informe o curso e a situação (cursando ou concluído) ligado a ${term}.`;
    case "language":
      return `Declare o nível real de ${term} (básico, intermediário, avançado, fluente).`;
    default:
      return `Descreva uma entrega em que você aplicou ${term}, com o resultado que gerou.`;
  }
}

function relevanceScore(text: string, matches: KeywordMatch[]): number {
  const normalized = normalize(text);
  let score = 0;
  for (const match of matches) {
    if (match.strength === "exact" && containsPhrase(normalized, match.norm)) score += 2;
    else if (match.strength === "partial") {
      const tokens = match.norm.split(" ");
      if (tokens.some((token) => containsPhrase(normalized, token))) score += 0.5;
    }
  }
  return score;
}

/** Reordena bullets relevantes para a vaga mantendo o restante na ordem original (sort estável). */
function orderBullets(bullets: string[], matches: KeywordMatch[]): { ordered: string[]; moved: number; hits: number } {
  const scored = bullets.map((bullet, index) => ({
    bullet,
    index,
    score: relevanceScore(bullet, matches),
  }));
  const ordered = [...scored].sort((a, b) => b.score - a.score || a.index - b.index);
  const moved = ordered.filter((item, position) => item.index !== position).length;
  const hits = ordered.filter((item) => item.score > 0).length;
  return { ordered: ordered.map((item) => item.bullet), moved, hits };
}

function buildSummary(analysis: Analysis, topSkills: string[], evidenceSkills: string[]): string {
  const { job, resume } = analysis;
  const objective = job.title ? `Objetivo: ${job.title}.` : "";
  const focus = topSkills.length ? `Foco em ${joinList(topSkills)}.` : "";

  if (resume.summary) {
    const ranked = sentences(resume.summary)
      .map((sentence) => ({ sentence, score: relevanceScore(sentence, analysis.matches) }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.sentence);
    const selected: string[] = [];
    let length = 0;
    for (const sentence of ranked) {
      if (length + sentence.length > 300 && selected.length > 0) break;
      selected.push(sentence);
      length += sentence.length;
    }
    const base = selected.join(" ").replace(/\s+/g, " ").trim();
    if (base) return [base, focus, objective].filter(Boolean).join(" ").slice(0, 620);
  }

  if (evidenceSkills.length >= 2) {
    return `Profissional com experiência em ${joinList(evidenceSkills.slice(0, 3))}. ${focus} ${objective}`
      .replace(/\s+/g, " ")
      .trim();
  }
  if (topSkills.length) {
    return `Profissional com competências em ${joinList(topSkills)}. ${objective}`.replace(/\s+/g, " ").trim();
  }
  return objective;
}

function stripBullet(line: string): string {
  return line.replace(BULLET_PREFIX, "").trim();
}

function buildPlainText(resume: Omit<GeneratedResume, "plainText" | "changes" | "gaps" | "metrics">): string {
  const blocks: string[] = [];
  const header = [resume.name, resume.headline, ...resume.contactLines].filter(Boolean).join("\n");
  if (header) blocks.push(header);
  if (resume.summary) blocks.push(`RESUMO PROFISSIONAL\n${resume.summary}`);
  if (resume.skills.length) blocks.push(`COMPETÊNCIAS\n${resume.skills.join(", ")}`);
  if (resume.experiences.length) {
    const body = resume.experiences
      .map((experience) => {
        const head = experience.titleLines.join("\n");
        const bullets = experience.bullets.map((bullet) => `- ${bullet}`).join("\n");
        const paragraphs = experience.paragraphs.join("\n");
        return [head, bullets, paragraphs].filter(Boolean).join("\n");
      })
      .join("\n\n");
    blocks.push(`EXPERIÊNCIA PROFISSIONAL\n${body}`);
  }
  if (resume.education.length) blocks.push(`FORMAÇÃO ACADÊMICA\n${resume.education.join("\n")}`);
  if (resume.certifications.length) blocks.push(`CURSOS E CERTIFICAÇÕES\n${resume.certifications.join("\n")}`);
  if (resume.languages.length) blocks.push(`IDIOMAS\n${resume.languages.join(" · ")}`);
  if (resume.projects.length) blocks.push(`PROJETOS\n${resume.projects.join("\n")}`);
  for (const extra of resume.extras) {
    if (extra.lines.length) blocks.push(`${extra.title.toUpperCase()}\n${extra.lines.join("\n")}`);
  }
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function generateResume(analysis: Analysis): GeneratedResume {
  const { resume, job, matches } = analysis;
  const exact = matches.filter((match) => match.strength === "exact");
  const partial = matches.filter((match) => match.strength === "partial");
  const supportedAll = [...exact, ...partial].sort(
    (a, b) => (a.requirement === b.requirement ? b.weight - a.weight : a.requirement === "must" ? -1 : 1),
  );
  // Idioma e formação não entram na lista de competências nem no resumo.
  const supported = supportedAll.filter(
    (match) => match.category !== "language" && match.category !== "education",
  );

  const experienceText = resume.experience
    .flatMap((experience) => [...experience.bullets, ...experience.paragraphs])
    .join(" ");

  const topSkills = supported.slice(0, 6).map((match) => match.term);
  const evidenceSkills = supported
    .filter((match) => containsPhrase(normalize(experienceText), match.norm))
    .slice(0, 4)
    .map((match) => match.term);

  // Competências: primeiro o que a vaga pede e o currículo comprova; depois o resto do currículo.
  const skillList: string[] = [];
  const pushSkill = (value: string) => {
    const clean = neatSkill(value);
    const norm = normalize(clean);
    if (!norm || norm.length < 2) return;
    const duplicate = skillList.some((skill) => {
      const other = normalize(skill);
      return other === norm || other.includes(norm) || norm.includes(other);
    });
    if (!duplicate) skillList.push(clean);
  };
  for (const match of supported) {
    const fromResume = resume.skills.find((skill) => {
      const norm = normalize(skill);
      return norm === match.norm || norm.startsWith(match.norm) || match.norm.startsWith(norm);
    });
    pushSkill(fromResume ?? match.term);
  }
  for (const skill of resume.skills) pushSkill(skill);
  const skills = skillList.slice(0, 18);

  let movedBullets = 0;
  let keywordBullets = 0;
  const experiences = resume.experience.map((experience) => {
    const { ordered, moved, hits } = orderBullets(experience.bullets, matches);
    movedBullets += moved;
    keywordBullets += hits;
    return { titleLines: experience.titleLines, bullets: ordered, paragraphs: experience.paragraphs };
  });

  const education = resume.sections.find((section) => section.key === "formacao")?.lines.map(stripBullet) ?? [];
  const languages = resume.sections.find((section) => section.key === "idiomas")?.lines.map(stripBullet) ?? [];
  const certifications = resume.sections
    .find((section) => section.key === "certificacoes")
    ?.lines.map(stripBullet) ?? [];
  const projects = resume.sections.find((section) => section.key === "projetos")?.lines.map(stripBullet) ?? [];
  const extras = resume.sections
    .filter((section) => section.key === "outros")
    .map((section) => ({ title: section.title, lines: section.lines.map(stripBullet) }));

  const summary = buildSummary(analysis, topSkills, evidenceSkills);
  const headline = "";

  const contactLines = [
    ...resume.emails.slice(0, 1),
    ...resume.phones.slice(0, 1),
    ...resume.links.slice(0, 2).map((link) => link.replace(/^https?:\/\//, "").replace(/^www\./, "")),
    ...resume.locationLines.slice(0, 1),
  ];

  const draft = {
    name: resume.name,
    headline,
    contactLines,
    summary,
    skills,
    experiences,
    education,
    languages,
    certifications,
    projects,
    extras,
  };

  const plainText = buildPlainText(draft);
  const after = scoreText(job.keywords, plainText);
  const missing = analysis.missing;

  const changes: ResumeChange[] = [];

  if (summary) {
    const top = topSkills.slice(0, 3);
    changes.push({
      title: resume.summary ? "Resumo reescrito com as prioridades da vaga" : "Resumo criado a partir do seu conteúdo",
      detail: resume.summary
        ? `Mantive suas frases e coloquei na frente as que contêm o que a vaga pede${
            top.length ? `: ${joinList(top)}` : ""
          }.`
        : `Resumo montado apenas com competências que já aparecem no seu currículo${
            top.length ? `: ${joinList(top)}` : ""
          }.`,
    });
  }

  if (skills.length) {
    const aligned = supported.filter((match) => skills.some((skill) => normalize(skill) === match.norm)).length;
    changes.push({
      title: "Competências na ordem que o filtro procura",
      detail: aligned
        ? `${aligned} competência(s) que a vaga pede foram para o topo da lista — todas já estavam no seu currículo.`
        : "Mantive sua lista de competências, reorganizada da mais relevante para a menos relevante.",
    });
  }

  if (movedBullets > 0) {
    changes.push({
      title: "Bullets com palavras-chave subiram de posição",
      detail: `${movedBullets} bullet(s) foram reordenados dentro das experiências; ${keywordBullets} citam termos da vaga. Nenhum texto foi inventado.`,
    });
  }

  if (resume.present.experiencia) {
    changes.push({
      title: "Títulos de seção padronizados",
      detail:
        "Cabeçalhos em formato que o ATS reconhece: Resumo Profissional, Competências, Experiência Profissional, Formação Acadêmica.",
    });
  }

  changes.push({
    title: "Formatação de uma coluna só",
    detail:
      "Sem tabelas, colunas ou caixas de texto. O PDF sai com texto selecionável e o .docx com o mesmo conteúdo, em uma coluna editável.",
  });

  const gains = after.score - analysis.score;
  changes.push({
    title: "Cobertura de palavras-chave medida de novo",
    detail: `Antes: ${analysis.score}% com ${exact.length} termo(s) exato(s). Depois: ${after.score}% com ${after.found} termo(s) exato(s)${
      gains > 0 ? ` (+${gains} pontos)` : ""
    }.`,
  });

  const gaps: ResumeGap[] = missing.map((match) => ({
    term: match.term,
    category: CATEGORY_LABELS[match.category],
    requirement: match.requirement,
    hint: hintFor(match),
  }));

  return {
    ...draft,
    plainText,
    changes,
    gaps,
    metrics: {
      before: analysis.score,
      after: after.score,
      keywordsBefore: exact.length,
      keywordsAfter: after.found,
      keywordTotal: job.keywords.length,
    },
  };
}

export function resumeFileName(name: string): string {
  const slug = (name || "curriculo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "curriculo"}-ats.txt`;
}

export function capitalizeSentence(text: string): string {
  return capitalizeFirst(text);
}
