# Football Jersey & Scarf Museum 🧣👕

A tiny self-hosted app (FastAPI) to catalog a jersey and scarf collection
with photos — open it from your phone on your home wifi and snap a photo
straight from the camera when you add a new piece.

## How data is stored

- **`data/items.json`**: the record for each piece (club, season, player,
  story, etc.) as plain JSON

- **`static/uploads/`**: the actual photos, saved as real `.jpg` files
  (auto-resized on upload). The JSON only stores the filename, not the
  image itself.


## 1. Install uv (if you don't have it)

This project runs with [uv](https://docs.astral.sh/uv/), which manages
Python and dependencies for you — no manual virtualenv needed.

```bash
# Mac / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

## 2. Run the server

```bash
cd digital_collection
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

Open it on your own computer at `http://localhost:8000`.

## 3. Open it from your phone

Your phone and computer need to be on the **same wifi network**.

1. Find your computer's local IP address:
   - **Mac**: open Terminal and run `ipconfig getifaddr en0`
   - **Windows**: open `cmd` and run `ipconfig`, look for "IPv4 Address"
   - **Linux**: run `hostname -I`

   You'll get something like `192.168.0.15`.

2. On your phone's browser, go to:

   ```
   http://192.168.0.15:8000
   ```

   (using your own IP)

3. Done — from there, tap **"📷 Take photo"** when adding a piece and it
   opens your phone's camera directly.


## 4. Keep it running (optional)

While the terminal with `uvicorn` is open, the server keeps running. If
you close the terminal, it stops. If you want it running in the
background permanently, tools like `pm2`, `systemd` (Linux), or `launchd`
(Mac) can help.

## Project structure

```
digital_collection/
├── main.py               # FastAPI server and API
├── pyproject.toml        # dependencies (used by uv)
├── uv.lock                # exact pinned versions
├── .gitignore
├── data/
│   └── items.json         # your real collection (gitignored)
├── examples/               # 2 sample entries, tracked in git for reference
│   ├── items.example.json
│   └── photos/
└── static/
    ├── index.html
    ├── style.css
    ├── app.js
    └── uploads/            # your real photos (gitignored, except .gitkeep)
```
