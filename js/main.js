import { createExample } from './example.js';
import { compareKeywords } from './keywords.js';
import { formToMarkdown, parseMarkdown } from './markdown.js';
import { PALETTES, hexToRgb, resolvePalette } from './palettes.js';
import { buildPdf } from './pdf.js';
import { renderSheet } from './preview.js';
import { loadState, saveState } from './storage.js';
import { byId, downloadFile, escapeHtml, slugify } from './utils.js';

const state = loadState() ?? {
  versions: createExample(),
  current: 0,
  tab: 'form',
  palette: { id: 'musgo' },
};
replaceUntouchedExample(state);

let jobText = '';
let accentRgb = hexToRgb(resolvePalette(state.palette).color);

const currentCv = () => state.versions[Math.min(state.current, state.versions.length - 1)];
const markdownOf = (cv) => (cv.source === 'md' ? cv.md : formToMarkdown(cv));
const persist = () => saveState(state);

// O exemplo fica marcado como "untouched" até a pessoa editar alguma coisa nele.
// Enquanto estiver assim, ele é trocado pela versão atual do exemplo a cada visita.
function replaceUntouchedExample(saved) {
  const [example] = createExample();
  saved.versions = saved.versions.map((cv) => (isUntouchedExample(cv) ? structuredClone(example) : cv));
}

function isUntouchedExample(cv) {
  // Estados salvos antes da marcação existir: o exemplo antigo se chamava Ana Ribeiro.
  const legacyExample = cv.id === 'exemplo' && cv.name === 'Ana Ribeiro' && cv.source === 'form';
  return cv.untouched === true || legacyExample;
}

function markEdited(cv = currentCv()) {
  delete cv.untouched;
}

const EMPTY_ITEM = {
  experience: { role: '', company: '', period: '', bullets: '' },
  projects: { name: '', tech: '', period: '', desc: '' },
  skills: { label: '', items: '' },
  education: { course: '', school: '', period: '' },
};

const ADD_LABELS = {
  experience: 'Adicionar experiência',
  projects: 'Adicionar projeto',
  skills: 'Adicionar linha',
  education: 'Adicionar formação',
};

/* Utilidades de interface */

let toastTimer;
function toast(message) {
  const element = byId('toast');
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 3500);
}

// Ações destrutivas pedem um segundo clique em até 4 segundos.
let pendingConfirm = null;
function confirmSecondClick(key, button, prompt) {
  if (pendingConfirm === key) {
    pendingConfirm = null;
    return true;
  }
  pendingConfirm = key;
  const original = button.textContent;
  button.textContent = prompt;
  setTimeout(() => {
    if (pendingConfirm === key) pendingConfirm = null;
    if (button.isConnected) button.textContent = original;
  }, 4000);
  return false;
}

function fileBaseName(cv) {
  const name = slugify(cv.name) || 'CV';
  return cv.label ? `${name}_CV_${slugify(cv.label)}` : `${name}_CV`;
}

