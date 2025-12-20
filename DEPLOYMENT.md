# Deployment Guide

## GitHub Actions CI/CD Setup

This project uses GitHub Actions for continuous integration and deployment.

### Prerequisites

1. **GitHub Repository Secrets**
   
   Navigate to your repository settings → Secrets and variables → Actions, and add:
   
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token
   - Add any other environment-specific secrets needed for deployment

2. **Docker Hub Account**
   
   Create an account at https://hub.docker.com if you don't have one.

### Workflows

#### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

Triggers on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **backend-test**: Runs backend tests and generates coverage
- **backend-build**: Builds and pushes Docker image to Docker Hub (on push to main)
- **frontend-build**: Builds frontend and uploads artifacts
- **deploy-staging**: Deploys to staging environment (on push to develop)
- **deploy-production**: Deploys to production (on push to main)

#### 2. Docker Build Pipeline (`.github/workflows/docker-build.yml`)

Triggers on:
- Push to `main` branch
- Version tags (e.g., `v1.0.0`)

Builds and pushes multi-platform Docker images for both backend and frontend.

### Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` with your actual configuration.

### Local Development with Docker

Build and run all services:
```bash
docker-compose up --build
```

Run in detached mode:
```bash
docker-compose up -d
```

Stop services:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

### Production Deployment

#### Option 1: Using Docker Compose on Server

1. SSH into your server
2. Clone the repository
3. Create `.env` file with production values
4. Run:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

#### Option 2: Using Pre-built Images

1. Pull images from Docker Hub:
   ```bash
   docker pull yourusername/spm-backend:latest
   docker pull yourusername/spm-frontend:latest
   ```

2. Run containers:
   ```bash
   docker run -d -p 3001:3001 --env-file .env yourusername/spm-backend:latest
   docker run -d -p 80:80 --env-file .env yourusername/spm-frontend:latest
   ```

### Deployment Customization

To customize deployment steps:

1. Edit the `deploy-staging` or `deploy-production` jobs in `.github/workflows/ci-cd.yml`
2. Add your deployment commands (e.g., SSH, kubectl, AWS CLI, etc.)

Example SSH deployment:
```yaml
- name: Deploy to production
  run: |
    echo "${{ secrets.SSH_PRIVATE_KEY }}" > deploy_key
    chmod 600 deploy_key
    ssh -i deploy_key user@your-server.com "cd /app && docker-compose pull && docker-compose up -d"
    rm deploy_key
```

### Monitoring

After deployment, monitor your application:
- Check container logs: `docker-compose logs -f`
- Check container status: `docker-compose ps`
- Access backend API: `http://your-domain:3001`
- Access frontend: `http://your-domain`

### Rollback

To rollback to a previous version:
```bash
docker-compose down
docker pull yourusername/spm-backend:previous-tag
docker pull yourusername/spm-frontend:previous-tag
docker-compose up -d
```

### Troubleshooting

**Build fails:**
- Check GitHub Actions logs
- Verify all secrets are set correctly
- Ensure Docker Hub credentials are valid

**Deployment fails:**
- Check server connectivity
- Verify environment variables
- Check disk space and resources

**Container crashes:**
- Check logs: `docker logs container-name`
- Verify database connection
- Check environment variables
