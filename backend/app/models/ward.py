"""Backward compatibility alias for the legacy Ward model.

The `wards` table is replaced by `admin_units` representing India's national
administrative hierarchy (country, states, districts, blocks).
"""

from app.models.admin_unit import AdminUnit

# Alias Ward to AdminUnit so legacy queries and imports continue to function
Ward = AdminUnit

__all__ = ["Ward"]
