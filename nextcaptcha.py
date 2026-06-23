import random
import requests
from solver import Solver

proxy = random.choice(open('proxies.txt', 'r', encoding='utf-8').read().splitlines()).strip()
#proxy=None
token = Solver(proxy=proxy).solve(
    url='https://nextcaptcha.com/demo/recaptcha_v3_enterprise',
    sitekey='6LcAbwIqAAAAAJvVAhSSJ8qzYsujc7kn1knmSgQX',
    action='submit',
    enterprise=True,
)

print('Solved ReCaptcha ->', token[:50] + '***')

r = requests.post(
    'https://next.nextcaptcha.com/api/captcha-demo/recaptcha_enterprise/verify',
    data={'siteKey': '6LcAbwIqAAAAAJvVAhSSJ8qzYsujc7kn1knmSgQX', 'gRecaptchaResponse': token, 'action': 'submit'},
)

risk = r.json()["riskAnalysis"]
score = risk["score"]
reason = risk["reasons"]

print(f"Score: {score} | Reason: {reason}")