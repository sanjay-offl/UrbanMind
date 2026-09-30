"""Telegram adapter that feeds text, voice, and photos into shared intake."""

from __future__ import annotations

import asyncio
import base64
from io import BytesIO

from sqlalchemy.orm import Session

from app.config import settings
from app.services.intake_pipeline import IntakeUnavailable, submit_complaint
from app.services.speech import transcribe_audio


async def register_webhook(public_base_url: str) -> bool:
    """Register the Telegram webhook at ``/webhooks/telegram``."""
    if not settings.telegram_bot_token:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN before registering the webhook.")
    from telegram import Bot

    async with Bot(settings.telegram_bot_token) as bot:
        return await bot.set_webhook(f"{public_base_url.rstrip('/')}/webhooks/telegram")


async def handle_update(payload: dict, db: Session) -> dict:
    if not settings.telegram_bot_token:
        raise IntakeUnavailable("Set TELEGRAM_BOT_TOKEN to enable Telegram intake.")
    from telegram import Bot, Update

    async with Bot(settings.telegram_bot_token) as bot:
        update = Update.de_json(payload, bot)
        message = update.effective_message
        if message is None:
            return {"ok": True, "processed": False}

        complaint_text = message.text or message.caption or ""
        photo_bytes = None
        photo_mime = None
        if message.voice or message.audio:
            voice = message.voice or message.audio
            telegram_file = await bot.get_file(voice.file_id)
            audio = bytes(await telegram_file.download_as_bytearray())
            transcript = await asyncio.to_thread(transcribe_audio, audio)
            complaint_text = str(transcript["transcript"])
        elif message.photo:
            telegram_file = await bot.get_file(message.photo[-1].file_id)
            photo_bytes = bytes(await telegram_file.download_as_bytearray())
            photo_mime = "image/jpeg"

        if not complaint_text.strip() and photo_bytes is None:
            await message.reply_text("Please send a text request, voice note, or civic issue photo.")
            return {"ok": True, "processed": False}

        result = await submit_complaint(
            db,
            complaint_text,
            source="telegram",
            photo=photo_bytes,
            photo_mime_type=photo_mime,
        )
        await message.reply_text(result["confirmation_text"])
        encoded_audio = result.get("confirmation_audio_base64")
        if encoded_audio:
            await bot.send_voice(
                chat_id=message.chat_id,
                voice=BytesIO(base64.b64decode(encoded_audio)),
                filename="confirmation.mp3",
            )
        return {"ok": True, "processed": True, "reference_id": result["reference_id"]}