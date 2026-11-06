import { ArrowRight, ShieldCheck, ScanLine } from "lucide-react";
import { Badge, Button } from "./ui";

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section id="top" className="print-hide relative overflow-hidden bg-ink text-paper">
      <div className="absolute inset-0 grid-texture opacity-70" aria-hidden="true" />
      <div
        className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-500/25 blur-[90px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-signal-lime sm:text-[11px] sm:tracking-[0.18em]">
            <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
            Análise ATS · roda no seu navegador
          </p>
          <h1 className="mt-4 font-serif text-[34px] leading-[1.05] tracking-[-0.015em] sm:text-[52px] sm:leading-[1.02]">
            Currículo bom que nunca chega ao RH, porque o <span className="italic text-signal-lime">filtro</span>{" "}
            barrou antes.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-paper/70">
            Cole a descrição da vaga e o seu currículo. Em segundos você vê o match, as palavras-chave que o ATS
            procura e as que faltam — e leva uma versão ajustada, pronta para exportar em PDF.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button size="lg" variant="lime" onClick={onStart}>
              Começar a análise
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <a
              href="#como-funciona"
              className="inline-flex h-12 items-center rounded-xl border border-white/20 px-5 text-[14px] text-paper/80 transition-colors hover:border-white/40 hover:text-paper"
            >
              Ver como a conta é feita
            </a>
          </div>

          <div className="mt-8 flex max-w-xl gap-3 rounded-xl border border-white/15 bg-white/[0.04] p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-signal-lime" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-paper/80">
              <strong className="font-semibold text-paper">Regra da casa:</strong> a ferramenta melhora como você se
              apresenta. Ela nunca inventa experiência que você não tem — e mostra, um por um, os termos que deixou de
              fora por falta de evidência no seu currículo.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/50">
                exemplo de saída
              </span>
              <Badge tone="limeDark">match 71%</Badge>
            </div>
            <p className="mt-4 text-[13.5px] text-paper/80">Analista de Dados Pleno · Operações</p>
            <div className="mt-3 space-y-2.5">
              {[
                { label: "SQL", state: "encontrada" },
                { label: "Power BI", state: "encontrada" },
                { label: "Análise de dados", state: "encontrada" },
                { label: "dbt", state: "faltando" },
                { label: "Airflow", state: "faltando" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-ink/40 px-3 py-2"
                >
                  <span className="text-[12.5px] text-paper/85">{item.label}</span>
                  <span
                    className={
                      item.state === "encontrada"
                        ? "font-mono text-[10.5px] uppercase tracking-wider text-signal-lime"
                        : "font-mono text-[10.5px] uppercase tracking-wider text-[#f0b57a]"
                    }
                  >
                    {item.state}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
              {[
                { value: "12", label: "palavras-chave" },
                { value: "8", label: "no currículo" },
                { value: "4", label: "faltando" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-mono text-[18px] leading-none text-paper">{stat.value}</p>
                  <p className="mt-1 text-[10.5px] text-paper/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-paper/40">
            Exemplo ilustrativo · a análise real usa o texto que você colar
          </p>
        </div>
      </div>
    </section>
  );
}
