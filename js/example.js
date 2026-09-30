// Currículo fictício que aparece na primeira visita, só para mostrar como fica.
export function createExample() {
  return [
    {
      id: 'exemplo',
      label: 'Exemplo',
      lang: 'pt',
      source: 'form',
      md: '',
      name: 'Tim Maia',
      title: 'Desenvolvedor Backend | Java • Spring Boot • AWS',
      phone: '+55 (21) 90000-0000',
      email: 'tim.maia@email.com',
      city: 'Rio de Janeiro, RJ',
      linkedin: 'linkedin.com/in/tim-maia',
      github: 'github.com/tim-maia',
      summary:
        'Desenvolvedor Backend com 4 anos de experiência em Java e Spring Boot, construindo APIs e serviços para produtos de pagamentos e logística. Experiência com mensageria, bancos relacionais e infraestrutura na AWS. Inglês avançado.',
      experience: [
        {
          role: 'Desenvolvedor Backend',
          company: 'Empresa de Pagamentos',
          period: 'Mar/2023 – Atual',
          bullets: [
            'Desenvolvo e mantenho microsserviços em Java e Spring Boot que processam cerca de 200 mil transações por dia.',
            'Reduzi em 40% o tempo médio de resposta da API de conciliação com cache em Redis e revisão de consultas SQL.',
            'Implementei filas com RabbitMQ para o envio de notificações, eliminando perdas em horários de pico.',
          ].join('\n'),
        },
        {
          role: 'Desenvolvedor Júnior',
          company: 'Startup de Logística',
          period: 'Fev/2021 – Fev/2023',
          bullets: [
            'Criei endpoints REST em Node.js e TypeScript para rastreamento de entregas em tempo real.',
            'Migrei a aplicação para containers Docker na AWS (ECS), com deploy automatizado via GitHub Actions.',
          ].join('\n'),
        },
      ],
      projects: [
        {
          name: 'Carteira Digital',
          tech: 'Java • Spring Boot • PostgreSQL',
          period: '2025',
          desc: 'API de estudo que simula transferências instantâneas entre contas, com testes automatizados e documentação OpenAPI.',
        },
      ],
      skills: [
        { label: 'Back-end', items: 'Java, Spring Boot, Node.js, TypeScript, APIs REST, Microsserviços' },
        { label: 'Dados e mensageria', items: 'PostgreSQL, Redis, RabbitMQ' },
        { label: 'Cloud & DevOps', items: 'AWS (ECS, S3, RDS), Docker, GitHub Actions, Git' },
        { label: 'Testes', items: 'JUnit, Mockito, Testcontainers' },
        { label: 'Idiomas', items: 'Português (nativo), Inglês (avançado)' },
      ],
      education: [
        { course: 'Bacharelado em Ciência da Computação', school: 'Universidade Exemplo', period: '2017 – 2020' },
      ],
    },
  ];
}
