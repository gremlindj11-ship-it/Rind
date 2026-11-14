# Rind

The layer that holds the rest together. Student prototype for the National MedTech Hackathon 2026. Synthetic patients only. Not an NHS service.

## Just open it

Open `index.html` in a browser. It is one file and works with no internet.

## With the optional AI summary

`main.py` (by Kalvin) serves the same page and adds an AI summary with a safety gate: any claim whose quote is not word for word in the notes is blocked.

```
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --reload --port 8000
```

Put your Anthropic API key in `.env` (never commit that file), then open the address uvicorn prints. With no key the server falls back to plain extraction and the page says so.

Source for the page is in `rind.zip`.
