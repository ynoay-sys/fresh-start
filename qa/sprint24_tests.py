"""
Fresh Start — Sprint 24 UI/UX Test Suite  (fixed run)
=======================================================
Fixes vs. first run:
  • TEST A/B  – detect redirect-to-login as "page not deployed" not a selector bug
  • TEST C    – fix CSS selector crash (label[for=complex-value]); wait for spinner
  • TEST D    – longer timeout + navigate to /contacts (lighter page) to verify session
  • TEST E    – fix search placeholder ('חפש' not 'חיפוש'); fix stat-card counter
  • TEST F    – exclude email-address tokens from English-text false-positive
"""

import sys, time, re
from pathlib import Path
from datetime import datetime
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from playwright.sync_api import sync_playwright, Page, BrowserContext

BASE_URL    = "https://singing-fresh-biz-path.base44.app"
SS_DIR      = Path("C:/Users/ynoay/qa_tests/screenshots/sprint24")
AUTH_STATE  = Path("C:/Users/ynoay/qa_tests/auth_state.json")
REPORT_PATH = Path("C:/Users/ynoay/qa_tests/sprint24_ui_report.txt")
SS_DIR.mkdir(parents=True, exist_ok=True)

results = []
HEBREW_RE = re.compile(r'[\u0590-\u05FF]')

# ── helpers ────────────────────────────────────────────────────────────────────

def log(msg):
    print(msg, flush=True)

def shot(page: Page, name: str) -> str:
    path = str(SS_DIR / f"{name}.png")
    try:
        page.screenshot(path=path, full_page=True)
    except Exception:
        pass
    return path

def record(test: str, passed: bool, issues: list, screenshot: str | None):
    status = "PASSED" if passed else "FAILED"
    icon   = "✅" if passed else "❌"
    results.append({"test": test, "status": status,
                    "issues": issues, "screenshot": screenshot})
    log(f"  {icon} {test}: {status}")
    for iss in issues:
        log(f"     • {iss}")

def wait_for_content(page: Page, timeout_ms: int = 8000):
    """Wait until the loading spinner is gone."""
    try:
        page.locator(".animate-spin").wait_for(state="hidden", timeout=timeout_ms)
    except Exception:
        pass
    page.wait_for_timeout(1500)

def check_rtl(page: Page, label: str) -> list[str]:
    """Return RTL / English-text problems. Ignores email addresses and URLs."""
    problems = []

    # 1. document dir
    dir_attr = page.evaluate(
        "document.documentElement.getAttribute('dir') || "
        "document.body.getAttribute('dir') || ''"
    )
    if dir_attr.lower() == "ltr":
        problems.append(f"[RTL] <html dir='ltr'> on {label}")

    # 2. English visible words (≥4 chars, Latin-only, not an email / URL / technical token)
    english_words = page.evaluate("""() => {
        const SKIP_TAGS = new Set(['SCRIPT','STYLE','NOSCRIPT','META','LINK','HEAD']);
        const TECH = /^(true|false|null|undefined|NaN|Infinity|Error|Loading|OK|HTML|CSS|SVG|PNG|JPG|GIF|RTL|LTR|SPA|API|URI|URL|UUID|ID|EN|HE|IL|HTTP|HTTPS|WWW)$/i;
        const EMAIL_RE = /^[\\w.+-]+@[\\w.-]+\\.[a-z]{2,}$/i;
        const URL_RE   = /^https?:\\/\\//i;
        const found = new Set();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            const parent = node.parentElement;
            if (!parent || SKIP_TAGS.has(parent.tagName)) continue;
            const rect = parent.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const raw = node.nodeValue || '';
            // skip if text is part of an email address or URL
            if (EMAIL_RE.test(raw.trim()) || URL_RE.test(raw.trim())) continue;
            const words = raw.match(/[A-Za-z]{4,}/g) || [];
            for (const w of words) {
                if (!TECH.test(w)) found.add(w);
            }
        }
        // Remove words that appear inside links (href=mailto: or http)
        const anchors = document.querySelectorAll('a[href]');
        for (const a of anchors) {
            const h = a.getAttribute('href') || '';
            if (h.startsWith('mailto:') || h.startsWith('http')) {
                const txt = a.innerText || '';
                (txt.match(/[A-Za-z]{4,}/g) || []).forEach(w => found.delete(w));
            }
        }
        return Array.from(found).slice(0, 12);
    }""")
    if english_words:
        problems.append(f"[EN] English UI text on {label}: {', '.join(english_words)}")

    return problems


