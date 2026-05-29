"""Geocoding tool — resolve a place name to lat/lon/timezone."""

from langchain_core.tools import tool
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder


@tool
def geocode_place(place: str) -> dict:
    """Geocode a place name to latitude, longitude, timezone, and display name.

    Args:
        place: A free-text place name, e.g. "Mumbai, India" or "New York, USA".

    Returns:
        A dict with lat, lon, timezone (IANA), and display_name.
    """
    geolocator = Nominatim(user_agent="astroagent", timeout=10)
    location = geolocator.geocode(place)

    if location is None:
        raise ValueError(
            f"Could not geocode place '{place}'. "
            "Please provide a more specific location (city, country)."
        )

    tf = TimezoneFinder()
    timezone = tf.timezone_at(lat=location.latitude, lng=location.longitude)

    if timezone is None:
        raise ValueError(
            f"Could not determine timezone for '{place}' "
            f"(lat={location.latitude}, lon={location.longitude})."
        )

    return {
        "lat": float(location.latitude),
        "lon": float(location.longitude),
        "timezone": str(timezone),
        "display_name": str(location.address),
    }
