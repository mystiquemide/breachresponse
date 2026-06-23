import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'index',
    'getting-started',
    'how-it-works',
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/system-design',
        'architecture/monitor-pipeline',
        'architecture/detect-pipeline',
        'architecture/respond-pipeline',
      ],
    },
    {
      type: 'category',
      label: 'Smart Contracts',
      items: [
        'smart-contracts/sentinel-registry',
        'smart-contracts/genlayer-consensus',
      ],
    },
    {
      type: 'category',
      label: 'Sentinel Agent',
      items: [
        'agent/installation',
        'agent/configuration',
        'agent/response-modes',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/overview',
        'api-reference/audit',
        'api-reference/analyze',
        'api-reference/compare',
        'api-reference/gas-estimate',
        'api-reference/sentinels',
        'api-reference/telemetry',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/vercel',
        'deployment/railway-worker',
        'deployment/neon-postgres',
        'deployment/environment-variables',
      ],
    },
  ],
};

export default sidebars;
