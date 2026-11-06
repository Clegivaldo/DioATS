import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, FileDown, FileText, Printer, ShieldAlert } from "lucide-react";
import type { Analysis } from "../lib/analyze";
import { DOCX_MIME, buildDocx, resumeDocxFileName } from "../lib/docx";
import { copyText, downloadBinaryFile, downloadTextFile, exportPdf } from "../lib/export";
import { resumeFileName, type GeneratedResume } from "../lib/generate";
import { cn } from "../lib/cn";
import { ResumePaper } from "./ResumePaper";
import { Badge, Button, Card, Progress } from "./ui";

interface DocumentPanelProps {
  analysis: Analysis;
  resume: GeneratedResume;
}

export function DocumentPanel({ analysis, resume }: DocumentPanelProps) {
  const [tab, setTab] = useState<"previa" | "texto">("previa");
  const [copied, setCopied] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const handleCopy = async () => {
    const ok = await copyText(resume.plainText);
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setCopied(false), 2200);
  };

  const visibleGaps = resume.gaps.slice(0, 6);

  return (
    <section id="curriculo" className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-12 print:px-0 print:pt-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 print-hide">
        <div>
          <p className="label-mono">03 · Saída</p>
          <h2 className="mt-2 font-serif text-[30px] leading-tight sm:text-[34px]">
            Currículo ajustado, mesma história.
          </h2>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-ink-muted">
            Uma coluna, seções com nome padrão, competências na frente. Nada aqui foi inventado — revise antes de
            enviar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? "Copiado" : "Copiar texto"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadTextFile(resumeFileName(resume.name), resume.plainText)}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            .txt
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadBinaryFile(resumeDocxFileName(resume.name), buildDocx(resume), DOCX_MIME)}
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            .docx
          </Button>
          <Button size="sm" onClick={() => exportPdf(`Currículo — ${resume.name || "candidato"}`)}>
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-1 print-hide">
            {[
              { id: "previa" as const, label: "Prévia", icon: FileText },
              { id: "texto" as const, label: "Texto puro", icon: Copy },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] transition-colors",
                  tab === item.id
                    ? "bg-ink text-paper"
                    : "text-ink-muted hover:bg-ink/5 hover:text-ink",
                )}
                aria-pressed={tab === item.id}
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </button>
            ))}
            <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-muted">
              a4 · 1 coluna
            </span>
          </div>

          <div
            className={cn(
              "rounded-2xl bg-paper/60 p-3 sm:p-4 print:bg-white print:p-0",
              tab === "previa" ? "block" : "hidden print:block",
            )}
          >
            <ResumePaper resume={resume} />
          </div>

          <div
            className={cn(
              "rounded-2xl border border-line bg-white p-5 print:hidden",
              tab === "texto" ? "block" : "hidden",
            )}
          >
            <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink-soft">
              {resume.plainText}
            </pre>
          </div>

          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted print-hide">
            Na caixa de impressão, escolha <strong className="font-medium text-ink-soft">Salvar como PDF</strong> e
            desative cabeçalho e rodapé do navegador. O texto do PDF é selecionável, então o parser consegue ler
            linha por linha. O <strong className="font-medium text-ink-soft">.docx</strong> tem o mesmo conteúdo da
            prévia, editável no Word.
          </p>
        </div>

        <aside className="w-full shrink-0 space-y-4 lg:w-[352px] print-hide">
          <Card className="p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[13.5px] font-semibold">Antes e depois</h3>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-muted">
                medido, não estimado
              </span>
            </div>
            <div className="mt-4 space-y-3.5">
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="text-ink-muted">Currículo original</span>
                  <span className="font-mono text-ink">{resume.metrics.before}%</span>
                </div>
                <Progress value={resume.metrics.before} tone="amber" className="mt-1.5" />
              </div>
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="text-ink-muted">Versão ajustada</span>
                  <span className="font-mono text-brand-600">{resume.metrics.after}%</span>
                </div>
                <Progress value={resume.metrics.after} className="mt-1.5" />
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-muted">
              {resume.metrics.after > resume.metrics.before ? (
                <>
                  <strong className="font-medium text-brand-600">
                    +{resume.metrics.after - resume.metrics.before} pontos
                  </strong>{" "}
                  de cobertura: {resume.metrics.keywordsAfter} de {resume.metrics.keywordTotal} palavras-chave
                  reconhecidas no texto gerado (antes: {resume.metrics.keywordsBefore}).
                </>
              ) : (
                <>
                  Mesma cobertura: {resume.metrics.keywordsAfter} de {resume.metrics.keywordTotal} palavras-chave. Os
                  termos que faltam não existem no seu texto e não vão ser inventados — o ganho aqui é de formato,
                  ordem de leitura e padronização das seções.
                </>
              )}
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="text-[13.5px] font-semibold">O que mudou</h3>
            <ol className="mt-3 space-y-3">
              {resume.changes.map((change, index) => (
                <li key={change.title} className="flex gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-paper font-mono text-[10px] text-ink-muted">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium leading-snug text-ink">{change.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">{change.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="border-[#eed9b4] bg-[#fdfaf3] p-5">
            <h3 className="flex items-center gap-2 text-[13.5px] font-semibold">
              <ShieldAlert className="h-4 w-4 text-signal-amber" aria-hidden="true" />
              Ficou de fora
            </h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">
              Termos da vaga sem evidência no seu currículo. Não escrevemos por você — se for verdade, conte onde usou.
            </p>
            {visibleGaps.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {visibleGaps.map((gap) => (
                  <li key={gap.term}>
                    <div className="flex items-center gap-2">
                      <Badge tone={gap.requirement === "must" ? "amber" : "neutral"}>{gap.term}</Badge>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                        {gap.category}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{gap.hint}</p>
                  </li>
                ))}
                {resume.gaps.length > visibleGaps.length && (
                  <li className="text-[11px] text-ink-muted">
                    + {resume.gaps.length - visibleGaps.length} outros termos na lista acima.
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-2 text-[11.5px] text-ink-soft">
                Nada ficou de fora. Todas as palavras-chave reconhecidas já estão no seu currículo.
              </p>
            )}
            <p className="mt-3 border-t border-[#eed9b4] pt-3 text-[11px] text-ink-muted">
              Vaga analisada: {analysis.job.keywords.length} termos, {analysis.found.length + analysis.partial.length}{" "}
              presentes.
            </p>
          </Card>
        </aside>
      </div>
    </section>
  );
}
