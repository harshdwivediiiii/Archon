# Archon Kubernetes Deployment

## Prerequisites

- Kubernetes cluster (local: Docker Desktop, Minikube, or kind; cloud: EKS, GKE, AKS)
- `kubectl` configured with cluster access
- Container image built and pushed to a registry (see Build & Push below)

## Build & Push Docker Image

```bash
# Build the image
docker build -t archon:latest .

# Tag and push to your registry (replace with your registry URL)
docker tag archon:latest your-registry/archon:latest
docker push your-registry/archon:latest
```

## Create Kubernetes Secret

All environment variables are loaded from a Kubernetes Secret named `archon-secrets`. Create it from your `.env` file:

```bash
# Generate from .env file (one-line; excludes comments and blanks)
kubectl create secret generic archon-secrets \
  --namespace archon \
  --from-env-file=.env
```

Or create it manually with individual values:

```bash
kubectl create secret generic archon-secrets \
  --namespace archon \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=DATABASE_DIRECT_URL="postgresql://..." \
  --from-literal=AUTH_SECRET="..." \
  --from-literal=AUTH_GITHUB_ID="..." \
  --from-literal=AUTH_GITHUB_SECRET="..." \
  --from-literal=AUTH_GOOGLE_ID="..." \
  --from-literal=AUTH_GOOGLE_SECRET="..." \
  --from-literal=AUTH_URL="https://archon.example.com" \
  --from-literal=OPENAI_API_KEY="sk-..." \
  --from-literal=OPENAI_MODEL="gpt-4o" \
  --from-literal=STRIPE_SECRET_KEY="sk_test_..." \
  --from-literal=STRIPE_WEBHOOK_SECRET="whsec_..." \
  --from-literal=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." \
  --from-literal=RESEND_API_KEY="re_..." \
  --from-literal=NEXT_PUBLIC_POSTHOG_KEY="phc_..." \
  --from-literal=NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com" \
  --from-literal=SENTRY_DSN="https://..." \
  --from-literal=NEXT_PUBLIC_APP_URL="https://archon.example.com"
```

**Important:** For production, use a secrets manager (e.g., AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault) and sync to the Kubernetes Secret via an external-secrets operator.

## Deploy

Apply the manifests in order:

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secret (see section above)
kubectl create secret generic archon-secrets --namespace archon --from-env-file=.env

# 3. Deploy the application
kubectl apply -f k8s/archon-deployment.yaml

# 4. Expose the service
kubectl apply -f k8s/archon-service.yaml
```

Single-command rollout:

```bash
kubectl apply -f k8s/namespace.yaml && \
kubectl create secret generic archon-secrets --namespace archon --from-env-file=.env && \
kubectl apply -f k8s/archon-deployment.yaml -f k8s/archon-service.yaml
```

## Verification

```bash
# Check pods
kubectl get pods -n archon

# Watch pod status
kubectl get pods -n archon -w

# Check deployment rollout status
kubectl rollout status deployment/archon -n archon

# Check service and endpoints
kubectl get svc -n archon
kubectl get endpoints -n archon archon

# View logs
kubectl logs -n archon deployment/archon

# Stream logs
kubectl logs -n archon deployment/archon -f

# Access the application (LoadBalancer)
kubectl get svc -n archon archon -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Health check through the service
kubectl run test-pod --image=curlimages/curl -it --rm --restart=Never \
  -- curl -s http://archon.archon.svc.cluster.local:80/api/health
```

## Troubleshooting

```bash
# Describe pod for events and status
kubectl describe pod -n archon -l app=archon

# Check pod logs with previous instance (if restarting)
kubectl logs -n archon deployment/archon --previous

# Debug with an interactive shell
kubectl run debug-pod -n archon --image=nicolaka/netshoot -it --rm -- /bin/bash

# Port-forward to test locally
kubectl port-forward -n archon deployment/archon 3000:3000

# Check events in namespace
kubectl get events -n archon --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n archon

# Validate manifests locally
kubectl apply --dry-run=client -f k8s/
```

## Rollback

```bash
# Rollback to previous revision
kubectl rollout undo deployment/archon -n archon

# Rollback to a specific revision
kubectl rollout undo deployment/archon -n archon --to-revision=2

# Check rollout history
kubectl rollout history deployment/archon -n archon

# View details of a specific revision
kubectl rollout history deployment/archon -n archon --revision=2

# Pause/resume rollout
kubectl rollout pause deployment/archon -n archon
kubectl rollout resume deployment/archon -n archon

# Scale the deployment
kubectl scale deployment/archon -n archon --replicas=0  # scale down
kubectl scale deployment/archon -n archon --replicas=3  # scale up
```

## Environment Variables

The following environment variables are required. All are loaded from the `archon-secrets` Secret.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (with pgBouncer, port 6543) |
| `DATABASE_DIRECT_URL` | Yes | Direct PostgreSQL connection string (port 5432) |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | No | Set "true" to enforce SSL cert validation |
| `AUTH_SECRET` | Yes | NextAuth.js secret (min 32 chars) |
| `AUTH_URL` | Yes | Public URL of the application |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth App client secret |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_MODEL` | No | OpenAI model name (default: gpt-4o) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (client-side) |
| `RESEND_API_KEY` | Yes | Resend email API key |
| `NEXT_PUBLIC_POSTHOG_KEY` | Yes | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Yes | PostHog ingestion host |
| `SENTRY_DSN` | Yes | Sentry error tracking DSN |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the application |
| `STORAGE_PATH` | No | Local file upload path (default: ./storage/uploads) |
| `R2_ACCOUNT_ID` | No | Cloudflare R2 account ID (optional, not yet used in code) |
| `R2_ACCESS_KEY_ID` | No | Cloudflare R2 access key (optional) |
| `R2_SECRET_ACCESS_KEY` | No | Cloudflare R2 secret key (optional) |
| `R2_BUCKET` | No | Cloudflare R2 bucket name (optional) |
