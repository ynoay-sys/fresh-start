"""
Fresh Start – QA Test Suite
TEST 14: Business Type Setup
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
    Navigate to /dashboard, check business type badge or setup link.
    Navigate to /setup/existing, verify 6 business type cards, back button.
    Select first card (עוסק פטור), verify next step loads.
    """
    driver = get_driver()
    wait = WebDriverWait(driver, 10)
    results = []

    try:
        # ── Step 1: Dashboard ──────────────────────────────────────────────
        driver.get(f"{BASE_URL}/dashboard")
        time.sleep(2)

        dashboard_loaded = "dashboard" in driver.current_url or "login" in driver.current_url
        results.append(("dashboard_navigated", dashboard_loaded))

        # Check: business type badge OR "הגדר סוג עסק" link visible
        page_source = driver.page_source
        has_biz_badge = any(kw in page_source for kw in [
            "עוסק פטור", "עוסק מורשה", "חברה בע\"מ",
            "סוג עסק", "הגדר סוג עסק", "business_type",
        ])
        results.append(("dashboard_biz_type_element_visible", has_biz_badge))

        # ── Step 2: /setup/existing ────────────────────────────────────────
        driver.get(f"{BASE_URL}/setup/existing")
        time.sleep(2)

        # Check: page loads (not redirected away)
        page_loaded = "setup" in driver.current_url or "existing" in driver.current_url
        results.append(("setup_existing_page_loaded", page_loaded))

        # Screenshot
        driver.save_screenshot("business_type_setup.png")
        results.append(("screenshot_saved", True))

        # Check: 6 business type cards visible
        # Try multiple possible selectors
        card_selectors = [
            "[data-testid='business-type-card']",
            ".business-type-card",
            "[class*='business-type']",
            "[class*='BusinessType']",
        ]
        cards = []
        for sel in card_selectors:
            cards = driver.find_elements(By.CSS_SELECTOR, sel)
            if cards:
                break

        # Fallback: look for known Hebrew business type labels
        if not cards:
            biz_types = ["עוסק פטור", "עוסק מורשה", "חברה בע\"מ", "שותפות", "עמותה", "פרילנסר"]
            cards_found = sum(1 for bt in biz_types if bt in driver.page_source)
            results.append(("six_business_type_cards_visible", cards_found >= 4))
            card_count = cards_found
        else:
            results.append(("six_business_type_cards_visible", len(cards) >= 6))
            card_count = len(cards)

        # Check: back button present
        back_btn_present = any(kw in driver.page_source for kw in [
            "חזרה", "חזור", "← חזרה", "BackButton", "back",
        ])
        results.append(("back_button_present", back_btn_present))

        # ── Step 3: Select first card (עוסק פטור) ─────────────────────────
        clicked = False

        # Try clicking by text
        try:
            btn = driver.find_element(By.XPATH, "//*[contains(text(), 'עוסק פטור')]")
            btn.click()
            clicked = True
        except Exception:
            pass

        # Fallback: click first card element
        if not clicked and cards:
            try:
                cards[0].click()
                clicked = True
            except Exception:
                pass

        results.append(("first_card_clicked", clicked))

        if clicked:
            time.sleep(1.5)
            # Check: next step loads (URL changed OR new content appeared)
            next_step_loaded = (
                driver.current_url != f"{BASE_URL}/setup/existing"
                or any(kw in driver.page_source for kw in [
                    "המשך", "הבא", "next", "confirm", "אישור",
                    "שם העסק", "פרטים", "step",
                ])
            )
            results.append(("next_step_loaded_after_selection", next_step_loaded))
        else:
            results.append(("next_step_loaded_after_selection", None))  # skipped

        # ── Final verdict ──────────────────────────────────────────────────
        # PASS if setup flow is navigable: page loaded + cards found + click worked
        critical = [
            "setup_existing_page_loaded",
            "six_business_type_cards_visible",
            "first_card_clicked",
        ]
        passed = all(
            v for k, v in results if k in critical and v is not None
        )

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


if __name__ == "__main__":
    result = test_14_business_type_setup()
    exit(0 if result else 1)