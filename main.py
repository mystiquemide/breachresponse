"""Railway entrypoint shim.

Supports deployments that run from the repository root while the worker source
lives under agent/. If Railway is configured with agent as the root directory,
agent/main.py is used directly and this file is ignored.
"""

from pathlib import Path
import runpy
import sys

AGENT_DIR = Path(__file__).resolve().parent / "agent"
sys.path.insert(0, str(AGENT_DIR))
runpy.run_path(str(AGENT_DIR / "main.py"), run_name="__main__")
