import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/reset.css';
import './styles/index.css';
import { RouterProvider } from 'react-router-dom';
import { routes } from './routes.tsx';
import { ThemeProvider } from '@emotion/react';
import { theme } from './theme.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <RouterProvider router={routes} />
    </ThemeProvider>
  </StrictMode>,
);
