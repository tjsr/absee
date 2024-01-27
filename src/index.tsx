import Frontend from './ui/frontend.js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals.js';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="812652339289-06lsauvaktfap7g3qeof2043q2eecif2.apps.googleusercontent.com">
      <Frontend collectionId='83fd0b3e-dd08-4707-8135-e5f138a43f00'/>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
