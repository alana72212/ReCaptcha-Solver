from __future__ import annotations
import json
import os
import tempfile
from dataclasses import dataclass

@dataclass(frozen=True)
class Parser:
    scheme: str
    host: str
    port: int
    username: str | None = None
    password: str | None = None

    @property
    def isAuth(self) -> bool:
        return bool(self.username and self.password)

    @property
    def server(self) -> str:
        return f"{self.scheme}://{self.host}:{self.port}"

    @property
    def url(self) -> str:
        if self.isAuth:
            return f"{self.scheme}://{self.username}:{self.password}@{self.host}:{self.port}"
        return self.server

    @classmethod
    def parse(cls, proxy: str | None) -> Parser | None:
        if not proxy:
            return None
        scheme, rest = (proxy.split('://', 1) if '://' in proxy else ('http', proxy))
        username = password = None
        if '@' in rest:
            auth, rest = rest.split('@', 1)
            if ':' in auth:
                username, password = auth.split(':', 1)
        host, port = rest.rsplit(':', 1)
        return cls(scheme=scheme, host=host, port=int(port), username=username, password=password)

    def build(self) -> str:
        out = tempfile.mkdtemp(prefix='proxy_auth_')
        manifest = {
            "version": "1.0.0",
            "manifest_version": 2,
            "name": "Proxy Auth",
            "permissions": [
                "proxy", "tabs", "unlimitedStorage", "storage",
                "<all_urls>", "webRequest", "webRequestBlocking",
            ],
            "background": {"scripts": ["background.js"]},
            "minimum_chrome_version": "22.0.0",
        }
        background = (
            "var config = {mode: 'fixed_servers', rules: {singleProxy: "
            f"{{scheme: '{self.scheme}', host: '{self.host}', port: {self.port}}}, "
            "bypassList: ['localhost']}};\n"
            "chrome.proxy.settings.set({value: config, scope: 'regular'}, function(){});\n"
            "chrome.webRequest.onAuthRequired.addListener(\n"
            f"  function(){{ return {{authCredentials: {{username: '{self.username}', password: '{self.password}'}}}}; }},\n"
            "  {urls: ['<all_urls>']},\n"
            "  ['blocking']\n"
            ");\n"
        )
        with open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8') as f:
            json.dump(manifest, f)
        with open(os.path.join(out, 'background.js'), 'w', encoding='utf-8') as f:
            f.write(background)
        return out