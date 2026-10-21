import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Public hostname of the site (vite blocks unknown Host headers).
const allowedHosts = ['smatsnap.strima.co.za'];

export default defineConfig({
    plugins: [vue()],
    server: { port: 5173, allowedHosts },
    preview: { allowedHosts },
});
