export const byId = (id) => document.getElementById(id);

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Quebra um texto em linhas, removendo marcadores de lista que a pessoa tenha digitado. */
export function splitLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*]\s+/, '').trim())
    .filter(Boolean);
}

export function contactItems(cv) {
  return [cv.phone, cv.email, cv.city, cv.linkedin, cv.github]
    .map((item) => (item || '').trim())
    .filter(Boolean);
}

export function downloadFile(filename, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1000);
}
