from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "UrbanMind API"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/urbanmind"
    redis_url: str = "redis://localhost:6379/0"
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-6"
    openai_api_key: str = ""
    pinecone_api_key: str = ""
    pinecone_index: str = "urbanmind"
    secret_key: str = ""
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
