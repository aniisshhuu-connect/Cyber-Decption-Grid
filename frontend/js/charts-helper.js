export function ensureChartJs() {
  if (!window.Chart) {
    throw new Error('Chart.js failed to load.');
  }
}
