import { ArrowRight, FileSearch, ListChecks, X } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "A vaga entra como vocabulário",
    body: "O anúncio é fatiado em requisitos, diferenciais e benefícios. Cada termo reconhecido recebe um peso — ferramenta citada em requisito vale mais que comportamental em “desejável”.",
  },
  {
    step: "02",
    title: "Seu currículo é lido por seções",
    body: "O parser separa cabeçalho, resumo, competências, experiências, formação, idiomas. Cada bullet recebe uma nota de relevância para a vaga antes de ser reordenado.",
  },
  {
    step: "03",
    title: "O match vira trabalho concreto",
    body: "Você vê o que já está lá, o que aparece com outras palavras e o que falta. A versão ajustada é montada só com o que você escreveu — e a diferença é medida de novo.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="print-hide mx-auto max-w-6xl scroll-mt-20 px-5 pt-16">
      <div className="max-w-2xl">
        <p className="label-mono">Como funciona</p>
        <h2 className="mt-2 font-serif text-[32px] leading-tight sm:text-[38px]">
          Da vaga colada ao currículo ajustado, em três passos.
        </h2>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {STEPS.map((item) => (
          <div key={item.step} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <span className="font-mono text-[11px] text-brand-500">{item.step}</span>
            <h3 className="mt-2 text-[14.5px] font-semibold leading-snug">{item.title}</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{item.body}</p>
          </div>
        ))}
      </div>

      <div id="transparencia" className="mt-10 grid scroll-mt-20 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h3 className="text-[15px] font-semibold">Como o match é calculado</h3>
          <div className="mt-4 space-y-3 text-[12.5px] leading-relaxed text-ink-soft">
            <p>
              <strong className="font-semibold text-ink">1. Extração.</strong> Um léxico de competências, ferramentas
              e comportamentais reconhece expressões de várias palavras (“gestão de projetos”, “power bi”). Termos
              específicos do anúncio entram por frequência e siglas. Benefícios são descartados.
            </p>
            <p>
              <strong className="font-semibold text-ink">2. Peso.</strong> Requisito pesa 1; diferencial pesa 0,6.
              Ferramentas e competências pesam mais que comportamentais. Repetição no anúncio aumenta a importância.
            </p>
            <p>
              <strong className="font-semibold text-ink">3. Correspondência.</strong> Frase exata vale 100% do peso.
              Variação — o mesmo conceito com outra palavra — vale 60%. Ausente, zero.
            </p>
            <p>
              <strong className="font-semibold text-ink">4. Nota.</strong> A soma ponderada vira um número de 0 a 100.
              É cobertura lexical: mede vocabulário e formato, não se você é bom no trabalho.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper/70 px-3.5 py-3 font-mono text-[11px] text-ink-muted">
            <span>match</span>
            <span className="text-ink">=</span>
            <span>Σ (peso × requisito × cobertura)</span>
            <span className="text-ink">/</span>
            <span>Σ (peso × requisito)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#eed9b4] bg-[#fdfaf3] p-6">
          <h3 className="text-[15px] font-semibold">A regra que não se negocia</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
            A ferramenta melhora como você se apresenta. Ela não cria cargos, empresas, certificações, anos de
            experiência ou resultados.
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              "Não inventa experiência para cobrir palavra-chave que falta.",
              "Não muda datas, cargos ou empresas do seu histórico.",
              "Não escreve um resultado numérico que você não informou.",
            ].map((item) => (
              <li key={item} className="flex gap-2 text-[12px] leading-relaxed text-ink-soft">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-danger" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2 rounded-xl border border-[#eed9b4] bg-white/60 p-3">
            <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-signal-amber" aria-hidden="true" />
            <p className="text-[11.5px] leading-relaxed text-ink-muted">
              A lacuna aparece como pergunta, não como texto pronto. Quem sabe se você tem a experiência é você.
            </p>
          </div>
          <div className="mt-4 flex gap-2 rounded-xl border border-line bg-white/60 p-3">
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
            <p className="text-[11.5px] leading-relaxed text-ink-muted">
              Todo o processamento acontece no navegador. Não há login, banco de dados nem envio de currículo.
            </p>
          </div>
          <a
            href="#analise"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[12.5px] font-medium text-brand-600 hover:text-brand-700 sm:min-h-0"
          >
            Analisar meu currículo
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
