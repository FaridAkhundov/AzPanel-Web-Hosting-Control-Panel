# AzPanel — Quraşdırma və İstifadə Təlimatı

## Tez Başlanğıc

```bash
# 1. Serverə yüklə
scp azpanel-v2.zip root@YOUR_SERVER_IP:/tmp/

# 2. SSH ilə qoşul
ssh root@YOUR_SERVER_IP

# 3. Quraşdır
cd /tmp && unzip azpanel-v2.zip -d azpanel && cd azpanel
chmod +x install/install.sh
bash install/install.sh

# 4. Paneli aç
http://YOUR_SERVER_IP
```

---

## Sistem Tələbləri

| Komponent | Versiya |
|-----------|---------|
| OS | AlmaLinux 8.x (Rocky Linux 8 də işləyir) |
| RAM | Min 1 GB (2 GB tövsiyə olunur) |
| Disk | Min 10 GB |
| Giriş | Root istifadəçi |

---

## Detallı Quraşdırma

### Addım 1 — Node.js quraşdır

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
npm install -g pnpm pm2
node --version   # v20.x olmalıdır
```

### Addım 2 — Layihəni hazırla

```bash
cd /tmp/azpanel
pnpm install
pnpm run build
```

`pnpm run build` həm React frontend-i, həm Node.js API-ni build edir.

### Addım 3 — PostgreSQL qur (Panel DB)

```bash
dnf install -y postgresql-server postgresql
postgresql-setup --initdb
systemctl enable postgresql && systemctl start postgresql

# Panel istifadəçisi yarat
sudo -u postgres psql <<SQL
CREATE USER azpanel WITH PASSWORD 'GUCHLU_SIFRE_BU_YERƏ';
CREATE DATABASE azpanel OWNER azpanel;
SQL
```

### Addım 4 — Mühit dəyişənlərini qur

```bash
mkdir -p /opt/azpanel
cp -r dist/. /opt/azpanel/

cat > /opt/azpanel/.env <<EOF
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://azpanel:GUCHLU_SIFRE_BU_YERƏ@localhost:5432/azpanel
SESSION_SECRET=$(openssl rand -hex 32)
EOF

chmod 600 /opt/azpanel/.env
```

### Addım 5 — DB sxemini yarat

```bash
cd /opt/azpanel
DATABASE_URL=postgresql://azpanel:GUCHLU_SIFRE_BU_YERƏ@localhost:5432/azpanel \
  node_modules/.bin/drizzle-kit push
```

### Addım 6 — PM2 ilə işə sal

```bash
cd /opt/azpanel
pm2 start server/index.mjs --name azpanel --env production
pm2 save
pm2 startup
# Əmr göstərəcək — onu kopyalayıb icra et (sudo env PATH=...)
```

### Addım 7 — Nginx reverse proxy

```bash
dnf install -y nginx

cat > /etc/nginx/conf.d/azpanel.conf <<'NGINX'
server {
    listen 80 default_server;
    server_name _;

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
        proxy_read_timeout 90;
    }
}
NGINX

nginx -t && systemctl enable nginx && systemctl restart nginx
```

### Addım 8 — Firewall

```bash
systemctl enable firewalld && systemctl start firewalld
firewall-cmd --permanent --add-service={http,https,ftp,smtp,pop3,imap,imaps,pop3s,dns,ssh}
firewall-cmd --reload
```

### Addım 9 — SELinux

```bash
setsebool -P httpd_can_network_connect 1
setsebool -P httpd_can_network_relay 1
semanage port -a -t http_port_t -p tcp 8080 2>/dev/null || true
```

---

## Əlavə Xidmətlər

### Postfix + Dovecot (E-mail)
```bash
dnf install -y postfix dovecot
systemctl enable postfix dovecot
systemctl start postfix dovecot
```

### vsftpd (FTP)
```bash
dnf install -y vsftpd
systemctl enable vsftpd && systemctl start vsftpd
```

### BIND DNS
```bash
dnf install -y bind bind-utils
systemctl enable named && systemctl start named
```

### PHP 8.2 + PHP-FPM
```bash
dnf install -y https://rpms.remirepo.net/enterprise/remi-release-8.rpm
dnf module reset php -y && dnf module enable php:remi-8.2 -y
dnf install -y php php-fpm php-mysqlnd php-xml php-curl php-mbstring php-zip php-gd php-opcache
systemctl enable php-fpm && systemctl start php-fpm
```

### MariaDB (Müştəri saytları üçün)
```bash
dnf install -y mariadb-server mariadb
systemctl enable mariadb && systemctl start mariadb
mysql_secure_installation
```

---

## İlk Giriş

### Admin hesabı yarat:
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "SuperGuchluSifre123!",
    "role": "admin"
  }'
```

