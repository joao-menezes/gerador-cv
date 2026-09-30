const STORAGE_KEY = 'gerador-cv';

// O localStorage pode estar bloqueado (aba anônima, cookies desativados). Nesse caso o app
// funciona normalmente, só não lembra do que foi escrito.

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved?.versions) && saved.versions.length ? saved : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sem armazenamento disponível
  }
}
