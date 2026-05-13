# DocuVerify

DocuVerify is a full-stack **Retrieval-Augmented Generation (RAG)** app: users sign in, upload **PDF** or **TXT** documents, and ask questions. Answers are generated **only from retrieved chunks** of their own documents, with **source citations** (filename and chunk index) to keep responses traceable.

---

## What’s in this repo

| Layer | Role |
|--------|------|
| **Backend** (`backend/app/`) | FastAPI: JWT auth, SQLAlchemy metadata for users/documents, ingestion (extract → chunk → embed), ChromaDB for vectors, Ollama for the final answer. |
| **Frontend** (`frontend/`) | React (Vite), Tailwind CSS, React Router: register, login, dashboard with upload + chat. Calls the API at `http://localhost:8000`. |

**Not implemented here** (even if mentioned in older design notes): OpenAI embeddings/LLM, LangChain loaders, separate RBAC beyond a `role` field on users. The running system uses **local embeddings** and **Ollama** for generation.

---

## Architecture 

1. **Upload** — PDF/TXT → text extraction (PyPDF2 / UTF-8 text) → overlapping word chunks (~500 words, ~10% overlap) → `sentence-transformers` **all-MiniLM-L6-v2** embeddings → stored in **ChromaDB** with `user_id` for isolation; a row is stored in **SQLite** (or your configured DB) for document metadata.
2. **Query** — Question is embedded → Chroma retrieves top **5** chunks for **that user** → prompt is sent to **Ollama** (`/api/generate`) → response includes deduplicated **sources** (document id, filename, chunk index).

---

## Prerequisites

- **Python 3.10+** (3.13 works with the pinned `bcrypt` in `requirements.txt`)
- **Node.js** (current LTS is fine) for the frontend
- **Ollama** installed and running locally, with the model you configure (default **`llama3`**) pulled, e.g. `ollama pull llama3`

First embedding load can take a moment while `sentence-transformers` downloads the model.

---

## Backend setup and run

The ASGI app lives in **`backend/app/main.py`**. Imports assume the **current working directory is `backend/app`**, so start Uvicorn from there (or use `--app-dir`).

```powershell
cd "path\to\DocuVerify\backend\app"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create **`backend/app/.env`** if you want to override defaults (see [Configuration](#configuration)). The app reads `.env` from that same folder (`core/config.py`).

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**From the repository root** (alternative):

```powershell
cd "path\to\DocuVerify"
uvicorn main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend\app
```

- API base: `http://127.0.0.1:8000`
- Interactive docs: `http://127.0.0.1:8000/docs`
- Health: `GET /health`

If you see `Could not import module "main"`, you are almost certainly not using `backend/app` as the app directory (or `--app-dir`).

---

## Frontend setup and run

```powershell
cd "path\to\DocuVerify\frontend"
npm install
npm run dev
```

Vite defaults to **`http://localhost:5173`**, which is allowed by backend CORS. The client is configured in `frontend/src/api.js` to use **`http://localhost:8000`** — keep the API on port 8000 or update that file.

---

## Configuration

Environment variables are optional; defaults are suitable for local development.

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `sqlite:///./docuverify.db` | SQLAlchemy URL (SQLite file created under `backend/app/`). PostgreSQL is supported if you install a driver and use a `postgresql://…` URL. |
| `JWT_SECRET` | (dev placeholder) | Secret for signing JWTs — **change for any shared or production use**. |
| `ALGORITHM` | `HS256` | JWT algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token lifetime. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server. |
| `OLLAMA_MODEL` | `llama3` | Model name passed to Ollama’s generate API. |
| `CHROMA_PERSIST_DIR` | `./chroma_data` | ChromaDB persistence directory (relative to `backend/app/` when you run from there). |

---

## API overview

All document routes require **`Authorization: Bearer <token>`**.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Register (username, email, password). |
| `POST` | `/auth/login` | No | Login; returns JWT + user. |
| `GET` | `/auth/me` | Yes | Current user profile. |
| `POST` | `/upload` | Yes | Multipart file upload (`.pdf` or `.txt`). |
| `POST` | `/query` | Yes | JSON `{ "question": "…" }` → RAG answer + sources. |

---

## Local data and gitignore

Running the app creates, under `backend/app/` (or paths you set):

- SQLite DB file (when using default `DATABASE_URL`)
- `chroma_data/` — vector index
- `temp_uploads/` — short-lived upload scratch (cleaned per request)

These patterns are listed in `.gitignore` along with `venv/`, `.env`, and `__pycache__/`.

---

## Troubleshooting

- **`Could not import module "main"`** — Run Uvicorn from `backend/app` or add `--app-dir backend\app` from the repo root.
- **Ollama errors** — Ensure Ollama is running and the model in `OLLAMA_MODEL` exists (`ollama list`).
- **Broken `pip` after activating `venv`** — If the virtualenv was moved or copied from another path, recreate it in this project and reinstall `requirements.txt`.

---


