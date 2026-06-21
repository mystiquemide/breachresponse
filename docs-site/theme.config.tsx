import type { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ 
        fontWeight: 700, 
        fontSize: "1.1rem", 
        letterSpacing: "0.1em",
        color: "#10B981" 
      }}>
        BREACH RESPONSE
      </span>
    </div>
  ),
  project: {
    link: "https://github.com/mystiquemide/breachresponse",
  },
  docsRepositoryBase: "https://github.com/mystiquemide/breachresponse/tree/main/docs-site",
  footer: {
    content: (
      <span style={{ color: "#6B7280", fontSize: "0.75rem" }}>
        BreachResponse — AI-powered contract security for Mantle Network
      </span>
    ),
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="BreachResponse — AI-powered contract auditing, gas estimation, and incident response for Mantle" />
      <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>" />
      <style>{`
        :root {
          --nextra-bg: #050507 !important;
        }
        body {
          background: #050507 !important;
          color: #e5e7eb !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
        }
        .nextra-navbar {
          background: rgba(5, 5, 7, 0.95) !important;
          backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid rgba(16, 185, 129, 0.1) !important;
        }
        .nextra-sidebar {
          background: #050507 !important;
        }
        .nextra-toc {
          background: #050507 !important;
        }
        .nextra-breadcrumb {
          color: #10B981 !important;
        }
        a {
          color: #10B981 !important;
        }
        a:hover {
          color: #34D399 !important;
        }
        .nextra-navbar a, .nextra-navbar button {
          color: #e5e7eb !important;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #ffffff !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
        }
        code {
          background: rgba(16, 185, 129, 0.08) !important;
          color: #10B981 !important;
          border: 1px solid rgba(16, 185, 129, 0.15) !important;
        }
        pre {
          background: #0a0a0c !important;
          border: 1px solid rgba(16, 185, 129, 0.12) !important;
        }
        .nextra-callout {
          background: rgba(16, 185, 129, 0.05) !important;
          border-color: rgba(16, 185, 129, 0.2) !important;
        }
        .nextra-card {
          background: rgba(16, 16, 20, 0.6) !important;
          border: 1px solid rgba(16, 185, 129, 0.1) !important;
        }
        .nextra-card:hover {
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        .nextra-search input {
          background: #0a0a0c !important;
          border: 1px solid rgba(16, 185, 129, 0.15) !important;
          color: #e5e7eb !important;
        }
        table {
          border-color: rgba(16, 185, 129, 0.1) !important;
        }
        th {
          background: rgba(16, 185, 129, 0.05) !important;
          color: #10B981 !important;
        }
        td {
          border-color: rgba(16, 185, 129, 0.08) !important;
        }
      `}</style>
    </>
  ),
  darkMode: false,
  nextThemes: { defaultTheme: "dark", forcedTheme: "dark" },
  sidebar: { defaultMenuCollapseLevel: 1 },
  toc: { backToTop: true },
  feedback: { content: null },
  editLink: { content: "Edit this page →" },
};

export default config;
