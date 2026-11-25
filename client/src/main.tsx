import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { handleMockApi } from './services/mockBackend.ts'

// Transparent API fallback for static deployments (e.g. Vercel) where /api/* has no Express server
const originalFetch = window.fetch.bind(window);
let forceMockBackend = false;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (urlStr.startsWith('/api/')) {
    if (forceMockBackend) {
      return handleMockApi(input, init);
    }
    try {
      const res = await originalFetch(input, init);
      const contentType = res.headers.get('content-type') || '';
      if (res.status === 404 || contentType.includes('text/html')) {
        forceMockBackend = true;
        return handleMockApi(input, init);
      }
      return res;
    } catch {
      forceMockBackend = true;
      return handleMockApi(input, init);
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
