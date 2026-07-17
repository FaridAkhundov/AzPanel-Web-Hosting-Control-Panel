import React, { useState } from 'react';

export function PageHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <table className="w-full text-sm text-left whitespace-nowrap">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground border-b border-border">{children}</thead>;
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-muted/30 transition-colors">{children}</tr>;
}

export function Th({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <th className={`px-4 py-3.5 font-medium tracking-wider ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

export function Badge({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "danger" | "outline" }) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    danger: "bg-red-500/10 text-red-500 border-red-500/20",
    outline: "bg-transparent border-border text-muted-foreground"
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-semibold border ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-card border border-border rounded-lg p-5 shadow-sm ${className}`}>{children}</div>;
}

export function InlineForm({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="mb-6 p-6 border border-primary/30 bg-primary/5 rounded-lg shadow-inner">
      <div className="flex justify-between items-center mb-6 border-b border-primary/20 pb-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">{title}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-medium px-2 py-1 rounded hover:bg-background/50 transition-colors">Cancel</button>
      </div>
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = "default", type = "button", disabled = false, className = "", size = "default" }: any) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9"
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}>{children}</button>;
}

export function Input({ className = "", ...props }: any) {
  return <input className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}

export function EmptyState({ icon: Icon, title, description, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-lg bg-card/50">
      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-foreground mb-1.5 block">{children}</label>;
}

export function Select({ className = "", children, ...props }: any) {
  return <select className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</select>;
}

export function Tabs({ tabs, activeTab, onChange }: { tabs: { id: string, label: string }[], activeTab: string, onChange: (id: string) => void }) {
  return (
    <div className="flex border-b border-border mb-6 overflow-x-auto custom-scrollbar">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  const getColors = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
      case 'completed':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'paused':
      case 'stopped':
      case 'failed':
      case 'error':
        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
      case 'unknown':
      default:
        return 'bg-gray-500';
    }
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${getColors()}`}></div>;
}

export function ConfirmButton({ onConfirm, icon: Icon, title = "Confirm", label }: any) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => { onConfirm(); setConfirming(false); }} className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded font-medium shadow-sm hover:bg-destructive/90 transition-colors">Sure?</button>
        <button onClick={() => setConfirming(false)} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded font-medium shadow-sm hover:bg-muted/80 transition-colors">No</button>
      </div>
    );
  }
  
  if (label) {
    return (
      <button onClick={() => setConfirming(true)} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors text-sm font-medium">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </button>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors" title={title}>
      {Icon ? <Icon className="w-4 h-4" /> : "Delete"}
    </button>
  );
}
