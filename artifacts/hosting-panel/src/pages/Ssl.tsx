import { useState } from "react";
import { useListSsl, useCreateSsl, useDeleteSsl, useListDomains, getListSslQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, Badge, InlineForm, Button, Input, EmptyState, Select, FormLabel, ConfirmButton } from "@/components/ui-utils";
import { Lock, Plus } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function Ssl() {
  const { data: certs, isLoading } = useListSsl();
  const { data: domains } = useListDomains();
  const createSsl = useCreateSsl();
  const deleteSsl = useDeleteSsl();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ domain: "", type: "LetsEncrypt" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSsl.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSslQueryKey() });
        setIsFormOpen(false);
      }
    });
  };

  const getDaysLeftColor = (days: number) => {
    if (days > 30) return 'text-emerald-500 font-semibold';
    if (days >= 10) return 'text-amber-500 font-semibold';
    return 'text-red-500 font-bold';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="SSL Certificates" 
        description="Secure your domains with Let's Encrypt or custom certificates."
        action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> Issue Certificate</Button>} 
      />
      
      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Issue SSL Certificate">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Domain</FormLabel>
              <Select value={formData.domain} onChange={(e: any) => setFormData({...formData, domain: e.target.value})} required>
                 <option value="">Select Domain</option>
                 {domains?.map(d => {
                    const name = d.name.split(' ')[0];
                    return <option key={name} value={name}>{name}</option>;
                 })}
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Certificate Type</FormLabel>
              <Select value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
                <option value="LetsEncrypt">Let's Encrypt (Free)</option>
                <option value="SelfSigned">Self-Signed</option>
                <option value="Custom">Custom Certificate</option>
              </Select>
            </div>
          </div>
          <div className="pt-2"><Button type="submit" disabled={createSsl.isPending}>{createSsl.isPending ? 'Issuing...' : 'Issue Certificate'}</Button></div>
        </form>
      </InlineForm>

      {isLoading ? <div className="text-sm text-muted-foreground p-4">Loading certificates...</div> : certs?.length === 0 ? (
        <EmptyState 
           icon={Lock} 
           title="No SSL certificates" 
           description="Issue a free Let's Encrypt SSL certificate to secure your websites."
           action={<Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" /> Issue Certificate</Button>}
        />
      ) : (
        <Table>
          <Thead><Tr><Th>Domain</Th><Th>Type</Th><Th>Issuer</Th><Th>Expires</Th><Th>Days Left</Th><Th>Status</Th><Th className="text-right">Actions</Th></Tr></Thead>
          <Tbody>
            {certs?.map(cert => {
              const daysLeft = differenceInDays(new Date(cert.expiresAt), new Date());
              return (
                <Tr key={cert.id}>
                  <Td className="font-semibold text-foreground text-[15px]"><div className="flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-500" />{cert.domain}</div></Td>
                  <Td><Badge variant="outline">{cert.type || "Let's Encrypt"}</Badge></Td>
                  <Td className="text-muted-foreground">{cert.issuer}</Td>
                  <Td className="text-xs text-muted-foreground font-mono">{format(new Date(cert.expiresAt), "MMM d, yyyy")}</Td>
                  <Td className={`text-xs ${getDaysLeftColor(daysLeft)}`}>{daysLeft} days</Td>
                  <Td><Badge variant={cert.status === 'active' ? 'success' : 'warning'}>{cert.status}</Badge></Td>
                  <Td className="text-right">
                    <ConfirmButton onConfirm={() => deleteSsl.mutate({ id: cert.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSslQueryKey() }) })} title="Revoke SSL" />
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
