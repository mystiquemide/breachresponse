import pathlib

AGENT_DIR = pathlib.Path(__file__).parent
ROOT = AGENT_DIR.parent


def test_agent_api_base_url_is_configurable_and_not_hardcoded_to_3002():
    reporter = (AGENT_DIR / "reporter.py").read_text()
    main = (AGENT_DIR / "main.py").read_text()

    assert "FRONTEND_API_BASE_URL" in reporter
    assert "frontend_api_url" in reporter
    assert "http://localhost:3002" not in reporter
    assert "http://localhost:3002" not in main


def test_frontend_has_agent_log_ingest_route_for_sse_bridge():
    route = ROOT / "frontend" / "src" / "app" / "api" / "logs" / "ingest" / "route.ts"
    assert route.exists()

    source = route.read_text()
    assert "sseEmitter.emit('log'" in source
    assert "'LOG'" in source
    assert "'ALERT'" in source
    assert "body.status === 'MITIGATED'" in source
    assert "NextResponse.json" in source