def public_browser(pw):
    """Headless browser with NO saved session (for public pages)."""
    b = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = b.new_context(
        locale="he-IL", timezone_id="Asia/Jerusalem",
        viewport={"width": 1280, "height": 720},
    )
    return b, ctx

def auth_browser(pw):
    """Headless browser seeded with saved Google session."""
    b = pw.chromium.launch(
        headless=True,
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
    )
    ctx = b.new_context(
        storage_state=str(AUTH_STATE),
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        locale="he-IL", timezone_id="Asia/Jerusalem",
        viewport={"width": 1280, "height": 720},
    )
    return b, ctx

def refresh_session(pw):
    """Full Google OAuth → saves fresh auth_state.json."""
    log("  Refreshing session via Google OAuth...")
    b = pw.chromium.launch(
        headless=False,
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
    )
    ctx = b.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        locale="he-IL", timezone_id="Asia/Jerusalem",
    )
    p = ctx.new_page()
    p.set_default_timeout(20000)
    p.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    p.wait_for_timeout(2000)
    p.locator('button:has-text("Continue with Google")').click()
    p.wait_for_url("**/accounts.google.com/**", timeout=15000)
    p.wait_for_timeout(2000)
    p.locator('input[type="email"]').fill("ynoay9@gmail.com")
    p.wait_for_timeout(400)
    p.locator('button:has-text("הבא")').click()
    p.wait_for_timeout(3000)
    p.locator('input[type="password"]').fill("NoaY2003")
    p.wait_for_timeout(400)
    p.locator('button:has-text("הבא")').click()
    p.wait_for_timeout(8000)
    ok = "dashboard" in p.url
    if ok:
        ctx.storage_state(path=str(AUTH_STATE))
        log("  Session saved ✓")
    b.close()
    return ok


def verify_session(pw) -> bool:
    """Return True if saved session reaches /dashboard."""
    try:
        b, ctx = auth_browser(pw)
        p = ctx.new_page()
        p.set_default_timeout(12000)
        p.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        p.wait_for_timeout(4000)
        ok = "/dashboard" in p.url
        b.close()
        return ok
    except Exception:
        return False


# ══════════════════════════════════════════════════════════════════════════════
# TEST A — Marketing / root page  (public)
# ══════════════════════════════════════════════════════════════════════════════

