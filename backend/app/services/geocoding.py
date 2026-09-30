"""Google Maps Geocoding API adapter."""

from __future__ import annotations

import httpx

from app.config import settings

GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def _component(components: list[dict], kind: str) -> str | None:
    for component in components:
        if kind in component.get("types", []):
            return component.get("long_name")
    return None


def geocode_mentions(location_mentions: list[str]) -> dict | None:
    """Resolve the first mentioned location, or return None when unlocated."""
    if not settings.google_maps_api_key:
        return None
    for mention in location_mentions:
        if not str(mention).strip():
            continue
        try:
            response = httpx.get(
                GEOCODING_URL,
                params={"address": f"{mention}, India", "key": settings.google_maps_api_key},
                timeout=8.0,
            )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError:
            return None
        results = payload.get("results") or []
        if payload.get("status") != "OK" or not results:
            continue
        result = results[0]
        components = result.get("address_components") or []
        point = result.get("geometry", {}).get("location") or {}
        lat, lng = point.get("lat"), point.get("lng")
        if lat is None or lng is None:
            continue
        return {
            "lat": float(lat),
            "lng": float(lng),
            "state": _component(components, "administrative_area_level_1"),
            "district": (
                _component(components, "administrative_area_level_2")
                or _component(components, "locality")
            ),
            "block": _component(components, "administrative_area_level_3"),
            "formatted_address": result.get("formatted_address"),
        }
    return None