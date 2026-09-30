"""UrbanMind agent entrypoint powered by Gemini."""

from agent import config
from agent.prompts import SYSTEM_PROMPT


def build_agent(session_id: str):
    """Build conversational agent for the given session using Gemini."""
    # Stubs or wires Gemini agent (completed in Phase 5 function calling)
    raise NotImplementedError("Gemini function-calling agent integration is scheduled for Phase 5.")


def invoke_agent(message: str, session_id: str) -> dict:
    """Invoke the agent with a user message."""
    try:
        executor = build_agent(session_id)
        return executor.invoke({"input": message})
    except NotImplementedError:
        return {
            "reply": "UrbanMind Gemini Agent is being initialized with BigQuery and national data tools.",
            "tool_calls": [],
        }


def main() -> None:
    session_id = input("Session ID (default 'local'): ").strip() or "local"
    print("UrbanMind agent ready.")
    while True:
        message = input("You: ").strip()
        if message.lower() in {"exit", "quit"}:
            break
        response = invoke_agent(message, session_id)
        print(f"Agent: {response['reply']}")


if __name__ == "__main__":
    main()
