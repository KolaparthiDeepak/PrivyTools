import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="p-8 text-lg">PrivyTools</div>
  </StrictMode>,
);
