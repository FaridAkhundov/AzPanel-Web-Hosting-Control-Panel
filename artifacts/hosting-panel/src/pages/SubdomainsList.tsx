import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Thead, Tbody, Tr, Th, Td, Badge, Button, InlineForm, Input, EmptyState, FormLabel, ConfirmButton, Select } from "@/components/ui-utils";
import { CornerDownRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { useListDomains } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function SubdomainsList({ domainId }: { domainId?: number }) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: domains } = useListDomains();
  
  const queryKey = domainId ? ['subdomains', 'domain', domainId] : ['subdomains'];
  const endpoint = domainId ? `${BASE}/api/subdomains/by-domain/${domainId}` : `${BASE}/api/subdomains`;

  const { data: subdomains, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetch(endpoint).then(r => r.json())
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch(`${BASE}/api/subdomains`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
    }),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['subdomains'] });
       setIsFormOpen(false);
       setFormData({ name: "", domainId: domainId?.toString() || "", documentRoot: "" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/subdomains/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subdomains'] })
  });

  const [formData, setFormData] = useState({ name: "", domainId: domainId?.toString() || "", documentRoot: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ 
       name: formData.name, 
       domainId: parseInt(formData.domainId),
       documentRoot: formData.documentRoot
    });
  };

  const handleNameChange = (val: string) => {
     const parentDomain = domains?.find(d => d.id.toString() === formData.domainId)?.name?.split(' [IP:')[0];
     if (parentDomain) {
        setFormData({ ...formData, name: val, documentRoot: `/var/www/vhosts/${parentDomain}/${val}` });
     } else {
        setFormData({ ...formData, name: val });
     }
  };

  const handleDomainChange = (val: string) => {
     const parentDomain = domains?.find(d => d.id.toString() === val)?.name?.split(' [IP:')[0];
     setFormData({ ...formData, domainId: val, documentRoot: parentDomain && formData.name ? `/var/www/vhosts/${parentDomain}/${formData.name}` : formData.documentRoot });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h3 className="text-lg font-semibold">{domainId ? "Domain Subdomains" : "All Subdomains"}</h3>
         <Button onClick={() => setIsFormOpen(!isFormOpen)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Subdomain</Button>
      </div>

      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create Subdomain">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
          <div className="grid grid-cols-2 gap-5">
            {!domainId && (
               <div className="col-span-2">
                 <FormLabel>Parent Domain</FormLabel>
                 <Select required value={formData.domainId} onChange={(e: any) => handleDomainChange(e.target.value)}>
                    <option value="">Select Domain...</option>
                    {domains?.map(d => <option key={d.id} value={d.id}>{d.name.split(' [IP:')[0]}</option>)}
                 </Select>
               </div>
            )}
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Subdomain Name</FormLabel>
              <Input required placeholder="blog" value={formData.name} onChange={(e: any) => handleNameChange(e.target.value)} />
            </div>
            <div className="col-span-2">
              <FormLabel>Document Root</FormLabel>
              <Input required value={formData.documentRoot} onChange={(e: any) => setFormData({...formData, documentRoot: e.target.value})} />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Subdomain'}</Button>
          </div>
        </form>
      </InlineForm>

      {isLoading ? <div className="text-muted-foreground p-4">Loading subdomains...</div> : subdomains?.length === 0 ? (
         <EmptyState 
           icon={CornerDownRight} 
           title="No subdomains found" 
           description="Create subdomains like blog.yourdomain.com."
         />
      ) : (
        <Table>
          <Thead><Tr><Th>Subdomain</Th><Th>Parent Domain</Th><Th>Document Root</Th><Th>Status</Th><Th>Created</Th><Th className="text-right">Actions</Th></Tr></Thead>
          <Tbody>
             {subdomains?.map((sub: any) => (
                <Tr key={sub.id}>
                   <Td className="font-semibold text-foreground text-[15px]"><div className="flex items-center gap-2"><CornerDownRight className="w-4 h-4 text-primary" />{sub.name}.{sub.domainName}</div></Td>
                   <Td className="text-muted-foreground">{sub.domainName}</Td>
                   <Td className="font-mono text-xs text-muted-foreground">{sub.documentRoot}</Td>
                   <Td><Badge variant={sub.status === 'active' ? 'success' : 'warning'}>{sub.status}</Badge></Td>
                   <Td className="text-xs text-muted-foreground font-mono">{format(new Date(sub.createdAt), "MMM d, yyyy")}</Td>
                   <Td className="text-right"><ConfirmButton onConfirm={() => deleteMutation.mutate(sub.id)} title="Delete Subdomain" /></Td>
                </Tr>
             ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
