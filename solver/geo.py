from datetime import datetime
import requests
from zoneinfo import ZoneInfo

def lookup(proxy: str | None = None, timeout: float = 8.0) -> dict | None:
    try:
        proxies = {"http": proxy, "https": proxy} if proxy else None
        r = requests.get("http://ip-api.com/json/", proxies=proxies, timeout=timeout).json()
        if r.get("status") == "success":
            return r
    except Exception:
        pass
    return None

def getOffset(zone: str) -> int | None:
    return -int(datetime.now(ZoneInfo(zone)).utcoffset().total_seconds() / 60)
