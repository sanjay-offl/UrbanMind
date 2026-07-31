"""UrbanMind agent entrypoint: builds a LangChain AgentExecutor and REPL."""

from langchain.agents import AgentExecutor, create_agent
from langchain_anthropic import ChatAnthropic

from agent import config
from agent.memory import get_memory
from agent.prompts import SYSTEM_PROMPT
from agent.tools import map_tool, report_tool, sql_query_tool, trend_tool

TOOLS = [sql_query_tool, trend_tool, map_tool, report_tool]


def build_agent(session_id: str) -> AgentExecutor:
    """Build a conversational AgentExecutor for the given session."""
    llm = ChatAnthropic(model=config.CLAUDE_MODEL, temperature=0)
    memory = get_memory(session_id)
    agent = create_agent(
        llm=llm,
        tools=TOOLS,
        system_prompt=SYSTEM_PROMPT,
    )
    return AgentExecutor(
        agent=agent,
        tools=TOOLS,
        memory=memory,
        handle_parsing_errors=True,
        verbose=True,
    )


def _extract_tool_calls(result: dict) -> list[str]:
    calls = []
    for step in result.get("intermediate_steps", []):
        action = step[0]
        if hasattr(action, "tool"):
            calls.append(action.tool)
    return calls


def invoke_agent(message: str, session_id: str) -> dict:
    """Invoke the agent with a user message and return reply and tool calls."""
    executor = build_agent(session_id)
    result = executor.invoke({"input": message})
    return {"reply": result.get("output", ""), "tool_calls": _extract_tool_calls(result)}


def main() -> None:
    """Local REPL for testing the agent against a real backend."""
    session_id = input("Session ID (default 'local'): ").strip() or "local"
    print("UrbanMind agent ready. Type 'exit' to quit.")
    while True:
        message = input("You: ").strip()
        if message.lower() in {"exit", "quit"}:
            break
        response = invoke_agent(message, session_id)
        print(f"Agent: {response['reply']}")


if __name__ == "__main__":
    main()
