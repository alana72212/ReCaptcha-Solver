# ReCaptcha-Solver

Simply an easy drag-n-drop solution for ReCaptcha V3, not V2 unfortunately

However, this project still does work for a lot of targets including Ticketmaster, which is where I've seen the biggest demand for a solution, so here it is

This isn't the best code, it is a little older, but it works well enough

# How It Works

The solver works by firing up a chrome instance using [nodriver](https://github.com/ultrafunkamsterdam/nodriver), however there may be a faster library to use.

With that chrome instance, it navigates to the page the captcha is located on and injects some code to build legit user-data such as an injected fingerprint, so it isn't using the same one over and over from the browser.

Once the data is injected, it runs a "warmup" by running a quick, randomized, google search before heading to the target page where it will call `grecaptcha.execute` and that returns the valid token.

# Usage

This porject comes with an `api.py` file so you can instantly just run and serve it, however, for local use (just import the `solver` package) there is an example below: 

```
from solver import Solver
import time

proxy = "http://user:pass@ip:port"
start = time.time()
token = Solver(proxy=proxy).solve(
    url='https://nextcaptcha.com/demo/recaptcha_v3_enterprise',
    sitekey='6LcAbwIqAAAAAJvVAhSSJ8qzYsujc7kn1knmSgQX',
    action='submit',
    enterprise=True,
)

print(f"ReCaptcha | {token[:50} | {round(time.time() - start, 2)}s")
```

Or for usage with the API, simply run `api.py`, then in your project use the example below:

```
import requests

headers = {
    "Authorization": "bearer api_key"
}

data = {
    "url": "https://nextcaptcha.com/demo/recaptcha_v3_enterprise",
    "sitekey":"6LcAbwIqAAAAAJvVAhSSJ8qzYsujc7kn1knmSgQX",
    "action":"submit",
    "enterprise": True,
    "proxy": "http://user:pass@host:port"
}

response = requests.post("http://127.0.0.1:8778/solve", headers=headers, json=data)
print(response.json())
```

# Notice

- Everything included in this repository is strictly for *educational & research purposes*
- This is a browser-based solver meaning it is unlikely to scale to that of a profesional service
- This is intended to show where ReCaptcha lacks in browser fingerprinting
- The only big thing they check is GPU, however, that isn't difficult to inject

# Contact
Contact is available via *Telegram*, *Discord*, or *email*

Telegram - `@Fyxavwfunctionstringstring`
Email - `alana72212@proton.me`

Discord - `discord.gg/5c6RABnqHU`
Telegram - `t.me/autopiax`

# Legal / DMCA
⚠️I am fully compliant with any takedown request by the order of *Google*, *ReCaptcha*, or associated parties⚠️
