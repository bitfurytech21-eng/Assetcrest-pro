import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const isOpaqueCrossOriginError =
        event.message === 'Script error.' &&
        !event.error &&
        (!event.filename || !event.filename.startsWith(window.location.origin));
      if (isOpaqueCrossOriginError) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
