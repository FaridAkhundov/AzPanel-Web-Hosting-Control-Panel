import { useState } from "react";
import { useListDns, useCreateDns, useDeleteDns, useGetDomain, getListDnsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, InlineForm, Button, Input, Select, FormLabel, ConfirmButton, EmptyState } from "@/components/ui-utils";
import { Plus, ArrowLeft, Network } from "lucide-react";

export default function DnsRecords({ domainIdProp }: { domainIdProp?: number }) {
  const params = useParams();
  const idStr = params.id;
  const domainId = domainIdProp || parseInt(idStr || "0", 10);
  
  const { data: domain } = useGetDomain(domainId, { query: { enabled: !!domainId } });
  const { data: records, isLoading } = useListDns(domainId, { query: { enabled: !!domainId } });
  
  const createDns = useCreateDns();
  const deleteDns = useDeleteDns();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({ type: "A", name: "", value: "", ttl: 3600, priority: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDns.mutate({ 
      domainId, 
      data: { ...formData, priority: formData.priority ? parseInt(formData.priority) : null } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDnsQueryKey(domainId) });
        setIsFormOpen(false);
        setFormData({ type: "A", name: "", value: "", ttl: 3600, priority: "" });
      }
    });
  };

  const handleDelete = (recordId: number) => {
    deleteDns.mutate({ domainId, recordId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDnsQueryKey(domainId) });
      }
    });
  };

  return (
    <div className={!domainIdProp ? "max-w-7xl mx-auto space-y-6" : "space-y-6"}>
      {!domainIdProp && (
        <div className="mb-4">
          <Link href={`/domains/${domainId}/manage`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Domain
          </Link>
        </div>
      )}
      
      {!domainIdProp && (
        <PageHeader 
          title={`DNS Records: ${domain?.name || '...'}`} 
          description="Manage zone file records for this domain."
          action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> Add Record</Button>}
        />
      )}

      {domainIdProp && (
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-semibold">DNS Zone Records</h3>
           <Button onClick={() => setIsFormOpen(!isFormOpen)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Record</Button>
        </div>
      )}

      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add DNS Record">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-3xl">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
            <div className="md:col-span-1">
              <FormLabel>Type</FormLabel>
              <Select value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
                {['A','AAAA','CNAME','MX','TXT','SRV'].map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="col-span-2">
              <FormLabel>Name</FormLabel>
              <Input required placeholder="@ or www" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="col-span-2">
              <FormLabel>Value</FormLabel>
              <Input required placeholder="192.168.1.1" value={formData.value} onChange={(e: any) => setFormData({...formData, value: e.target.value})} />
            </div>
            <div className="md:col-span-1">
              <FormLabel>TTL</FormLabel>
              <Input type="number" required value={formData.ttl} onChange={(e: any) => setFormData({...formData, ttl: parseInt(e.target.value)})} />
            </div>
            {formData.type === 'MX' && (
              <div className="md:col-span-1">
                <FormLabel>Priority</FormLabel>
                <Input type="number" required value={formData.priority} onChange={(e: any) => setFormData({...formData, priority: e.target.value})} />
              </div>
            )}
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={createDns.isPending}>{createDns.isPending ? 'Saving...' : 'Save Record'}</Button>
          </div>
        </form>
      </InlineForm>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-4">Loading records...</div>
      ) : records?.length === 0 ? (
        <EmptyState 
           icon={Network} 
           title="No DNS records" 
           description="This domain has no custom DNS records configured."
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>Name</Th>
              <Th>Value</Th>
              <Th>TTL</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {records?.map(record => (
              <Tr key={record.id}>
                <Td><span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{record.type}</span></Td>
                <Td className="font-mono text-xs font-medium text-foreground">{record.name}</Td>
                <Td className="font-mono text-xs text-muted-foreground">{record.priority ? <span className="text-amber-500 mr-2">[{record.priority}]</span> : ''}{record.value}</Td>
                <Td className="text-xs text-muted-foreground font-mono">{record.ttl}</Td>
                <Td className="text-right">
                  <ConfirmButton onConfirm={() => handleDelete(record.id)} title="Delete Record" />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
