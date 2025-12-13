"""
Webhook Receiver for Auto-Deploy

This tiny service listens for GitHub webhooks and triggers a redeploy
whenever you push to the main branch.

Runs alongside Liminal in Docker.
"""

import os
import hmac
import hashlib
import subprocess
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

# Secret for verifying GitHub webhooks (set in docker-compose.yml)
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "change-me-to-something-secure")
DEPLOY_SCRIPT = "/app/deploy-internal.sh"


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify the GitHub webhook signature."""
    if not signature:
        return False
    
    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)


@app.post("/webhook")
async def github_webhook(request: Request):
    """Handle GitHub webhook for auto-deploy."""
    
    # Get the raw body for signature verification
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")
    
    # Verify the webhook is from GitHub
    if not verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Parse the payload
    payload = await request.json()
    
    # Only deploy on pushes to main branch
    ref = payload.get("ref", "")
    if ref != "refs/heads/main":
        return {"status": "ignored", "reason": f"Not main branch: {ref}"}
    
    # Trigger deploy
    try:
        result = subprocess.run(
            ["bash", DEPLOY_SCRIPT],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        return {
            "status": "deployed",
            "returncode": result.returncode,
            "stdout": result.stdout[-500:] if result.stdout else "",  # Last 500 chars
            "stderr": result.stderr[-500:] if result.stderr else ""
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Deploy timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "webhook-receiver"}
