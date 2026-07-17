import { useState } from "react";
import { useListBackups, useCreateBackup, useDeleteBackup, useListDomains, getListBackupsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, Badge, InlineForm, Button, Input, EmptyState, Select, FormLabel, ConfirmButton } from "@/components/ui-utils";
import { HardDrive, Plus, Download, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export default function Backups() {
  const { data: backups, isLoading } = useListBackups();
  const { data: domains } = useListDomains();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: `backup_${format(new Date(), "yyyyMMdd_HHmm")}`, type: "full", domainId: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBackup.mutate({ 
       data: { 
          name: formData.name,
          type: formData.type,
          domainId: formData.type === 'domain' && formData.domainId ? parseInt(formData.domainId) : undefined 
       } as any
    }, {
      onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: getListBackupsQueryKey() }); 
        setIsFormOpen(false); 
      }
    });
  };

  const getStatusIcon = (status: string) => {
     if (status === 'completed') return <ShieldCheck className="w-3.5 h-3.5 mr-1" />;
     if (status === 'failed') return <ShieldAlert className="w-3.5 h-3.5 mr-1" />;
     if (status === 'running') return <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-1.5" />;
     return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="System Backups" 
        description="Create and manage full, domain-level, and database backups."
        action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> New Backup</Button>} 
      />
      
      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create Backup">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <FormLabel>Backup Name</FormLabel>
              <Input required value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Backup Type</FormLabel>
              <Select value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
                <option value="full">Full Server Backup</option>
                <option value="domain">Domain Backup</option>
                <option value="database">Databases Only</option>
              </Select>
            </div>
            {formData.type === 'domain' && (
               <div className="col-span-2 sm:col-span-1">
                 <FormLabel>Select Domain</FormLabel>
                 <Select required value={formData.domainId} onChange={(e: any) => setFormData({...formData, domainId: e.target.value})}>
                    <option value="">Select...</option>
                    {domains?.map(d => <option key={d.id} value={d.id}>{d.name.split(' [IP:')[0]}</option>)}
                 </Select>
               </div>
            )}
          </div>
          <div className="pt-2"><Button type="submit" disabled={createBackup.isPending}>{createBackup.isPending ? 'Starting...' : 'Start Backup'}</Button></div>
        </form>
      </InlineForm>

      {isLoading ? <div className="text-sm text-muted-foreground p-4">Loading backups...</div> : backups?.length === 0 ? (
        <EmptyState 
           icon={HardDrive} 
           title="No backups found" 
           description="Safeguard your data by creating a full or partial backup."
           action={<Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Backup</Button>}
        />
      ) : (
        <Table>
          <Thead><Tr><Th>Name</Th><Th>Type</Th><Th>Size</Th><Th>Status</Th><Th>Created</Th><Th className="text-right">Actions</Th></Tr></Thead>
          <Tbody>
            {backups?.map(b => (
              <Tr key={b.id}>
                <Td className="font-semibold text-[15px]"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />{b.name}</div></Td>
                <Td><Badge variant="outline" className="capitalize">{b.type}</Badge></Td>
                <Td className="font-mono text-xs font-semibold">{b.size} MB</Td>
                <Td>
                   <Badge variant={b.status === 'completed' ? 'success' : b.status === 'failed' ? 'danger' : 'warning'}>
                      {getStatusIcon(b.status)}
                      {b.status}
                   </Badge>
                </Td>
                <Td className="text-xs text-muted-foreground font-mono">{format(new Date(b.createdAt), "MMM d, yyyy HH:mm")}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors" title="Download Backup"><Download className="w-4 h-4" /></button>
                    <ConfirmButton onConfirm={() => deleteBackup.mutate({ id: b.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBackupsQueryKey() }) })} title="Delete Backup" />
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
