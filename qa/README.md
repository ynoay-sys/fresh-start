# Fresh Start — QA Test Suite

Automated Playwright tests for the Fresh Start web app.

## Setup

```bash
pip install playwright
playwright install chromium
```

## Running tests

Double-click `run_tests.bat`  
— or —  
```bash
python -X utf8 fresh_start_tests.py   # Core + Sprint 24 tests (10 tests)
python -X utf8 sprint24_tests.py      # Sprint 24 UI/UX audit (7 tests)
```

## Authentication

Tests use a saved Google OAuth session stored in `auth_state.json`.  
This file is **gitignored** — generate it by running a headed OAuth flow once.

## Test inventory

| # | Test | File |
|---|------|------|
| 1 | Login session | fresh_start_tests.py |
| 4 | Add a Contact | fresh_start_tests.py |
| 5 | Delete a Contact | fresh_start_tests.py |
| 6 | Business Opening Steps | fresh_start_tests.py |
| 8 | Mobile Responsive | fresh_start_tests.py |
| 9 | 404 Page | fresh_start_tests.py |
| 10 | Marketing page (public) | fresh_start_tests.py |
| 11 | Login page Hebrew labels | fresh_start_tests.py |
| 12 | Register page | fresh_start_tests.py |
| 13 | Back buttons audit | fresh_start_tests.py |
| A | Marketing page | sprint24_tests.py |
| B | Register page | sprint24_tests.py |
| C | Login page | sprint24_tests.py |
| D | Back buttons | sprint24_tests.py |
| E | Admin pages | sprint24_tests.py |
| F | RTL / Hebrew audit | sprint24_tests.py |

## Adding new tests

See `HOW_TO_ADD_TESTS.md`.
