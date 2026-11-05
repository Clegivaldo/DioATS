import { Button } from "./ui";

export function Header({ onStart }: { onStart: () => void }) {
  return (
    <header className="print-hide sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink font-mono text-[13px] font-medium text-signal-lime">
            jm
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-tight">JobMatch</span>
            <span className="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
              ATS
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-[13px] text-ink-soft md:flex">
          <a href="#analise" className="transition-colors hover:text-ink">
            Analisar
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-ink">
            Como funciona
          </a>
          <a href="#transparencia" className="transition-colors hover:text-ink">
            Regras
          </a>
        </nav>

        <Button size="sm" variant="dark" onClick={onStart}>
          Analisar currículo
        </Button>
      </div>
    </header>
  );
}
