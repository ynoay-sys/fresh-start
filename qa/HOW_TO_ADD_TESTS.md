# How to Add New Tests to Fresh Start QA Suite

## When to add new tests:
After every sprint that adds a new page or feature.

## How to ask Claude Code to add tests:
"Add tests to fresh_start_tests.py for these new 
Sprint [N] features:
- [new page name] at /[route]: should show [what]
- [new feature]: clicking [X] should [result]"

## Test naming convention:
TEST 1-9: Core tests (don't change)
TEST 10+: Sprint-specific tests

## Running tests:
Double-click run_tests.bat on desktop
OR: python -X utf8 fresh_start_tests.py

## After sprint 24, add these tests:
TEST 10 — Marketing page loads without login
TEST 11 — Register page has all Hebrew fields  
TEST 12 — Admin users page loads for admin role
TEST 13 — Back button exists on /pricing page
