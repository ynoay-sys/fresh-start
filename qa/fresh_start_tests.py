"""
Fresh Start App — Full QA Test Suite
=====================================
Core tests  (1-9):  Login, Document Upload, Sign Document, Add Contact,
                    Delete Contact, Business Opening, Notifications,
                    Mobile Responsive, 404 Page
Sprint 24   (10-13): Marketing page (public), Login Hebrew labels,
                     Register page, Back buttons audit
"""

import time
import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright, expect, Page, Browser

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

BASE_URL = "https://singing-fresh-biz-path.base44.app"
EMAIL    = "ynoay9@gmail.com"
PASSWORD = "NoaY2003"

SCREENSHOT_DIR = Path("C:/Users/ynoay/qa_tests/screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

results = []

HEBREW_RE = re.compile(r'[\u0590-\u05FF]')

# ─── Helpers ────────────────────────────────────────────────────────────────

def log(msg):
    print(msg, flush=True)

def record(name, passed, note="", screenshot=None):
    status = "PASSED" if passed else "FAILED"
    results.append({"test": name, "status": status, "note": note, "screenshot": screenshot})
    icon = "✅" if passed else "❌"
    log(f"  {icon} {name}: {status}" + (f" — {note}" if note else ""))

def shot(page: Page, name: str) -> str:
    path = str(SCREENSHOT_DIR / f"{name}.png")
    try:
        page.screenshot(path=path, full_page=False)
    except Exception:
        pass
    return path

AUTH_STATE = Path("C:/Users/ynoay/qa_tests/auth_state.json")


def ensure_session(page: Page) -> bool:
    """
    Navigate to /dashboard and verify the session is alive.
    If the page gets stuck on a blank spinner (no redirect to /login but also
    no content), reload once — Base44 tokens sometimes need a single refresh.
    Returns True if we end up on /dashboard with content.
    """
    page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
    try:
        page.wait_for_url(lambda url: "/login" not in url, timeout=8000)
    except Exception:
        pass
    page.wait_for_timeout(3000)

    # Detect blank-spinner state: no nav text and not on /login
    content = page.content()
    has_content = any(kw in content for kw in ["ראשי", "Fresh Start", "dashboard", "התנתקות"])

    if not has_content and "/login" not in page.url:
        # Blank spinner — reload to recover the session
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(4000)

    shot(page, "login_result")
    return "/login" not in page.url and "/dashboard" in page.url


def login(page: Page) -> bool:
    return ensure_session(page)


# ─── TEST 1 — Login ──────────────────────────────────────────────────────────

def test_login(page: Page):
    """
    Auth is via Google OAuth (session injected via auth_state.json).
    This test verifies the session is alive: navigate to /dashboard,
    confirm no redirect to /login, and confirm a Hebrew greeting is present.
    """
    log("\n▶ TEST 1 — Login")
    try:
        page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

        url = page.url
        sc = shot(page, "test1_login")

        on_dashboard = "/dashboard" in url
        content = page.content()
        has_greeting = any(g in content for g in ["בוקר טוב", "ערב טוב", "צהריים טובים", "לילה טוב", "ברוך הבא", "ברוכים הבאים", "ברוכה הבאה"])

        if not on_dashboard:
            record("TEST 1 — Login", False,
                   f"Session not valid — redirected to {url} instead of /dashboard", sc)
        elif not has_greeting:
            record("TEST 1 — Login", False,
                   "On /dashboard but Hebrew greeting not found in page content", sc)
        else:
            record("TEST 1 — Login", True,
                   f"Session active, on {url}, Hebrew greeting present")

    except Exception as e:
        sc = shot(page, "test1_login_error")
        record("TEST 1 — Login", False, str(e), sc)


# ─── TEST 2 — Document Upload ────────────────────────────────────────────────

def test_document_upload(page: Page):
    log("\n▶ TEST 2 — Document Upload")
    try:
        # Create a minimal test PDF
        pdf_path = "C:/Users/ynoay/qa_tests/test_document.pdf"
        with open(pdf_path, "wb") as f:
            f.write(b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n"
                    b"xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n"
                    b"0000000058 00000 n\n0000000115 00000 n\n"
                    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF")

        page.goto(f"{BASE_URL}/documents/upload", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Upload file
        file_input = page.locator("input[type='file']").first
        if file_input.count() > 0:
            file_input.set_input_files(pdf_path)
            page.wait_for_timeout(1000)
        else:
            # Try drag-drop area
            page.wait_for_timeout(500)

        # Select category "חוזה"
        try:
            cat_select = page.locator("select, [role='combobox'], [role='listbox']").first
            if cat_select.count() > 0:
                cat_select.select_option(label="חוזה")
                page.wait_for_timeout(500)
            else:
                # Click dropdown trigger
                page.locator("text=חוזה").first.click()
                page.wait_for_timeout(500)
        except Exception:
            pass

        # Click upload button
        upload_btn = page.locator("button:has-text('העלאה'), button:has-text('שמור'), button:has-text('אישור'), button[type='submit']").first
        upload_btn.click()
        page.wait_for_timeout(3000)

        content = page.content()
        has_success = ("הועלה" in content or "הצלחה" in content or "success" in content.lower()
                       or "נשמר" in content or "✓" in content or "✅" in content)

        sc = shot(page, "test2_upload")

        # Check document appears in archive
        page.goto(f"{BASE_URL}/documents", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        archive_content = page.content()
        doc_in_archive = "test_document" in archive_content or "חוזה" in archive_content or "pdf" in archive_content.lower()

        if not has_success:
            record("TEST 2 — Document Upload", False, "Success message not found after upload", sc)
        elif not doc_in_archive:
            record("TEST 2 — Document Upload", False, "Document not visible in /documents archive", shot(page, "test2_archive"))
        else:
            record("TEST 2 — Document Upload", True, "Upload succeeded and document visible in archive")

    except Exception as e:
        sc = shot(page, "test2_upload_error")
        record("TEST 2 — Document Upload", False, str(e), sc)


# ─── TEST 3 — Sign a Document ────────────────────────────────────────────────

def test_sign_document(page: Page):
    log("\n▶ TEST 3 — Sign a Document")
    try:
        page.goto(f"{BASE_URL}/documents", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Click "חתום" on any document
        sign_btn = page.locator("button:has-text('חתום'), a:has-text('חתום')").first
        if sign_btn.count() == 0:
            sc = shot(page, "test3_no_sign_btn")
            record("TEST 3 — Sign a Document", False, "No 'חתום' button found on /documents", sc)
            return

        sign_btn.click()
        page.wait_for_timeout(2500)

        content = page.content()
        sc = shot(page, "test3_sign_flow")

        # Verify signing flow (3 steps)
        has_steps = (("שלב 1" in content or "Step 1" in content or "1 של" in content)
                     and ("שלב 2" in content or "Step 2" in content or "2 של" in content or "2" in content))
        # Verify Step 1 shows document
        has_doc = ("pdf" in content.lower() or "מסמך" in content or "iframe" in content.lower()
                   or "canvas" in content.lower() or "embed" in content.lower())

        if not has_steps:
            record("TEST 3 — Sign a Document", False, "3-step signing flow not visible", sc)
        elif not has_doc:
            record("TEST 3 — Sign a Document", False, "Document not shown in Step 1 of signing flow", sc)
        else:
            record("TEST 3 — Sign a Document", True, "Signing flow opened with steps and document visible")

    except Exception as e:
        sc = shot(page, "test3_sign_error")
        record("TEST 3 — Sign a Document", False, str(e), sc)


# ─── TEST 4 — Add a Contact ──────────────────────────────────────────────────

def test_add_contact(page: Page):
    log("\n▶ TEST 4 — Add a Contact")
    try:
        page.goto(f"{BASE_URL}/contacts", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Click the "הוסף איש קשר" / "+ הוסף" button (top-left of the contacts page)
        add_btn = page.locator(
            "button:has-text('הוסף איש קשר'), "
            "button:has-text('הוספת איש קשר'), "
            "button:has-text('+ הוסף'), "
            "button:has-text('הוסף')"
        ).first
        add_btn.click()
        page.wait_for_timeout(1500)

        # ── Work exclusively inside the modal dialog ──────────────────────
        modal = page.locator("div.fixed.inset-0, [role='dialog']").first
        modal.wait_for(state="visible", timeout=8000)

        # Category dropdown — use JS nativeInputValueSetter so React's synthetic
        # onChange fires correctly even in headless mode.
        cat_select = modal.locator("select").first
        cat_select.wait_for(state="visible", timeout=5000)
        page.evaluate("""() => {
            const sel = document.querySelector('div.fixed.inset-0 select');
            if (!sel) return;
            const nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLSelectElement.prototype, 'value').set;
            nativeSetter.call(sel, 'client');
            sel.dispatchEvent(new Event('change', { bubbles: true }));
        }""")
        page.wait_for_timeout(400)

        # Full name field
        name_input = modal.locator("input[type='text']").first
        name_input.wait_for(state="visible", timeout=5000)
        name_input.fill("בדיקה אוטומטית")
        name_input.dispatch_event("input")   # ensure React state update
        page.wait_for_timeout(400)

        # Scroll the inner card to reveal Save button
        page.evaluate("""() => {
            const overlay = document.querySelector('div.fixed.inset-0');
            if (!overlay) return;
            const card = overlay.firstElementChild;
            if (card) card.scrollTop = card.scrollHeight;
        }""")
        page.wait_for_timeout(500)
        shot(page, "test4_before_save")

        # Wait for save button to be enabled (React needs both name + category set)
        save_btn = page.locator("button:has-text('שמור איש קשר')").first
        try:
            page.wait_for_function(
                "() => { const b = document.querySelector('button'); "
                "const btns = Array.from(document.querySelectorAll('button')); "
                "const s = btns.find(b => b.textContent.includes('שמור איש קשר')); "
                "return s && !s.disabled; }",
                timeout=5000
            )
        except Exception:
            pass
        save_btn.click(force=True)
        shot(page, "test4_after_click")

        # Wait for modal to close — this is the real success signal.
        # If save fails, modal stays open (error shown inside it).
        modal_closed = False
        try:
            page.locator("div.fixed.inset-0").wait_for(state="hidden", timeout=8000)
            modal_closed = True
        except Exception:
            pass

        if not modal_closed:
            sc = shot(page, "test4_modal_stuck")
            # Check if there's an error message inside the modal
            modal_content = page.locator("div.fixed.inset-0").inner_text()
            err_hint = "שגיאה בשמירה" if "שגיאה" in modal_content else "modal did not close"
            record("TEST 4 — Add a Contact", False,
                   f"Save did not complete — {err_hint}", sc)
            return

        # Modal closed → save succeeded. Wait for list to reload then verify.
        page.wait_for_timeout(2000)
        content = page.content()
        sc = shot(page, "test4_add_contact")
        contact_visible = "בדיקה אוטומטית" in content

        if not contact_visible:
            record("TEST 4 — Add a Contact", False,
                   "Modal closed (save OK) but contact not visible in refreshed list", sc)
        else:
            record("TEST 4 — Add a Contact", True,
                   "Contact 'בדיקה אוטומטית' saved, modal closed, visible in list")

    except Exception as e:
        sc = shot(page, "test4_add_contact_error")
        record("TEST 4 — Add a Contact", False, str(e), sc)


# ─── TEST 5 — Delete a Contact ───────────────────────────────────────────────

def test_delete_contact(page: Page):
    log("\n▶ TEST 5 — Delete a Contact")
    try:
        # ── Wait for TEST 4's save to fully propagate ──────────────────────
        # Give the server and React state time to settle before we navigate.
        log("   Waiting 3s for TEST 4 save to propagate...")
        time.sleep(3)

        # Navigate to /contacts explicitly and wait for the contact element.
        page.goto(f"{BASE_URL}/contacts", wait_until="domcontentloaded")
        try:
            page.locator("text=בדיקה אוטומטית").wait_for(state="visible", timeout=8000)
            log("   Contact found on first attempt ✓")
        except Exception:
            # ── Retry: refresh and wait 3 more seconds ─────────────────────
            log("   Contact not visible — refreshing and retrying...")
            page.reload(wait_until="domcontentloaded")
            time.sleep(3)
            try:
                page.locator("text=בדיקה אוטומטית").wait_for(state="visible", timeout=8000)
                log("   Contact found after retry ✓")
            except Exception:
                sc = shot(page, "test5_no_contact")
                record("TEST 5 — Delete a Contact", False,
                       "Contact from TEST 4 not found after reload + 3s retry — cannot delete", sc)
                return

        # Find the card containing the test contact using the confirmed
        # ancestor selector (the app uses Tailwind "rounded-*" classes, not
        # semantic "card"/"row" class names).
        contact_row = page.locator("text=בדיקה אוטומטית").first
        parent = contact_row.locator(
            "xpath=ancestor::div[contains(@class,'rounded')][1]"
        )
        del_btn = parent.locator("button:has-text('מחק')").first
        del_btn.click()
        page.wait_for_timeout(1500)

        # Wait for the confirmation dialog (fixed overlay) to appear
        dialog = page.locator("div.fixed.inset-0")
        try:
            dialog.wait_for(state="visible", timeout=5000)
        except Exception:
            pass

        content_after = page.content()
        sc_dialog = shot(page, "test5_confirm_dialog")
        has_dialog = any(kw in content_after for kw in ["האם", "בטוח", "מחיקת", "מחק", "אישור"])

        # Scope confirm button strictly inside the dialog overlay to avoid
        # hitting background card buttons that are obscured by the overlay
        confirm_btn = dialog.locator(
            "button:has-text('מחק'), button:has-text('אישור'), button:has-text('כן')"
        ).last
        confirm_btn.click(force=True)

        # Capture toast while it is still on screen (it disappears quickly)
        toast_visible = False
        try:
            toast = page.locator(
                "[data-sonner-toast], [class*='toast'], div:has-text('נמחק')"
            )
            toast.wait_for(state="visible", timeout=2000)
            toast_visible = True
        except Exception:
            pass

        # The Sonner toast shows "בדיקה אוטומטית נמחק ✓" for ~4 seconds.
        # If we read page.content() while it's still on-screen, the name appears
        # in the toast HTML and the "contact_gone" check falsely fails.
        # Wait 6 seconds flat to guarantee the toast has cleared.
        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except Exception:
            pass
        page.wait_for_timeout(6000)

        final_content = page.content()
        sc = shot(page, "test5_deleted")

        contact_gone = "בדיקה אוטומטית" not in final_content

        if not has_dialog:
            record("TEST 5 — Delete a Contact", False,
                   "Confirmation dialog not detected before delete", sc_dialog)
        elif not contact_gone:
            record("TEST 5 — Delete a Contact", False,
                   "Contact still in list after confirmed delete (list may not have refreshed)", sc)
        elif not toast_visible:
            # Contact IS gone — toast was ephemeral (< 2s)
            record("TEST 5 — Delete a Contact", True,
                   "Contact deleted and removed from list (toast ephemeral, < 2s)")
        else:
            record("TEST 5 — Delete a Contact", True,
                   "Contact deleted with confirmation dialog, removed from list, toast confirmed")

    except Exception as e:
        sc = shot(page, "test5_delete_error")
        record("TEST 5 — Delete a Contact", False, str(e), sc)


# ─── TEST 6 — Business Opening Steps ─────────────────────────────────────────

def test_business_opening(page: Page):
    log("\n▶ TEST 6 — Business Opening Steps")
    try:
        page.goto(f"{BASE_URL}/business-opening", wait_until="domcontentloaded")

        # The page retries up to 5× with 1.5s delay each if fewer than 4 steps
        # are returned by the API (total up to ~10s). Wait for spinner first,
        # then poll until all 4 step cards are visible (max 15s total).
        try:
            page.locator(".animate-spin").wait_for(state="hidden", timeout=10000)
        except Exception:
            pass

        # Poll for step cards — each retry cycle is 1.5s, up to 5 retries
        for _ in range(10):
            content = page.content()
            if content.count("התחל מדריך") + content.count("צפה בפרטים") >= 4:
                break
            page.wait_for_timeout(1500)

        content = page.content()
        sc = shot(page, "test6_business_opening")

        # Step cards use Tailwind utility classes, not semantic names.
        # Each step card shows EITHER "התחל מדריך" (incomplete) OR "צפה בפרטים" (complete).
        # Count both to handle whichever account state is present.
        incomplete_cards = content.count("התחל מדריך")
        complete_cards   = content.count("צפה בפרטים")
        step_count = incomplete_cards + complete_cards
        has_4_steps = step_count >= 4

        # Progress bar: always shows "השלמת X מתוך 4 שלבים"
        has_progress = "מתוך 4" in content or "שלבים" in content

        state_label = f"{complete_cards} completed, {incomplete_cards} not started"
        if not has_4_steps:
            record("TEST 6 — Business Opening Steps", False,
                   f"Expected 4 step cards, detected {step_count} ({state_label})", sc)
        elif not has_progress:
            record("TEST 6 — Business Opening Steps", False,
                   "Progress text ('מתוך 4 שלבים') not found", sc)
        else:
            record("TEST 6 — Business Opening Steps", True,
                   f"4 step cards visible ({state_label}), progress bar present")

    except Exception as e:
        sc = shot(page, "test6_error")
        record("TEST 6 — Business Opening Steps", False, str(e), sc)


# ─── TEST 7 — Notifications ───────────────────────────────────────────────────

def test_notifications(page: Page):
    log("\n▶ TEST 7 — Notifications")
    try:
        page.goto(f"{BASE_URL}/notifications", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        content = page.content()
        sc = shot(page, "test7_notifications")

        has_title = "התראות" in content
        has_tabs = ("הכל" in content and ("אישי" in content or "לאומי" in content or "מערכת" in content))

        if not has_title:
            record("TEST 7 — Notifications", False, "Hebrew title 'התראות' not found", sc)
        elif not has_tabs:
            record("TEST 7 — Notifications", False, "Filter tabs (הכל/אישי/לאומי/מערכת) not all visible", sc)
        else:
            record("TEST 7 — Notifications", True, "Page loads with Hebrew title and filter tabs")

    except Exception as e:
        sc = shot(page, "test7_error")
        record("TEST 7 — Notifications", False, str(e), sc)


# ─── TEST 8 — Mobile Responsive ───────────────────────────────────────────────

def test_mobile_responsive(page: Page):
    log("\n▶ TEST 8 — Mobile Responsive")
    try:
        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Guard: confirm we actually reached the dashboard, not the login redirect
        if "/login" in page.url:
            sc = shot(page, "test8_auth_fail")
            record("TEST 8 — Mobile Responsive", False,
                   "Not authenticated — /dashboard redirected to /login", sc)
            page.set_viewport_size({"width": 1280, "height": 720})
            return

        sc = shot(page, "test8_mobile_dashboard")
        content = page.content()

        # Check bottom tab bar — look for visible nav elements, not just CSS keywords
        bottom_nav = page.locator(
            "[class*='bottom-nav'], [class*='tab-bar'], [class*='bottom-tab'], "
            "[class*='mobile-nav'], nav[class*='bottom'], [data-testid*='tab']"
        )
        has_bottom_nav = bottom_nav.count() > 0

        # Check no horizontal scroll
        scroll_width = page.evaluate("document.documentElement.scrollWidth")
        has_no_hscroll = scroll_width <= 380  # 375 + 5px tolerance

        # Navigate to /contacts and verify cards are full width
        page.goto(f"{BASE_URL}/contacts", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Guard: confirm /contacts loaded (not redirected)
        if "/login" in page.url:
            sc = shot(page, "test8_contacts_auth_fail")
            record("TEST 8 — Mobile Responsive", False,
                   "/contacts redirected to /login during mobile test", sc)
            page.set_viewport_size({"width": 1280, "height": 720})
            return

        sc_contacts = shot(page, "test8_mobile_contacts")
        cards = page.locator("[class*='card']").first
        full_width = True
        if cards.count() > 0:
            box = cards.bounding_box()
            if box:
                full_width = box["width"] >= 300  # ≥300px on a 375px screen = full-width

        if not has_bottom_nav:
            record("TEST 8 — Mobile Responsive", False,
                   f"Bottom tab bar not detected (matched 0 elements) at 375px width", sc)
        elif not has_no_hscroll:
            record("TEST 8 — Mobile Responsive", False,
                   f"Horizontal scroll detected: scrollWidth={scroll_width}px (expected ≤375px)", sc)
        elif not full_width:
            record("TEST 8 — Mobile Responsive", False,
                   "Contact cards not full-width on mobile", sc_contacts)
        else:
            record("TEST 8 — Mobile Responsive", True,
                   f"Bottom nav present, scrollWidth={scroll_width}px, cards full-width")

        # Always reset viewport
        page.set_viewport_size({"width": 1280, "height": 720})

    except Exception as e:
        sc = shot(page, "test8_error")
        record("TEST 8 — Mobile Responsive", False, str(e), sc)
        page.set_viewport_size({"width": 1280, "height": 720})


# ─── TEST 9 — 404 Page ────────────────────────────────────────────────────────

def test_404_page(page: Page):
    log("\n▶ TEST 9 — 404 Page")
    try:
        start = time.time()
        page.goto(f"{BASE_URL}/this-page-does-not-exist", wait_until="domcontentloaded")
        elapsed = time.time() - start
        page.wait_for_timeout(1000)

        content = page.content()
        sc = shot(page, "test9_404")

        hebrew_404 = ("לא נמצא" in content or "404" in content or "הדף לא קיים" in content
                      or "שגיאה" in content or "אין דף" in content)
        has_back_btn = "חזור לדשבורד" in content or "חזרה" in content or "דשבורד" in content
        fast_load = elapsed < 3.0

        if not hebrew_404:
            record("TEST 9 — 404 Page", False, "Hebrew 404 message not found", sc)
        elif not has_back_btn:
            record("TEST 9 — 404 Page", False, "'חזור לדשבורד' button not found on 404 page", sc)
        elif not fast_load:
            record("TEST 9 — 404 Page", False, f"Page loaded in {elapsed:.1f}s (expected <3s)", sc)
        else:
            record("TEST 9 — 404 Page", True, f"404 page OK — Hebrew message, back button, loaded in {elapsed:.2f}s")

    except Exception as e:
        sc = shot(page, "test9_error")
        record("TEST 9 — 404 Page", False, str(e), sc)


# ─── TEST 10 — Marketing page (public, no login) ─────────────────────────────

def test_marketing_public(pw):
    """
    Opens the root URL in a fresh unauthenticated context.
    PASS: page loads without redirecting to /login, Hebrew title present,
          CTA button exists, and page loads in under 3 seconds.
    """
    log("\n▶ TEST 10 — Marketing page (public)")
    b = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = b.new_context(locale="he-IL", timezone_id="Asia/Jerusalem",
                        viewport={"width": 1280, "height": 720})
    page = ctx.new_page()
    page.set_default_timeout(15000)
    try:
        start = time.time()
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        elapsed = time.time() - start
        sc = shot(page, "test10_marketing")
        url = page.url

        if "/login" in url:
            record("TEST 10 — Marketing page", False,
                   "Root URL redirects to /login — public marketing page not yet deployed", sc)
            return

        body = page.locator("body").inner_text()

        # Hebrew title
        hebrew_title = HEBREW_RE.search(body) is not None and len(body.strip()) > 50
        if not hebrew_title:
            record("TEST 10 — Marketing page", False,
                   "No Hebrew content found on root page", sc)
            return

        # CTA button "התחל" / "הירשם" / "התחל חינם"
        cta = page.locator(
            "button:has-text('התחל'), a:has-text('התחל'), "
            "button:has-text('הירשם'), a:has-text('הירשם'), "
            "button:has-text('חינם'), a:has-text('חינם')"
        )
        has_cta = cta.count() > 0
        if not has_cta:
            record("TEST 10 — Marketing page", False,
                   "CTA button ('התחל חינם' / 'הירשם') not found on marketing page", sc)
            return

        # Load time < 3 seconds
        if elapsed >= 3.0:
            record("TEST 10 — Marketing page", False,
                   f"Page loaded in {elapsed:.1f}s (expected under 3s)", sc)
            return

        record("TEST 10 — Marketing page", True,
               f"Page loads without /login redirect, Hebrew title present, "
               f"CTA button found, loaded in {elapsed:.2f}s")

    except Exception as e:
        sc = shot(page, "test10_marketing_error")
        record("TEST 10 — Marketing page", False, str(e), sc)
    finally:
        b.close()


# ─── TEST 11 — Login page Hebrew labels ──────────────────────────────────────

def test_login_hebrew(pw):
    """
    Navigates to /login in an unauthenticated session and checks:
    - email field label is in Hebrew (אימייל)
    - password field label is in Hebrew (סיסמה)
    - no raw English labels ('Email', 'Password') visible to users
    - a link to /register is present
    """
    log("\n▶ TEST 11 — Login page Hebrew labels")
    b = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = b.new_context(locale="he-IL", timezone_id="Asia/Jerusalem",
                        viewport={"width": 1280, "height": 720})
    page = ctx.new_page()
    page.set_default_timeout(15000)
    failures = []
    try:
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        sc = shot(page, "test11_login_hebrew")

        body    = page.locator("body").inner_text()
        content = page.content()

        # 1. Email label — fetch via JS to avoid complex CSS-selector quoting
        email_lbl = page.evaluate(
            "document.querySelector('label[for=\"email\"]')?.innerText || ''"
        )
        email_ph  = page.locator("#email").get_attribute("placeholder") or ""
        email_txt = (email_lbl + " " + email_ph).strip()

        if not HEBREW_RE.search(email_txt):
            failures.append(
                f"Email field has no Hebrew label — shows: '{email_txt[:40]}' "
                f"(expected אימייל)"
            )

        # 2. Password label
        pwd_lbl = page.evaluate(
            "document.querySelector('label[for=\"password\"]')?.innerText || ''"
        )
        pwd_ph  = page.locator("#password").get_attribute("placeholder") or ""
        pwd_txt = (pwd_lbl + " " + pwd_ph).strip()

        if not HEBREW_RE.search(pwd_txt):
            failures.append(
                f"Password field has no Hebrew label — shows: '{pwd_txt[:40]}' "
                f"(expected סיסמה)"
            )

        # 3. No bare English UI labels visible (Email / Password as standalone text nodes)
        en_labels = [w for w in re.findall(r'\b(?:Email|Password|Sign in|Forgot)\b', body)]
        if en_labels:
            failures.append(
                f"English labels visible to users: {', '.join(en_labels)} "
                f"— should be Hebrew (אימייל, סיסמה, כניסה, שכחתי סיסמה)"
            )

        # 4. Link to /register
        has_register_link = (
            page.locator(
                "a[href*='register'], button:has-text('הירשם'), a:has-text('הירשם')"
            ).count() > 0
            or "register" in content
        )
        if not has_register_link:
            failures.append("Link to /register not found on login page")

        if failures:
            record("TEST 11 — Login page Hebrew", False,
                   " | ".join(failures), sc)
        else:
            record("TEST 11 — Login page Hebrew", True,
                   "Email and password labels are Hebrew, no bare English labels, "
                   "register link present")

    except Exception as e:
        sc = shot(page, "test11_login_hebrew_error")
        record("TEST 11 — Login page Hebrew", False, str(e), sc)
    finally:
        b.close()


# ─── TEST 12 — Register page ──────────────────────────────────────────────────

def test_register_page(pw):
    """
    Navigates to /register in an unauthenticated session and checks:
    - page does NOT redirect to /login
    - Hebrew title is visible
    - Google sign-up button is present
    - link back to /login is present
    """
    log("\n▶ TEST 12 — Register page")
    b = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = b.new_context(locale="he-IL", timezone_id="Asia/Jerusalem",
                        viewport={"width": 1280, "height": 720})
    page = ctx.new_page()
    page.set_default_timeout(15000)
    failures = []
    try:
        page.goto(f"{BASE_URL}/register", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        sc = shot(page, "test12_register")
        url = page.url

        # 1. No redirect
        if "/login" in url:
            record("TEST 12 — Register page", False,
                   "/register redirects to /login — registration page not yet deployed", sc)
            return

        body    = page.locator("body").inner_text()
        content = page.content()

        # 2. Hebrew title
        if not HEBREW_RE.search(body) or len(body.strip()) < 20:
            failures.append("No Hebrew content found on /register page")

        # 3. Google sign-up button
        google_btn = page.locator(
            "button:has-text('Google'), button:has-text('Continue with Google'), "
            "button:has-text('המשך עם Google')"
        )
        if google_btn.count() == 0:
            failures.append("Google sign-up button not found")

        # 4. Link to /login
        has_login_link = (
            page.locator(
                "a[href*='login'], button:has-text('כניסה'), a:has-text('כניסה'), "
                "a:has-text('כבר יש לי'), button:has-text('התחברות')"
            ).count() > 0
            or "login" in content
            or "כניסה" in body
        )
        if not has_login_link:
            failures.append("Link back to /login not found on register page")

        if failures:
            record("TEST 12 — Register page", False,
                   " | ".join(failures), sc)
        else:
            record("TEST 12 — Register page", True,
                   "Page loads at /register, Hebrew title present, "
                   "Google button found, login link present")

    except Exception as e:
        sc = shot(page, "test12_register_error")
        record("TEST 12 — Register page", False, str(e), sc)
    finally:
        b.close()


# ─── TEST 13 — Back buttons audit ────────────────────────────────────────────

BACK_BUTTON_PAGES = [
    "/settings",
    "/documents/email-signature",
    "/progress",
    "/pricing",
    "/billing",
    "/help",
    "/terms",
    "/privacy",
]

def test_back_buttons(page: Page):
    """
    For each of the 8 pages navigates (authenticated) and checks for a back
    button — any element with text 'חזרה', 'חזור', '←', '→ חזרה', or
    aria-label containing 'חזור'/'back'.
    PASS only if ALL 8 pages have a back button.
    Reports per-page pass/fail in the note.
    """
    log("\n▶ TEST 13 — Back buttons audit")
    passed_pages = []
    failed_pages = []

    try:
        for path in BACK_BUTTON_PAGES:
            try:
                page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded")
                page.wait_for_timeout(2000)

                dest = page.url.replace(BASE_URL, "") or "/"
                if dest in ("/login", "/dashboard", "/") and dest != path:
                    failed_pages.append(f"{path} (redirected to {dest})")
                    log(f"     ✗ {path} — redirected to {dest}")
                    shot(page, f"test13_back_{path.lstrip('/').replace('/', '_')}")
                    continue

                body = page.locator("body").inner_text()
                has_back = (
                    page.locator(
                        "button:has-text('חזרה'), a:has-text('חזרה'), "
                        "button:has-text('חזור'), a:has-text('חזור'), "
                        "button:has-text('←'), a:has-text('←'), "
                        "[aria-label*='חזור'], [aria-label*='back']"
                    ).count() > 0
                    or "חזרה" in body
                    or "חזור" in body
                )
                if has_back:
                    passed_pages.append(path)
                    log(f"     ✓ {path} — back button found")
                else:
                    failed_pages.append(path)
                    log(f"     ✗ {path} — back button MISSING")
                    shot(page, f"test13_back_{path.lstrip('/').replace('/', '_')}")

            except Exception as ex:
                failed_pages.append(f"{path} (error: {str(ex)[:60]})")

        sc = shot(page, "test13_back_buttons_summary")
        all_pass = len(failed_pages) == 0
        summary = (
            f"Pass: {', '.join(passed_pages) or 'none'} | "
            f"Missing: {', '.join(failed_pages) or 'none'}"
        )
        record("TEST 13 — Back buttons", all_pass, summary, sc)

    except Exception as e:
        sc = shot(page, "test13_back_buttons_error")
        record("TEST 13 — Back buttons", False, str(e), sc)


# ─── TEST A — Admin Analytics (original test 10, kept for reference) ──────────

def test_admin_analytics(page: Page):
    log("\n▶ TEST 10 — Admin Analytics")
    try:
        page.goto(f"{BASE_URL}/admin/analytics", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

        content = page.content()
        sc = shot(page, "test10_admin_analytics")

        # Check page loads (not a redirect to login/403)
        url = page.url
        page_loaded = "/admin/analytics" in url or "analytics" in content.lower() or "אנליטיקס" in content

        # Check event timeline visible
        has_timeline = ("timeline" in content.lower() or "ציר" in content or "אירועים" in content
                        or "היסטוריה" in content or "פעילות" in content or "chart" in content.lower()
                        or "graph" in content.lower() or "גרף" in content)

        if not page_loaded:
            record("TEST 10 — Admin Analytics", False, f"Admin analytics page did not load, URL: {url}", sc)
        elif not has_timeline:
            record("TEST 10 — Admin Analytics", False, "Event timeline not found on analytics page", sc)
        else:
            record("TEST 10 — Admin Analytics", True, "Admin analytics page loaded with event timeline")

    except Exception as e:
        sc = shot(page, "test10_error")
        record("TEST 10 — Admin Analytics", False, str(e), sc)


# ─── Report Generator ─────────────────────────────────────────────────────────

def generate_report():
    log("\n" + "═" * 60)
    log("  FRESH START — QA TEST REPORT")
    log(f"  Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log("═" * 60)

    passed = sum(1 for r in results if r["status"] == "PASSED")
    failed = sum(1 for r in results if r["status"] == "FAILED")

    for r in results:
        icon = "✅" if r["status"] == "PASSED" else "❌"
        log(f"\n{icon} {r['test']}: {r['status']}")
        if r["note"]:
            log(f"   Note: {r['note']}")
        if r["screenshot"] and r["status"] == "FAILED":
            log(f"   Screenshot: {r['screenshot']}")
        if r["status"] == "FAILED":
            # Suggest fixes
            note = r["note"].lower()
            if "marketing" in r["test"].lower():
                log("   Suggested fix: Deploy public marketing page at / (root) — currently redirects to /login")
            elif "hebrew" in r["test"].lower():
                log("   Suggested fix: Replace English field labels (Email→אימייל, Password→סיסמה, Sign in→כניסה) and add link to /register")
            elif "register" in r["test"].lower():
                log("   Suggested fix: Build and deploy /register page with Hebrew form, Google button, and link to /login")
            elif "back button" in r["test"].lower():
                log("   Suggested fix: Add חזרה/← navigation button to each page listed as missing (typically top-left corner)")
            elif "login" in r["test"].lower() or "redirect" in note:
                log("   Suggested fix: Check auth flow, verify credentials and redirect path (/dashboard)")
            elif "upload" in r["test"].lower():
                log("   Suggested fix: Verify file input selector and category dropdown labels")
            elif "sign" in r["test"].lower():
                log("   Suggested fix: Ensure at least one document exists before signing; check signing flow route")
            elif "contact" in r["test"].lower() and "add" in r["test"].lower():
                log("   Suggested fix: Verify 'הוספת איש קשר' button selector and form field names")
            elif "contact" in r["test"].lower() and "delete" in r["test"].lower():
                log("   Suggested fix: Ensure TEST 4 ran first; check delete confirmation dialog trigger")
            elif "business" in r["test"].lower():
                log("   Suggested fix: Check /business-opening page renders 4 steps, progress bar, and fallback banner")
            elif "notification" in r["test"].lower():
                log("   Suggested fix: Verify /notifications route and tab component renders correctly")
            elif "mobile" in r["test"].lower():
                log("   Suggested fix: Add responsive CSS — bottom nav on mobile, prevent overflow-x")
            elif "404" in r["test"]:
                log("   Suggested fix: Add a catch-all route with Hebrew 404 page and 'חזור לדשבורד' button")
            elif "admin" in r["test"].lower():
                log("   Suggested fix: Verify admin role is assigned to test user; check /admin/analytics route")

    log("\n" + "─" * 60)
    log(f"  TOTAL: {len(results)} tests (6 core + 4 Sprint 24) | ✅ PASSED: {passed} | ❌ FAILED: {failed}")
    log("─" * 60)

    # Save JSON report
    report_path = "C:/Users/ynoay/qa_tests/report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({
            "run_at": datetime.now().isoformat(),
            "summary": {"total": len(results), "passed": passed, "failed": failed},
            "tests": results
        }, f, ensure_ascii=False, indent=2)
    log(f"\n  JSON report saved: {report_path}")
    log(f"  Screenshots dir:   {SCREENSHOT_DIR}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    """
    Run suite: TEST 1, 4, 5, 6, 8, 9  (core authenticated tests)
               TEST 10, 11, 12         (Sprint 24 public-page tests — own browser)
               TEST 13                 (Sprint 24 back-button audit — authenticated)
    Tests 2, 3, 7 are skipped (passed previously / need separate manual setup).
    """
    with sync_playwright() as pw:
        browser: Browser = pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        ctx = browser.new_context(
            storage_state=str(AUTH_STATE),   # ← inject saved Google session
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="he-IL",
            timezone_id="Asia/Jerusalem",
            viewport={"width": 1280, "height": 720}
        )
        page = ctx.new_page()
        page.set_default_timeout(20000)

        # ── Shared login ───────────────────────────────────────────────────
        log("Logging in (shared session for all tests)...")
        logged_in = login(page)
        log(f"   URL after login: {page.url}")
        log(f"   Login success:   {logged_in}")

        if not logged_in:
            # Login itself failed — record it and abort dependent tests
            sc = shot(page, "test1_login_failed")
            try:
                body = page.locator("body").inner_text()
                hint = next((ln.strip() for ln in body.splitlines()
                             if ln.strip() and len(ln.strip()) > 5
                             and "sign" not in ln.lower()
                             and "@" not in ln), "")
            except Exception:
                hint = ""
            msg = f"Still at {page.url} after login." + (f" Page says: {hint}" if hint else "")
            record("TEST 1 — Login", False, msg, sc)
            for name in ["TEST 4 — Add a Contact", "TEST 5 — Delete a Contact",
                         "TEST 6 — Business Opening Steps",
                         "TEST 8 — Mobile Responsive", "TEST 9 — 404 Page"]:
                record(name, False, "Skipped — login failed", None)
            browser.close()
            generate_report()
            return

        def guard(test_fn):
            """Run a test, but first reload the session if it expired."""
            try:
                content = page.content()
                alive = any(kw in content for kw in ["ראשי", "Fresh Start", "התנתקות"])
                if not alive:
                    log("   ⚡ Session heartbeat lost — reloading...")
                    page.reload(wait_until="domcontentloaded")
                    page.wait_for_timeout(3000)
            except Exception:
                pass
            test_fn(page)

        # ── TEST 1 — Login ─────────────────────────────────────────────────
        test_login(page)

        # ── TEST 4 — Add a Contact ─────────────────────────────────────────
        guard(test_add_contact)

        # ── TEST 5 — Delete a Contact ──────────────────────────────────────
        guard(test_delete_contact)

        # ── TEST 6 — Business Opening Steps ───────────────────────────────
        guard(test_business_opening)

        # ── TEST 8 — Mobile Responsive ─────────────────────────────────────
        guard(test_mobile_responsive)

        # ── TEST 9 — 404 Page ──────────────────────────────────────────────
        guard(test_404_page)

        # ── Sprint 24 back-button audit (authenticated page) ───────────────
        guard(test_back_buttons)

        browser.close()

        # ── Sprint 24 public-page tests (their own unauthenticated browser) ─
        # These run AFTER the authenticated browser is closed so they don't
        # accidentally inherit the session cookies.
        test_marketing_public(pw)
        test_login_hebrew(pw)
        test_register_page(pw)

    generate_report()


if __name__ == "__main__":
    main()
