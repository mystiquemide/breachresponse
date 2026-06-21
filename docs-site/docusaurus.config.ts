import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'BreachResponse Docs',
  tagline: '',
  favicon: 'img/favicon.png',

  url: 'https://breachresponse-docs.vercel.app',
  baseUrl: '/',
  organizationName: 'mystiquemide',
  projectName: 'breachresponse',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          showLastUpdateTime: true,
          editUrl: 'https://github.com/mystiquemide/breachresponse/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      style: 'dark',
      logo: {
        alt: 'BreachResponse',
        src: 'img/logo.png',
        width: 28,
        height: 28,
      },
      items: [
        {
          href: 'https://breachresponse.xyz',
          label: 'App',
          position: 'right',
        },
        {
          href: 'https://github.com/mystiquemide/breachresponse',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: 'BreachResponse',
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
