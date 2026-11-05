/**
 * Utilitários de texto usados pelo motor de análise.
 * Tudo roda no navegador: nenhum texto do usuário sai do dispositivo.
 */

const ACCENT_MARKS = /[\u0300-\u036f]/g;

/** Minúsculas, sem acento, sem pontuação "decorativa" — mantém . / - + # para node.js, ci/cd, c++. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(ACCENT_MARKS, "")
    .toLowerCase()
    .replace(/[“”"’‘`]/g, " ")
    .replace(/[^a-z0-9+#./\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BOUNDARY_BEFORE = "(^|[^a-z0-9])";
const BOUNDARY_AFTER = "([^a-z0-9]|$)";

/** Quantas vezes a expressão aparece como palavra/frase inteira no texto já normalizado. */
export function countPhrase(normalizedText: string, normalizedTerm: string): number {
  if (!normalizedTerm) return 0;
  const re = new RegExp(BOUNDARY_BEFORE + escapeRegExp(normalizedTerm) + BOUNDARY_AFTER, "g");
  let count = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalizedText)) !== null) {
    count += 1;
    if (match.index === re.lastIndex) re.lastIndex += 1;
    if (count > 40) break;
  }
  return count;
}

export function containsPhrase(normalizedText: string, normalizedTerm: string): boolean {
  return countPhrase(normalizedText, normalizedTerm) > 0;
}