def test_a_marketing(pw):
    log("\n▶ TEST A — Marketing page (public, no login)")
    issues = []
    b, ctx = public_browser(pw)
    page = ctx.new_page()
    page.set_default_timeout(15000)

    try:
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        sc = shot(page, "marketing_page")
        url = page.url

        # ── Is there a public marketing page at all? ──────────────────────
        if "/login" in url:
            issues.append(
                "Sprint 24 finding: / (root) redirects to /login — "
                "public marketing page not yet deployed"
            )
            # Still check the login page for English labels as a secondary finding
            body = page.locator("body").inner_text()
            en_labels = [w for w in
                         re.findall(r'\b[A-Za-z]{4,}\b', body)
                         if w not in {"with","that","from","your","have","this","will","just"}][:8]
            if en_labels:
                issues.append(
                    f"Login page (shown at /): English labels visible to users "
                    f"— {', '.join(en_labels[:6])}"
                )
            record("TEST A — Marketing page", False, issues, sc)
            return

        body = page.locator("body").inner_text()

        # 1. Hebrew title
        if "נהל את העסק שלך" not in body and "עסק שלך" not in body:
            issues.append("Hebrew main title 'נהל את העסק שלך בקלות' not found")

        # 2. Feature cards — count ≥ 3 distinct sections/cards
        feature_count = (
            page.locator("section").count() +
            page.locator("[class*='feature']").count() +
            page.locator("[class*='card']").count()
        )
        grid_children = page.locator("[class*='grid'] > div, [class*='flex'] > div").count()
        if feature_count < 3 and grid_children < 3:
            issues.append(
                f"Expected ≥3 feature cards; found {feature_count} sections/cards "
                f"and {grid_children} grid children"
            )

        # 3. CTA button "התחל חינם"
        cta = page.locator(
            "button:has-text('התחל'), a:has-text('התחל'), "
            "button:has-text('הרשמה'), a:has-text('הרשמה')"
        ).first
        if cta.count() == 0:
            issues.append("CTA button 'התחל חינם' not found")
        else:
            href = cta.get_attribute("href") or cta.evaluate(
                "el => el.closest('a')?.href || ''"
            )
            if href and "register" not in href and "login" not in href:
                issues.append(f"CTA button points to '{href}' — expected /register")

        # 4. RTL
        issues += check_rtl(page, "marketing /")

        # 5. Mobile 375px — no horizontal scroll
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(600)
        scroll_w = page.evaluate("document.documentElement.scrollWidth")
        shot(page, "marketing_page_mobile")
        if scroll_w > 380:
            issues.append(f"Horizontal scroll at 375px (scrollWidth={scroll_w}px)")
        page.set_viewport_size({"width": 1280, "height": 720})

        record("TEST A — Marketing page", len(issues) == 0, issues, sc)

    except Exception as e:
        sc = shot(page, "marketing_page_error")
        record("TEST A — Marketing page", False, [f"Exception: {e}"], sc)
    finally:
        b.close()


# ══════════════════════════════════════════════════════════════════════════════
# TEST B — Register page
# ══════════════════════════════════════════════════════════════════════════════

