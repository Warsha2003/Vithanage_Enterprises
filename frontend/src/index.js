import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Force the background color on the body element
document.body.style.backgroundColor = '#f7f7f7';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.minHeight = '100vh';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
