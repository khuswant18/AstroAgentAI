"""Birth chart computation tool using kerykeion."""

from datetime import datetime
from langchain_core.tools import tool
from kerykeion import AstrologicalSubject


@tool
def compute_birth_chart(
    date: str,
    time: str,
    lat: float,
    lon: float,
    timezone: str,
    name: str = "User",
) -> dict:
    """Compute a natal birth chart for the given birth details.

    Args:
        date: Birth date in ISO format YYYY-MM-DD.
        time: Birth time in 24h format HH:MM.
        lat: Latitude of birth place.
        lon: Longitude of birth place.
        timezone: IANA timezone string, e.g. "Asia/Kolkata".
        name: Name of the person (optional, defaults to "User").

    Returns:
        A dict containing planets, houses, ascendant, and computation timestamp.
    """
    # Coerce coordinates — LLM occasionally passes strings
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid coordinates: lat={lat}, lon={lon}. Must be numeric. Error: {e}")

    try:
        dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    except ValueError as e:
        raise ValueError(
            f"Invalid date/time format. Expected YYYY-MM-DD and HH:MM. Got: {date} {time}. Error: {e}"
        )

    # Create the astrological subject with explicit coordinates (offline mode)
    subject = AstrologicalSubject(
        name,
        dt.year,
        dt.month,
        dt.day,
        dt.hour,
        dt.minute,
        lng=lon,
        lat=lat,
        tz_str=timezone,
        online=False,
    )

    # Extract planet data
    planet_names = [
        "sun", "moon", "mercury", "venus", "mars",
        "jupiter", "saturn", "uranus", "neptune", "pluto",
    ]

    planets = []
    for pname in planet_names:
        planet = getattr(subject, pname, None)
        if planet is None:
            continue
        planets.append({
            "name": getattr(planet, "name", pname.capitalize()),
            "sign": getattr(planet, "sign", "Unknown"),
            "degree": round(getattr(planet, "position", 0), 2),
            "house": getattr(planet, "house", "Unknown"),
            "retrograde": getattr(planet, "retrograde", False),
        })

    # Extract houses
    houses = []
    for i in range(1, 13):
        house_names = [
            "first_house", "second_house", "third_house", "fourth_house",
            "fifth_house", "sixth_house", "seventh_house", "eighth_house",
            "ninth_house", "tenth_house", "eleventh_house", "twelfth_house",
        ]
        house_data = getattr(subject, house_names[i - 1], None)
        if house_data is not None:
            houses.append({
                "number": i,
                "sign": getattr(house_data, "sign", "Unknown"),
                "degree": round(getattr(house_data, "position", 0), 2),
            })

    # Ascendant
    first_house = getattr(subject, "first_house", None)
    ascendant = {
        "sign": getattr(first_house, "sign", "Unknown") if first_house else "Unknown",
        "degree": round(getattr(first_house, "position", 0), 2) if first_house else 0,
    }

    return {
        "planets": planets,
        "houses": houses,
        "ascendant": ascendant,
        "computed_at_utc": datetime.utcnow().isoformat(),
    }