def test_b_register(pw):
    log("\n▶ TEST B — Register page")
    issues = []
    b, ctx = public_browser(pw)
    page = ctx.new_page()
    page.set_default_timeout(15000)

    try:
        page.goto(f"{BASE_URL}/register", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        sc = shot(page, "register_page")
        url = page.url

        # ── Does /register exist? ─────────────────────────────────────────
        if "/login" in url or url.rstrip("/") == BASE_URL.rstrip("/"):
            issues.append(
                "Sprint 24 finding: /register redirects to /login — "
                "registration page not yet deployed"
            )
            record("TEST B — Register page", False, issues, sc)
            return

        body    = page.locator("body").inner_text()
        content = page.content()

        # 1. Google button
        if page.locator(
            "button:has-text('Google'), button:has-text('Continue with Google')"
        ).count() == 0:
            issues.append("Google sign-up button not found")

        # 2. Hebrew labels — iterate visible inputs safely
        inputs = page.locator("input:visible").all()
        non_hebrew = []
        for inp in inputs[:10]:
            try:
                ph = inp.get_attribute("placeholder") or ""
                input_id = inp.get_attribute("id") or ""
                # Get associated label text via id (avoid complex CSS selectors)
                lbl_txt = ""
                if input_id:
                    lbl_txt = page.evaluate(
                        f"document.querySelector('label[for=\"{input_id}\"]')?.innerText || ''"
                    )
                combined = (ph + " " + lbl_txt).strip()
                if combined and not HEBREW_RE.search(combined) and len(combined) > 2:
                    non_hebrew.append(combined[:30])
            except Exception:
                pass
        if non_hebrew:
            issues.append(f"Non-Hebrew field labels/placeholders: {non_hebrew[:5]}")

        # 3. Password show/hide toggle
        if page.locator(
            "[class*='eye'], [class*='toggle'], button[aria-label*='password'], "
            "button:has-text('הצג'), button:has-text('הסתר')"
        ).count() == 0 and "eye" not in content.lower():
            issues.append("Password show/hide toggle not found")

        # 4. Password strength indicator — type into first password field
        pwd = page.locator("input[type='password']").first
        if pwd.count() > 0:
            pwd.fill("Test123!")
            page.wait_for_timeout(700)
            strength = (
                page.locator(
                    "[class*='strength'], [class*='meter'], [role='progressbar']"
                ).count() > 0
                or any(kw in page.content()
                       for kw in ["חזק", "בינוני", "חלש", "strength", "weak", "strong"])
            )
            if not strength:
                issues.append("Password strength indicator not visible when typing")
            pwd.fill("")
        else:
            issues.append("Password input not found")

        # 5. Terms checkbox
        if (page.locator("input[type='checkbox']").count() == 0
                and "תנאי" not in body and "הסכמה" not in body):
            issues.append("Terms/agree checkbox not found")

        # 6. Link back to /login
        if (page.locator(
            "a[href*='login'], button:has-text('כניסה'), "
            "a:has-text('כבר'), a:has-text('התחברות')"
        ).count() == 0
                and "login" not in content and "כבר יש" not in body):
            issues.append("Link to /login not found on register page")

        # 7. RTL
        issues += check_rtl(page, "/register")

        # 8. Mobile
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(600)
        shot(page, "register_page_mobile")
        sw = page.evaluate("document.documentElement.scrollWidth")
        if sw > 380:
            issues.append(f"Horizontal scroll on mobile (scrollWidth={sw}px)")
        page.set_viewport_size({"width": 1280, "height": 720})

        record("TEST B — Register page", len(issues) == 0, issues, sc)

    except Exception as e:
        sc = shot(page, "register_page_error")
        record("TEST B — Register page", False, [f"Exception: {e}"], sc)
    finally:
        b.close()


# ══════════════════════════════════════════════════════════════════════════════
# TEST C — Login page
# ══════════════════════════════════════════════════════════════════════════════

def test_c_login(pw):
    log("\n▶ TEST C — Login page")
    issues = []
    b, ctx = public_browser(pw)
    page = ctx.new_page()
    page.set_default_timeout(15000)

    try:
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)   # wait longer than before (spinner)
        sc = shot(page, "login_page")

        body    = page.locator("body").inner_text()
        content = page.content()

        # 1. Google button
        if page.locator(
            "button:has-text('Google'), button:has-text('Continue with Google')"
        ).count() == 0:
            issues.append("Google sign-in button not found")

        # 2. Check field labels / placeholders (safe approach — no complex [for=] selectors)
        email_ph = page.locator("#email").get_attribute("placeholder") or ""
        pwd_ph   = page.locator("#password").get_attribute("placeholder") or ""
        # Label text (fetched via JS to avoid CSS selector quoting issues)
        email_lbl = page.evaluate(
            "document.querySelector('label[for=\"email\"]')?.innerText || ''"
        )
        pwd_lbl = page.evaluate(
            "document.querySelector('label[for=\"password\"]')?.innerText || ''"
        )

        for field, txt in [("Email field", email_ph + email_lbl),
                           ("Password field", pwd_ph + pwd_lbl)]:
            if txt.strip() and not HEBREW_RE.search(txt):
                issues.append(
                    f"{field} has no Hebrew label (shows English: '{txt.strip()[:30]}')"
                )

        # 3. Forgot password link
        forgot = page.locator(
            "button:has-text('שכחתי'), a:has-text('שכחתי'), "
            "button:has-text('Forgot'), a:has-text('Forgot')"
        ).first
        if forgot.count() == 0:
            issues.append("'שכחתי סיסמה' (forgot password) link not found")
        else:
            forgot.click()
            page.wait_for_timeout(1000)
            forgot_content = page.content()
            if not any(kw in forgot_content
                       for kw in ["email", "אימייל", "דואר", "reset", "איפוס"]):
                issues.append(
                    "Clicking 'שכחתי סיסמה' did not reveal an email-reset input"
                )
            shot(page, "login_forgot_clicked")
            # reload for remaining checks
            page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
            page.wait_for_timeout(2000)
            body    = page.locator("body").inner_text()
            content = page.content()

        # 4. Link to /register
        if (page.locator(
            "a[href*='register'], button:has-text('הירשם'), "
            "a:has-text('הירשם'), a:has-text('Sign up')"
        ).count() == 0
                and "register" not in content and "הירשם" not in body):
            issues.append("Link to /register not found on login page")

        # 5. RTL
        issues += check_rtl(page, "/login")

        record("TEST C — Login page", len(issues) == 0, issues, sc)

    except Exception as e:
        sc = shot(page, "login_page_error")
        record("TEST C — Login page", False, [f"Exception: {e}"], sc)
    finally:
        b.close()


