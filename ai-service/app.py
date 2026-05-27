"""
Lekha AI Service — Keyword Extraction
Uses KeyBERT for NLP-based keyword extraction.
Supports PDF, DOCX, and TXT files.
Run with: uvicorn app:app --host 0.0.0.0 --port 8000
"""

import os
import io
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from keybert import KeyBERT
import pdfplumber
from docx import Document

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lekha-ai")

# ── App Setup ──────────────────────────────────────────────────────────────
app = FastAPI(title="Lekha AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load KeyBERT model once at startup ────────────────────────────────────
logger.info("Loading KeyBERT model...")
kw_model = KeyBERT()
logger.info("KeyBERT model loaded ✅")

# ── Allowed file types ─────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE_MB = 20


# ── Text Extractors ────────────────────────────────────────────────────────

def extract_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pdfplumber."""
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def extract_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()


def extract_from_txt(file_bytes: bytes) -> str:
    """Extract text from plain TXT file."""
    return file_bytes.decode("utf-8", errors="ignore").strip()


def extract_text(file_bytes: bytes, extension: str) -> str:
    """Route to correct extractor based on file extension."""
    if extension == ".pdf":
        return extract_from_pdf(file_bytes)
    elif extension == ".docx":
        return extract_from_docx(file_bytes)
    elif extension == ".txt":
        return extract_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {extension}")


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Lekha AI Keyword Extractor"}


@app.post("/extract-keywords")
async def extract_keywords(file: UploadFile = File(...)):
    """
    Accepts a file upload, extracts text, runs KeyBERT,
    and returns the top 10 keywords as JSON.
    """
    # Validate extension
    filename = file.filename or ""
    ext = os.path.splitext(filename)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: PDF, DOCX, TXT"
        )

    # Read file bytes
    file_bytes = await file.read()

    # Validate file size
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Max allowed: {MAX_FILE_SIZE_MB} MB"
        )

    # Extract text
    try:
        text = extract_text(file_bytes, ext)
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        raise HTTPException(status_code=422, detail=f"Could not extract text: {str(e)}")

    if not text or len(text) < 50:
        raise HTTPException(status_code=422, detail="File has too little text to extract keywords from.")

    # Run KeyBERT
    try:
        raw_keywords = kw_model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),  # single words + bigrams
            stop_words="english",
            top_n=10,
            diversity=0.5           # MMR diversity to avoid duplicates
        )
        keywords = [kw for kw, score in raw_keywords]
    except Exception as e:
        logger.error(f"KeyBERT extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Keyword extraction failed: {str(e)}")

    logger.info(f"Extracted {len(keywords)} keywords from '{filename}'")
    return {
        "success": True,
        "filename": filename,
        "keywords": keywords,
        "keyword_count": len(keywords)
    }
