import { Router, type IRouter } from "express";
import { execSync } from "child_process";

const router: IRouter = Router();

interface ServiceInfo {
  name: string;
  displayName: string;
  status: "running" | "stopped" | "unknown";
  pid?: number;
}

function checkService(serviceName: string): "running" | "stopped" | "unknown" {
  try {
    const output = execSync(`systemctl is-active ${serviceName} 2>/dev/null`, { timeout: 3000 }).toString().trim();
    return output === "active" ? "running" : "stopped";
  } catch {
    return "unknown";
  }
}

const SERVICES = [
  { name: "nginx", displayName: "Nginx Web Server" },
  { name: "php-fpm", displayName: "PHP-FPM" },
  { name: "mariadb", displayName: "MariaDB Database" },
  { name: "postfix", displayName: "Postfix SMTP" },
  { name: "dovecot", displayName: "Dovecot IMAP/POP3" },
  { name: "vsftpd", displayName: "vsftpd FTP Server" },
  { name: "named", displayName: "BIND DNS Server" },
  { name: "firewalld", displayName: "Firewall" },
];

router.get("/services", async (_req, res): Promise<void> => {
  const result: ServiceInfo[] = SERVICES.map(svc => ({
    name: svc.name,
    displayName: svc.displayName,
    status: checkService(svc.name),
  }));
  res.json(result);
});

router.post("/services/:name/restart", async (req, res): Promise<void> => {
  const { name } = req.params;
  const allowed = SERVICES.map(s => s.name);
  if (!allowed.includes(name)) {
    res.status(400).json({ error: "Unknown service" });
    return;
  }
  try {
    execSync(`systemctl restart ${name} 2>/dev/null`, { timeout: 15000 });
    res.json({ success: true, message: `${name} restarted` });
  } catch {
    res.status(500).json({ error: `Failed to restart ${name}. Run as root or check systemd.` });
  }
});

router.post("/services/:name/stop", async (req, res): Promise<void> => {
  const { name } = req.params;
  const allowed = SERVICES.map(s => s.name);
  if (!allowed.includes(name)) { res.status(400).json({ error: "Unknown service" }); return; }
  try {
    execSync(`systemctl stop ${name} 2>/dev/null`, { timeout: 10000 });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: `Failed to stop ${name}` });
  }
});

router.post("/services/:name/start", async (req, res): Promise<void> => {
  const { name } = req.params;
  const allowed = SERVICES.map(s => s.name);
  if (!allowed.includes(name)) { res.status(400).json({ error: "Unknown service" }); return; }
  try {
    execSync(`systemctl start ${name} 2>/dev/null`, { timeout: 10000 });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: `Failed to start ${name}` });
  }
});

export default router;
