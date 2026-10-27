import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const odataBaseUrl = env.VITE_SAP_ODATA_BASE_URL;

  let sapTarget = 'http://10.4.19.224:8005';
  try {
    sapTarget = new URL(odataBaseUrl).origin;
  } catch {
    // fallback
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/whisper': {
          target: 'http://127.0.0.1:8178',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/whisper/, ''),
        },
        '/sap-odata': {
          target: sapTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (requestPath) => requestPath.replace(/^\/sap-odata/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const method = (req.method || 'GET').toUpperCase();
              // Remove X-CSRF-Token from GET/HEAD requests at the proxy level.
              // SAP NetWeaver rejects read-only requests that carry a token value with
              // 403 "CSRF token validation failed".
              if (['GET', 'HEAD'].includes(method)) {
                proxyReq.removeHeader('x-csrf-token');
                proxyReq.removeHeader('X-CSRF-Token');
              }
              const hasAuth = !!proxyReq.getHeader('authorization');
              console.log(`[Vite SAP Proxy] -> ${method} ${req.url} (Auth: ${hasAuth ? 'yes' : 'MISSING'})`);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(`[Vite SAP Proxy] <- Status ${proxyRes.statusCode} for ${req.url}`);
            });
            proxy.on('error', (err, req) => {
              console.error(`[Vite SAP Proxy Error] ${req.url}:`, err.message);
            });
          },
        },
      },
    },
    base: '/Physician-Portal/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
