#!/usr/bin/env bash
# Deploys the current checkout without OCIR or CI: builds the x86 image here, streams it to the VM over SSH,
# and restarts app + Caddy. Run scripts/provision-vm.sh once first. Needs VM_PUBLIC_IP and VM_SSH_KEY_PATH in .env.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

IMAGE=tolk-app:direct
SSH=(ssh -i "$VM_SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new "opc@$VM_PUBLIC_IP")

echo "→ Building $IMAGE for linux/amd64"
docker buildx build --platform linux/amd64 -t "$IMAGE" --load .

echo "→ Shipping image to $VM_PUBLIC_IP"
docker save "$IMAGE" | gzip | "${SSH[@]}" 'gunzip | sudo docker load'

echo "→ Restarting"
"${SSH[@]}" "cd /opt/hacktn26 && sed -i 's#^APP_IMAGE=.*#APP_IMAGE=$IMAGE#' .env && sudo docker compose up -d"

echo "✓ Deployed: https://${APP_DOMAIN}"
