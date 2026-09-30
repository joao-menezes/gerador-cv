import { escapeHtml } from './utils.js';

function runsToHtml(runs, { inEntry = false } = {}) {
  return runs
    .map((run) => {
      const text = escapeHtml(run.text);
      // Nos títulos de entrada, o itálico vira o texto cinza (tecnologias, instituição).
      if (inEntry) return run.italic ? `<span class="cv-soft">${text}</span>` : text;
      if (run.bold && run.italic) return `<b><i>${text}</i></b>`;
      if (run.bold) return `<b>${text}</b>`;
      if (run.italic) return `<i>${text}</i>`;
      return text;
    })
    .join('');
}

export function renderSheet(blocks) {
  let html = '';
  let previous = null;

  for (const block of blocks) {
    switch (block.type) {
      case 'name':
        html += `<p class="cv-name">${runsToHtml(block.runs)}</p>`;
        break;
      case 'title':
        html += `<p class="cv-title">${runsToHtml(block.runs)}</p>`;
        break;
      case 'contact':
        html += `<p class="cv-contact">${runsToHtml(block.runs)}</p>`;
        break;
      case 'section':
        html += `<h3>${escapeHtml(block.text)}</h3>`;
        break;
      case 'entry': {
        const tight = previous === 'entry' ? ' tight' : '';
        html += `<div class="cv-entry${tight}">
          <span>${runsToHtml(block.runs, { inEntry: true })}</span>
          <span class="cv-date">${escapeHtml(block.date)}</span>
        </div>`;
        break;
      }
      case 'item':
        html += `<div class="cv-item">${runsToHtml(block.runs)}</div>`;
        break;
      case 'rule':
        html += '<hr>';
        break;
      default: {
        const spaced = block.spaced && previous && previous !== 'section' ? ' spaced' : '';
        html += `<p class="cv-text${spaced}">${runsToHtml(block.runs)}</p>`;
      }
    }
    previous = block.type;
  }

  return html;
}
