import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const CHUNK_RELOAD_KEY = 'codelearn:chunk-reload-attempted';

function reloadForFreshBuild() {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.reload();
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadForFreshBuild();
});

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason ?? '');
  if (message.includes('Failed to fetch dynamically imported module')) {
    reloadForFreshBuild();
  }
});

window.addEventListener('load', () => {
  window.setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 5000);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
