import {onCLS, onINP, onLCP} from 'web-vitals';

import Frontend from './ui/frontend.js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';
import ReactDOM from 'react-dom/client';

;

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="812652339289-06lsauvaktfap7g3qeof2043q2eecif2.apps.googleusercontent.com">
      <Frontend collectionId='83fd0b3e-dd08-4707-8135-e5f138a43f00'/>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

onCLS(console.log);
onINP(console.log);
onLCP(console.log);
