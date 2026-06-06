import os

files = {
    ".gitignore": """
node_modules/
.next/
dist/
build/
coverage/
.env
.env.local
.env.*.local
venv/
__pycache__/
*.pyc
contracts/artifacts/
contracts/cache/
contracts/typechain-types/
""",
    "LICENSE": """MIT License

Copyright (c) 2024 Sentinel.ax

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
""",
    "CONTRIBUTING.md": """# Contributing to Sentinel.ax

We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
""",
    "SECURITY.md": """# Security Policy

## Supported Versions
Only the latest version is supported.

## Reporting a Vulnerability
Please do not report security vulnerabilities through public GitHub issues. Instead, email security@sentinel.ax.
""",
    "CHANGELOG.md": """# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2024-10-25
### Added
- Initial public release
- Next.js 14 Frontend Command Center
- Python-based AI Agent for Mempool Scanning
- Mantle Sepolia Smart Contracts for TargetVault and SentinelRegistry
- GitHub CI/CD, CodeQL, and Dependabot workflows
""",
    "docs/DEPLOYMENT.md": """# Deployment Guide

## Prerequisites
- Node.js 20+
- Python 3.10+
- A funded Mantle Sepolia wallet

## Local Development
1. Clone the repo.
2. Run `npm install` in the `frontend` and `contracts` directories.
3. Add your `.env` variables.
4. Run `npm run dev` in the frontend directory.
""",
    ".github/workflows/ci.yml": """name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      - name: Build Frontend
        run: npm run build
        working-directory: ./frontend
""",
    ".github/workflows/codeql.yml": """name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '30 1 * * 0'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [javascript-typescript, python]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: /language:${{ matrix.language }}
""",
    ".github/dependabot.yml": """version: 2
updates:
  - package-ecosystem: npm
    directory: /frontend
    schedule:
      interval: weekly
  - package-ecosystem: npm
    directory: /contracts
    schedule:
      interval: weekly
  - package-ecosystem: pip
    directory: /agent
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
""",
    ".github/ISSUE_TEMPLATE/bug_report.md": """---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error
""",
    ".github/ISSUE_TEMPLATE/feature_request.md": """---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem?**
A clear and concise description of what the problem is.
""",
    ".github/pull_request_template.md": """## Description
Please include a summary of the change and which issue is fixed.

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
"""
}

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else ".", exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Generated all Github Launch Polish files successfully.")
