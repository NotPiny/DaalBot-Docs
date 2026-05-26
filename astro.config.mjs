// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator'

import svelte from '@astrojs/svelte';

export default defineConfig({
    integrations: [starlight({
        plugins: [starlightLinksValidator()],
        title: 'DaalBot Docs',
        customCss: ['./src/styles/m3-theme.css'],
        social: [
            {
                icon: 'github',
                label: 'GitHub',
                href: 'https://github.com/DaalBot/Docs'
            }],
        sidebar: [
            {
                label: 'Guides',
                autogenerate: { directory: 'guides' },
            },
            {
                label: 'Commands',
                autogenerate: { directory: 'commands', collapsed: true }
            },
            {
                label: 'Features',
                autogenerate: { directory: 'features' }
            },
            {
                label: 'API',
                autogenerate: { directory: 'api' }
            },
            {
                label: 'Reference',
                autogenerate: { directory: 'reference' },
            }
        ],
        editLink: {
            baseUrl: 'https://github.com/DaalBot/Docs/edit/main/'
        }
    }), svelte()],
    server: {
        allowedHosts: true
    },
    site: 'https://docs.daalbot.xyz',
});