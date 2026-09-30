"""Telegram and Meta WhatsApp webhook entry points."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.intake_pipeline import IntakeUnavailable

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/telegram")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    from telegram_bot.bot import handle_update

    payload = await request.json()
    try:
        return await handle_update(payload, db)
    except IntakeUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid Telegram update") from exc


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    messages = [
        message
        for entry in payload.get("entry", [])
        for change in entry.get("changes", [])
        for message in change.get("value", {}).get("messages", [])
    ]
    if not messages:
        return {"accepted": True, "status": "WhatsApp integration: ready for Meta approval", "processed": 0}

    from app.services.intake_pipeline import submit_complaint

    results = []
    for message in messages:
        body = message.get("text", {}).get("body", "").strip()
        if not body:
            continue
        try:
            results.append(await submit_complaint(db, body, source="whatsapp"))
        except IntakeUnavailable as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except (RuntimeError, ValueError) as exc:
            raise HTTPException(status_code=503 if isinstance(exc, RuntimeError) else 400, detail=str(exc)) from exc
    return {
        "accepted": True,
        "status": "WhatsApp integration: ready for Meta approval",
        "processed": len(results),
        "results": results,
    }