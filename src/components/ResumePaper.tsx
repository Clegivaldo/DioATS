import type { GeneratedResume } from "../lib/generate";

export function ResumePaper({ resume }: { resume: GeneratedResume }) {
  return (
    <article
      id="resume-paper"
      className="resume-paper paper-texture mx-auto w-full max-w-[794px] rounded-sm border border-line px-5 py-7 shadow-page sm:px-12 sm:py-12"
    >
      <header className="border-b border-[#d7d7d7] pb-3">
        <h1 className="text-[21px] leading-tight sm:text-[24px]">{resume.name || "Seu nome completo"}</h1>
        {resume.contactLines.length > 0 && (
          <p className="mt-1.5 text-[11.5px] text-[#3a3a3a]">{resume.contactLines.join("  ·  ")}</p>
        )}
      </header>

      {resume.summary && (
        <section>
          <h2>Resumo Profissional</h2>
          <p>{resume.summary}</p>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <h2>Competências</h2>
          <p>{resume.skills.join(" · ")}</p>
        </section>
      )}

      {resume.experiences.length > 0 && (
        <section>
          <h2>Experiência Profissional</h2>
          {resume.experiences.map((experience, index) => (
            <div key={`${experience.titleLines[0] ?? "exp"}-${index}`} className="resume-entry mt-3 first:mt-1">
              {experience.titleLines.map((line, lineIndex) => (
                <p key={lineIndex} className={lineIndex === 0 ? "font-semibold text-black" : "text-[#2b2b2b]"}>
                  {line}
                </p>
              ))}
              {experience.bullets.length > 0 && (
                <ul className="mt-1">
                  {experience.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              )}
              {experience.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`p-${paragraphIndex}`} className="mt-1">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </section>
      )}

      {resume.education.length > 0 && (
        <section>
          <h2>Formação Acadêmica</h2>
          {resume.education.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </section>
      )}

      {resume.certifications.length > 0 && (
        <section>
          <h2>Cursos e Certificações</h2>
          {resume.certifications.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </section>
      )}

      {resume.languages.length > 0 && (
        <section>
          <h2>Idiomas</h2>
          <p>{resume.languages.join(" · ")}</p>
        </section>
      )}

      {resume.projects.length > 0 && (
        <section>
          <h2>Projetos</h2>
          {resume.projects.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </section>
      )}

      {resume.extras.map((extra) => (
        <section key={extra.title}>
          <h2>{extra.title}</h2>
          {extra.lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
