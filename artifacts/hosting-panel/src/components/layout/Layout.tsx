import { Link, useLocation } from "wouter";
import { LayoutDashboard, Globe, Database, Mail, HardDrive, Lock, Users, Server, Menu, Bell, CornerDownRight, FolderOpen, Clock, Activity } from "lucide-react";
import React from "react";
import { useGetServerStats } from "@workspace/api-client-react";

export function Sidebar() {
  const [location] = useLocation();

  const sections = [
    {
       label: "HOSTING",
       items: [
         { name: "Websites & Domains", href: "/domains", icon: Globe },
         { name: "Subdomains", href: "/subdomains", icon: CornerDownRight }
       ]
    },
    {
       label: "MAIL",
       items: [
         { name: "Email Accounts", href: "/emails", icon: Mail },
       ]
    },
    {
       label: "DATA",
       items: [
         { name: "Databases", href: "/databases", icon: Database },
         { name: "FTP Accounts", href: "/ftp", icon: FolderOpen }
       ]
    },
    {
       label: "SECURITY",
       items: [
         { name: "SSL Certificates", href: "/ssl", icon: Lock },
       ]
    },
    {
       label: "SERVER",
       items: [
         { name: "Cron Jobs", href: "/cronjobs", icon: Clock },
         { name: "Services Monitor", href: "/services", icon: Activity },
         { name: "Panel Users", href: "/users", icon: Users },
         { name: "Backups", href: "/backups", icon: HardDrive },
       ]
    }
  ];

  return (
    <aside className="w-64 border-r bg-sidebar border-sidebar-border hidden md:flex flex-col h-full sticky top-0 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
        <Server className="w-6 h-6 text-primary mr-3" />
        <span className="font-bold tracking-tight text-sidebar-foreground text-xl">AzPanel</span>
      </div>
      <nav className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto px-3 custom-scrollbar">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            location === "/" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        {sections.map((section, i) => (
          <div key={i}>
             <h4 className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-2 px-3">{section.label}</h4>
             <div className="flex flex-col gap-0.5">
                {section.items.map(item => {
                   const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                   const Icon = item.icon;
                   return (
                     <Link
                       key={item.name}
                       href={item.href}
                       className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                         active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                       }`}
                     >
                       <Icon className="w-4 h-4" />
                       {item.name}
                     </Link>
                   );
                })}
             </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border shrink-0 bg-sidebar/50">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-foreground font-bold text-sm">
              root
            </div>
            <div className="flex flex-col text-sidebar-foreground">
              <span className="text-sm font-semibold">Administrator</span>
              <span className="text-xs text-muted-foreground">root user</span>
            </div>
         </div>
      </div>
    </aside>
  );
}

export function Topbar() {
  const { data: stats } = useGetServerStats();
  
  return (
    <header className="h-16 border-b bg-card border-card-border flex items-center justify-between px-6 sticky top-0 z-10 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
         <div className="md:hidden">
            <Menu className="w-5 h-5 text-muted-foreground" />
         </div>
         <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Server:</span>
            <span className="text-sm font-mono font-medium text-foreground">{stats?.hostname || "localhost"}</span>
            <div className="flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Online</span>
            </div>
         </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-foreground relative p-2 rounded-full hover:bg-accent transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-card"></span>
        </button>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground selection:bg-primary/30 overflow-hidden">
       <Sidebar />
       <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          <Topbar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
             {children}
          </main>
       </div>
    </div>
  );
}
