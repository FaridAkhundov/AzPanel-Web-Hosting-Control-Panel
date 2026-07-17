import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Card, Button, StatusDot, Badge } from "@/components/ui-utils";
import { Activity, RefreshCw, Server, Zap, Database, Mail, Globe, Shield, FileOutput } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function Services() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: services, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch(`${BASE}/api/services`).then(r => r.json()),
    refetchInterval: 30000 // Refresh every 30s
  });

  const actionMutation = useMutation({
    mutationFn: ({ name, action }: { name: string, action: 'start' | 'stop' | 'restart' }) => 
      fetch(`${BASE}/api/services/${name}/${action}`, { method: 'POST' }).then(r => r.json()),
    onSuccess: (data, variables) => {
       queryClient.invalidateQueries({ queryKey: ['services'] });
       toast({
          title: `Service ${variables.action}ed`,
          description: data.message || `Successfully executed ${variables.action} on ${variables.name}.`
       });
    },
    onError: () => {
       toast({
          title: "Action failed",
          description: "Could not perform the action. Check server logs.",
          variant: "destructive"
       });
    }
  });

  const getServiceIcon = (name: string) => {
     if (name.includes('nginx') || name.includes('httpd')) return Globe;
     if (name.includes('php')) return Zap;
     if (name.includes('maria') || name.includes('mysql')) return Database;
     if (name.includes('postfix') || name.includes('dovecot')) return Mail;
     if (name.includes('named') || name.includes('bind')) return Activity;
     if (name.includes('firewalld') || name.includes('iptables')) return Shield;
     if (name.includes('ftp')) return FileOutput;
     return Server;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
         <PageHeader 
           title="Services Monitor" 
           description="Manage core server daemon processes."
         />
         <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {dataUpdatedAt ? (
               <span className="font-mono text-xs">Last updated: {format(new Date(dataUpdatedAt), "HH:mm:ss")}</span>
            ) : null}
            <Button 
               variant="outline" 
               size="sm" 
               onClick={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
               disabled={isFetching}
            >
               <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
               Refresh All
            </Button>
         </div>
      </div>

      {isLoading ? <div className="text-muted-foreground p-4">Loading service statuses...</div> : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services?.map((svc: any) => {
               const Icon = getServiceIcon(svc.name);
               const isRunning = svc.status === 'running';
               const isStopped = svc.status === 'stopped';
               const isProcessing = actionMutation.isPending && actionMutation.variables?.name === svc.name;
               
               return (
                  <Card key={svc.name} className="flex flex-col border-border/60 hover:border-primary/30 transition-colors shadow-sm relative overflow-hidden">
                     {isProcessing && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>}
                     
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                              <Icon className="w-5 h-5" />
                           </div>
                           <div>
                              <h3 className="font-semibold text-foreground">{svc.displayName}</h3>
                              <p className="text-xs text-muted-foreground font-mono">{svc.name}</p>
                           </div>
                        </div>
                        <Badge variant={isRunning ? 'success' : isStopped ? 'danger' : 'warning'}>
                           <div className="flex items-center gap-1.5">
                              <StatusDot status={svc.status} />
                              <span className="capitalize">{svc.status}</span>
                           </div>
                        </Badge>
                     </div>
                     
                     <div className="mt-auto pt-4 border-t border-border grid grid-cols-3 gap-2">
                        <Button 
                           variant="secondary" 
                           size="sm" 
                           className="text-xs font-semibold w-full"
                           disabled={isRunning || isProcessing}
                           onClick={() => actionMutation.mutate({ name: svc.name, action: 'start' })}
                        >
                           Start
                        </Button>
                        <Button 
                           variant="secondary" 
                           size="sm" 
                           className="text-xs font-semibold w-full"
                           disabled={!isRunning || isProcessing}
                           onClick={() => actionMutation.mutate({ name: svc.name, action: 'restart' })}
                        >
                           Restart
                        </Button>
                        <Button 
                           variant="outline" 
                           size="sm" 
                           className="text-xs font-semibold w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-transparent"
                           disabled={!isRunning || isProcessing}
                           onClick={() => {
                              if (confirm(`Stop ${svc.displayName}? This may cause downtime.`)) {
                                 actionMutation.mutate({ name: svc.name, action: 'stop' });
                              }
                           }}
                        >
                           Stop
                        </Button>
                     </div>
                  </Card>
               );
            })}
         </div>
      )}
    </div>
  );
}
