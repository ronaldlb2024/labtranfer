// MVP offline: extrai texto de PDFs usando pdf.js em um Web Worker.
const elIn = document.getElementById('pdfInput');
const outText = document.getElementById('outText');
const outJSON = document.getElementById('outJSON');
const btnLimpar = document.getElementById('btnLimpar');

const worker = new Worker('js/worker.js', { type: 'module' });

function resetUI() {
  outText.textContent = '—';
  outJSON.textContent = '—';
}
resetUI();

btnLimpar?.addEventListener('click', resetUI);

elIn?.addEventListener('change', async () => {
  const f = elIn.files?.[0];
  if (!f) return;

  const ab = await f.arrayBuffer();
  outText.textContent = 'Lendo PDF…';
  outJSON.textContent = 'Analisando…';

  worker.onmessage = (ev) => {
    const { text, meta, error } = ev.data || {};
    if (error) {
      outText.textContent = 'Erro: ' + error;
      outJSON.textContent = '—';
      return;
    }
    outText.textContent = text || 'Vazio';
    try {
      const simple = {
        pages: meta?.pages,
        chars: (text || '').length,
        // espaço para heurísticas: identificar blocos, linhas com "Resultado", etc.
      };
      outJSON.textContent = JSON.stringify(simple, null, 2);
    } catch (e) {
      outJSON.textContent = '{}';
    }
  };

  worker.postMessage({ pdf: ab }, [ab]);
});
