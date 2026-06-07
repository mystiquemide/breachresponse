# ANALYTICS: Sentinel.ax

## Metric Schemas (On-Chain / Agent)
- `mempool_scan_rate`: Txs processed per second.
- `anomaly_score`: 0-100 score of current block risk.
- `time_to_formulate_ms`: Latency from alert generation to LLM-assisted response proposal.
- `time_to_human_approval_ms`: Time taken from alert generation to human signature.

## Dashboard Specs (Frontend)
- The main UI itself is an analytics dashboard for the protocol.
- It displays a live chart of "Value at Risk" vs "Value Secured".
