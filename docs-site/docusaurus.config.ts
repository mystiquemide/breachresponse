import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'BreachResponse',
  tagline: 'AI-powered active-defense security for Mantle Network',
  favicon: 'img/favicon.ico',

  url: 'https://docs.breachresponse.xyz',
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
      title: 'BREACH RESPONSE',
      style: 'dark',
      logo: {
        alt: 'BreachResponse',
        src: 'img/logo.svg',
      },
      items: [
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
      copyright: `BreachResponse — AI-powered contract security for Mantle Network`,
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
