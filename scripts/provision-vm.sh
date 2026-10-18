#!/usr/bin/env bash
# Prepares the app VM (Starter Kit, Oracle Linux 9, ADR-0010): Docker, open 80/443 in firewalld, app dir, env + OCI key, OCIR login.
# Reads values from .env (written by scripts/setup-oci.sh). Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

SSH=(ssh -i "$VM_SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new "opc@$VM_PUBLIC_IP")
SCP=(scp -i "$VM_SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new)

echo "→ Installing Docker and opening ports 80/443 (firewalld) on $VM_PUBLIC_IP"
"${SSH[@]}" 'bash -s' <<'REMOTE'
set -euo pipefail
if ! command -v docker >/dev/null; then
  # get.docker.com doesn't support Oracle Linux; use Docker's RHEL-family repo.
  sudo dnf install -y dnf-plugins-core >/dev/null
  sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  sudo dnf install -y --allowerasing docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null
fi
sudo systemctl enable --now docker
sudo usermod -aG docker opc
sudo firewall-cmd --permanent --add-service=http --add-service=https >/dev/null
sudo firewall-cmd --reload >/dev/null
sudo mkdir -p /opt/hacktn26 && sudo chown opc:opc /opt/hacktn26
REMOTE

echo "→ Copying compose files, env, and OCI key"
grep -vE '^(LOCAL_DATABASE_URL|OCI_PRIVATE_KEY_PATH|VM_SSH_KEY_PATH|OCIR_AUTH_TOKEN)=' .env > /tmp/hacktn26.server.env
echo "OCI_PRIVATE_KEY_PATH=/app/oci_api_key.pem" >> /tmp/hacktn26.server.env
"${SCP[@]}" docker-compose.yml Caddyfile "opc@$VM_PUBLIC_IP:/opt/hacktn26/"
"${SCP[@]}" /tmp/hacktn26.server.env "opc@$VM_PUBLIC_IP:/opt/hacktn26/.env"
"${SCP[@]}" "$OCI_PRIVATE_KEY_PATH" "opc@$VM_PUBLIC_IP:/opt/hacktn26/oci_api_key.pem"
rm -f /tmp/hacktn26.server.env

echo "→ Logging the VM into OCIR"
printf '%s' "$OCIR_AUTH_TOKEN" | "${SSH[@]}" "sudo docker login '$OCIR_HOST' -u '$OCIR_USERNAME' --password-stdin"

echo "✓ VM ready. First deploy: push to main (CI), or on the VM: cd /opt/hacktn26 && sudo docker compose up -d"
