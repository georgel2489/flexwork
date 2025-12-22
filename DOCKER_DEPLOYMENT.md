# Docker Deployment Guide

Acest ghid descrie cum să deployezi aplicația pe server folosind imagini Docker pre-construite.

## Prerequisite

1. Docker și Docker Compose instalate pe server
2. Imagini Docker construite și push-uite într-un registry (Docker Hub, GitHub Container Registry, etc.)
3. Acces la registry-ul Docker

## Pași pentru Deployment

### 1. Construirea și Push-uirea Imaginilor

Pe mașina de development sau în CI/CD pipeline:

```bash
# Login la Docker registry
docker login

# Construiește imaginile
docker build -t your_registry/spm-backend:latest ./backend
docker build -t your_registry/spm-frontend:latest ./frontend

# Push imaginile la registry
docker push your_registry/spm-backend:latest
docker push your_registry/spm-frontend:latest
```

### 2. Configurare Server

Pe server, creează directorul pentru aplicație:

```bash
mkdir -p /opt/spm-app
cd /opt/spm-app
```

Copiază fișierele necesare pe server:
- `docker-compose.yml`
- `.env` (bazat pe `.env.example`)

### 3. Configurare Variabile de Mediu

Creează fișierul `.env` pe server:

```bash
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=spm_database
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this

# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://your-server-ip:3001

# Docker Registry Configuration
DOCKER_REGISTRY=your_docker_registry_url
IMAGE_TAG=latest
```

### 4. Pull și Start Containers

```bash
# Login la Docker registry (dacă e privat)
docker login

# Pull imaginile
docker compose pull

# Start serviciile
docker compose up -d

# Verifică status
docker compose ps
docker compose logs -f
```

### 5. Verificare Deployment

```bash
# Verifică că toate containerele rulează
docker compose ps

# Verifică logs
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Test endpoint-uri
curl http://localhost:3001/health
curl http://localhost:80
```

## Comenzi Utile

### Update la o nouă versiune

```bash
# Pull noile imagini
docker compose pull

# Restart serviciile
docker compose up -d

# Verifică logs
docker compose logs -f
```

### Stop servicii

```bash
docker compose down
```

### Stop și șterge volume-uri (ATENȚIE: șterge datele din DB)

```bash
docker compose down -v
```

### Backup Database

```bash
docker compose exec db pg_dump -U postgres spm_database > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker compose exec -T db psql -U postgres spm_database
```

## Configurare CI/CD

### GitHub Actions Example

Creează `.github/workflows/deploy.yml`:

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_REGISTRY }}/spm-backend:latest
      
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ secrets.DOCKER_REGISTRY }}/spm-frontend:latest
```

## Troubleshooting

### Container nu pornește

```bash
docker compose logs [service_name]
docker compose ps
```

### Probleme de conectare la DB

Verifică că serviciul `db` rulează și că variabilele de mediu sunt corecte.

### Probleme cu imaginile

```bash
# Forțează re-pull
docker compose pull --ignore-pull-failures

# Rebuild fără cache (dacă folosești build local)
docker compose build --no-cache
```

## Securitate

1. **Nu commita fișierul `.env`** în Git
2. Folosește parole puternice pentru DB
3. Schimbă `JWT_SECRET` cu o valoare sigură
4. Configurează firewall pentru a expune doar porturile necesare
5. Folosește HTTPS în producție (adaugă Nginx reverse proxy cu SSL)