Sonra brauzerdə: `http://YOUR_SERVER_IP`

---

## Panel İstifadəsi

### 🌐 Domen Əlavə Etmək
1. Sol menü → **Websites & Domains** → **Add Domain**
2. Domen: `example.com`
3. Document Root avtomatik: `/var/www/vhosts/example.com`
4. PHP versiyasını seçin → **Create Domain**

### 🔀 Subdomain
1. **Subdomains** → **Add Subdomain**
2. Ana domenini seçin → subdomain adı yazın (məs. `blog`)
3. Nəticə: `blog.example.com`

### 📧 Email Hesabı
1. **Email Accounts** → **Add Email**
2. Ünvan: `info` + `@example.com` → şifrə + kvota
3. Nəticə: `info@example.com`

### 🌍 DNS Qurğusu
1. Domains səhifəsi → DNS ikonu
2. Əsas yazılar:
   ```
   @     A      SERVER_IP     3600
   www   CNAME  @             3600
   mail  A      SERVER_IP     3600
   @     MX     mail.ex.com   3600   priority:10
   ```

### 🔒 SSL Sertifikatı
1. **SSL Certificates** → **Issue SSL**
2. **Let's Encrypt** — pulsuz, 90 günlük, avtomatik yenilənir
   - Şərt: domenin DNS-i serverə işarə etməlidir
3. **Self-Signed** — test üçün

### 🗄️ MySQL Verilənlər Bazası
1. **Databases** → **Add Database**
2. DB adı, istifadəçi, şifrə daxil et
3. WordPress `wp-config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'example_wp');
   define('DB_USER', 'example_user');
   define('DB_PASSWORD', 'SIFRE');
   ```

### 📁 FTP Hesabı
1. **FTP Accounts** → **Add FTP**
2. FileZilla ilə qoşun: Host=`SERVER_IP`, Port=`21`, istifadəçi+şifrə

### ⏰ Cron Jobs
1. **Cron Jobs** → **Add Cron Job**
2. Cədvəl nümunələri:
   - `@hourly` = hər saat
   - `@daily` = hər gün gecə 00:00
   - `0 */6 * * *` = hər 6 saatda
3. Komanda: `/usr/bin/php /var/www/vhosts/example.com/cron.php`

### 🖥️ Services Monitor
- Sol menü → **Services Monitor**
- Hər xidmət kartı: nginx, php-fpm, mariadb, postfix, dovecot, vsftpd, named, firewalld
- **Start / Stop / Restart** düymələri systemctl-i çalışdırır

### 💾 Yedəkləmə
1. **Backups** → **New Backup**
2. Növlər: Full Server / Domain Only / Databases Only

---

## PM2 Əmrləri

```bash
pm2 status              # Panel vəziyyəti
pm2 logs azpanel        # Canlı loglar
pm2 restart azpanel     # Yenidən başlat
pm2 stop azpanel        # Dayandır
```

---

## Problem Həlləri

| Problem | Yoxla |
|---------|-------|
| Panel açılmır | `pm2 status` + `pm2 logs azpanel` |
| DB bağlantısı yoxdur | `systemctl status postgresql` |
| Port 80 bağlı | `firewall-cmd --list-all` |
| 502 Bad Gateway | `pm2 restart azpanel` |
| SELinux bloklar | `ausearch -m avc -ts today \| audit2allow` |
| Nginx xətası | `nginx -t && journalctl -u nginx` |

---

## Arxitektura

```
İnternet
   │
   ▼
Nginx :80/443  (reverse proxy + vhostlar)
   │
   ▼
AzPanel :8080  (Node.js API + React UI)
   │
   ├── PostgreSQL :5432  (Panel datası)
   ├── MariaDB :3306     (Müştəri DB-ları)
   ├── Postfix :25       (Email göndərmə)
   ├── Dovecot :143/993  (IMAP/POP3)
   ├── vsftpd :21        (FTP)
   └── BIND :53          (DNS)
```
