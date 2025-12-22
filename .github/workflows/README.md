# GitHub Actions Workflows

## docker-build-push.yml

Acest workflow construiește și push-uiește automat imaginile Docker pentru backend și frontend în GitHub Container Registry (GHCR).

### Când rulează

- **Push pe branch-ul main/master**: Construiește și push-uiește imagini cu tag `latest`
- **Pull Request**: Construiește imaginile pentru testare (fără push)
- **Manual**: Poate fi rulat manual din tab-ul Actions

### Configurare

#### 1. Activează GitHub Container Registry

Workflow-ul folosește `GITHUB_TOKEN` automat - nu trebuie să configurezi nimic manual!

#### 2. Verifică permisiunile

Asigură-te că repository-ul are permisiuni pentru packages:
- Settings → Actions → General → Workflow permissions
- Selectează "Read and write permissions"

#### 3. Imaginile create

Workflow-ul creează două imagini:
- `ghcr.io/[username]/[repo]-backend:latest`
- `ghcr.io/[username]/[repo]-frontend:latest`

### Tag-uri generate

Workflow-ul creează automat mai multe tag-uri:
- `latest` - pentru branch-ul default (main/master)
- `main-abc1234` - SHA-ul commit-ului
- `pr-123` - pentru pull requests
- `v1.2.3` - pentru release-uri semantice

### Folosire pe server

După ce workflow-ul rulează, pe server:

```bash
# Login la GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Sau folosește Personal Access Token
echo $PAT | docker login ghcr.io -u USERNAME --password-stdin

# Pull și start
docker compose pull
docker compose up -d
```

### Configurare .env pe server

```bash
DOCKER_REGISTRY=ghcr.io/username/repo
IMAGE_TAG=latest
```

### Vizibilitate imagini

Imaginile sunt private by default. Pentru a le face publice:
1. Mergi la Packages în profilul GitHub
2. Selectează package-ul
3. Package settings → Change visibility → Public

### Troubleshooting

**Eroare: "Username and password required"**
- Verifică că workflow-ul are `permissions: packages: write`
- Verifică că repository settings permite write permissions pentru Actions

**Imagini nu apar în Packages**
- Verifică că workflow-ul a rulat cu succes
- Verifică logs în tab-ul Actions
- Asigură-te că push-ul nu e pe un PR (PR-urile nu push-uiesc imagini)

**Cache issues**
- Workflow-ul folosește GitHub Actions cache pentru build-uri mai rapide
- Cache-ul se invalidează automat când se schimbă Dockerfile-urile

### Alternative: Docker Hub

Pentru a folosi Docker Hub în loc de GHCR, modifică workflow-ul:

```yaml
env:
  REGISTRY: docker.io
  IMAGE_NAME: your-dockerhub-username/spm

# În step-ul login:
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}
```

Apoi adaugă secrets în repository:
- Settings → Secrets and variables → Actions
- New repository secret: `DOCKER_USERNAME`
- New repository secret: `DOCKER_PASSWORD`
