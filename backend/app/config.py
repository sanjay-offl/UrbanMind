from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "UrbanMind API"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/urbanmind"
    redis_url: str = "redis://localhost:6379/0"

    # Google Cloud & AI credentials
    google_api_key: str = ""
    vertex_ai_project: str = ""
    vertex_ai_location: str = "asia-south1"
    google_application_credentials: str = ""
    firebase_project_id: str = ""

    # Google AI models (reported verbatim in every API response)
    gemini_model: str = "gemini-2.0-flash"
    gemini_pro_model: str = "gemini-2.0-pro"
    gemini_embedding_model: str = "text-embedding-004"
    speech_model: str = "chirp"
    speech_languages: str = (
        "en-IN,hi-IN,ta-IN,te-IN,kn-IN,ml-IN,bn-IN,mr-IN,gu-IN,pa-IN,or-IN,ur-IN"
    )

    # Other Google Cloud services
    google_maps_api_key: str = ""
    google_cloud_storage_bucket: str = ""
    bigquery_dataset: str = "urbanmind_prod"
    bigquery_location: str = "asia-south1"
    telegram_bot_token: str = ""
    whatsapp_verify_token: str = ""

    # Deduplication
    dedup_similarity_threshold: float = 0.92

    # Application settings
    secret_key: str = "dev_secret_key_urbanmind"
    cors_origins: str = "http://localhost:3000"
    demo_mode: bool = False

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def speech_language_codes(self) -> list[str]:
        return [code.strip() for code in self.speech_languages.split(",") if code.strip()]

    @property
    def is_demo_mode(self) -> bool:
        """True when no Google AI credential is configured.

        Demo mode never runs a keyword fallback: callers must serve only
        pre-computed data from ``data/demo_classifications.json``.
        """
        if self.demo_mode:
            return True
        return not (self.google_api_key.strip() or self.vertex_ai_project.strip())


settings = Settings()
