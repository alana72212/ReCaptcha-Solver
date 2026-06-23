from __future__ import annotations
import asyncio
import json
import os
import nodriver as uc
import nodriver.cdp.page as cdp_page
import nodriver.cdp.emulation as cdp_emulation
from .proxy import Parser
from . import geo

class Stealth:
    def __init__(self, fingerprint: dict, proxy: str | None = None, headless: bool = False):
        self.fingerprint = fingerprint
        self.proxy = Parser.parse(proxy)
        self.headless = headless
        self._browser = None
        self._geo: dict | None = None
        self._tz_offset: int | None = None
        self._tz_name: str | None = None

    async def __aenter__(self) -> Stealth:
        self._browser = await uc.start(headless=self.headless, browser_args=self._args())
        return self

    async def __aexit__(self, *exc) -> None:
        if self._browser is not None:
            try:
                self._browser.stop()
            except Exception:
                pass
            self._browser = None

    def _args(self) -> list[str]:
        scr = self.fingerprint['screen']
        args = [
            "--disable-blink-features=AutomationControlled",
            f"--window-size={scr['Width']},{scr['Height']}",
            "--no-first-run",
            "--disable-infobars",
            "--disable-ipc-flooding-protection",
            "--metrics-recording-only",
            "--use-mock-keychain",
        ]
        if self.proxy:
            if self.proxy.isAuth:
                ext = self.proxy.build()
                args += [f"--load-extension={ext}", f"--disable-extensions-except={ext}"]
            else:
                args.append(f"--proxy-server={self.proxy.server}")
        if not self.headless:
            args.append("--window-position=-32000,-32000") # just so it dont show on ur screen
        return args

    async def getPage(self):
        page = await self._browser.get('about:blank')
        await self._override(page)
        return page

    async def humanize(self, page) -> None:
        await page.evaluate(r"""
            new Promise(async (resolve) => {
                const sleep = (ms) => new Promise(r => setTimeout(r, ms));
                let x = window.innerWidth / 2, y = window.innerHeight / 2;
                let lastX = x, lastY = y;
                for (let i = 0; i < 25; i++) {
                    x += (Math.random() - 0.5) * 80;
                    y += (Math.random() - 0.5) * 80;
                    x = Math.max(5, Math.min(window.innerWidth - 5, x));
                    y = Math.max(5, Math.min(window.innerHeight - 5, y));
                    const evt = new MouseEvent('mousemove', {
                        clientX: x, clientY: y,
                        screenX: x, screenY: y,
                        movementX: x - lastX, movementY: y - lastY,
                        bubbles: true, cancelable: true, view: window,
                        button: 0, buttons: 0,
                    });
                    document.dispatchEvent(evt);
                    window.dispatchEvent(evt);
                    lastX = x; lastY = y;
                    await sleep(20 + Math.random() * 50);
                }
                window.scrollBy({ top: 120, behavior: 'smooth' });
                await sleep(700);
                window.scrollBy({ top: -120, behavior: 'smooth' });
                await sleep(500);
                resolve();
            });
            """, 
            True
        )

    async def warmup(self, page, query: str | None = None) -> None:
        import random
        q = query or random.choice([
            'weather', 'youtube', 'maps', 'news today', 'translate english',
            'gmail', 'github', 'wikipedia', 'currency converter', 'time zone converter',
        ])
        try:
            await page.get(f'https://www.google.com/search?q={q.replace(" ", "+")}')
            await page.wait(2)
        except Exception:
            pass

    async def _override(self, page) -> None:
        await self._cdp(page)
        await self._cdp_geo(page)
        await self._inject(page)

    async def _cdp(self, page) -> None:
        scr = self.fingerprint['screen']
        features = [
            cdp_emulation.MediaFeature(name='color-gamut', value='srgb'),
            cdp_emulation.MediaFeature(name='prefers-color-scheme', value='light'),
            cdp_emulation.MediaFeature(name='prefers-reduced-motion', value='no-preference'),
            cdp_emulation.MediaFeature(name='prefers-contrast', value='no-preference'),
            cdp_emulation.MediaFeature(name='forced-colors', value='none'),
            cdp_emulation.MediaFeature(name='dynamic-range', value='standard'),
            cdp_emulation.MediaFeature(name='inverted-colors', value='none'),
        ]
        for call in [
            cdp_emulation.set_focus_emulation_enabled(enabled=True),
            cdp_emulation.set_touch_emulation_enabled(enabled=False),
            cdp_emulation.set_emulated_media(media='screen', features=features),
            cdp_emulation.set_device_metrics_override(
                width=scr['innerWidth'],
                height=scr['innerHeight'],
                device_scale_factor=scr['devicePixelRatio'],
                mobile=False,
                screen_width=scr['Width'],
                screen_height=scr['Height'],
                position_x=0,
                position_y=0,
            ),
        ]:
            try:
                await page.send(call)
            except Exception:
                pass

    async def _cdp_geo(self, page) -> None:
        if not self.proxy:
            return
        self._geo = await asyncio.to_thread(geo.lookup, self.proxy.url)
        if not self._geo:
            return
        self._tz_name = self._geo.get('timezone')
        if self._tz_name:
            self._tz_offset = geo.zone(self._tz_name)
            try:
                await page.send(cdp_emulation.set_timezone_override(timezone_id=self._tz_name))
            except Exception:
                pass
        lat, lon = self._geo.get('lat'), self._geo.get('lon')
        if lat is not None and lon is not None:
            try:
                await page.send(cdp_emulation.set_geolocation_override(
                    latitude=float(lat), longitude=float(lon), accuracy=100,
                ))
            except Exception:
                pass

    async def _inject(self, page) -> None:
        fp = dict(self.fingerprint)
        if self._tz_offset is not None:
            fp['_TZ_OFFSET'] = self._tz_offset
        if self._tz_name:
            fp['_TZ_NAME'] = self._tz_name
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "injection.js")
        script = open(script_path, "r", encoding="utf-8").read().replace(
            '_FP_', json.dumps(fp)
        )
        await page.send(cdp_page.add_script_to_evaluate_on_new_document(source=script))
