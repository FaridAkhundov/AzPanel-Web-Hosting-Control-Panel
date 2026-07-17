import { useGetServerStats, useListActivity, useListDomains, useListDatabases, useListEmails, useListFtp, useListSsl } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader, Badge, StatusDot } from "@/components/ui-utils";
import { Cpu, MemoryStick, HardDrive, Clock, Activity, Globe, Database, Mail, FolderOpen, Lock, Server } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetServerStats();
  const { data: activity } = useListActivity();
  const { data: domains } = useListDomains();
  const { data: databases } = useListDatabases();
  const { data: emails } = useListEmails();
  const { data: ftp } = useListFtp();
  const { data: ssl } = useListSsl();

  const { data: subdomains } = useQuery({ queryKey: ['subdomains'], queryFn: () => fetch(`${BASE}/api/subdomains`).then(r => r.json()) });
  const { data: cronjobs } = useQuery({ queryKey: ['cronjobs'], queryFn: () => fetch(`${BASE}/api/cronjobs`).then(r => r.json()) });
  const { data: services } = useQuery({ queryKey: ['services'], queryFn: () => fetch(`${BASE}/api/services`).then(r => r.json()) });

  const activeServicesCount = services?.filter((s: any) => s.status === 'running')?.length || 0;

  if (statsLoading) return <div className="text-muted-foreground p-4">Loading dashboard metrics...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader title="Server Dashboard" description="System resource utilization and panel overview" />
      
      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResourceCard title="CPU Usage" icon={Cpu} value={`${stats?.cpuUsage || 0}%`} progress={stats?.cpuUsage || 0} />
        <ResourceCard title="Memory Usage" icon={MemoryStick} value={`${Math.round((stats?.ramUsed || 0) / 1024)}GB / ${Math.round((stats?.ramTotal || 0) / 1024)}GB`} progress={((stats?.ramUsed || 0) / (stats?.ramTotal || 1)) * 100} />
        <ResourceCard title="Disk Space" icon={HardDrive} value={`${Math.round((stats?.diskUsed || 0) / 1024)}GB / ${Math.round((stats?.diskTotal || 0) / 1024)}GB`} progress={((stats?.diskUsed || 0) / (stats?.diskTotal || 1)) * 100} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-8">
          {/* Panel Stats Grid */}
          <Card className="shadow-md border-border/60">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <StatBox label="Domains" value={domains?.length} icon={Globe} />
               <StatBox label="Subdomains" value={subdomains?.length} icon={Globe} />
               <StatBox label="Databases" value={databases?.length} icon={Database} />
               <StatBox label="Email Accounts" value={emails?.length} icon={Mail} />
               <StatBox label="FTP Accounts" value={ftp?.length} icon={FolderOpen} />
               <StatBox label="Cron Jobs" value={cronjobs?.length} icon={Clock} />
               <StatBox label="SSL Certs" value={ssl?.length} icon={Lock} />
               <StatBox label="Active Services" value={activeServicesCount} icon={Activity} />
            </div>
            
            <div className="mt-8 pt-5 border-t border-border flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground bg-secondary/40 px-3 py-1.5 rounded-md">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">System Uptime:</span>
                <span className="text-foreground font-mono">{stats?.uptime}</span>
              </div>
              <Badge variant="success">System Healthy</Badge>
            </div>
          </Card>

          {/* Service Status Strip */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold flex items-center gap-2">
               <Server className="w-5 h-5 text-primary" /> Service Status
             </h3>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {services?.slice(0, 8).map((svc: any) => (
                   <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border shadow-sm hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                         <StatusDot status={svc.status} />
                         <span className="text-sm font-medium text-foreground">{svc.displayName}</span>
                      </div>
                      <Badge variant={svc.status === 'running' ? 'success' : svc.status === 'stopped' ? 'danger' : 'outline'}>{svc.status}</Badge>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="xl:col-span-1 shadow-md border-border/60 flex flex-col">
          <h3 className="text-lg font-semibold mb-6">Activity Log</h3>
          <div className="space-y-5 flex-1">
            {!activity ? (
               <div className="text-sm text-muted-foreground">Loading activity...</div>
            ) : activity?.slice(0, 8).map((event: any) => (
               <div key={event.id} className="flex gap-3 text-sm group">
                 <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 mt-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors shrink-0" />
                    <div className="w-px h-full bg-border/50 my-1 group-last:hidden" />
                 </div>
                 <div className="pb-1">
                   <p className="font-semibold text-foreground leading-snug">{event.action}</p>
                   <p className="text-xs text-muted-foreground mt-0.5 break-all">{event.resource}</p>
                   <p className="text-[10px] font-mono text-muted-foreground/60 mt-1.5 uppercase tracking-wider">{formatDistanceToNow(new Date(event.createdAt))} ago</p>
                 </div>
               </div>
            ))}
            {activity?.length === 0 && (
               <div className="text-sm text-muted-foreground">No recent activity.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ResourceCard({ title, icon: Icon, value, progress }: any) {
  const getProgressColor = (val: number) => {
    if (val > 80) return "bg-red-500";
    if (val > 60) return "bg-amber-500";
    return "bg-emerald-500";
  };
  return (
    <Card className="shadow-md border-border/60">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </h3>
        <span className="text-2xl font-bold font-mono text-foreground">{value}</span>
      </div>
      <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
        <div className={`h-full transition-all duration-1000 ease-out ${getProgressColor(progress)}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </Card>
  );
}

function StatBox({ label, value, icon: Icon }: any) {
  return (
    <div className="p-4 rounded-lg bg-background border border-border shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
         <Icon className="w-5 h-5 text-muted-foreground" />
         <div className="text-2xl font-bold font-mono text-foreground">{value !== undefined ? value : '-'}</div>
      </div>
      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</div>
    </div>
  );
}