function getAt(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

function setAt(object, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((target, key) => target[key], object)[last] = value;
}

/* Paleta */

function applyPalette() {
  const palette = resolvePalette(state.palette);
  const root = document.documentElement.style;
  root.setProperty('--hue', palette.hue);
  root.setProperty('--sat', `${palette.sat}%`);
  root.setProperty('--neutral-sat', `${palette.neutralSat}%`);
  byId('sheet').style.setProperty('--paper-accent', palette.color);
  accentRgb = hexToRgb(palette.color);
  return palette;
}

function renderPalette() {
  const palette = applyPalette();
  const selected = state.palette?.id ?? 'musgo';

  const swatches = PALETTES.map((option) => `
    <button type="button" class="swatch" data-palette="${option.id}" style="background:${option.color}"
      title="${option.name}" aria-label="${option.name}" aria-pressed="${option.id === selected}"></button>`);

  const customValue = palette.id === 'custom' ? state.palette.hex : '#1d4e89';
  swatches.push(`
    <label class="swatch custom" title="Outra cor" aria-pressed="${selected === 'custom'}">
      <input type="color" id="custom-color" value="${customValue}" aria-label="Outra cor">
    </label>`);

  byId('palette').innerHTML = swatches.join('');
}

/* Formulário */

function field(label, path, { multiline = false, rows = 3, placeholder = '' } = {}) {
  const id = `field-${path.replaceAll('.', '-')}`;
  const value = escapeHtml(getAt(currentCv(), path) ?? '');
  const attrs = `id="${id}" data-path="${path}" placeholder="${escapeHtml(placeholder)}"`;
  const control = multiline
    ? `<textarea ${attrs} rows="${rows}">${value}</textarea>`
    : `<input type="text" ${attrs} value="${value}">`;
  return `<label for="${id}">${label}${control}</label>`;
}

function cardActions(list, index) {
  return `
    <div class="card-actions">
      <button class="btn ghost" type="button" data-action="up" data-list="${list}" data-index="${index}" aria-label="Mover para cima">↑</button>
      <button class="btn ghost" type="button" data-action="down" data-list="${list}" data-index="${index}" aria-label="Mover para baixo">↓</button>
      <button class="btn ghost" type="button" data-action="remove" data-list="${list}" data-index="${index}">Remover</button>
    </div>`;
}

function listGroup(title, list, renderCard) {
  const cards = currentCv()[list]
    .map((_, index) => `<div class="card">${renderCard(index)}${cardActions(list, index)}</div>`)
    .join('');
  return `
    <div class="group">
      <h2>${title}</h2>
      ${cards}
      <button class="btn add" type="button" data-action="add" data-list="${list}">+ ${ADD_LABELS[list]}</button>
    </div>`;
}

function renderForm() {
  const cv = currentCv();
  const usingMarkdown = cv.source === 'md';

  const notice = usingMarkdown
    ? `<div class="notice">
         <p>Este CV está sendo escrito em Markdown, então o PDF usa o texto da aba Markdown.</p>
         <button class="btn warn" type="button" data-action="use-form">Descartar o Markdown e usar o formulário</button>
       </div>`
    : '';

  byId('panel-form').innerHTML = `${notice}
    <div class="form${usingMarkdown ? ' locked' : ''}">
      <div class="group">
        <h2>Você</h2>
        <div class="row">${field('Nome', 'name')}${field('Nome desta versão', 'label')}</div>
        ${field('Título', 'title')}
        <div class="row">${field('Telefone', 'phone')}${field('E-mail', 'email')}</div>
        <div class="row">${field('Cidade', 'city')}${field('LinkedIn', 'linkedin', { placeholder: 'linkedin.com/in/…' })}</div>
        <div class="row">
          ${field('GitHub', 'github', { placeholder: 'github.com/…' })}
          <label for="field-lang">Idioma dos títulos
            <select id="field-lang" class="field" data-path="lang">
              <option value="pt"${cv.lang === 'pt' ? ' selected' : ''}>Português</option>
              <option value="en"${cv.lang === 'en' ? ' selected' : ''}>English</option>
            </select>
          </label>
        </div>
        ${field('Resumo', 'summary', { multiline: true, rows: 4 })}
      </div>

      ${listGroup('Experiência', 'experience', (i) => `
        <div class="row">${field('Cargo', `experience.${i}.role`)}${field('Empresa', `experience.${i}.company`)}</div>
        ${field('Período', `experience.${i}.period`)}
        ${field('O que você fez (uma linha por item)', `experience.${i}.bullets`, { multiline: true, rows: 4 })}`)}

      ${listGroup('Projetos', 'projects', (i) => `
        <div class="row">${field('Nome', `projects.${i}.name`)}${field('Período', `projects.${i}.period`)}</div>
        ${field('Tecnologias', `projects.${i}.tech`)}
        ${field('Descrição', `projects.${i}.desc`, { multiline: true })}`)}

      ${listGroup('Competências', 'skills', (i) => `
        <div class="row">${field('Categoria', `skills.${i}.label`)}${field('Itens', `skills.${i}.items`)}</div>`)}

      ${listGroup('Formação', 'education', (i) => `
        ${field('Curso', `education.${i}.course`)}
        <div class="row">${field('Instituição', `education.${i}.school`)}${field('Período', `education.${i}.period`)}</div>`)}
    </div>`;
}

/* Versões, abas e painel de Markdown */

function renderVersions() {
  byId('version-select').innerHTML = state.versions
    .map((cv, index) => `<option value="${index}"${index === state.current ? ' selected' : ''}>${escapeHtml(cv.label || 'Sem nome')}</option>`)
    .join('');
}

function renderMarkdownPanel() {
  const cv = currentCv();
  const input = byId('md-input');
  const markdown = markdownOf(cv);
  if (input.value !== markdown) input.value = markdown;
  byId('back-to-form').hidden = cv.source !== 'md';
}

function showTab(tab) {
  state.tab = tab;
  persist();
  for (const name of ['form', 'md', 'job']) {
    byId(`panel-${name}`).hidden = name !== tab;
    byId(`tab-${name}`).setAttribute('aria-selected', String(name === tab));
  }
  if (tab === 'md') renderMarkdownPanel();
  if (tab === 'job') renderKeywords();
}

function renderKeywords() {
  const container = byId('keywords');
  if (!jobText.trim()) {
    container.innerHTML = '';
    return;
  }

  const results = compareKeywords(jobText, markdownOf(currentCv()));
  if (!results.length) {
    container.innerHTML = '<p>Não achei termos técnicos conhecidos nesse texto.</p>';
    return;
  }

  const missing = results.filter((result) => !result.found).length;
  const summary = missing
    ? `Faltam ${missing} de ${results.length}. Coloque só o que você realmente usa.`
    : 'Tudo que a vaga pede já está no CV.';

  container.innerHTML = results
    .map(({ name, found }) => `<span class="chip ${found ? 'found' : 'missing'}">${found ? '✓' : '✗'} ${escapeHtml(name)}</span>`)
    .join('') + `<p>${summary}</p>`;
}

function renderAll() {
  renderVersions();
  renderForm();
  renderMarkdownPanel();
  showTab(state.tab || 'form');
  refresh();
}

/* Prévia e contador de páginas */

const MM_TO_PX = 96 / 25.4;
const A4_WIDTH_PX = 210 * MM_TO_PX;
const A4_HEIGHT_PX = 297 * MM_TO_PX;

let refreshTimer;
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, 160);
}

