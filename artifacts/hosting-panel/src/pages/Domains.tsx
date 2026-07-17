import { useState } from "react";
import { useListDomains, useCreateDomain, useDeleteDomain, getListDomainsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, Badge, InlineForm, Button, Input, EmptyState, Select, FormLabel, ConfirmButton } from "@/components/ui-utils";
import { Globe, Settings, Plus, LayoutGrid, Check, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Domains() {
  const { data: domains, isLoading } = useListDomains();
  const createDomain = useCreateDomain();
  const deleteDomain = useDeleteDomain();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "", documentRoot: "/var/www/vhosts/", phpVersion: "8.1", ipAddress: "", sslEnabled: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { 
       name: formData.ipAddress ? `${formData.name} [IP:${formData.ipAddress}]` : formData.name, 
       documentRoot: formData.documentRoot, 
       phpVersion: formData.phpVersion,
       sslEnabled: formData.sslEnabled
    };
    createDomain.mutate({ data: finalData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDomainsQueryKey() });
        setIsFormOpen(false);
        setFormData({ name: "", documentRoot: "/var/www/vhosts/", phpVersion: "8.1", ipAddress: "", sslEnabled: true });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteDomain.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDomainsQueryKey() });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Websites & Domains" 
        description="Manage hosted domains, document roots, and web settings."
        action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> Add Domain</Button>}
      />

      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add New Domain">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Domain Name</FormLabel>
              <Input required placeholder="example.com" value={formData.name} onChange={(e: any) => {
                const val = e.target.value;
                setFormData({ ...formData, name: val, documentRoot: `/var/www/vhosts/${val}` })
              }} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>IP Address (Optional)</FormLabel>
              <Input placeholder="192.168.1.100" value={formData.ipAddress} onChange={(e: any) => setFormData({...formData, ipAddress: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>PHP Version</FormLabel>
              <Select value={formData.phpVersion} onChange={(e: any) => setFormData({...formData, phpVersion: e.target.value})}>
                <option value="8.0">PHP 8.0</option>
                <option value="8.1">PHP 8.1</option>
                <option value="8.2">PHP 8.2</option>
                <option value="8.3">PHP 8.3</option>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Enable SSL</FormLabel>
              <div className="flex items-center gap-2 mt-2 bg-background border border-input rounded-md px-3 h-9">
                 <input type="checkbox" id="ssl-toggle" checked={formData.sslEnabled} onChange={(e) => setFormData({...formData, sslEnabled: e.target.checked})} className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-primary" />
                 <label htmlFor="ssl-toggle" className="text-sm font-medium cursor-pointer text-foreground">Let's Encrypt Free SSL</label>
              </div>
            </div>
            <div className="col-span-2">
              <FormLabel>Document Root</FormLabel>
              <Input required value={formData.documentRoot} onChange={(e: any) => setFormData({...formData, documentRoot: e.target.value})} />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={createDomain.isPending}>{createDomain.isPending ? 'Creating...' : 'Create Domain'}</Button>
          </div>
        </form>
      </InlineForm>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-4">Loading domains...</div>
      ) : domains?.length === 0 ? (
        <EmptyState 
           icon={Globe} 
           title="No domains yet" 
           description="Add your first domain to start hosting websites, creating email accounts, and managing databases."
           action={<Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Your First Domain</Button>}
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Domain</Th>
              <Th>Doc Root</Th>
              <Th>PHP</Th>
              <Th>Status</Th>
              <Th>SSL</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {domains?.map(domain => {
              const nameDisplay = domain.name.includes(' [IP:') ? domain.name.split(' [IP:')[0] : domain.name;
              return (
                <Tr key={domain.id}>
                  <Td className="font-medium">
                    <div className="flex items-center gap-2 text-foreground">
                      <Globe className="w-4 h-4 text-primary" />
                      <Link href={`/domains/${domain.id}/manage`} className="hover:underline hover:text-primary transition-colors text-[15px] font-semibold">{nameDisplay}</Link>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground font-mono text-xs">{domain.documentRoot}</Td>
                  <Td>
                    <span className="font-mono bg-secondary px-2 py-1 rounded text-xs border border-border text-foreground font-medium">{domain.phpVersion}</span>
                  </Td>
                  <Td>
                    <Badge variant={domain.status === 'active' ? 'success' : 'warning'}>{domain.status}</Badge>
                  </Td>
                  <Td>
                     {domain.sslEnabled ? <Badge variant="success"><Check className="w-3 h-3 mr-1" /> Active</Badge> : <Badge variant="outline">None</Badge>}
                  </Td>
                  <Td className="text-muted-foreground text-xs">{format(new Date(domain.createdAt), "MMM d, yyyy")}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/domains/${domain.id}/manage`} className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded text-xs font-semibold transition-colors">
                        Manage
                      </Link>
                      <ConfirmButton onConfirm={() => handleDelete(domain.id)} title="Delete Domain" />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
