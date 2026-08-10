# syntax=docker/dockerfile:1
# AgroShield AI Service — CPU only, compatible Hugging Face Spaces (PORT=7860)

FROM python:3.11-slim-bookworm AS builder

WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt


FROM python:3.11-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HF_HOME=/data/huggingface \
    MODELS_DIR=/data/models \
    DEMO_MODE=true \
    SKIP_MODEL_LOAD=false \
    MODEL_DEVICE=cpu \
    HF_HUB_DISABLE_TELEMETRY=1

RUN useradd --create-home --uid 1000 --shell /bin/bash appuser \
    && mkdir -p /data/huggingface /data/models /app \
    && chown -R appuser:appuser /data /app

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser data ./data

USER appuser
EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:'+__import__('os').environ.get('PORT','7860')+'/health')"

CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
