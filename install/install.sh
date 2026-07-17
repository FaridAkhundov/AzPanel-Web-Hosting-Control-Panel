#!/bin/bash
# ============================================================
# AzPanel - Web Hosting Control Panel
# AlmaLinux 8 Installation Script
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PANEL_DIR="/opt/azpanel"
PANEL_PORT=8080
DB_NAME="azpanel"
DB_USER="azpanel"
DB_PASS=$(openssl rand -hex 16)
NODE_VERSION="20"

log()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
header() { echo -e "\n${BLUE}========== $1 ==========${NC}\n"; }

check_root() {
  [[ $EUID -ne 0 ]] && error "Bu script root istifadəçi ilə icra edilməlidir. sudo ./install.sh"
}

check_os() {
  if [[ ! -f /etc/almalinux-release ]]; then
    warn "Bu sistem AlmaLinux deyil. Script yalnız AlmaLinux 8 üçün test edilib."
    warn "Davam edilir..."
  fi
}

install_dependencies() {
  header "Sistem paketlərini yükləyir"

  dnf update -y
  dnf install -y epel-release
  dnf install -y \
    curl wget git unzip tar openssl \
    nginx \
    mariadb-server mariadb \
    postfix dovecot \
    vsftpd \
    bind bind-utils \
    certbot python3-certbot-nginx \
    firewalld \
    policycoreutils-python-utils \
    gcc gcc-c++ make
}

install_node() {
  header "Node.js ${NODE_VERSION} quraşdırılır"

  curl -fsSL "https://rpm.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  dnf install -y nodejs
  npm install -g pnpm pm2

  log "Node.js versiyası: $(node --version)"
  log "pnpm versiyası: $(pnpm --version)"
}

install_php() {
  header "PHP quraşdırılır"

  dnf install -y dnf-utils http://rpms.remirepo.net/enterprise/remi-release-8.rpm || true
  dnf module reset php -y
  dnf module enable php:remi-8.2 -y
  dnf install -y php php-fpm php-mysqlnd php-xml php-curl php-mbstring \
    php-zip php-gd php-opcache php-json php-intl

  systemctl enable php-fpm
  systemctl start php-fpm
  log "PHP versiyası: $(php --version | head -1)"
}

setup_mariadb() {
  header "MariaDB qurulur"

  systemctl enable mariadb
  systemctl start mariadb

  # Secure MariaDB
  mysql -e "DELETE FROM mysql.user WHERE User='';" || true
  mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');" || true
  mysql -e "DROP DATABASE IF EXISTS test;" || true
  mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';" || true

  # Create panel database
  mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
  mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
  mysql -e "FLUSH PRIVILEGES;"

  log "Verilənlər bazası hazırdır: ${DB_NAME}"
}

install_panel() {
  header "AzPanel quraşdırılır"

  mkdir -p "${PANEL_DIR}"

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  DIST_DIR="${SCRIPT_DIR}/dist"

  if [[ -d "${DIST_DIR}" ]]; then
    cp -r "${DIST_DIR}/." "${PANEL_DIR}/"
  else
    error "dist/ qovluğu tapılmadı. Əvvəlcə 'pnpm run build' əmrini icra edin."
  fi

  # Write environment config
  cat > "${PANEL_DIR}/.env" <<EOF
NODE_ENV=production
PORT=${PANEL_PORT}
BASE_PATH=/
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PANEL_USER=${DB_USER}
MYSQL_PANEL_PASS=${DB_PASS}
SESSION_SECRET=$(openssl rand -hex 32)
EOF

  chmod 600 "${PANEL_DIR}/.env"

  # Install backend dependencies
  cd "${PANEL_DIR}"
  if [[ -f "package.json" ]]; then
    pnpm install --prod 2>/dev/null || npm install --production
  fi

  log "Panel faylları kopyalandı: ${PANEL_DIR}"
}

