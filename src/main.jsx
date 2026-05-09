import React from 'react';
import { createRoot } from 'react-dom/client';
import { configure } from 'mobx';
import App from './App.jsx';
import './styles.css';

configure({ enforceActions: 'always' });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
