#!/usr/bin/env bash
# Prepares the app VM: Docker, open ports 80/443, app dir, env + OCI key, OCIR login.
# Reads values from .env (written by scripts/setup-oci.sh). Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

SSH=(ssh -i "$VM_SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new "ubuntu@$VM_PUBLIC_IP")
SCP=(scp -i "$VM_SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new)

echo "→ Installing Docker and opening ports 80/443 on $VM_PUBLIC_IP"
"${SSH[@]}" 'bash -s' <<'REMOTE'
set -euo pipefail
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
for port in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
done
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y netfilter-persistent >/dev/null
sudo netfilter-persistent save
sudo mkdir -p /opt/hacktn26 && sudo chown ubuntu:ubuntu /opt/hacktn26
REMOTE

echo "→ Copying compose files, env, and OCI key"
grep -vE '^(LOCAL_DATABASE_URL|OCI_PRIVATE_KEY_PATH|VM_SSH_KEY_PATH|OCIR_AUTH_TOKEN)=' .env > /tmp/hacktn26.server.env
echo "OCI_PRIVATE_KEY_PATH=/app/oci_api_key.pem" >> /tmp/hacktn26.server.env
"${SCP[@]}" docker-compose.yml Caddyfile "ubuntu@$VM_PUBLIC_IP:/opt/hacktn26/"
"${SCP[@]}" /tmp/hacktn26.server.env "ubuntu@$VM_PUBLIC_IP:/opt/hacktn26/.env"
"${SCP[@]}" "$OCI_PRIVATE_KEY_PATH" "ubuntu@$VM_PUBLIC_IP:/opt/hacktn26/oci_api_key.pem"
rm -f /tmp/hacktn26.server.env

echo "→ Logging the VM into OCIR"
printf '%s' "$OCIR_AUTH_TOKEN" | "${SSH[@]}" "sudo docker login '$OCIR_HOST' -u '$OCIR_USERNAME' --password-stdin"

echo "✓ VM ready. First deploy: push to main (CI), or on the VM: cd /opt/hacktn26 && sudo docker compose up -d"
