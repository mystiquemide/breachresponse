import urllib.request
import json
import os


def frontend_api_url(path: str = "") -> str:
    """Builds a frontend API URL from FRONTEND_API_BASE_URL."""
    base_url = os.getenv("FRONTEND_API_BASE_URL", "http://127.0.0.1:3000/api").rstrip("/")
    clean_path = path.lstrip("/")
    return f"{base_url}/{clean_path}" if clean_path else base_url


class Reporter:
    @staticmethod
    def log(text: str, level: str = "INFO"):
        """Sends a raw log line to the SSE endpoint."""
        url = frontend_api_url("logs/ingest")
        payload = {"text": text, "level": level}
        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, timeout=2)
        except Exception as e:
            pass # Fail silently for log streaming to avoid terminal spam
            
    @staticmethod
    def heartbeat(address: str, name: str = "Sentinel.ax Node"):
        """Sends a heartbeat ping to keep node active in UI."""
        url = frontend_api_url("nodes/heartbeat")
        payload = {"address": address, "name": name}
        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, timeout=2)
        except Exception as e:
            pass
