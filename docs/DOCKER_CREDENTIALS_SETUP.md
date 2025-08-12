# Docker Hub Credentials Setup for ToluAI

## Your Docker Hub Configuration

**Username:** `mekasoft1`  
**Registry:** Docker Hub (hub.docker.com)  
**Repository:** `mekasoft1/toluai`

## ⚠️ IMPORTANT SECURITY NOTICE

**NEVER commit your Docker access token to Git!** The token you have should only be stored in GitHub Secrets.

## Step-by-Step Setup in GitHub

### 1. Navigate to GitHub Secrets
1. Go to your GitHub repository: https://github.com/[your-username]/toluai
2. Click on **Settings** (in the repository, not your profile)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Docker Username
1. Click **New repository secret**
2. **Name:** `DOCKER_USERNAME`
3. **Value:** `mekasoft1`
4. Click **Add secret**

### 3. Add Docker Password (Access Token)
1. Click **New repository secret**
2. **Name:** `DOCKER_PASSWORD`  
3. **Value:** `[Your Docker Access Token]`
4. Click **Add secret**

## Testing Your Setup Locally

### Test Docker Login
```bash
# Test login locally (DO NOT commit this command to any file)
docker login -u mekasoft1 -p [YOUR_TOKEN]

# You should see:
# Login Succeeded
```

### Build and Push Test
```bash
# Build your image locally
docker build -t mekasoft1/toluai:test .

# Push to Docker Hub
docker push mekasoft1/toluai:test

# Check on Docker Hub
# Visit: https://hub.docker.com/r/mekasoft1/toluai
```

## What Happens in CI/CD

When you push to the `main` branch, the pipeline will:

1. **Build** the Docker image
2. **Tag** it as:
   - `mekasoft1/toluai:latest` (always points to newest)
   - `mekasoft1/toluai:[commit-sha]` (specific version)
3. **Push** to Docker Hub under your account

## Pulling Your Image

After the CI/CD pipeline runs successfully:

```bash
# Pull the latest version
docker pull mekasoft1/toluai:latest

# Run the container
docker run -p 5000:5000 mekasoft1/toluai:latest

# Or with environment variables
docker run -p 5000:5000 \
  -e DATABASE_URI="your_database_uri" \
  -e SECRET_KEY="your_secret_key" \
  mekasoft1/toluai:latest
```

## Docker Compose Usage

```yaml
version: '3.8'
services:
  toluai:
    image: mekasoft1/toluai:latest
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URI=${DATABASE_URI}
      - SECRET_KEY=${SECRET_KEY}
    restart: unless-stopped
```

## Monitoring Your Docker Hub

- **View your repository:** https://hub.docker.com/r/mekasoft1/toluai
- **Check image tags:** Look for different versions
- **Download stats:** See how many times your image was pulled
- **Image size:** Monitor the size of your images

## Security Best Practices

1. ✅ **Token is stored in GitHub Secrets** (not in code)
2. ✅ **Using access token** instead of password
3. ✅ **Repository configured** as `mekasoft1/toluai`
4. ⚠️ **Rotate your token** every 90 days
5. ⚠️ **Never share** your token in issues, commits, or logs

## Troubleshooting

### If push fails with "unauthorized"
- Verify token is correctly added to GitHub Secrets
- Check token hasn't expired
- Ensure you have push permissions to `mekasoft1/toluai`

### If "repository does not exist"
- The repository will be created automatically on first push
- Ensure the name is exactly `mekasoft1/toluai`

### To revoke/regenerate token
1. Go to https://hub.docker.com/settings/security
2. Delete the compromised token
3. Create a new token
4. Update GitHub Secret with new token

## Next Steps

1. ✅ Add `DOCKER_USERNAME` and `DOCKER_PASSWORD` to GitHub Secrets
2. ✅ Push a commit to `main` branch
3. ✅ Watch the GitHub Actions run
4. ✅ Check Docker Hub for your new image
5. ✅ Test pulling and running the image locally

## Need Help?

- **Docker Hub Status:** https://status.docker.com/
- **Docker Hub Support:** https://hub.docker.com/support/contact/
- **GitHub Actions Logs:** Check the Actions tab in your repository