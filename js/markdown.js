import { contactItems, splitLines } from './utils.js';

const SECTION_TITLES = {
  pt: {
    summary: 'Resumo',
    experience: 'Experiência profissional',
    projects: 'Projetos',
    skills: 'Competências técnicas',
    education: 'Formação',
  },
  en: {
    summary: 'Summary',
    experience: 'Professional experience',
    projects: 'Projects',
    skills: 'Technical skills',
    education: 'Education',
  },
};

// A data à direita de um "###" só é reconhecida se for curta, para não cortar títulos que usem "|".
const MAX_DATE_LENGTH = 34;

const oneLine = (text) => String(text || '').trim().replace(/\s*\n+\s*/g, ' ');

function entryHeading(main, detail, period) {
  let heading = `### ${oneLine(main)}`;
  if (detail?.trim()) heading += ` — *${oneLine(detail)}*`;
  if (period?.trim()) heading += ` | ${oneLine(period)}`;
  return heading;
}

/** Converte os dados do formulário no mesmo Markdown que a pessoa escreveria à mão. */
export function formToMarkdown(cv) {
  const titles = SECTION_TITLES[cv.lang] ?? SECTION_TITLES.pt;
  const lines = [`# ${oneLine(cv.name)}`];

  if (cv.title?.trim()) lines.push(oneLine(cv.title));
  const contact = contactItems(cv);
  if (contact.length) lines.push(contact.join(' · '));

  if (cv.summary?.trim()) {
    lines.push('', `## ${titles.summary}`, oneLine(cv.summary));
  }

  const experience = cv.experience.filter((job) => job.role || job.company || job.bullets);
  if (experience.length) {
    lines.push('', `## ${titles.experience}`);
    for (const job of experience) {
      const roleAndCompany = [job.role, job.company].map(oneLine).filter(Boolean).join(' — ');
      lines.push(`### ${roleAndCompany}${job.period?.trim() ? ` | ${oneLine(job.period)}` : ''}`);
      for (const bullet of splitLines(job.bullets)) lines.push(`- ${bullet}`);
    }
  }

  const projects = cv.projects.filter((project) => project.name || project.desc);
  if (projects.length) {
    lines.push('', `## ${titles.projects}`);
    for (const project of projects) {
      lines.push(entryHeading(project.name, project.tech, project.period));
      if (project.desc?.trim()) lines.push(oneLine(project.desc));
    }
  }

  const skills = cv.skills.filter((skill) => skill.label || skill.items);
  if (skills.length) {
    lines.push('', `## ${titles.skills}`);
    for (const skill of skills) {
      const label = skill.label?.trim() ? `**${oneLine(skill.label)}:** ` : '';
      lines.push(label + oneLine(skill.items));
    }
  }

  const education = cv.education.filter((course) => course.course || course.school);
  if (education.length) {
    lines.push('', `## ${titles.education}`);
    for (const course of education) {
      lines.push(entryHeading(course.course, course.school, course.period));
    }
  }

  return lines.join('\n') + '\n';
}

/** Negrito, itálico e links. Links viram só o texto, que é o que interessa no PDF. */
export function parseInline(text) {
  const pattern = /\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  const runs = [];
  let last = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (match.index > last) runs.push({ text: text.slice(last, match.index) });
    if (match[1] != null) runs.push({ text: match[1], bold: true });
    else if (match[2] != null) runs.push({ text: match[2], italic: true });
    else runs.push({ text: match[3] });
    last = pattern.lastIndex;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });

  return runs.filter((run) => run.text);
}

const plainText = (text) => parseInline(text).map((run) => run.text).join('');

/**
 * Lê o Markdown do CV e devolve uma lista de blocos que a prévia e o PDF sabem desenhar.
 * Cada linha não vazia vira um parágrafo próprio (diferente do Markdown padrão),
 * porque num CV quebrar a linha quase sempre é intencional.
 */
export function parseMarkdown(markdown) {
  const blocks = [];
  let inHeader = false;
  let headerLine = 0;
  let afterBlankLine = false;

  for (const rawLine of String(markdown).replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim();
    let match;

    if (!line) {
      afterBlankLine = true;
      continue;
    }

    if ((match = line.match(/^#\s+(.*)/))) {
      blocks.push({ type: 'name', runs: parseInline(match[1]) });
      inHeader = true;
      headerLine = 0;
    } else if ((match = line.match(/^##\s+(.*)/))) {
      blocks.push({ type: 'section', text: plainText(match[1]) });
      inHeader = false;
    } else if ((match = line.match(/^###\s+(.*)/))) {
      blocks.push(parseEntry(match[1]));
      inHeader = false;
    } else if ((match = line.match(/^#{4,6}\s+(.*)/))) {
      blocks.push({ type: 'text', runs: [{ text: plainText(match[1]), bold: true }], spaced: afterBlankLine });
      inHeader = false;
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      blocks.push({ type: 'rule' });
    } else if ((match = line.match(/^(?:[-+•]|\*(?!\*)|\d+[.)])\s+(.*)/))) {
      blocks.push({ type: 'item', runs: parseInline(match[1]) });
      inHeader = false;
    } else if (inHeader) {
      blocks.push({ type: headerLine === 0 ? 'title' : 'contact', runs: parseInline(line) });
      headerLine += 1;
    } else {
      blocks.push({ type: 'text', runs: parseInline(line), spaced: afterBlankLine });
    }

    afterBlankLine = false;
  }

  return blocks;
}

function parseEntry(text) {
  const split = text.lastIndexOf(' | ');
  const hasDate = split > 0 && text.length - split - 3 <= MAX_DATE_LENGTH;
  return {
    type: 'entry',
    runs: parseInline(hasDate ? text.slice(0, split) : text),
    date: hasDate ? plainText(text.slice(split + 3)) : '',
  };
}