function refresh() {
  clearTimeout(refreshTimer);
  const blocks = parseMarkdown(markdownOf(currentCv()));
  byId('sheet').innerHTML = renderSheet(blocks);
  if (!byId('panel-job').hidden) renderKeywords();
  updatePageMeter(blocks);
  fitSheet();
}

function updatePageMeter(blocks) {
  const meter = byId('page-meter');
  if (!window.jspdf) {
    meter.textContent = '…';
    return;
  }
  const { pages, lastPageUsage } = buildPdf(blocks, accentRgb);
  meter.classList.toggle('over', pages > 1);
  meter.textContent = pages > 1 ? `${pages} páginas` : `1 página · ${Math.round(lastPageUsage * 100)}%`;
  meter.title = pages > 1 ? 'Passou de uma página' : 'Quanto da página está ocupado';
}

// Escala a folha A4 para caber na coluna e marca onde cada página termina.
function fitSheet() {
  const desk = byId('desk');
  const frame = byId('sheet-frame');
  const sheet = byId('sheet');
  const style = getComputedStyle(desk);
  const available = desk.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const scale = Math.min(1, Math.max(0.2, available / A4_WIDTH_PX));

  sheet.style.transform = `scale(${scale})`;
  frame.style.width = `${A4_WIDTH_PX * scale}px`;
  frame.style.height = `${Math.max(sheet.offsetHeight, A4_HEIGHT_PX) * scale}px`;

  frame.querySelectorAll('.page-break').forEach((marker) => marker.remove());
  for (let page = 1; page * A4_HEIGHT_PX < sheet.offsetHeight - 2; page++) {
    const marker = document.createElement('div');
    marker.className = 'page-break';
    marker.style.top = `${page * A4_HEIGHT_PX * scale}px`;
    marker.innerHTML = `<span>fim da página ${page}</span>`;
    frame.append(marker);
  }
}

/* Eventos */

document.querySelector('.tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) showTab(tab.dataset.tab);
});

const formPanel = byId('panel-form');

formPanel.addEventListener('input', (event) => {
  const { path } = event.target.dataset;
  if (!path) return;
  setAt(currentCv(), path, event.target.value);
  markEdited();
  persist();
  scheduleRefresh();
  if (path === 'label') renderVersions();
});

formPanel.addEventListener('change', (event) => {
  if (event.target.dataset.path !== 'lang') return;
  currentCv().lang = event.target.value;
  markEdited();
  persist();
  refresh();
});

