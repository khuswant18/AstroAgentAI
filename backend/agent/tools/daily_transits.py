"""Daily transits tool — compute current planetary positions and aspects to natal chart."""

import json
from datetime import datetime
from langchain_core.tools import tool
from kerykeion import AstrologicalSubject


# Aspect definitions: (name, target_angle, orb_degrees)
ASPECTS = [
    ("conjunction", 0, 8),
    ("opposition", 180, 8),
    ("trine", 120, 6),
    ("square", 90, 6),
    ("sextile", 60, 4),
]


def _absolute_longitude(sign: str, degree: float) -> float:
    """Convert sign + degree to absolute ecliptic longitude (0–360)."""
    signs_order = [
        "Ari", "Tau", "Gem", "Can", "Leo", "Vir",
        "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis",
    ]
    idx = signs_order.index(sign) if sign in signs_order else 0
    return idx * 30.0 + degree


def _angle_between(lon1: float, lon2: float) -> float:
    """Compute the shortest angular distance between two ecliptic longitudes."""
    diff = abs(lon1 - lon2) % 360
    return min(diff, 360 - diff)


@tool
def get_daily_transits(date: str, natal_chart: str) -> dict:
    """Compute daily planetary transits and their aspects to a natal chart.

    Args:
        date: The date to compute transits for, in ISO format YYYY-MM-DD.
        natal_chart: JSON string of the natal chart dict (from compute_birth_chart).

    Returns:
        A dict with the date, transiting planet positions, and aspects to natal planets.
    """
    # Parse natal chart from JSON string if needed
    if isinstance(natal_chart, str):
        natal_data = json.loads(natal_chart)
    else:
        natal_data = natal_chart

    try:
        dt = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise ValueError(f"Invalid date format. Expected YYYY-MM-DD. Got: {date}")

    # Create a transit subject for noon UTC on the given date
    transit_subject = AstrologicalSubject(
        "Transit",
        dt.year,
        dt.month,
        dt.day,
        12,  # noon
        0,
        lng=0.0,  # Greenwich for UTC reference
        lat=51.4772,
        tz_str="UTC",
        online=False,
    )

    planet_names = [
        "sun", "moon", "mercury", "venus", "mars",
        "jupiter", "saturn", "uranus", "neptune", "pluto",
    ]

    transiting_planets = []
    for pname in planet_names:
        planet = getattr(transit_subject, pname, None)
        if planet is None:
            continue
        transiting_planets.append({
            "name": getattr(planet, "name", pname.capitalize()),
            "sign": getattr(planet, "sign", "Unknown"),
            "degree": round(getattr(planet, "position", 0), 2),
            "retrograde": getattr(planet, "retrograde", False),
        })

    # Find aspects between transiting and natal planets
    aspects_to_natal = []
    natal_planets = natal_data.get("planets", [])

    for tp in transiting_planets:
        tp_lon = _absolute_longitude(tp["sign"], tp["degree"])

        for np_data in natal_planets:
            if not isinstance(np_data, dict) or "sign" not in np_data or "degree" not in np_data:
                continue
                
            np_lon = _absolute_longitude(np_data["sign"], np_data["degree"])
            angle = _angle_between(tp_lon, np_lon)

            for aspect_name, target_angle, orb in ASPECTS:
                if abs(angle - target_angle) <= orb:
                    aspects_to_natal.append({
                        "transiting_planet": tp["name"],
                        "natal_planet": np_data.get("name", "Unknown"),
                        "aspect": aspect_name,
                        "angle": round(angle, 2),
                        "orb": round(abs(angle - target_angle), 2),
                    })

    return {
        "date": date,
        "transiting_planets": transiting_planets,
        "aspects_to_natal": aspects_to_natal,
    }