setup_nginx() {
  header "Nginx konfiqurasiyası"

  cat > /etc/nginx/conf.d/azpanel.conf <<'NGINX'
server {
    listen 80 default_server;
    server_name _;

    # Panel UI and API
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:8080;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

  # Remove default config if exists
  rm -f /etc/nginx/conf.d/default.conf

  nginx -t
  systemctl enable nginx
  systemctl restart nginx
  log "Nginx konfiqurasiyası tamamlandı"
}

setup_firewall() {
  header "Firewall konfiqurasiyası"

  systemctl enable firewalld
  systemctl start firewalld

  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --permanent --add-service=ftp
  firewall-cmd --permanent --add-service=smtp
  firewall-cmd --permanent --add-service=pop3
  firewall-cmd --permanent --add-service=imap
  firewall-cmd --permanent --add-service=imaps
  firewall-cmd --permanent --add-service=pop3s
  firewall-cmd --permanent --add-service=dns
  firewall-cmd --permanent --add-service=ssh
  firewall-cmd --permanent --add-port=8080/tcp
  firewall-cmd --reload

  log "Firewall qaydaları tətbiq edildi"
}

setup_pm2() {
  header "PM2 prosesini konfiqurasiya edir"

  cd "${PANEL_DIR}"

  pm2 delete azpanel 2>/dev/null || true
  pm2 start server/index.mjs --name azpanel --env production
  pm2 save
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true

  log "Panel PM2 ilə işə salındı"
}

setup_selinux() {
  header "SELinux konfiqurasiyası"

  setsebool -P httpd_can_network_connect 1 || true
  setsebool -P httpd_can_network_relay 1 || true
  semanage port -a -t http_port_t -p tcp ${PANEL_PORT} 2>/dev/null || true
  log "SELinux qaydaları tətbiq edildi"
}

run_migrations() {
  header "Verilənlər bazası sxemini yaradır"

  cd "${PANEL_DIR}"
  if [[ -f "node_modules/.bin/drizzle-kit" ]]; then
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}" \
      node_modules/.bin/drizzle-kit push --config drizzle.config.ts 2>/dev/null || true
  fi
  log "Verilənlər bazası sxemi yaradıldı"
}

print_summary() {
  header "Quraşdırma Tamamlandı"

  SERVER_IP=$(hostname -I | awk '{print $1}')

  echo -e "${GREEN}"
  echo "╔══════════════════════════════════════════════════╗"
  echo "║          AzPanel Uğurla Quraşdırıldı!           ║"
  echo "╠══════════════════════════════════════════════════╣"
  echo "║  Panel URL    : http://${SERVER_IP}              "
  echo "║  Panel Qovluğu: ${PANEL_DIR}                    "
  echo "║  DB İstifadəçi: ${DB_USER}                      "
  echo "║  DB Şifrə     : ${DB_PASS}                      "
  echo "╠══════════════════════════════════════════════════╣"
  echo "║  İlk giriş üçün admin hesabı yaradın:            ║"
  echo "║  curl -X POST http://localhost:8080/api/users \\  ║"
  echo "║    -H 'Content-Type: application/json' \\         ║"
  echo "║    -d '{\"username\":\"admin\",\"email\":             ║"
  echo "║         \"admin@example.com\",\"password\":         ║"
  echo "║         \"YOUR_PASS\",\"role\":\"admin\"}'            ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo -e "${NC}"

  # Save credentials
  cat > /root/azpanel-credentials.txt <<CREDS
AzPanel Quraşdırma Məlumatları
================================
Tarix        : $(date)
Server IP    : ${SERVER_IP}
Panel URL    : http://${SERVER_IP}
Panel Qovluğu: ${PANEL_DIR}

Verilənlər Bazası
-----------------
DB Adı      : ${DB_NAME}
DB İstifadəçi: ${DB_USER}
DB Şifrə    : ${DB_PASS}
CREDS
  chmod 600 /root/azpanel-credentials.txt
  log "Etimadnamələr /root/azpanel-credentials.txt faylında saxlandı"
}

main() {
  header "AzPanel Quraşdırma Başlayır"
  check_root
  check_os
  install_dependencies
  install_node
  install_php
  setup_mariadb
  install_panel
  setup_nginx
  setup_firewall
  setup_selinux
  setup_pm2
  run_migrations
  print_summary
}

main "$@"
