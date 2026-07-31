from fastapi import APIRouter

from app.services.agent import chat as agent_chat

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat")
def chat(payload: dict):
    message = payload.get("message", "")
    history = payload.get("history", []) or []
    session_id = payload.get("session_id")
    result = agent_chat(message, history, session_id)
    return {"reply": result["reply"], "tool_calls": result.get("tool_calls", [])}
