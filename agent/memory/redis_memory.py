"""Redis-backed conversation memory for the agent."""

from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import RedisChatMessageHistory

from agent import config


def get_memory(session_id: str) -> ConversationBufferMemory:
    """Build a conversation memory stored in Redis for the given session."""
    history = RedisChatMessageHistory(session_id=session_id, url=config.REDIS_URL)
    return ConversationBufferMemory(
        chat_memory=history,
        return_messages=True,
        memory_key="chat_history",
    )
