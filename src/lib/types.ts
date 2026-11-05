export type KeywordCategory =
  | "tool"
  | "skill"
  | "soft"
  | "certification"
  | "education"
  | "language";

export type Requirement = "must" | "nice";

export type MatchStrength = "exact" | "partial" | "none";

export interface JobKeyword {
  /** Forma exibida, com a grafia usada na vaga (ex.: "Power BI"). */
  term: string;
  /** Forma normalizada usada no matching. */
  norm: string;
  category: KeywordCategory;
  /** Peso 1..5 — importância do termo dentro do anúncio. */
  weight: number;
  requirement: Requirement;
  countInJob: number;
  origin: "lexicon" | "extracted";
}

export interface KeywordMatch extends JobKeyword {
  strength: MatchStrength;
  countInResume: number;
  found: boolean;
  /** 0..1 — cobertura (1 = frase exata, 0.6 = parcial, 0 = ausente). */
  coverage: number;
}

export type CheckStatus = "pass" | "warn" | "fail";

export interface AtsCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  weight: number;
}
