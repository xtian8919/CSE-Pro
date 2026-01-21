
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  const errorMsg = "Critical Error: Root element '#root' not found in document.";
  console.error(errorMsg);
  const display = document.getElementById('error-display');
  if (display) {
    display.style.display = 'block';
    display.innerText = errorMsg;
  }
} else {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
