import os
import json
from pathlib import Path
import nodriver as uc
from .stealth import Stealth

class Solver:
    def __init__(
        self,
        fingerprint: str | Path | dict | None = None,
        proxy: str | None = None,
        headless: bool = False,
    ):
        if not fingerprint:
            fp_path = os.path.join(os.path.dirname(__file__), "fp.json")
            with open(fp_path, 'r', encoding='utf-8') as f:
                self.fingerprint = json.load(f)
        else:
            self.fingerprint = fingerprint
        self.proxy = proxy
        self.headless = headless

    def solve(
        self,
        url: str,
        sitekey: str,
        action: str = 'submit',
        enterprise: bool = False,
    ) -> str:
        return uc.loop().run_until_complete(
            self.asolve(url, sitekey, action, enterprise)
        )

    async def asolve(
        self,
        url: str,
        sitekey: str,
        action: str = 'submit',
        enterprise: bool = False,
    ) -> str:
        async with Stealth(self.fingerprint, proxy=self.proxy, headless=self.headless) as sb:
            page = await sb.getPage()
            await sb.warmup(page)
            await page.get(url)
            #await page.wait(3) # additional waiting for page to load
            await sb.humanize(page)
            parent = 'grecaptcha.enterprise' if enterprise else 'grecaptcha'
            result = await page.evaluate(f"""
new Promise((resolve, reject) => {{
    {parent}.ready(() => {{
        {parent}.execute('{sitekey}', {{ action: '{action}' }})
            .then(resolve)
            .catch(reject);
    }});
}});
""", True)
            return result[0].value

def solve(
    url: str,
    sitekey: str,
    action: str = 'submit',
    enterprise: bool = False,
    *,
    proxy: str | None = None,
    fingerprint: str | Path | dict | None = None,
    headless: bool = False,
) -> str:
    return Solver(fingerprint=fingerprint, proxy=proxy, headless=headless).solve(
        url, sitekey, action, enterprise
    )