# ══════════════════════════════════════════════════════════════════════════════
# TEST D — Back buttons on new authenticated pages
# ══════════════════════════════════════════════════════════════════════════════

BACK_PAGES = [
    "/pricing",
    "/billing",
    "/help",
    "/terms",
    "/privacy",
    "/settings",
    "/documents/email-signature",
    "/progress",
]

def test_d_back_buttons(pw):
    log("\n▶ TEST D — Back buttons audit")
    missing  = []
    present  = []
    not_built = []

    b, ctx = auth_browser(pw)
    page = ctx.new_page()
    page.set_default_timeout(20000)

    try:
        # Verify session with a lighter page (/contacts) rather than /dashboard
        page.goto(f"{BASE_URL}/contacts", wait_until="domcontentloaded")
        wait_for_content(page, 8000)
        if "/login" in page.url:
            record("TEST D — Back buttons", False, ["Session expired"], None)
            return

        for path in BACK_PAGES:
            try:
                page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded")
                page.wait_for_timeout(2500)

                dest = page.url.replace(BASE_URL, "") or "/"

                # Page not built / access denied — redirected elsewhere
                if dest in ("/login", "/dashboard", "/") and dest != path:
                    not_built.append(f"{path} → redirected to {dest} (not yet built)")
                    log(f"     — {path} → redirected to {dest}")
                    continue

                body = page.locator("body").inner_text()

                has_back = (
                    page.locator(
                        "button:has-text('חזרה'), a:has-text('חזרה'), "
                        "button:has-text('חזור'), a:has-text('חזור'), "
                        "button:has-text('←'), a:has-text('←'), "
                        "button:has-text('→ חזרה'), a:has-text('→ חזרה'), "
                        "[aria-label*='חזור'], [aria-label*='back']"
                    ).count() > 0
                    or "חזרה" in body or "חזור" in body
                )

                if has_back:
                    present.append(path)
                    log(f"     ✓ {path} — back button found")
                else:
                    missing.append(f"{path} — no back/חזרה button")
                    log(f"     ✗ {path} — back button MISSING")
                    shot(page, f"back_missing_{path.lstrip('/').replace('/', '_')}")

            except Exception as ex:
                missing.append(f"{path} — error: {str(ex)[:80]}")

        sc = shot(page, "back_buttons_check")

        all_issues = missing + not_built
        # Only truly missing back buttons count as failures;
        # not-built pages are informational
        record(
            "TEST D — Back buttons",
            len(missing) == 0,
            (missing if missing else []) + (not_built if not_built else []),
            sc,
        )

    except Exception as e:
        sc = shot(page, "back_buttons_error")
        record("TEST D — Back buttons", False, [f"Exception: {e}"], sc)
    finally:
        b.close()


# ══════════════════════════════════════════════════════════════════════════════
# TEST E — Admin pages (login required)
# ══════════════════════════════════════════════════════════════════════════════

