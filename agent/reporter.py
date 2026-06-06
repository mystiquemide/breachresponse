import urllib.request
import json
import os

NEXT_JS_API = "http://localhost:3002/api"

class Reporter:
    @staticmethod
    def log(text: str, level: str = "INFO"):
        """Sends a raw log line to the SSE endpoint."""
        url = f"{NEXT_JS_API}/logs/ingest"
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
        url = f"{NEXT_JS_API}/nodes/heartbeat"
        payload = {"address": address, "name": name}
        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, timeout=2)
        except Exception as e:
            pass