/** Tokens alfanuméricos, sem stopwords, com 2+ caracteres. */
export function tokenize(input: string): string[] {
  return normalize(input)
    .split(/[^a-z0-9+#]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/** Compara dois termos tolerando plural/variação curta (react / reactjs, competencia / competencias). */
export function tokensEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5) return false;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (!longer.startsWith(shorter)) return false;
  return shorter.length / longer.length >= 0.72;
}

/**
 * Cobertura parcial de uma frase: quantos tokens do termo aparecem no texto.
 * Usada só quando a frase exata não aparece (ex.: vaga pede "análise de dados"
 * e o currículo fala "análises de dados" ou "análise dos dados").
 */
export function partialCoverage(normalizedText: string, normalizedTerm: string): number {
  const termTokens = normalizedTerm.split(" ").filter((t) => t.length > 1);
  if (termTokens.length === 0) return 0;
  const textTokens = tokenize(normalizedText);
  if (textTokens.length === 0) return 0;
  let hits = 0;
  for (const termToken of termTokens) {
    if (textTokens.some((textToken) => tokensEquivalent(termToken, textToken))) hits += 1;
  }
  return hits / termTokens.length;
}

export function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-–—]$/, "")}…`;
}

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
export function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    result.push(item);
  }
  return result;
}

export const STOPWORDS = new Set(
  `a à às ao aos aquela aquelas aquele aqueles aquilo as até com como da das de dela delas dele deles depois do dos e ela elas ele eles em entre era eram essa essas esse esses esta estas este estes eu foi fomos for foram fosse fui há isso isto já lhe lhes mais mas me mesmo meu meus minha minhas muito na nas não no nos nós num numa o os ou para pela pelas pelo pelos por qual quais quando que quem se sem seu seus sua suas são sobre também te tem tém temos tenho ter teu teus tua tuas um uma você vocês
  a an and are as at be been being but by can do does for from had has have he her his how i if in into is it its may more most much my no not of on or our out she should so some such than that the their them then there these they this to too under up was we were what when where which while who will with would you your
  vaga vagas empresa empresas cargo cargos posição posicao área area atividades atividade atribuições atribuicoes responsável responsavel responsabilidades requisitos requisito perfil profissional profissionalmente desejável desejavel diferencial diferenciais necessário necessario obrigatório obrigatorio experiência experiencia conhecimentos conhecimento habilidades habilidade competências competencias trabalho trabalhar trabalhando atuação atuacao atuar buscamos procuramos procuramos estamos será sera ser ter tenha tenha você voce nós nos local local de remoto híbrido hibrido presencial jornada salário salario benefícios beneficios oferecemos oportunidades oportunidade candidato candidata candidatos candidatas
  anos ano mês mes meses dia dias semana semanas hora horas forma formas parte partes vez vezes etc
  sobre como mais menos muito pouco todos todas todo toda outro outra outros outras mesmo mesma`
    .split(/\s+/)
    .filter(Boolean),
);

/** Verbos de ação que bons bullets de currículo usam no início da frase. */
export const ACTION_VERBS = new Set(
  `liderei liderança liderar conduzi conduzir implementei implementar desenvolvi desenvolver criei criar construí construi construir reduzi reduzir aumentei aumentar melhorei melhorar otimizei otimizar automatizei automatizar gerenciei gerenciar coordenei coordenar organizei organizar estruturei estruturar analisei analisar negociei negociar implantei implantar migrei migrar refatorei refatorar projetei projetar executei executar apoiei apoiar atendi atender treinei treinar mentorei mentorar acompanhei acompanhar controlei controlar planejei planejar padronizei padronizar documentei documentar integrei integrar acelerei acelerar recuperei recuperar expandi expandir administrei administrar geri gerir garanti garantir validei validar mapeei mapear elaborei elaborar propus propor apresentei apresentar publiquei publicar
  led lead built build created create designed design developed develop implemented implement improved improve increased increase reduced reduce managed manage analyzed analyse automated automate launched launch delivered deliver migrated migrate optimized optimize`
    .split(/\s+/)
    .filter(Boolean),
);

export const BULLET_PREFIX = /^\s*([-•*·●○▪▫►‣◦✓✔–—+]|\d+[.)])\s+/;

/** Nomes próprios e grafias que devem ser preservadas na saída. */
const PROPER_NOUNS: Record<string, string> = {
  "power bi": "Power BI",
  "power query": "Power Query",
  bigquery: "BigQuery",
  javascript: "JavaScript",
  typescript: "TypeScript",
  github: "GitHub",
  gitlab: "GitLab",
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  "sql server": "SQL Server",
  "node.js": "Node.js",
  "next.js": "Next.js",
  "react native": "React Native",
  "spring boot": "Spring Boot",
  "google sheets": "Google Sheets",
  "google analytics": "Google Analytics",
  "google ads": "Google Ads",
  "google tag manager": "Google Tag Manager",
  "looker studio": "Looker Studio",
  "google data studio": "Google Data Studio",
  "qlik sense": "Qlik Sense",
  "meta ads": "Meta Ads",
  "rd station": "RD Station",
  "excel vba": "Excel VBA",
  "excel avançado": "Excel avançado",
  "excel avancado": "Excel avançado",
  "power bi ": "Power BI",
  kpis: "KPIs",
  kpi: "KPI",
  slas: "SLAs",
  "okrs": "OKRs",
  dbt: "dbt",
  "p&l": "P&L",
  "customer success": "Customer Success",
  "business intelligence": "Business Intelligence",
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  pipedrive: "Pipedrive",
  zendesk: "Zendesk",
  freshdesk: "Freshdesk",
  databricks: "Databricks",
  snowflake: "Snowflake",
  airflow: "Airflow",
  jira: "Jira",
  confluence: "Confluence",
  trello: "Trello",
  notion: "Notion",
  asana: "Asana",
  figma: "Figma",
  canva: "Canva",
  photoshop: "Photoshop",
  illustrator: "Illustrator",
  shopify: "Shopify",
  wordpress: "WordPress",
  python: "Python",
  react: "React",
  angular: "Angular",
  vue: "Vue",
  kotlin: "Kotlin",
  swift: "Swift",
  flutter: "Flutter",
  docker: "Docker",
  kubernetes: "Kubernetes",
  terraform: "Terraform",
  linux: "Linux",
  excel: "Excel",
  sap: "SAP",
  totvs: "TOTVS",
  protheus: "Protheus",
  mailchimp: "Mailchimp",
  ga4: "GA4",
  graphql: "GraphQL",
  postman: "Postman",
  swagger: "Swagger",
  zapier: "Zapier",
  n8n: "n8n",
  guardrails: "Guardrails",
};

const ACRONYMS = new Set([
  "bi",
  "sql",
  "etl",
  "elt",
  "kpi",
  "kpis",
  "crm",
  "api",
  "apis",
  "dax",
  "aws",
  "gcp",
  "sap",
  "rh",
  "ti",
  "b2b",
  "b2c",
  "seo",
  "ux",
  "ui",
  "pmp",
  "mba",
  "lgpd",
  "pmo",
  "itil",
  "cfa",
  "crc",
  "oab",
  "ga4",
  "ci/cd",
  "bpmn",
  "vba",
  "php",
  "css",
  "html",
  "qa",
  "sla",
  "slas",
  "okr",
  "okrs",
  "pmbok",
  "capm",
  "dbt",
  "erp",
  "saas",
  "cdp",
  "mrr",
  "arr",
  "ltv",
  "roi",
  "p&l",
]);

const PROPER_NOUN_LOOKUP = new Map(
  Object.entries(PROPER_NOUNS).map(([key, value]) => [normalize(key), value]),
);

/**
 * Grafia de exibição de um termo: "power bi" → "Power BI",
 * "analise de dados" → "Análise de dados". Preserva acentos do texto original.
 */
export function displayTerm(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const whole = normalize(cleaned);
  const wholeMatch = PROPER_NOUN_LOOKUP.get(whole);
  if (wholeMatch) return wholeMatch;

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      const norm = normalize(word);
      const proper = PROPER_NOUN_LOOKUP.get(norm);
      if (proper) return proper;
      if (ACRONYMS.has(norm)) return word.toUpperCase();
      if (word.includes(".") || word.includes("/")) return word;
      const lower = word.toLowerCase();
      if (index > 0) return lower;
      return capitalizeFirst(lower);
    })
    .join(" ");
}

/** Mantém a grafia que a pessoa escreveu, só corrigindo a inicial minúscula. */
export function neatSkill(raw: string): string {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (!trimmed) return trimmed;
  const first = trimmed.charAt(0);
  if (first !== first.toUpperCase()) {
    return first.toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}
