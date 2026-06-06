# Deployment Guide

This guide covers deploying the Next.js frontend to Vercel and running the Python Sentinel agent in production.

## Prerequisites
- Node.js v20+
- Python 3.11+
- Vercel CLI (optional)
- RPC access to Mantle Sepolia

## Required Environment Variables
Ensure the following variables are set in your production environment (Vercel Dashboard / Server ENV):
- `MANTLE_RPC_URL`
- `NEXT_PUBLIC_WALLETCONNECT_ID`
- `OPENAI_API_KEY`
- `PRIVATE_KEY`

## Deploying the Frontend to Vercel
The frontend is pre-configured for Vercel deployment.

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Link your project:
   ```bash
   vercel link
   ```
3. Deploy to production:
   ```bash
   vercel deploy --prod
   ```

## Deploying the Sentinel Agent
The Python agent should run on a highly available server (e.g., AWS EC2, DigitalOcean Droplet, or Railway).

1. Clone the repository on your remote server.
2. Setup the Python environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Create the `.env` file with your production API keys and RPC URL.
4. Run the agent using `systemd` or `pm2` for process management:
   ```bash
   pm2 start main.py --name "sentinel-agent" --interpreter python
   ```

## Post-Deploy Verification
- Check the Vercel dashboard to ensure the build succeeded.
- Verify the Agent logs to ensure it has successfully connected to the Mantle RPC node.
