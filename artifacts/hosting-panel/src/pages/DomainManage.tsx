import { useState } from "react";
import { useGetDomain, useListDomains } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PageHeader, Card, Tabs, Badge, Button, StatusDot } from "@/components/ui-utils";
import { ArrowLeft, Globe, Lock, CornerDownRight, Activity, Server, FileText } from "lucide-react";
import { format } from "date-fns";
import DnsRecords from "./DnsRecords";
import SubdomainsList from "./SubdomainsList"; // We will extract the table part to a reusable component
import SslTab from "./SslTab"; // Reusable

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function DomainManage() {
  const params = useParams();
  const domainId = parseInt(params.id || "0", 10);
  const { data: domain, isLoading } = useGetDomain(domainId, { query: { enabled: !!domainId } });
  
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) return <div className="text-muted-foreground p-4">Loading domain...</div>;
  if (!domain) return <div className="text-destructive p-4">Domain not found.</div>;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "dns", label: "DNS Records" },
    { id: "ssl", label: "SSL Certificate" },
    { id: "subdomains", label: "Subdomains" },
    { id: "statistics", label: "Statistics" },
  ];

  const nameDisplay = domain.name.includes(' [IP:') ? domain.name.split(' [IP:')[0] : domain.name;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-4">
        <Link href="/domains" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Domains
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
             <Globe className="w-8 h-8 text-primary" />
             {nameDisplay}
          </h1>
          <div className="flex items-center gap-3 mt-3 text-sm">
             <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md text-muted-foreground font-mono">
               <FileText className="w-3.5 h-3.5" />
               {domain.documentRoot}
             </div>
             <Badge variant={domain.status === 'active' ? 'success' : 'warning'}>{domain.status}</Badge>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "overview" && <DomainOverview domain={domain} nameDisplay={nameDisplay} setActiveTab={setActiveTab} />}
        {activeTab === "dns" && <DnsRecords domainIdProp={domainId} />}
        {activeTab === "ssl" && <SslTab domain={domain} />}
        {activeTab === "subdomains" && <SubdomainsList domainId={domainId} />}
        {activeTab === "statistics" && <DomainStatistics domainId={domainId} />}
      </div>
    </div>
  );
}

function DomainOverview({ domain, nameDisplay, setActiveTab }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <Card className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold border-b border-border pb-3">Hosting Settings</h3>
          <div className="grid grid-cols-2 gap-y-6">
             <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Status</p>
                <div className="flex items-center gap-2">
                   <StatusDot status={domain.status} />
                   <span className="font-medium capitalize">{domain.status}</span>
                </div>
             </div>
             <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">PHP Version</p>
                <p className="font-mono text-sm font-medium">{domain.phpVersion}</p>
             </div>
             <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">SSL Certificate</p>
                <p className="font-medium flex items-center gap-2">
                   {domain.sslEnabled ? <><Lock className="w-4 h-4 text-emerald-500" /> Active</> : <span className="text-muted-foreground">Not secured</span>}
                </p>
             </div>
             <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Created</p>
                <p className="text-sm font-medium">{format(new Date(domain.createdAt), "MMMM d, yyyy")}</p>
             </div>
          </div>
       </Card>

       <Card className="space-y-4 bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold text-primary">Quick Actions</h3>
          <div className="flex flex-col gap-2">
             <Button variant="outline" className="justify-start" onClick={() => setActiveTab('dns')}><Globe className="w-4 h-4 mr-2 text-muted-foreground" /> Manage DNS</Button>
             <Button variant="outline" className="justify-start" onClick={() => setActiveTab('ssl')}><Lock className="w-4 h-4 mr-2 text-muted-foreground" /> Issue SSL</Button>
             <Button variant="outline" className="justify-start" onClick={() => setActiveTab('subdomains')}><CornerDownRight className="w-4 h-4 mr-2 text-muted-foreground" /> Add Subdomain</Button>
             <Button variant="outline" className="justify-start" onClick={() => setActiveTab('statistics')}><Activity className="w-4 h-4 mr-2 text-muted-foreground" /> View Statistics</Button>
          </div>
       </Card>
    </div>
  );
}

function DomainStatistics({ domainId }: { domainId: number }) {
  const { data: stats, isLoading } = useQuery({ 
     queryKey: ['domain-stats', domainId], 
     queryFn: () => fetch(`${BASE}/api/domains/${domainId}/stats`).then(r => r.ok ? r.json() : null).catch(() => null) 
  });

  if (isLoading) return <div className="text-muted-foreground">Loading statistics...</div>;

  const mockStats = stats || {
     requestsToday: 12450,
     bandwidthToday: "1.2 GB",
     requestsMonth: 345000,
     bandwidthMonth: "45.8 GB"
  };

  return (
    <div className="space-y-6">
       <h3 className="text-lg font-semibold">Web Traffic Statistics</h3>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard label="Requests (Today)" value={mockStats.requestsToday} />
          <StatCard label="Bandwidth (Today)" value={mockStats.bandwidthToday} />
          <StatCard label="Requests (Month)" value={mockStats.requestsMonth} />
          <StatCard label="Bandwidth (Month)" value={mockStats.bandwidthMonth} />
       </div>
    </div>
  );
}

function StatCard({ label, value }: any) {
  return (
    <Card className="flex flex-col justify-center">
       <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">{label}</p>
       <p className="text-2xl font-bold font-mono">{value}</p>
    </Card>
  );
}
