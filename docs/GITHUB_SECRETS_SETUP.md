# GitHub Secrets Setup Guide

## Valid Secret Names (Follow GitHub's Rules)

Secret names must:
- ✅ Only contain letters [a-z] [A-Z], numbers [0-9], or underscores _
- ✅ Start with a letter or underscore
- ❌ NO spaces, dashes, or special characters

## Required Secrets for ToluAI CI/CD

### 1. Docker Hub Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DOCKER_USERNAME` | `mekasoft1` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker access token | The token starting with `dckr_pat_` |

### 2. WhatsApp Notification Secrets (Optional)

Choose ONE of these options:

#### Option A: CallMeBot (Easiest)
| Secret Name | Value | Example |
|------------|-------|---------|
| `WHATSAPP_RECIPIENT` | Your phone with country code | `14155238886` |
| `CALLMEBOT_API_KEY` | API key from CallMeBot | `123456` |

#### Option B: WhatsApp Business API
| Secret Name | Value | Example |
|------------|-------|---------|
| `WHATSAPP_API_TOKEN` | Meta access token | `EAAxxxxx...` |
| `WHATSAPP_PHONE_ID` | Phone number ID from Meta | `123456789012345` |
| `WHATSAPP_RECIPIENT` | Target phone number | `14155238886` |

#### Option C: Twilio
| Secret Name | Value | Example |
|------------|-------|---------|
| `TWILIO_ACCOUNT_SID` | Account SID from Twilio | `ACxxxxx...` |
| `TWILIO_AUTH_TOKEN` | Auth token from Twilio | `xxxxx...` |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number | `+14155238886` |
| `WHATSAPP_RECIPIENT` | Target phone number | `14155238886` |

## Step-by-Step Instructions

### Adding Docker Secrets (REQUIRED)

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

**First Secret:**
- Name: `DOCKER_USERNAME`
- Secret: `mekasoft1`
- Click **Add secret**

**Second Secret:**
- Name: `DOCKER_PASSWORD`
- Secret: `[Your Docker token starting with dckr_pat_]`
- Click **Add secret**

### Adding WhatsApp Secrets (OPTIONAL)

**For CallMeBot (Simplest):**

1. Send WhatsApp message to `+34 698 28 89 73`: "I allow callmebot to send me messages"
2. You'll receive an API key
3. Add these secrets:
   - Name: `WHATSAPP_RECIPIENT`
   - Secret: Your phone (e.g., `14155238886`)
   
   - Name: `CALLMEBOT_API_KEY`
   - Secret: The key you received

## Testing Your Secrets

### Test Docker Secrets
1. Go to **Actions** tab
2. Select **Test Docker Build** workflow
3. Click **Run workflow**
4. Check if it succeeds

### Test WhatsApp (if configured)
1. Make a small change to any file
2. Commit and push
3. Wait for WhatsApp notification

## Common Issues and Fixes

### "Secret not found" Error
- Check spelling exactly matches (case-sensitive!)
- No spaces in secret names
- Must start with letter or underscore

### Invalid Secret Name Examples
❌ `DOCKER-USERNAME` (has dash)  
❌ `DOCKER PASSWORD` (has space)  
❌ `123_TOKEN` (starts with number)  
❌ `docker.username` (has dot)  

### Valid Secret Name Examples
✅ `DOCKER_USERNAME`  
✅ `DOCKER_PASSWORD`  
✅ `_PRIVATE_KEY`  
✅ `API_TOKEN_V2`  

## Security Reminders

1. **Never** commit secrets to code
2. **Never** log/print secrets in workflows
3. **Rotate** tokens every 90 days
4. **Delete** unused secrets
5. **Limit** secret access to required workflows only

## Verify Your Secrets Are Added

After adding, you should see them listed (but not their values) at:
```
https://github.com/[your-username]/toluai/settings/secrets/actions
```

You should see:
- DOCKER_USERNAME
- DOCKER_PASSWORD
- (Optional WhatsApp secrets if configured)

## Quick Copy-Paste for Docker Setup

**Secret 1:**
```
Name: DOCKER_USERNAME
Value: mekasoft1
```

**Secret 2:**
```
Name: DOCKER_PASSWORD
Value: [Your Docker token]
```

## Next Steps

1. ✅ Add `DOCKER_USERNAME` secret
2. ✅ Add `DOCKER_PASSWORD` secret
3. ✅ (Optional) Add WhatsApp secrets
4. ✅ Push to main branch to trigger pipeline
5. ✅ Check Actions tab for success
6. ✅ Visit https://hub.docker.com/r/mekasoft1/toluai to see your image