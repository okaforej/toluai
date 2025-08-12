# Docker Hub Setup Guide

## Setting up Docker Hub for CI/CD

### Step 1: Create Docker Hub Account
1. Go to [Docker Hub](https://hub.docker.com)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Create Access Token (Recommended over password)
1. Log in to Docker Hub
2. Click on your username (top right) → "Account Settings"
3. Go to "Security" tab
4. Click "New Access Token"
5. Give it a description like "GitHub Actions CI/CD"
6. Copy the token immediately (you won't see it again!)

### Step 3: Add Secrets to GitHub Repository
1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Add the following secrets:

#### DOCKER_USERNAME
- Click "New repository secret"
- Name: `DOCKER_USERNAME`
- Value: Your Docker Hub username (e.g., `yourusername`)

#### DOCKER_PASSWORD
- Click "New repository secret"  
- Name: `DOCKER_PASSWORD`
- Value: The access token you copied from Docker Hub (NOT your password)

### Step 4: Create Docker Repository (Optional)
By default, images will be pushed to `yourusername/toluai`. To create it manually:
1. Log in to Docker Hub
2. Click "Create Repository"
3. Name: `toluai`
4. Visibility: Public (for free account) or Private
5. Click "Create"

## WhatsApp Business API Setup

### Option 1: WhatsApp Business API (Official)

#### Prerequisites
- Facebook Business Account
- WhatsApp Business Account
- Meta Developer Account

#### Steps:
1. **Create Meta App**
   - Go to [Meta for Developers](https://developers.facebook.com)
   - Create a new app → Type: Business
   - Add WhatsApp product to your app

2. **Get Phone Number ID**
   - In your app dashboard → WhatsApp → Getting Started
   - You'll see a test phone number and Phone Number ID
   - Copy the Phone Number ID

3. **Get Access Token**
   - In the same page, you'll see a temporary access token
   - For production, generate a permanent token:
     - Go to Meta Business Suite
     - System Users → Add System User
     - Generate token with `whatsapp_business_messaging` permission

4. **Add to GitHub Secrets**
   ```
   WHATSAPP_API_TOKEN: Your access token
   WHATSAPP_PHONE_ID: Your phone number ID (e.g., 123456789012345)
   WHATSAPP_RECIPIENT: Recipient phone (e.g., 14155238886)
   ```

### Option 2: Using Twilio (Easier Alternative)

#### Steps:
1. **Sign up for Twilio**
   - Go to [Twilio](https://www.twilio.com)
   - Sign up for free trial
   - Verify your phone number

2. **Set up WhatsApp Sandbox** (for testing)
   - In Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join sandbox

3. **Get Credentials**
   - Account SID: Found in Twilio Console
   - Auth Token: Found in Twilio Console
   - WhatsApp Number: From sandbox or purchased number

4. **Update CI/CD for Twilio**
   ```yaml
   - name: Send WhatsApp via Twilio
     run: |
       curl -X POST https://api.twilio.com/2010-04-01/Accounts/${{ secrets.TWILIO_ACCOUNT_SID }}/Messages.json \
         -u "${{ secrets.TWILIO_ACCOUNT_SID }}:${{ secrets.TWILIO_AUTH_TOKEN }}" \
         -d "From=whatsapp:${{ secrets.TWILIO_WHATSAPP_NUMBER }}" \
         -d "To=whatsapp:${{ secrets.WHATSAPP_RECIPIENT }}" \
         -d "Body=Deployment Status: ${{ job.status }}"
   ```

### Option 3: Using WhatsApp Web API Services (Simplest)

Services like [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/):

1. **Setup (No registration needed)**
   - Send WhatsApp message to +34 698 28 89 73: "I allow callmebot to send me messages"
   - Wait for API key in response

2. **Update CI/CD**
   ```yaml
   - name: Send WhatsApp via CallMeBot
     run: |
       curl -X POST "https://api.callmebot.com/whatsapp.php?phone=${{ secrets.WHATSAPP_RECIPIENT }}&text=Deployment+${{ job.status }}&apikey=${{ secrets.CALLMEBOT_API_KEY }}"
   ```

3. **Add to GitHub Secrets**
   ```
   WHATSAPP_RECIPIENT: Your phone with country code (e.g., 14155238886)
   CALLMEBOT_API_KEY: The API key you received
   ```

## Testing Your Setup

### Test Docker Login
```bash
# Locally
docker login -u YOUR_USERNAME -p YOUR_ACCESS_TOKEN

# Should see: Login Succeeded
```

### Test WhatsApp Notification
```bash
# Test with curl (WhatsApp Business API)
curl -X POST \
  "https://graph.facebook.com/v17.0/YOUR_PHONE_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "RECIPIENT_PHONE",
    "type": "text",
    "text": {"body": "Test message from CI/CD"}
  }'
```

## Troubleshooting

### Docker Issues
- **Authentication failed**: Check token is correct and not expired
- **Repository not found**: Ensure repository name matches `username/repository`
- **Push denied**: Check you have push permissions

### WhatsApp Issues
- **Invalid token**: Regenerate token in Meta Business Suite
- **Phone number not registered**: Add recipient number to test numbers in Meta App
- **Message not received**: Check recipient has opted in to receive messages

## Security Best Practices

1. **Never commit secrets** to your repository
2. **Use access tokens** instead of passwords
3. **Rotate tokens** periodically
4. **Limit token permissions** to minimum required
5. **Use environment-specific** tokens (dev/staging/prod)

## Cost Considerations

### Docker Hub
- **Free**: 1 private repo, unlimited public repos
- **Pro ($5/month)**: Unlimited private repos
- **Team ($7/user/month)**: Team collaboration features

### WhatsApp Business API
- **Meta**: Pay per conversation (varies by country)
- **Twilio**: Pay per message ($0.005 - $0.05)
- **CallMeBot**: Free (with limitations)

## Next Steps

After setting up:
1. Push a commit to trigger the CI/CD pipeline
2. Check GitHub Actions for build status
3. Verify Docker image appears in Docker Hub
4. Confirm WhatsApp notification received