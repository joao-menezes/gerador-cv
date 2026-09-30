// Termos técnicos comuns em vagas de desenvolvimento. O nome é o que aparece na tela.
const TERMS = [
  ['Java', /\bjava\b(?!\s*script)/],
  ['Spring Boot', /spring\s*boot/],
  ['Spring Security', /spring\s*security/],
  ['Hibernate / JPA', /hibernate|\bjpa\b/],
  ['Maven', /\bmaven\b/],
  ['Gradle', /\bgradle\b/],
  ['JUnit', /\bjunit\b/],
  ['Mockito', /mockito/],
  ['Node.js', /\bnode(\.?js)?\b/],
  ['TypeScript', /typescript/],
  ['JavaScript', /javascript/],
  ['Angular', /angular/],
  ['React', /\breact\b/],
  ['Next.js', /next\.?js/],
  ['Vue', /\bvue/],
  ['Kotlin', /kotlin/],
  ['Python', /python/],
  ['Go', /\bgolang\b/],
  ['C# / .NET', /c#|\.net\b/],
  ['AWS', /\baws\b|amazon web services/],
  ['Azure', /azure/],
  ['GCP', /\bgcp\b|google cloud/],
  ['Docker', /docker/],
  ['Kubernetes', /kubernetes|\bk8s\b/],
  ['Terraform', /terraform/],
  ['CI/CD', /ci\s*\/\s*cd/],
  ['Git', /\bgit\b|github|gitlab/],
  ['Jenkins', /jenkins/],
  ['Linux', /linux/],
  ['PostgreSQL', /postgre/],
  ['MySQL', /mysql/],
  ['Oracle', /oracle/],
  ['SQL Server', /sql\s*server/],
  ['SQL', /\bsql\b/],
  ['MongoDB', /mongo/],
  ['Redis', /redis/],
  ['NoSQL', /nosql/],
  ['Kafka', /kafka/],
  ['RabbitMQ', /rabbit/],
  ['Mensageria', /mensageria|messaging|message broker/],
  ['Microsserviços', /micro\s*-?\s*servi|microservice/],
  ['APIs REST', /\brest(ful)?\b/],
  ['GraphQL', /graphql/],
  ['Testes', /testes|unit test|automated test|\btdd\b/],
  ['Clean Architecture', /clean arch|arquitetura limpa/],
  ['SOLID', /\bsolid\b/],
  ['Design Patterns', /design pattern|padr(õ|o)es de projeto/],
  ['Scrum / Ágil', /scrum|agile|ágil|kanban/],
  ['Observabilidade', /observab|grafana|prometheus|datadog|new relic/],
  ['Inglês', /ingl(ê|e)s|english/],
];

/** Devolve os termos que aparecem na vaga, com os que faltam no CV primeiro. */
export function compareKeywords(jobText, cvText) {
  const job = jobText.toLowerCase();
  const cv = cvText.toLowerCase();

  return TERMS
    .filter(([, pattern]) => pattern.test(job))
    .map(([name, pattern]) => ({ name, found: pattern.test(cv) }))
    .sort((a, b) => a.found - b.found);
}
