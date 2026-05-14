import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import KnowledgeSharingApp from './KnowledgeSharingApp.tsx';
import './index.css';

createRoot(document.getElementById('knowledge-root')!).render(
  <StrictMode>
    <KnowledgeSharingApp />
  </StrictMode>,
);