def test_e_admin(pw):
    log("\n▶ TEST E — Admin pages")

    b, ctx = auth_browser(pw)
    page = ctx.new_page()
    page.set_default_timeout(20000)

    try:
        # Verify session
        page.goto(f"{BASE_URL}/contacts", wait_until="domcontentloaded")
        wait_for_content(page, 8000)
        if "/login" in page.url:
            record("TEST E — Admin / Users",   False, ["Session expired"], None)
            record("TEST E — Admin / Content", False, ["Session expired"], None)
            return

        # ── /admin/users ──────────────────────────────────────────────────
        issues_users = []
        page.goto(f"{BASE_URL}/admin/users", wait_until="domcontentloaded")
        wait_for_content(page, 8000)
        sc_users = shot(page, "admin_users")
        dest = page.url.replace(BASE_URL, "")

        if dest in ("/dashboard", "/login", "/"):
            issues_users.append(
                f"Redirected to {dest} — admin role not assigned to this account"
            )
        else:
            body = page.locator("body").inner_text()

            # 1. User table rows
            rows = page.locator("table tbody tr").count()
            if rows == 0:
                rows = page.locator("tr").count() - 1  # subtract header
            if rows < 1:
                issues_users.append("User table has no rows")

            # 2. Search input — placeholder confirmed as 'חפש' from screenshot
            search_count = page.locator(
                "input[placeholder*='חפש'], input[placeholder*='search'], "
                "input[placeholder*='Search'], input[type='search']"
            ).count()
            if search_count == 0:
                issues_users.append("Search input not found")

            # 3. Stat cards — page shows 4 bordered divs at top with a number + label.
            #    Detect by counting visible integer-looking text nodes near short labels.
            stat_count = page.evaluate("""() => {
                // Count direct children of the first flex/grid container
                // that each contain a large number and a short label
                let count = 0;
                document.querySelectorAll('div,section').forEach(el => {
                    const children = Array.from(el.children);
                    if (children.length !== 4 && children.length !== 3) return;
                    const allHaveNum = children.every(c => /^\\d+$/.test((c.innerText||'').trim().split('\\n').pop()?.trim() || ''));
                    if (allHaveNum) count = children.length;
                });
                return count;
            }""")
            if stat_count < 4:
                # fallback: count bordered boxes with pure-number content
                stat_count = page.locator("div:has(> p), div:has(> span)").count()

            # Simpler reliable fallback: just count the 4 known Hebrew labels from screenshot
            known_labels = ["שותפים", "מנהלים", "פעילים היום", "סה\"כ משתמשים"]
            found_labels = [lbl for lbl in known_labels if lbl in body or lbl.replace('"','') in body]
            if len(found_labels) < 4:
                issues_users.append(
                    f"Expected 4 stat cards; found labels: {found_labels}"
                )

            # 4. RTL — exclude email addresses from the check
            issues_users += check_rtl(page, "/admin/users")

        record("TEST E — Admin / Users", len(issues_users) == 0, issues_users, sc_users)

        # ── /admin/content ────────────────────────────────────────────────
        issues_content = []
        page.goto(f"{BASE_URL}/admin/content", wait_until="domcontentloaded")
        wait_for_content(page, 8000)
        sc_content = shot(page, "admin_content")
        dest2 = page.url.replace(BASE_URL, "")

        if dest2 in ("/dashboard", "/login", "/"):
            issues_content.append(
                f"Redirected to {dest2} — admin role not assigned"
            )
        else:
            body2 = page.locator("body").inner_text()
            for tab in ["טפסים", "חגים", "תמחור"]:
                if tab not in body2:
                    issues_content.append(f"Tab '{tab}' not found")
            rows2 = page.locator("table tbody tr, li").count()
            if rows2 < 1:
                issues_content.append("No template items visible on first tab")
            issues_content += check_rtl(page, "/admin/content")

        record("TEST E — Admin / Content", len(issues_content) == 0, issues_content, sc_content)

    except Exception as e:
        shot(page, "admin_error")
        record("TEST E — Admin / Users",   False, [f"Exception: {e}"], None)
        record("TEST E — Admin / Content", False, [f"Exception: {e}"], None)
    finally:
        b.close()


# ══════════════════════════════════════════════════════════════════════════════
# TEST F — RTL / Hebrew audit across all tested pages
# ══════════════════════════════════════════════════════════════════════════════

