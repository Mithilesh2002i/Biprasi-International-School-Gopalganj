import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { ROUTER_MODE } from './config';
import './styles/theme.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/motion.css';
import './styles/diary.css';

const Router = ROUTER_MODE === 'hash' ? HashRouter : ROUTER_MODE === 'memory' ? MemoryRouter : BrowserRouter;
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);