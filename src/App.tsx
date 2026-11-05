import { useCallback, useRef, useState } from "react";
import { DocumentPanel } from "./components/DocumentPanel";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Results } from "./components/Results";
import { Workspace } from "./components/Workspace";
import { EXAMPLES } from "./data/examples";
import { analyze, type Analysis } from "./lib/analyze";
import { generateResume, type GeneratedResume } from "./lib/generate";

export default function App() {
  const [jobText, setJobText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [generated, setGenerated] = useState<GeneratedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scrollToWorkspace = useCallback(() => {
    document.getElementById("analise")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleAnalyze = useCallback(() => {
    const job = jobText.trim();
    const resume = resumeText.trim();

    if (job.length < 120) {
      setError("Cole a descrição da vaga com requisitos e responsabilidades.");
      return;
    }
    if (resume.length < 200) {
      setError("Cole o currículo completo — experiências, formação e competências.");
      return;
    }

    setError(null);
    const nextAnalysis = analyze(job, resume);
    const nextGenerated = generateResume(nextAnalysis);
    setAnalysis(nextAnalysis);
    setGenerated(nextGenerated);

    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [jobText, resumeText]);

  const handleLoadExample = useCallback(() => {
    const example = EXAMPLES[0];
    setJobText(example.job);
    setResumeText(example.resume);
    setError(null);
    setAnalysis(null);
    setGenerated(null);
  }, []);

  const handleClear = useCallback(() => {
    setJobText("");
    setResumeText("");
    setError(null);
    setAnalysis(null);
    setGenerated(null);
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <Header onStart={scrollToWorkspace} />
      <main>
        <Hero onStart={scrollToWorkspace} />

        <Workspace
          jobText={jobText}
          resumeText={resumeText}
          onJobChange={setJobText}
          onResumeChange={setResumeText}
          onAnalyze={handleAnalyze}
          onLoadExample={handleLoadExample}
          onClear={handleClear}
          error={error}
        />

        <div ref={resultsRef}>
          {analysis && generated ? (
            <>
              <Results analysis={analysis} generated={generated} />
              <DocumentPanel analysis={analysis} resume={generated} />
            </>
          ) : (
            <section className="mx-auto max-w-6xl px-5 pt-10">
              <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-5 py-8 text-center">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-muted">
                  aguardando análise
                </p>
                <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted">
                  O diagnóstico aparece aqui: match por categoria, palavras-chave encontradas e ausentes, checagens de
                  formato e o currículo ajustado para exportar.
                </p>
              </div>
            </section>
          )}
        </div>

        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
