// Worker do MVP: extrai texto básico com pdf.js (CDN), sem parsing complexo.
importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');

self.onmessage = async (ev) => {
  const { pdf } = ev.data || {};
  if (!pdf) return;

  try {
    // Configura worker do pdf.js
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }

    const loadingTask = pdfjsLib.getDocument({ data: pdf });
    const doc = await loadingTask.promise;
    const maxPages = Math.min(doc.numPages, 30);
    let text = '';

    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = content.items || [];
      const line = items.map(it => (it.str || '')).join(' ');
      text += (i > 1 ? '\n\n' : '') + line;
    }

    self.postMessage({ text, meta: { pages: maxPages } });
  } catch (e) {
    self.postMessage({ error: e?.message || String(e) });
  }
};