formPanel.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const cv = currentCv();
  const { action, list } = button.dataset;
  const index = Number(button.dataset.index);
  const items = cv[list];

  switch (action) {
    case 'add':
      items.push({ ...EMPTY_ITEM[list] });
      break;
    case 'remove':
      items.splice(index, 1);
      break;
    case 'up':
      if (index === 0) return;
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      break;
    case 'down':
      if (index === items.length - 1) return;
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
      break;
    case 'use-form':
      if (!confirmSecondClick('use-form', button, 'Clique de novo para confirmar')) return;
      cv.source = 'form';
      cv.md = '';
      toast('Voltou para o formulário.');
      break;
    default:
      return;
  }

  markEdited(cv);
  persist();
  renderForm();
  renderMarkdownPanel();
  refresh();
});

byId('md-input').addEventListener('input', (event) => {
  const cv = currentCv();
  const wasForm = cv.source !== 'md';
  cv.source = 'md';
  cv.md = event.target.value;
  markEdited(cv);
  persist();
  scheduleRefresh();
  if (wasForm) {
    byId('back-to-form').hidden = false;
    renderForm();
  }
});

byId('back-to-form').addEventListener('click', (event) => {
  if (!confirmSecondClick('back-to-form', event.currentTarget, 'Clique de novo: descarta o Markdown')) return;
  const cv = currentCv();
  cv.source = 'form';
  cv.md = '';
  persist();
  renderForm();
  renderMarkdownPanel();
  refresh();
  toast('Voltou para o formulário.');
});

byId('open-md').addEventListener('click', () => byId('md-file').click());

byId('md-file').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  const cv = currentCv();
  cv.source = 'md';
  cv.md = await file.text();
  markEdited(cv);
  persist();
  renderForm();
  renderMarkdownPanel();
  refresh();
  toast(`${file.name} aberto.`);
});

byId('save-md').addEventListener('click', () => {
  const cv = currentCv();
  downloadFile(`${fileBaseName(cv)}.md`, markdownOf(cv), 'text/markdown');
});

byId('version-select').addEventListener('change', (event) => {
  state.current = Number(event.target.value);
  persist();
  renderForm();
  renderMarkdownPanel();
  showTab(state.tab);
  refresh();
});

byId('duplicate-version').addEventListener('click', () => {
  const copy = structuredClone(currentCv());
  copy.id = `v${Date.now()}`;
  markEdited(copy);
  copy.label = `${copy.label || 'Versão'} (cópia)`;
  state.versions.push(copy);
  state.current = state.versions.length - 1;
  persist();
  renderAll();
  toast('Versão duplicada.');
});

byId('delete-version').addEventListener('click', (event) => {
  if (state.versions.length < 2) {
    toast('Mantenha pelo menos uma versão.');
    return;
  }
  if (!confirmSecondClick(`delete-${state.current}`, event.currentTarget, 'Confirmar')) return;
  state.versions.splice(state.current, 1);
  state.current = 0;
  persist();
  renderAll();
  toast('Versão excluída.');
});

const paletteBar = byId('palette');

paletteBar.addEventListener('click', (event) => {
  const swatch = event.target.closest('[data-palette]');
  if (!swatch) return;
  state.palette = { id: swatch.dataset.palette };
  persist();
  renderPalette();
  refresh();
});

paletteBar.addEventListener('input', (event) => {
  if (event.target.id !== 'custom-color') return;
  state.palette = { id: 'custom', hex: event.target.value };
  persist();
  applyPalette();
  scheduleRefresh();
});

// Só redesenha as bolinhas quando o seletor fecha, para não perder o foco no meio da escolha.
paletteBar.addEventListener('change', (event) => {
  if (event.target.id === 'custom-color') renderPalette();
});

byId('job-input').addEventListener('input', (event) => {
  jobText = event.target.value;
  renderKeywords();
});

byId('download-pdf').addEventListener('click', () => {
  if (!window.jspdf) {
    toast('O gerador de PDF ainda está carregando.');
    return;
  }
  const cv = currentCv();
  const { doc } = buildPdf(parseMarkdown(markdownOf(cv)), accentRgb);
  downloadFile(`${fileBaseName(cv)}.pdf`, doc.output('blob'), 'application/pdf');
});

new ResizeObserver(fitSheet).observe(byId('desk'));

renderPalette();
renderAll();
