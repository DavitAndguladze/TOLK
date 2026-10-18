#!/usr/bin/env bash
# Prepares the app VM (Starter Kit Oracle Linux 9 box, ADR-0010): Docker, frees 80/443 from the kit's httpd,
# app dir, env + OCI key. Reads values from .env (written by scripts/setup-oci.sh). Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

SSH=(ssh -i "$VM_SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new "opc@$VM_PUBLIC_IP")
SCP=(scp -i "$VM_SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new)

echo "→ Installing Docker and freeing ports 80/443 on $VM_PUBLIC_IP"
"${SSH[@]}" 'bash -s' <<'REMOTE'
set -euo pipefail
sudo systemctl disable --now httpd 2>/dev/null || true
if ! command -v docker >/dev/null; then
  sudo dnf -y -q install dnf-plugins-core
  sudo dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
  sudo dnf -y -q install docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
sudo systemctl enable --now docker
sudo usermod -aG docker opc
sudo firewall-cmd --permanent --add-port=80/tcp --add-port=443/tcp >/dev/null 2>&1 && sudo firewall-cmd --reload >/dev/null
sudo mkdir -p /opt/hacktn26 && sudo chown opc:opc /opt/hacktn26
REMOTE

echo "→ Copying compose files, env, and OCI key"
grep -vE '^(LOCAL_DATABASE_URL|OCI_PRIVATE_KEY_PATH|VM_SSH_KEY_PATH|OCIR_AUTH_TOKEN)=' .env > /tmp/hacktn26.server.env
echo "OCI_PRIVATE_KEY_PATH=/app/oci_api_key.pem" >> /tmp/hacktn26.server.env
"${SCP[@]}" docker-compose.yml Caddyfile "opc@$VM_PUBLIC_IP:/opt/hacktn26/"
"${SCP[@]}" /tmp/hacktn26.server.env "opc@$VM_PUBLIC_IP:/opt/hacktn26/.env"
"${SCP[@]}" "$OCI_PRIVATE_KEY_PATH" "opc@$VM_PUBLIC_IP:/opt/hacktn26/oci_api_key.pem"
"${SSH[@]}" 'chmod 600 /opt/hacktn26/.env; chmod 644 /opt/hacktn26/oci_api_key.pem'
rm -f /tmp/hacktn26.server.env

if [ -n "${OCIR_AUTH_TOKEN:-}" ]; then
  echo "→ Logging the VM into OCIR"
  printf '%s' "$OCIR_AUTH_TOKEN" | "${SSH[@]}" "sudo docker login '$OCIR_HOST' -u '$OCIR_USERNAME' --password-stdin"
fi

echo "✓ VM ready. Deploy: push to main (CI, needs OCIR), or ./scripts/deploy-direct.sh from your machine."
