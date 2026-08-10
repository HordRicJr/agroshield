"""Déploie ai-service vers un Hugging Face Space Docker.

Usage:
  set HF_TOKEN=hf_xxx   # token Write : https://huggingface.co/settings/tokens
  python scripts/deploy_space.py

Crée/met à jour : hordricjr/agroshield-ai-service
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from huggingface_hub import HfApi, create_repo, upload_folder

SPACE_ID = os.environ.get("HF_SPACE_ID", "hordricjr/agroshield-ai-service")
ROOT = Path(__file__).resolve().parents[1]

# Fichiers nécessaires au Space Docker (pas le venv / cache).
ALLOW = {
    "Dockerfile",
    "README.md",
    "requirements.txt",
    ".dockerignore",
    "app",
    "data",
    "docs",
}


def main() -> int:
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    if not token:
        print(
            "HF_TOKEN manquant. Crée un token Write sur "
            "https://huggingface.co/settings/tokens puis :\n"
            "  $env:HF_TOKEN='hf_...'\n"
            "  python scripts/deploy_space.py",
            file=sys.stderr,
        )
        return 1

    api = HfApi(token=token)
    me = api.whoami()
    print(f"auth_ok user={me.get('name')}")

    create_repo(
        SPACE_ID,
        repo_type="space",
        space_sdk="docker",
        private=False,
        exist_ok=True,
        token=token,
    )

    # Secret inter-services (change en prod)
    internal = os.environ.get("INTERNAL_TOKEN", "agroshield-demo-token-change-me")
    try:
        api.add_space_secret(SPACE_ID, "INTERNAL_TOKEN", internal)
        print("secret INTERNAL_TOKEN set")
    except Exception as exc:  # noqa: BLE001
        print(f"secret_warning: {exc}")

    api.add_space_variable(SPACE_ID, "DEMO_MODE", "true")
    api.add_space_variable(SPACE_ID, "PORT", "7860")
    api.add_space_variable(SPACE_ID, "MODEL_DEVICE", "cpu")
    api.add_space_variable(SPACE_ID, "SKIP_MODEL_LOAD", "false")

    # Upload sélectif
    import tempfile
    import shutil

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for name in ALLOW:
            src = ROOT / name
            if not src.exists():
                continue
            dest = tmp_path / name
            if src.is_dir():
                shutil.copytree(
                    src,
                    dest,
                    ignore=shutil.ignore_patterns(
                        "__pycache__", "*.pyc", ".gitkeep"
                    ),
                )
            else:
                shutil.copy2(src, dest)

        upload_folder(
            repo_id=SPACE_ID,
            repo_type="space",
            folder_path=str(tmp_path),
            token=token,
            commit_message="Deploy AgroShield AI Service (Fraud Guard + FastAPI)",
        )

    space_url = f"https://huggingface.co/spaces/{SPACE_ID}"
    app_url = f"https://{SPACE_ID.replace('/', '-')}.hf.space"
    print("deploy_ok")
    print(f"space_url={space_url}")
    print(f"app_url={app_url}")
    print(f"docs_url={app_url}/docs")
    print(f"health_url={app_url}/health")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
