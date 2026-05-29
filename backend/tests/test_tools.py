"""Unit tests for AstroAgent tools."""

import json
import os
import sys
import pytest
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestGeocode:
    """Tests for the geocode_place tool."""

    def test_valid_place(self):
        from agent.tools.geocode import geocode_place

        result = geocode_place.invoke({"place": "Delhi, India"})
        assert "lat" in result
        assert "lon" in result
        assert "timezone" in result
        assert "display_name" in result
        assert isinstance(result["lat"], float)
        assert isinstance(result["lon"], float)
        # Delhi should be roughly at 28.6N, 77.2E
        assert 25 < result["lat"] < 32
        assert 74 < result["lon"] < 80
        assert "Asia/Kolkata" in result["timezone"]

    def test_invalid_place(self):
        from agent.tools.geocode import geocode_place

        with pytest.raises(Exception):
            geocode_place.invoke({"place": "Xyzabcnotarealplace123"})

    def test_place_with_country(self):
        from agent.tools.geocode import geocode_place

        result = geocode_place.invoke({"place": "London, United Kingdom"})
        assert "lat" in result
        assert abs(result["lat"] - 51.5) < 1.0  # London is ~51.5N


class TestBirthChart:
    """Tests for the compute_birth_chart tool."""

    def test_valid_chart(self):
        from agent.tools.birth_chart import compute_birth_chart

        result = compute_birth_chart.invoke({
            "date": "1990-06-15",
            "time": "08:30",
            "lat": 28.6139,
            "lon": 77.209,
            "timezone": "Asia/Kolkata",
            "name": "Test User",
        })
        assert "planets" in result
        assert "houses" in result
        assert "ascendant" in result
        assert "computed_at_utc" in result
        assert len(result["planets"]) > 0

        # Check planet structure
        planet = result["planets"][0]
        assert "name" in planet
        assert "sign" in planet
        assert "degree" in planet

    def test_invalid_date(self):
        from agent.tools.birth_chart import compute_birth_chart

        with pytest.raises(Exception):
            compute_birth_chart.invoke({
                "date": "invalid-date",
                "time": "12:00",
                "lat": 0.0,
                "lon": 0.0,
                "timezone": "UTC",
            })


class TestDailyTransits:
    """Tests for the get_daily_transits tool."""

    def test_transits_with_natal(self):
        from agent.tools.birth_chart import compute_birth_chart
        from agent.tools.daily_transits import get_daily_transits

        # First compute a natal chart
        natal = compute_birth_chart.invoke({
            "date": "1990-06-15",
            "time": "08:30",
            "lat": 28.6139,
            "lon": 77.209,
            "timezone": "Asia/Kolkata",
        })

        # Then compute transits
        result = get_daily_transits.invoke({
            "date": "2026-05-27",
            "natal_chart": json.dumps(natal),
        })

        assert "date" in result
        assert "transiting_planets" in result
        assert "aspects_to_natal" in result
        assert len(result["transiting_planets"]) > 0


class TestKnowledge:
    """Tests for the knowledge_lookup tool (requires ChromaDB to be initialized)."""

    @pytest.mark.skipif(
        not os.path.exists(os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")),
        reason="ChromaDB not initialized — run 'python ingest.py' first",
    )
    def test_knowledge_lookup(self):
        from agent.tools.knowledge import knowledge_lookup

        result = knowledge_lookup.invoke({"query": "What is a grand trine?"})
        assert isinstance(result, list)
        assert len(result) > 0
        # Should contain something about trines
        combined = " ".join(result).lower()
        assert "trine" in combined


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
