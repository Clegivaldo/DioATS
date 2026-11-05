import { ArrowRight, Lock, Sparkles, Trash2 } from "lucide-react";
import { words } from "../lib/text";
import { Button, Card, FieldLabel, Textarea } from "./ui";

interface WorkspaceProps {
  jobText: string;
  resumeText: string;
  onJobChange: (value: string) => void;
  onResumeChange: (value: string) => void;
  onAnalyze: () => void;
  onLoadExample: () => void;
  onClear: () => void;
  error: string | null;
}

export function Workspace({
  jobText,
  resumeText,
  onJobChange,
  onResumeChange,
  onAnalyze,
  onLoadExample,
  onClear,
  error,
}: WorkspaceProps) {
  const jobWords = words(jobText).length;
  const resumeWords = words(resumeText).length;
  const hasContent = jobText.trim().length > 0 || resumeText.trim().length > 0;

  return (
    <section id="analise" className="print-hide mx-auto max-w-6xl scroll-mt-20 px-5 pt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono">01 · Entrada</p>
          <h2 className="mt-2 font-serif text-[30px] leading-tight sm:text-[34px]">
            Cole os dois textos. O resto é cálculo.
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onLoadExample}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Carregar exemplo
          </Button>
          <Button size="sm" variant="ghost" onClick={onClear} disabled={!hasContent}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Limpar
          </Button>
        </div>
      </div>

      <Card className="p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <FieldLabel step="01" title="Descrição da vaga" hint="copie o anúncio inteiro" />
            <Textarea
              value={jobText}
              onChange={(event) => onJobChange(event.target.value)}
              placeholder={`Cole aqui o anúncio da vaga — requisitos, responsabilidades, diferenciais.\n\nQuanto mais completo, melhor o recorte de palavras-chave.`}
              className="h-[290px]"
              spellCheck={false}
              aria-label="Descrição da vaga"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
              <span>Inclua também os “desejáveis”: eles entram com peso menor.</span>
              <span className="font-mono">{jobWords} palavras</span>
            </div>
          </div>

          <div>
            <FieldLabel step="02" title="Seu currículo" hint="texto puro, como você envia hoje" />
            <Textarea
              value={resumeText}
              onChange={(event) => onResumeChange(event.target.value)}
              placeholder={`Cole aqui o seu currículo em texto.\n\nSe ele estiver em PDF, abra e copie o conteúdo. Não precisa formatar: a gente reorganiza.`}
              className="h-[290px]"
              spellCheck={false}
              aria-label="Currículo"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
              <span>Cabeçalho, experiências, formação e competências.</span>
              <span className="font-mono">{resumeWords} palavras</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[12px] text-ink-muted">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Nenhum texto sai do seu navegador. Nada é salvo em servidor.
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {error && <span className="text-[12px] font-medium text-signal-danger">{error}</span>}
            <Button size="lg" onClick={onAnalyze}>
              Analisar compatibilidade
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
