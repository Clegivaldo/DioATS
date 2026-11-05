import { AlertTriangle, Check, CheckCircle2, CircleAlert, Minus, X } from "lucide-react";
import type { Analysis } from "../lib/analyze";
import type { GeneratedResume } from "../lib/generate";
import { cn } from "../lib/cn";
import { Badge, Card, Progress } from "./ui";

function Dial({ score }: { score: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(100, Math.max(0, score))) / 100;
  return (
    <div className="relative grid h-[124px] w-[124px] place-items-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#D8F46B"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-mono text-[30px] leading-none text-paper">
            {score}
            <span className="text-[15px] text-paper/60">%</span>
          </p>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-paper/50">match</p>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ analysis, generated }: { analysis: Analysis; generated: GeneratedResume }) {
  const delta = generated.metrics.after - generated.metrics.before;
  return (
    <Card className="relative overflow-hidden border-ink bg-ink p-6 text-paper">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-center gap-6">
        <Dial score={analysis.score} />
        <div className="min-w-[180px] flex-1">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/50">
            Compatibilidade com a vaga
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="limeDark">{analysis.grade.label}</Badge>
            {analysis.job.title && (
              <span className="truncate text-[12.5px] text-paper/60">{analysis.job.title}</span>
            )}
          </div>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-paper/70">{analysis.grade.note}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
        {[
          { label: "termos exatos", value: analysis.found.length },
          { label: "variações", value: analysis.partial.length },
          { label: "faltando", value: analysis.missing.length },
        ].map((stat) => (
          <div key={stat.label}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-paper/45">{stat.label}</dt>
            <dd className="mt-1 font-mono text-[20px] leading-none text-paper">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-signal-lime/25 bg-signal-lime/10 px-3.5 py-2.5">
        <span className="text-[12px] text-paper/75">Depois do ajuste, medido no texto gerado</span>
        <span className="shrink-0 font-mono text-[13px] text-signal-lime">
          {generated.metrics.after}%
          {delta > 0 && <span className="ml-1 text-[11px] text-signal-lime/80">+{delta}</span>}
        </span>
      </div>
    </Card>
  );
}

function CategoryCard({ analysis }: { analysis: Analysis }) {
  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold">Cobertura por categoria</h3>
        <span className="font-mono text-[11px] text-ink-muted">{analysis.job.keywords.length} termos</span>
      </div>
      <div className="mt-4 space-y-3.5">
        {analysis.categories.map((category) => (
          <div key={category.category}>
            <div className="flex items-baseline justify-between text-[12.5px]">
              <span className="text-ink-soft">{category.label}</span>
              <span className="font-mono text-[11.5px] text-ink-muted">
                {category.found + category.partial}/{category.total}
                <span className="ml-2 text-ink">{category.score}%</span>
              </span>
            </div>
            <Progress
              value={category.score}
              tone={category.score >= 70 ? "brand" : category.score >= 40 ? "amber" : "danger"}
              className="mt-1.5"
            />
          </div>
        ))}
        {analysis.categories.length === 0 && (
          <p className="text-[12.5px] text-ink-muted">
            Nenhum termo do léxico foi reconhecido. Cole o anúncio completo para melhorar o recorte.
          </p>
        )}
      </div>
      <p className="mt-5 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-muted">
        Peso maior para ferramentas e competências citadas em requisitos. Comportamentais e desejáveis pesam menos.
      </p>
    </Card>
  );
}

function KeywordsFound({ analysis }: { analysis: Analysis }) {
  const items = [...analysis.found, ...analysis.partial].sort((a, b) => b.weight - a.weight);
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <CheckCircle2 className="h-4 w-4 text-brand-500" aria-hidden="true" />
          Encontradas no currículo
        </h3>
        <span className="font-mono text-[11px] text-ink-muted">{items.length}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge
            key={item.norm}
            tone={item.strength === "exact" ? "brand" : "lime"}
            title={
              item.strength === "exact"
                ? `Aparece ${item.countInResume}× no currículo`
                : "Variação da expressão: o sentido está no currículo, mas com outras palavras"
            }
          >
            {item.term}
            {item.strength === "exact" && item.countInResume > 1 && (
              <span className="ml-0.5 font-mono text-[10px] opacity-60">{item.countInResume}×</span>
            )}
            {item.strength === "partial" && <Minus className="h-3 w-3 opacity-70" aria-hidden="true" />}
          </Badge>
        ))}
        {items.length === 0 && (
          <p className="text-[12.5px] text-ink-muted">
            Nenhuma palavra-chave da vaga aparece no currículo. A versão ajustada reorganiza o que existe, mas o
            conteúdo precisa ser seu.
          </p>
        )}
      </div>
      {analysis.partial.length > 0 && (
        <p className="mt-4 flex items-start gap-1.5 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-muted">
          <Minus className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          Os itens marcados aparecem como variação — o mesmo conceito escrito de outra forma. O ATS não faz essa
          inferência: a versão ajustada usa o termo da vaga porque você já comprovou o conceito.
        </p>
      )}
    </Card>
  );
}

