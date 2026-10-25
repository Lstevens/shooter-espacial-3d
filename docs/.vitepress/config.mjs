import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Shooter 3D Arena',
  description: 'Documentacion tecnica del prototipo Three.js + Vite',
  lang: 'es-ES',
  lastUpdated: true,
  cleanUrls: true,

  markdown: {
    config: (md) => {
      // Mermaid se renderiza via cliente en VitePress 1.x
      // No se necesita plugin server-side
    }
  },

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'mermaid'
      }
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Shooter 3D Docs',

    nav: [
      { text: 'Guia', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'Referencia', link: '/reference/config', activeMatch: '/reference/' },
      { text: 'Tutoriales', link: '/tutorials/add-weapon', activeMatch: '/tutorials/' },
      { text: 'Contribuir', link: '/contributing/agents' },
      { text: 'GitHub', link: 'https://github.com/tu-usuario/shooter-3d' }
    ],

    sidebar: {
      '/guide/': [
        { text: 'Introduccion', items: [
          { text: 'Arranque rapido', link: '/guide/getting-started' },
          { text: 'Arquitectura', link: '/guide/architecture' },
          { text: 'Game Loop', link: '/guide/game-loop' },
          { text: 'Extender el juego', link: '/guide/extending' }
        ]}
      ],
      '/reference/': [
        { text: 'Referencia', items: [
          { text: 'Configuracion', link: '/reference/config' },
          { text: 'Contratos (Tipos)', link: '/reference/contracts' },
          { text: 'API Core', link: '/reference/api/core' },
          { text: 'API Weapons', link: '/reference/api/weapons' },
          { text: 'API Enemies', link: '/reference/api/enemies' },
          { text: 'API Engine', link: '/reference/api/engine' }
        ]}
      ],
      '/tutorials/': [
        { text: 'Tutoriales', items: [
          { text: 'Anadir arma', link: '/tutorials/add-weapon' },
          { text: 'Anadir enemigo', link: '/tutorials/add-enemy' },
          { text: 'Anadir camara', link: '/tutorials/add-stage' }
        ]}
      ],
      '/contributing/': [
        { text: 'Contribuir', items: [
          { text: 'Reglas para agentes', link: '/contributing/agents' },
          { text: 'Workflow y PR', link: '/contributing/workflow' }
        ]}
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tu-usuario/shooter-3d' }
    ],

    footer: {
      message: 'Licencia MIT | Hecho con VitePress',
      copyright: 'Copyright 2026 CITT-videojuegoAI'
    },

    search: { provider: 'local' },
    editLink: { pattern: 'https://github.com/tu-usuario/shooter-3d/edit/main/docs/:path', text: 'Editar en GitHub' }
  }
})