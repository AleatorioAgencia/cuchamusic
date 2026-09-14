import { defineConfig } from 'vite';

// Puertos fijos de CUCHA Music (no cambiar: evita solaparse con otros proyectos)
//   Web (Vite): 4310
//   API (Express, server.cjs): 4311
export const WEB_PORT = 4310;
export const API_PORT = 4311;

// En dev, Vite no resuelve "/admin/" a "/admin/index.html" (lo manda a la home).
// Este plugin reescribe la URL para que el panel cargue en http://localhost:4310/admin
function adminIndexFallback() {
  return {
    name: 'admin-index-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/admin' || req.url === '/admin/' || req.url.startsWith('/admin/?')) {
          req.url = '/admin/index.html';
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [adminIndexFallback()],
  server: {
    port: WEB_PORT,
    strictPort: true, // falla si está ocupado en vez de saltar a otro puerto
    proxy: {
      '/api': `http://localhost:${API_PORT}`
    }
  },
  preview: {
    port: WEB_PORT,
    strictPort: true
  }
});
