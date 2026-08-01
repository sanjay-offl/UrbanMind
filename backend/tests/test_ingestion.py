from app.services.ingestion import parse_csv

VALID_CSV = b"""title,description,ward_name,latitude,longitude
Pothole on Begumpet road,Big pothole near the bus stop,Begumpet,17.4493,78.4740
No water supply,No water in the colony since morning,Ameerpet,17.4375,78.4483
Broken streetlight,Dark stretch at night,Kukatpally,17.4948,78.4074
"""


def test_parse_csv_valid_returns_three_rows():
    rows, errors = parse_csv(VALID_CSV)
    assert len(rows) == 3
    assert errors == []
    assert rows[0]["title"] == "pothole on begumpet road"
    assert rows[0]["ward_name"] == "begumpet"
    assert rows[0]["latitude"] == 17.4493
    assert rows[0]["longitude"] == 78.4740


def test_parse_csv_falls_back_to_first_column_and_skips_short_rows():
    data = b"title,ward_name\nNo water,Ameerpet\n"
    rows, errors = parse_csv(data)
    assert rows == []
    assert any("Row 1" in error for error in errors)


def test_parse_csv_complaint_text_variant():
    data = b"complaint_text,ward,date\nSewage overflow near Ward 42 school,Ward 42 Adyar,2024-08-01\n"
    rows, errors = parse_csv(data)
    assert len(rows) == 1
    assert rows[0]["title"] == "sewage overflow near ward 42 school"
    assert rows[0]["ward_name"] == "ward 42 adyar"


def test_parse_csv_empty_file_returns_error():
    rows, errors = parse_csv(b"")
    assert rows == []
    assert errors


def test_parse_csv_invalid_utf8_returns_error():
    rows, errors = parse_csv(b"\xff\xfe\x00not utf8")
    assert rows == []
    assert errors


def test_parse_csv_skips_rows_without_title():
    data = b"title,description,ward_name\n,No description,Begumpet\nValid title,Some description,Ameerpet\n"
    rows, errors = parse_csv(data)
    assert len(rows) == 1
    assert any("Row 1" in error for error in errors)