function KeywordsMissing({ analysis }: { analysis: Analysis }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <AlertTriangle className="h-4 w-4 text-signal-amber" aria-hidden="true" />
          Faltando no currículo
        </h3>
        <span className="font-mono text-[11px] text-ink-muted">{analysis.missing.length}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {analysis.missing.map((item) => (
          <Badge
            key={item.norm}
            tone={item.requirement === "must" ? "amber" : "neutral"}
            title={item.requirement === "must" ? "Requisito da vaga" : "Diferencial: soma pontos, não elimina"}
          >
            {item.term}
          </Badge>
        ))}
        {analysis.missing.length === 0 && (
          <p className="text-[12.5px] text-ink-muted">
            Todas as palavras-chave identificadas já aparecem no seu currículo. Ajuste agora é de forma, não de
            conteúdo.
          </p>
        )}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-muted">
        Estes termos <strong className="font-semibold text-ink-soft">não</strong> foram escritos no seu currículo
        ajustado: sem evidência de que você tem a experiência, incluí-los seria invenção. Trate a lista como perguntas
        — se for verdade, escreva onde e como você usou.
      </p>
    </Card>
  );
}

const STATUS_ICON = {
  pass: <Check className="h-3.5 w-3.5" aria-hidden="true" />,
  warn: <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />,
  fail: <X className="h-3.5 w-3.5" aria-hidden="true" />,
};

const STATUS_STYLE = {
  pass: "bg-brand-50 text-brand-600 border-brand-200",
  warn: "bg-[#fbf1e0] text-signal-amber border-[#eed9b4]",
  fail: "bg-[#fbeae7] text-signal-danger border-[#f0cdc7]",
};

function HealthCard({ analysis }: { analysis: Analysis }) {
  const failing = analysis.health.filter((check) => check.status !== "pass").length;
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold">Leitura do ATS</h3>
          <p className="mt-1 text-[12px] text-ink-muted">
            {analysis.health.length - failing} de {analysis.health.length} checagens de formato aprovadas.
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-[22px] leading-none text-ink">{analysis.healthScore}</span>
          <span className="ml-1 font-mono text-[12px] text-ink-muted">/100</span>
        </div>
      </div>
      <Progress
        value={analysis.healthScore}
        tone={analysis.healthScore >= 75 ? "brand" : analysis.healthScore >= 50 ? "amber" : "danger"}
        className="mt-3"
      />
      <ul className="mt-5 grid gap-x-6 gap-y-3 md:grid-cols-2">
        {analysis.health.map((check) => (
          <li key={check.id} className="flex gap-2.5">
            <span
              className={cn(
                "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                STATUS_STYLE[check.status],
              )}
            >
              {STATUS_ICON[check.status]}
            </span>
            <div>
              <p className="text-[12.5px] font-medium leading-snug text-ink">{check.label}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function Results({
  analysis,
  generated,
}: {
  analysis: Analysis;
  generated: GeneratedResume;
}) {
  return (
    <section id="resultado" className="print-hide mx-auto max-w-6xl scroll-mt-20 px-5 pt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-mono">02 · Diagnóstico</p>
          <h2 className="mt-2 font-serif text-[30px] leading-tight sm:text-[34px]">
            {analysis.score >= 60 ? "A base está boa. Vamos alinhar o vocabulário." : "O conteúdo existe. A forma está escondendo ele."}
          </h2>
        </div>
        <p className="text-[12px] text-ink-muted">
          {analysis.job.wordCount} palavras de vaga · {analysis.resume.wordCount} de currículo
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <ScoreCard analysis={analysis} generated={generated} />
        <CategoryCard analysis={analysis} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <KeywordsFound analysis={analysis} />
        <KeywordsMissing analysis={analysis} />
      </div>

      <div className="mt-4">
        <HealthCard analysis={analysis} />
      </div>
    </section>
  );
}