def test_f_rtl(pw):
    log("\n▶ TEST F — RTL / Hebrew audit")
    all_issues = []

    # Public pages
    b_pub = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    for path in ["/", "/login", "/register"]:
        c = b_pub.new_context(locale="he-IL", timezone_id="Asia/Jerusalem",
                              viewport={"width": 1280, "height": 720})
        p = c.new_page()
        p.set_default_timeout(12000)
        try:
            p.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded")
            p.wait_for_timeout(3000)
            page_issues = check_rtl(p, path)
            all_issues += [f"{path}: {i}" for i in page_issues]
        except Exception as ex:
            all_issues.append(f"{path}: error — {str(ex)[:60]}")
        finally:
            c.close()
    b_pub.close()

    # Authenticated pages — reuse one browser
    b_auth, ctx_auth = auth_browser(pw)
    p2 = ctx_auth.new_page()
    p2.set_default_timeout(15000)
    for path in ["/contacts", "/settings", "/pricing", "/help"]:
        try:
            p2.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded")
            wait_for_content(p2, 6000)
            if "/login" in p2.url:
                continue
            page_issues = check_rtl(p2, path)
            all_issues += [f"{path}: {i}" for i in page_issues]
        except Exception as ex:
            all_issues.append(f"{path}: error — {str(ex)[:60]}")
    b_auth.close()

    # Separate issues into EN-text vs RTL-direction problems
    en_issues  = [i for i in all_issues if "[EN]" in i]
    rtl_issues = [i for i in all_issues if "[RTL]" in i]

    report_issues = all_issues if all_issues else []
    record("TEST F — RTL / Hebrew audit",
           len(en_issues) == 0 and len(rtl_issues) == 0,
           report_issues, None)


# ══════════════════════════════════════════════════════════════════════════════
# Report generator
# ══════════════════════════════════════════════════════════════════════════════

def generate_report():
    passed = sum(1 for r in results if r["status"] == "PASSED")
    failed = sum(1 for r in results if r["status"] == "FAILED")

    lines = [
        "=" * 65,
        "  FRESH START — SPRINT 24 UI/UX TEST REPORT",
        f"  Run at  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"  Results : {len(results)} tests | ✅ PASSED: {passed} | ❌ FAILED: {failed}",
        "=" * 65,
    ]

    # Separate real failures from "not-yet-built" informational findings
    not_built_kw = "not yet deployed"

    for r in results:
        icon = "✅" if r["status"] == "PASSED" else "❌"
        lines.append(f"\n{icon} TEST NAME: {r['test']}")
        lines.append(f"   STATUS   : {r['status']}")
        if r["issues"]:
            # Split into actual bugs vs informational
            bugs = [i for i in r["issues"] if not_built_kw not in i and "redirected to" not in i and "→" not in i.split(":")[0]]
            info = [i for i in r["issues"] if i not in bugs]
            if bugs:
                lines.append("   Bugs found:")
                for b in bugs:
                    lines.append(f"     ❌ {b}")
            if info:
                lines.append("   Informational (not yet built / access):")
                for i in info:
                    lines.append(f"     ℹ  {i}")
        else:
            lines.append("   Issues found: none")
        if r["screenshot"]:
            lines.append(f"   Screenshot: {r['screenshot']}")

    lines += [
        "",
        "-" * 65,
        f"  TOTAL: {len(results)} tests | ✅ PASSED: {passed} | ❌ FAILED: {failed}",
        f"  Screenshots: {SS_DIR}",
        "-" * 65,
    ]

    text = "\n".join(lines)
    log("\n" + text)
    REPORT_PATH.write_text(text, encoding="utf-8")
    log(f"\n  Report → {REPORT_PATH}")


# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    with sync_playwright() as pw:

        # ── Session check / refresh ────────────────────────────────────────
        log("Checking auth session...")
        if verify_session(pw):
            log("  Session valid ✓")
        else:
            log("  Session expired — refreshing via Google OAuth...")
            ok = refresh_session(pw)
            if not ok:
                log("  ERROR: Could not re-authenticate. Authenticated tests will be skipped.")

        # ── Run tests ──────────────────────────────────────────────────────
        test_a_marketing(pw)
        test_b_register(pw)
        test_c_login(pw)
        test_d_back_buttons(pw)
        test_e_admin(pw)
        test_f_rtl(pw)

    generate_report()


if __name__ == "__main__":
    main()
