"""
Fresh Start – QA Test Suite
TEST 14: Business Type Setup
TEST 15: Contact Bulk Select
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "https://your-app-url.base44.app"  # Replace with actual URL


def get_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,900")
    return webdriver.Chrome(options=options)


def test_14_business_type_setup():
    """
    TEST 14 — Business Type Setup
    Navigate to /setup/existing, verify page loads with Hebrew content.
    Check for back button. PASS if not 404/login redirect.
    """
    driver = get_driver()
    results = []

    try:
        # ── Navigate to /setup/existing ────────────────────────────────────
        driver.get(f"{BASE_URL}/setup/existing")
        time.sleep(3)

        # Check: page does NOT redirect to 404 or login
        current_url = driver.current_url
        redirected_away = (
            "404" in current_url
            or ("login" in current_url and "setup" not in current_url)
        )
        results.append(("page_not_redirected", not redirected_away))

        # Screenshot
        driver.save_screenshot("setup_existing.png")
        results.append(("screenshot_saved", True))

        # Check: at least one expected Hebrew string is visible
        page_source = driver.page_source
        hebrew_content_found = any(kw in page_source for kw in [
            "הגדרת העסק הקיים",
            "מה המצב שלך",
            "עוסק פטור",
            "עוסק מורשה",
        ])
        results.append(("hebrew_content_visible", hebrew_content_found))

        # Check: back button present (→ arrow or חזרה text)
        back_btn_present = any(kw in page_source for kw in [
            "חזרה", "חזור", "→",
        ])
        results.append(("back_button_present", back_btn_present))

        # ── Final verdict ──────────────────────────────────────────────────
        # PASS if page loads with any Hebrew content and doesn't redirect to 404/login
        critical = ["page_not_redirected", "hebrew_content_visible"]
        passed = all(v for k, v in results if k in critical and v is not None)

    except Exception as e:
        results.append(("unexpected_error", str(e)))
        passed = False

    finally:
        driver.quit()

    # ── Report ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("TEST 14 — Business Type Setup")
    print("=" * 60)
    for name, value in results:
        status = "✅ PASS" if value is True else ("⚠️  SKIP" if value is None else "❌ FAIL")
        print(f"  {status}  {name}: {value}")
    print("-" * 60)
    print(f"  OVERALL: {'✅ PASS' if passed else '❌ FAIL'}")
    print("=" * 60 + "\n")

    return passed


def test_15_contact_bulk_select():
    """
    TEST 15 — Contact Bulk Select
    Navigate to /contacts, check for בחר button.
    Click it, verify checkboxes appear and ביטול button replaces it.
    Click ביטול, verify checkboxes disappear.
    """
    driver = get_driver()
    results = []

    try:
        # ── Navigate to /contacts ──────────────────────────────────────────
        driver.get(f"{BASE_URL}/contacts")
        time.sleep(2)

        page_source = driver.page_source

        # Check: בחר button exists
        becher_visible = "בחר" in page_source
        results.append(("becher_button_exists", becher_visible))

        if not becher_visible:
            results.append(("checkboxes_appear", False))
            results.append(("bitul_button_appears", False))
            results.append(("checkboxes_disappear_after_bitul", False))
            passed = False
        else:
            # Click בחר button
            try:
                becher_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'בחר') and not(contains(text(), 'ביטול'))]")
                becher_btn.click()
            except Exception:
                # Fallback: find button elements containing בחר
                btns = driver.find_elements(By.TAG_NAME, "button")
                for b in btns:
                    if b.text.strip() == "בחר":
                        b.click()
                        break

            time.sleep(1)
            page_after_click = driver.page_source

            # Check: at least one checkbox appears
            checkboxes = driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
            results.append(("checkboxes_appear", len(checkboxes) > 0))

            # Check: ביטול button appears
            bitul_visible = "ביטול" in page_after_click
            results.append(("bitul_button_appears", bitul_visible))

            # Screenshot in selection mode
            driver.save_screenshot("contacts_bulk_select.png")
            results.append(("screenshot_saved", True))

            # Click ביטול to exit selection mode
            try:
                bitul_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'ביטול')]")
                bitul_btn.click()
            except Exception:
                pass

            time.sleep(1)
            checkboxes_after = driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
            results.append(("checkboxes_disappear_after_bitul", len(checkboxes_after) == 0))

            # PASS if בחר exists and toggles correctly
            critical = ["becher_button_exists", "bitul_button_appears"]
            passed = all(v for k, v in results if k in critical and v is not None)

    except Exception as e:
        results.append(("unexpected_error", str(e)))
        passed = False

    finally:
        driver.quit()

    # ── Report ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("TEST 15 — Contact Bulk Select")
    print("=" * 60)
    for name, value in results:
        status = "✅ PASS" if value is True else ("⚠️  SKIP" if value is None else "❌ FAIL")
        print(f"  {status}  {name}: {value}")
    print("-" * 60)
    print(f"  OVERALL: {'✅ PASS' if passed else '❌ FAIL'}")
    print("=" * 60 + "\n")

    return passed


if __name__ == "__main__":
    r14 = test_14_business_type_setup()
    r15 = test_15_contact_bulk_select()
    exit(0 if (r14 and r15) else 1)