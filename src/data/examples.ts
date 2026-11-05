export interface ExamplePair {
  id: string;
  label: string;
  description: string;
  job: string;
  resume: string;
}

export const EXAMPLES: ExamplePair[] = [
  {
    id: "dados",
    label: "Analista de dados",
    description: "Vaga pleno em logística, currículo vindo de outra empresa",
    job: `Analista de Dados Pleno — Loggi (São Paulo, híbrido)

Sobre a vaga
Estamos buscando uma pessoa analista para o time de Operações, que vai transformar dados de entrega em decisões para as squads de logística.

Responsabilidades
- Construir e manter dashboards operacionais em Power BI para as lideranças de operações.
- Escrever consultas SQL em BigQuery para investigar desvios de SLA e produtividade.
- Automatizar rotinas de ETL e garantir a qualidade dos dados que alimentam os painéis.
- Traduzir análise em recomendação de negócio para times não técnicos.
- Documentar métricas e definições de KPIs junto ao time de governança de dados.

Requisitos
- Experiência com SQL e modelagem de dados.
- Domínio de Power BI (DAX) e Excel avançado.
- Vivência em análise de dados aplicada a operações ou logística.
- Inglês intermediário para reuniões com o time global.
- Boa comunicação e trabalho em equipe com áreas não técnicas.

Desejável
- Python para automação de análises.
- Conhecimento em dbt e Airflow.
- Experiência com storytelling com dados.

Benefícios
- Vale refeição, plano de saúde, gympass e PLR.`,
    resume: `Mariana Alves Souza
mariana.alves@email.com | (11) 98842-7710 | linkedin.com/in/marianaalves | São Paulo, SP

Objetivo
Profissional de dados com 5 anos de experiência em empresas de varejo, atuando da coleta à entrega de relatórios para diretoria.

Experiência
Analista de BI — Grupo Vestir (2021 - atual)
- Responsável pela área de relatórios comerciais, atendendo 4 diretorias.
• Criei painéis em Power BI usados por 120 pessoas todos os meses.
• Estruturei o processo de coleta de vendas em planilhas e banco de dados interno.
• Padronizei indicadores de vendas por loja, o que reduziu em 30% o tempo de fechamento mensal.
• Atuei com times de compras e marketing em campanhas sazonais.

Assistente de Dados — Grupo Vestir (2019 - 2021)
- Extraía dados do ERP com consultas SQL para áreas comercial e financeira.
• Automatizei com Excel e VBA dois relatórios que consumiam 12 horas por semana.
• Apoiei a migração do banco de dados para a nuvem junto ao time de TI.

Formação
Bacharelado em Administração — Universidade Presbiteriana Mackenzie (2018)

Competências
Power BI, SQL, Excel avançado, VBA, estatística descritiva, comunicação, trabalho em equipe

Idiomas
Inglês — intermediário

Cursos e certificações
Power BI para Análise de Dados — Alura (2022)
Google Data Analytics — Coursera (2021)`,
  },
  {
    id: "cs",
    label: "Customer Success",
    description: "Vaga em SaaS, currículo de quem migra de suporte",
    job: `Customer Success Analyst — Nuvem Fiscal (remoto)

Estamos contratando uma pessoa para cuidar da carteira de clientes de contabilidade, garantir adoção do produto e reduzir churn.

Atribuições
- Acompanhar indicadores de saúde da carteira e antecipar riscos de churn.
- Conduzir reuniões de onboarding e treinamento com novos clientes.
- Manter o CRM atualizado com as interações e o plano de sucesso de cada conta.
- Produzir relatórios de uso e apresentar resultados trimestrais aos clientes.

Requisitos
- Experiência em atendimento ao cliente ou suporte a produtos digitais.
- Conhecimento de CRM e ferramentas de ticket, como Zendesk.
- Excel intermediário para análise de indicadores.
- Comunicação clara, organização e proatividade.
- Ensino superior completo.

Diferenciais
- Experiência com customer success em SaaS.
- Conhecimento de contabilidade ou rotinas fiscais.
- Inglês intermediário.

O que oferecemos
- Salário compatível, vale refeição e plano de saúde.`,
    resume: `Rafael Nogueira
rafael.nogueira@email.com • (41) 99120-3344 • linkedin.com/in/rafaelnogueira • Curitiba, PR

Perfil
Trabalho com suporte a clientes de software há 4 anos, com foco em resolver problemas de forma rápida e documentar tudo o que aprendo.

Experiência profissional
Analista de Suporte N2 — ContaFácil Sistemas (2022 - atual)
● Atendimento de tickets no Zendesk com média de 60 chamados por semana e 94% de satisfação.
● Treinei 80 clientes novos no sistema em sessões online de 1 hora.
● Escrevi 40 artigos de base de conhecimento que reduziram 22% dos chamados repetidos.
● Trabalhei junto ao time de produto no envio de 15 melhorias sugeridas por clientes.

Assistente de Suporte — ContaFácil Sistemas (2020 - 2022)
● Suporte por telefone e chat a escritórios de contabilidade.
● Controle de planilhas de acompanhamento de chamados no Excel.

Formação Acadêmica
Tecnólogo em Gestão de TI — Universidade Positivo (2019)

Habilidades
Atendimento ao cliente, Zendesk, Excel intermediário, documentação, comunicação clara, organização

Idiomas
Inglês — intermediário`,
  },
];

export const WORKSPACE_STORAGE_KEY = "jobmatch:rascunho";
