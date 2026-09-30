import { searchFen } from './engine-search.js';

self.addEventListener('message', (event) => {
  const { id, fen, options } = event.data || {};
  if (!id || typeof fen !== 'string') return;
  try {
    self.postMessage({ id, result: searchFen(fen, options) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
});

