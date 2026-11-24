import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ command }) =>
{
  const common = {
    plugins: [react()],
    base: "./",
    // Excalidraw reads it to pick its React flavour
    define: { "process.env.IS_PREACT": JSON.stringify("false") },
    server: {
      open: true
    }
  }
  if (command === "build") {
    return common
  }
  else {
    // dev
    return { ...common, publicDir: '../../' }
  }
})
