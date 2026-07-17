# AzPanel - Web Hosting İdarəetmə Paneli

Plesk-ə bənzər, AlmaLinux 8 üçün hazırlanmış açıq mənbəli web hosting idarəetmə paneli.

## Xüsusiyyətlər

- **Domenlərin İdarəetməsi** — Virtual host əlavə et, sil, PHP versiyasını seç
- **MySQL Verilənlər Bazaları** — Yeni DB yarad, istifadəçi təyin et, sil
- **E-mail Hesabları** — Domen üçün e-mail əlavə et, kvota idar et
- **FTP Hesabları** — FTP istifadəçiləri yarat, kataloq təyin et
- **SSL Sertifikatları** — Let's Encrypt və ya özimzalı sertifikat qur
- **DNS İdarəetməsi** — A, AAAA, CNAME, MX, TXT yazıları əlavə et
- **Panel İstifadəçiləri** — Admin, reseller, user rolları
- **Yedəkləmə** — Tam, domen, verilənlər bazası yedəkləri
- **Dashboard** — CPU, RAM, disk, servis statistikaları

## Sistem Tələbləri

| Komponent | Minimum | Tövsiyə olunan |
|-----------|---------|-----------------|
| OS        | AlmaLinux 8.x | AlmaLinux 8.9+ |
| CPU       | 1 nüvə  | 2+ nüvə         |
| RAM       | 1 GB    | 2+ GB           |
| Disk      | 10 GB   | 20+ GB          |

## Quraşdırma

### 1. ZIP faylını serverə yükləyin

```bash
scp azpanel.zip root@YOUR_SERVER_IP:/tmp/
```

### 2. SSH ilə serverə qoşulun

```bash
ssh root@YOUR_SERVER_IP
```

### 3. Arxivi açın

```bash
cd /tmp
unzip azpanel.zip
cd azpanel
```

### 4. Əvvəlcə paneli build edin (development mühitindən)

```bash
# Node.js v20 lazımdır
node --version  # v20.x olmalıdır

# pnpm quraşdırın (əgər yoxdursa)
npm install -g pnpm

# Asılılıqları quraşdırın
pnpm install

# Paneli build edin
pnpm run build
```

### 5. Quraşdırma skriptini işə salın

```bash
chmod +x install/install.sh
sudo bash install/install.sh
```

Quraşdırma avtomatik olaraq bunları edəcək:
- Nginx, MariaDB, PHP, Postfix, Dovecot, VSFTPD quraşdırır
- Node.js v20 və PM2 quraşdırır
- Firewall qaydalarını tənzimləyir (HTTP, HTTPS, FTP, SMTP, IMAP, DNS)
- SELinux siyasətlərini konfiqurasiya edir
- Paneli PM2 ilə işə salır (server yenidən başladıqda avtomatik işə salınır)

### 6. Panelə daxil olun

```
http://YOUR_SERVER_IP
```

İlk admin istifadəçisini yaradın:

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@yourdomain.com","password":"StrongPass123!","role":"admin"}'
```

## Struktur

```
azpanel/
├── artifacts/
│   ├── hosting-panel/     # React frontend (UI)
│   └── api-server/        # Express backend (API)
├── lib/
│   ├── db/                # Drizzle ORM + verilənlər bazası sxemi
│   ├── api-spec/          # OpenAPI spesifikasiyası
│   └── api-client-react/  # Generasiya olunmuş React hooks
├── install/
│   ├── install.sh         # AlmaLinux 8 quraşdırma skripti
│   └── README.md          # Bu fayl
└── package.json
```

## Xidmətlər

| Xidmət    | Port | Məqsəd                      |
|-----------|------|-----------------------------|
| Nginx     | 80   | Reverse proxy (panel + vhosts) |
| Panel API | 8080 | Node.js Express backend     |
| MariaDB   | 3306 | Verilənlər bazası           |
| SMTP      | 25   | E-mail göndərmə             |
| IMAP      | 143  | E-mail qəbul                |
| IMAPS     | 993  | Şifrəli e-mail qəbul        |
| FTP       | 21   | Fayl transferi              |
| DNS       | 53   | Ad serveri                  |

## PM2 əmrləri

```bash
pm2 status            # Panel statusunu yoxla
pm2 logs azpanel      # Log fayllarını izlə
pm2 restart azpanel   # Paneli yenidən başlat
pm2 stop azpanel      # Paneli dayandır
```

## Nginx vhostları üçün konfiqurasiya nümunəsi

Panel hər domen əlavə edildikdə `/etc/nginx/conf.d/` qovluğunda konfiqurasiya faylı yaradır.
Manual əlavə etmək üçün:

```nginx
# /etc/nginx/conf.d/example.com.conf
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com;
    index index.php index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php-fpm/www.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## Problemlər

**Panel açılmır:**
```bash
pm2 status
pm2 logs azpanel --lines 50
systemctl status nginx
```

**Verilənlər bazasına qoşula bilmir:**
```bash
systemctl status mariadb
mysql -u azpanel -p  # şifrəni /root/azpanel-credentials.txt faylından tapın
```

**Firewall problemi:**
```bash
firewall-cmd --list-all
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload
```

## Lisenziya

MIT License — Azad istifadə, dəyişdirmə və paylaşmaq üçün açıqdır.
