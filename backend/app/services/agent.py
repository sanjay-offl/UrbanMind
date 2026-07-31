import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[3]

_agent: Any = None
_import_error: Exception | None = None

FALLBACK_REPLY = (
    "The agent workspace is not available right now. Available tools: "
    "grievance search, CSV upload and classification, analytics summary, "
    "trends, categories, ward breakdowns and PDF report generation."
)


def _load_agent():
    global _agent, _import_error
    if _agent is not None:
        return _agent
    if _import_error is not None:
        return None
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))
    try:
        from agent.agent import build_agent

        _agent = build_agent
        return _agent
    except Exception as exc:
        _import_error = exc
        return None


def build_agent():
    return _load_agent()


def chat(message: str, history: list | None = None, session_id: str | None = None) -> dict[str, Any]:
    builder = _load_agent()
    if builder is not None:
        try:
            from agent.agent import invoke_agent

            result = invoke_agent(message, session_id or "default")
            return {"reply": result.get("reply", ""), "tool_calls": result.get("tool_calls", [])}
        except Exception:
            pass
    return {"reply": FALLBACK_REPLY, "tool_calls": []}
