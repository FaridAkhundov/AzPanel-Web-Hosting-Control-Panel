import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, Badge, InlineForm, Button, Input, EmptyState, Select, FormLabel, ConfirmButton, StatusDot } from "@/components/ui-utils";
import { Clock, Plus, Pause, Play } from "lucide-react";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function CronJobs() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState("@daily");
  const [cronParts, setCronParts] = useState({ min: "*", hour: "*", day: "*", month: "*", weekday: "*" });

  const { data: cronjobs, isLoading } = useQuery({
    queryKey: ['cronjobs'],
    queryFn: () => fetch(`${BASE}/api/cronjobs`).then(r => r.json())
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch(`${BASE}/api/cronjobs`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
    }),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['cronjobs'] });
       setIsFormOpen(false);
       setFormData({ description: "", command: "" });
       setScheduleType("@daily");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => fetch(`${BASE}/api/cronjobs/${id}`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ status })
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cronjobs'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/cronjobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cronjobs'] })
  });

  const [formData, setFormData] = useState({ description: "", command: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSchedule = scheduleType === "custom" 
      ? `${cronParts.min} ${cronParts.hour} ${cronParts.day} ${cronParts.month} ${cronParts.weekday}`
      : scheduleType;
      
    createMutation.mutate({ 
       description: formData.description,
       command: formData.command,
       schedule: finalSchedule
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Scheduled Tasks" 
        description="Run commands or scripts automatically at specified intervals."
        action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> Add Cron Job</Button>}
      />

      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create Cron Job">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Description (Optional)</FormLabel>
              <Input placeholder="Clear cache" value={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Schedule</FormLabel>
              <Select value={scheduleType} onChange={(e: any) => setScheduleType(e.target.value)}>
                <option value="@hourly">Hourly (@hourly)</option>
                <option value="@daily">Daily (@daily)</option>
                <option value="@weekly">Weekly (@weekly)</option>
                <option value="@monthly">Monthly (@monthly)</option>
                <option value="custom">Custom (cron expression)</option>
              </Select>
            </div>

            {scheduleType === "custom" && (
               <div className="col-span-2 grid grid-cols-5 gap-3 p-4 bg-background border border-input rounded-md shadow-inner">
                  <div>
                    <FormLabel>Minute</FormLabel>
                    <Input value={cronParts.min} onChange={(e: any) => setCronParts({...cronParts, min: e.target.value})} placeholder="0-59, *" />
                  </div>
                  <div>
                    <FormLabel>Hour</FormLabel>
                    <Input value={cronParts.hour} onChange={(e: any) => setCronParts({...cronParts, hour: e.target.value})} placeholder="0-23, *" />
                  </div>
                  <div>
                    <FormLabel>Day</FormLabel>
                    <Input value={cronParts.day} onChange={(e: any) => setCronParts({...cronParts, day: e.target.value})} placeholder="1-31, *" />
                  </div>
                  <div>
                    <FormLabel>Month</FormLabel>
                    <Input value={cronParts.month} onChange={(e: any) => setCronParts({...cronParts, month: e.target.value})} placeholder="1-12, *" />
                  </div>
                  <div>
                    <FormLabel>Weekday</FormLabel>
                    <Input value={cronParts.weekday} onChange={(e: any) => setCronParts({...cronParts, weekday: e.target.value})} placeholder="0-7, *" />
                  </div>
               </div>
            )}

            <div className="col-span-2">
              <FormLabel>Command</FormLabel>
              <Input required placeholder="/usr/bin/php /var/www/vhosts/example.com/cron.php" value={formData.command} onChange={(e: any) => setFormData({...formData, command: e.target.value})} className="font-mono" />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Save Cron Job'}</Button>
          </div>
        </form>
      </InlineForm>

      {isLoading ? <div className="text-muted-foreground p-4">Loading cron jobs...</div> : cronjobs?.length === 0 ? (
         <EmptyState 
           icon={Clock} 
           title="No cron jobs configured" 
           description="Automate repetitive tasks by scheduling scripts to run at regular intervals."
           action={<Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Cron Job</Button>}
         />
      ) : (
        <Table>
          <Thead><Tr><Th>Description / Command</Th><Th>Schedule</Th><Th>Status</Th><Th>Last Run</Th><Th className="text-right">Actions</Th></Tr></Thead>
          <Tbody>
             {cronjobs?.map((cron: any) => (
                <Tr key={cron.id}>
                   <Td>
                      <div className="flex flex-col gap-1">
                         {cron.description && <span className="font-semibold text-[14px] text-foreground">{cron.description}</span>}
                         <span className="font-mono text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded w-fit">{cron.command}</span>
                      </div>
                   </Td>
                   <Td><span className="font-mono text-[13px] font-bold text-primary">{cron.schedule}</span></Td>
                   <Td>
                      <div className="flex items-center gap-2">
                         <StatusDot status={cron.status} />
                         <span className="text-xs font-semibold uppercase tracking-wider">{cron.status}</span>
                      </div>
                   </Td>
                   <Td className="text-xs text-muted-foreground font-mono">{cron.lastRun ? format(new Date(cron.lastRun), "MMM d, HH:mm") : 'Never'}</Td>
                   <Td className="text-right">
                      <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => updateMutation.mutate({ id: cron.id, status: cron.status === 'active' ? 'paused' : 'active' })} 
                            className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors"
                            title={cron.status === 'active' ? 'Pause' : 'Resume'}
                         >
                            {cron.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                         </button>
                         <ConfirmButton onConfirm={() => deleteMutation.mutate(cron.id)} title="Delete Cron Job" />
                      </div>
                   </Td>
                </Tr>
             ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
