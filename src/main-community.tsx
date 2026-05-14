import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CommunityHubApp from './CommunityHubApp.tsx';
import './index.css';

createRoot(document.getElementById('community-root')!).render(
  <StrictMode>
    <CommunityHubApp />
  </StrictMode>,
);
