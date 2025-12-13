# Auto-Deploy Setup Guide

This guide explains how to set up automatic deployment so that pushing to GitHub automatically updates Liminal on your NAS.

## How It Works

```
You push code          GitHub sends             Webhook service        Liminal
to GitHub      →       webhook to NAS    →      pulls & rebuilds  →   updated!
                           │
                           ▼
                    http://your-nas:9000/webhook
```

A small webhook service runs alongside Liminal. When GitHub notifies it of a push to `main`, it automatically pulls the new code and rebuilds the app.

---

## Setup Steps

### 1. Generate a Webhook Secret

On your computer (or NAS), generate a random secret:

```bash
openssl rand -hex 32
```

This outputs something like:
```
a1b2c3d4e5f6... (64 characters)
```

**Save this secret** - you'll need it in steps 2 and 3.

### 2. Configure Your NAS

SSH into your Synology and navigate to your Liminal directory:

```bash
cd /volume1/docker/liminal  # or wherever you cloned it
```

Create an environment file with your secret:

```bash
echo "WEBHOOK_SECRET=your-secret-from-step-1" > .env
```

Start the services:

```bash
docker-compose up -d
```

Verify the webhook service is running:

```bash
curl http://localhost:9000/health
# Should return: {"status":"ok","service":"webhook-receiver"}
```

### 3. Configure GitHub Webhook

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Fill in:

   | Field | Value |
   |-------|-------|
   | Payload URL | `http://your-nas-tailscale-ip:9000/webhook` |
   | Content type | `application/json` |
   | Secret | The secret from step 1 |
   | Events | Just the `push` event |
   | Active | ✓ Checked |

4. Click **Add webhook**

### 4. Test It

Make a small change to any file, commit, and push:

```bash
echo "# test" >> README.md
git add . && git commit -m "Test auto-deploy"
git push
```

Then check:
- GitHub webhook page should show a green checkmark for recent delivery
- On your NAS: `docker-compose logs webhook` should show the deploy
- Your change should be live at `http://your-nas:3000`

---

## Finding Your NAS Tailscale IP

If you're using Tailscale, your NAS has a stable IP like `100.x.y.z`.

To find it:
```bash
# On your NAS
tailscale ip -4
```

Or check the Tailscale admin console at https://login.tailscale.com/admin/machines

Use this IP for the GitHub webhook URL.

---

## Troubleshooting

### Webhook shows "failed" on GitHub

**Check the error message** in GitHub's webhook delivery details.

Common issues:
- Wrong secret → 401 error
- NAS not reachable → Connection timeout
- Port 9000 not open → Connection refused

### Check webhook logs

```bash
docker-compose logs webhook
```

### Test webhook locally

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main"}'
```

(This will fail signature verification but shows if the service is responding)

### Rebuild webhook service

```bash
docker-compose up -d --build webhook
```

---

## Security Notes

1. **Keep your webhook secret secure** - Anyone with it could trigger deploys
2. **Tailscale helps** - Your NAS isn't exposed to the public internet
3. **The webhook only deploys on `main`** - Pushes to other branches are ignored
4. **Signature verification** - GitHub signs webhooks; we verify them

---

## Disabling Auto-Deploy

If you want to go back to manual deploys:

```bash
docker-compose stop webhook
```

Or remove the webhook service from `docker-compose.yml` entirely.

---

## Manual Deploy (Fallback)

If auto-deploy isn't working, you can always deploy manually:

```bash
ssh your-nas
cd /volume1/docker/liminal
git pull
docker-compose up -d --build app
```
