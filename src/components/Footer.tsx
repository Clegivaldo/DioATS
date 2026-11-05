export function Footer() {
  return (
    <footer className="print-hide mt-16 border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink font-mono text-[11px] text-signal-lime">
            jm
          </span>
          <p className="text-[12px] text-ink-muted">
            <strong className="font-medium text-ink-soft">JobMatch ATS</strong> — seu currículo na linguagem da vaga,
            sem inventar nada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-ink-muted">
          <a href="#analise" className="hover:text-ink">
            Analisar
          </a>
          <a href="#como-funciona" className="hover:text-ink">
            Como funciona
          </a>
          <a href="#transparencia" className="hover:text-ink">
            Regras
          </a>
          <span className="font-mono">React + Vite · 100% no navegador</span>
        </div>
      </div>
    </footer>
  );
}
