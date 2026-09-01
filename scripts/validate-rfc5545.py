#!/usr/bin/env python3
from datetime import date, datetime, timezone
from pathlib import Path

from icalendar import Calendar
import recurring_ical_events

ICS_PATH = Path(__file__).resolve().parents[1] / "dist" / "MSS.ics"
calendar = Calendar.from_ical(ICS_PATH.read_bytes())
vevents = [component for component in calendar.walk() if component.name == "VEVENT"]
if not vevents:
    raise SystemExit("External RFC parser found no VEVENTs")

uids = []
for event in vevents:
    uid = str(event.get("UID", "")).strip()
    if not uid:
        raise SystemExit(f"VEVENT missing UID: {event.get('SUMMARY', '(untitled)')}")
    uids.append(uid)
if len(uids) != len(set(uids)):
    raise SystemExit("External RFC parser found duplicate UIDs")

expanded = recurring_ical_events.of(calendar).between(
    datetime(2026, 1, 1, tzinfo=timezone.utc),
    datetime(2036, 1, 1, tzinfo=timezone.utc),
)

def start_day(component):
    value = component.decoded("DTSTART")
    return value.date() if isinstance(value, datetime) else value

occurrences = {(str(event.get("SUMMARY", "")), start_day(event)) for event in expanded}

expected = {
    ("New Year's Day", date(2035, 1, 1)),
    ("Lunar New Year (Chunjie)", date(2035, 2, 8)),
    ("Spring Equinox (Ostara)", date(2035, 3, 20)),
    ("Passover", date(2035, 4, 24)),
    ("Buddhist Ghost Festival (Ullambana)", date(2035, 8, 18)),
    ("Burn Night", date(2035, 9, 1)),
    ("Glen Eyrie Madrigal Tickets Go On Sale", date(2035, 9, 4)),
    ("Autumn Equinox (Mabon)", date(2035, 9, 22)),
    ("Indigenous Peoples’ Day", date(2035, 10, 8)),
    ("Thanksgiving Day (United States)", date(2035, 11, 22)),
    ("Sinterklaas Arrival (Intocht)", date(2035, 11, 18)),
    ("Palm Sunday", date(2035, 3, 18)),
    ("Maundy Thursday", date(2035, 3, 22)),
    ("Good Friday", date(2035, 3, 23)),
    ("First Sunday of Advent", date(2035, 12, 2)),
    ("Second Sunday of Advent", date(2035, 12, 9)),
    ("Gaudete Sunday", date(2035, 12, 16)),
    ("Fourth Sunday of Advent", date(2035, 12, 23)),
    ("Palmer Lake Yule Log Hunt", date(2035, 12, 16)),
    ("Winter Solstice (Yule)", date(2035, 12, 21)),
    ("Hanukkah (Festival of Lights)", date(2035, 12, 26)),
}
missing = sorted(expected - occurrences, key=lambda item: (item[1], item[0]))
if missing:
    details = ", ".join(f"{summary}={day.isoformat()}" for summary, day in missing)
    raise SystemExit(f"10-year recurrence expansion is missing expected occurrences: {details}")

# Guard known source defects, naive annualization, and UTC-date leakage that
# authoritative calendar/astronomy data corrects. Astronomical events use the
# America/Denver civil date containing the USNO season instant.
forbidden = {
    ("Lunar New Year (Chunjie)", date(2026, 1, 29)),
    ("Buddhist Ghost Festival (Ullambana)", date(2026, 8, 28)),
    ("Passover", date(2035, 4, 2)),
    ("Hanukkah (Festival of Lights)", date(2035, 12, 15)),
    ("Spring Equinox (Ostara)", date(2028, 3, 20)),
    ("Autumn Equinox (Mabon)", date(2026, 9, 23)),
    ("Winter Solstice (Yule)", date(2027, 12, 22)),
}
incorrect = sorted(forbidden & occurrences, key=lambda item: (item[1], item[0]))
if incorrect:
    details = ", ".join(f"{summary}={day.isoformat()}" for summary, day in incorrect)
    raise SystemExit(f"Authoritative movable-calendar migration retained incorrect dates: {details}")

for summary in ["800th Anniversary Transitus of St. Francis", "Broadmoor Brunch", "Yalda Night"]:
    future = sorted(day for title, day in occurrences if title == summary and day.year >= 2027)
    if future:
        raise SystemExit(f"{summary} was incorrectly expanded into future years: {future[:3]}")

print(
    f"External RFC 5545 validation passed: {len(vevents)} VEVENTs parsed; "
    f"{len(expanded)} occurrences expanded across 2026-2035."
)
