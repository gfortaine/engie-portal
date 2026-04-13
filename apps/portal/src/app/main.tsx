import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// ENGIE Fluid Design System — official tokens + component styles
import '@engie-group/fluid-design-tokens/css';
import '@engie-group/fluid-design-system/css';
import '@engie-group/fluid-design-system-react/css';

// App-level overrides (layout, custom spacing)
import './styles/global.css';

const rootElement = document.getElementById('root')!;

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
