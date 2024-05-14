import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ command }) =>
{
  if (command === "build") {
    return {
      plugins: [react()],
      base: "./",
      server: {
        open: true
      }
    }
  }
  else {
    // dev
    return {
      plugins: [react()],
      base: "./",
      publicDir: '../../',
      server: {
        open: true
      }
    }
  }
})
