import { useState } from "react";
import { useListEmails, useCreateEmail, useDeleteEmail, useListDomains, getListEmailsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, InlineForm, Button, Input, EmptyState, Select, FormLabel, ConfirmButton } from "@/components/ui-utils";
import { Mail, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Emails() {
  const { data: emails, isLoading } = useListEmails();
  const { data: domains } = useListDomains();
  const createEmail = useCreateEmail();
  const deleteEmail = useDeleteEmail();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const defaultDomain = domains?.[0]?.name.split(' ')[0] || "";
  const [formData, setFormData] = useState({ address: "", domain: defaultDomain, password: "", quota: 1024 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmail.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEmailsQueryKey() });
        setIsFormOpen(false);
        setFormData({ address: "", domain: defaultDomain, password: "", quota: 1024 });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteEmail.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListEmailsQueryKey() }) });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Email Accounts" 
        description="Manage mailboxes and quotas."
        action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> Add Email</Button>}
      />

      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create Email Account">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <FormLabel>Email Address</FormLabel>
              <div className="flex rounded-md border border-input bg-background shadow-sm">
                 <input required className="flex h-9 w-full bg-transparent px-3 py-1 text-sm focus-visible:outline-none placeholder:text-muted-foreground rounded-l-md text-right" placeholder="info" value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} />
                 <span className="flex items-center px-3 border-l border-input bg-muted/50 text-muted-foreground text-sm font-semibold">@</span>
                 <select className="flex h-9 w-full bg-transparent px-3 py-1 text-sm focus-visible:outline-none rounded-r-md font-semibold text-foreground" value={formData.domain} onChange={(e: any) => setFormData({...formData, domain: e.target.value})}>
                    {domains?.map(d => {
                      const name = d.name.split(' ')[0];
                      return <option key={name} value={name}>{name}</option>;
                    })}
                 </select>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Password</FormLabel>
              <Input type="password" required value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Quota (MB)</FormLabel>
              <div className="flex gap-4 items-center">
                 <Input type="number" min="100" max="10240" required value={formData.quota} onChange={(e: any) => setFormData({...formData, quota: parseInt(e.target.value)})} />
                 <input type="range" min="100" max="10240" step="100" value={formData.quota} onChange={(e: any) => setFormData({...formData, quota: parseInt(e.target.value)})} className="w-full accent-primary" />
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={createEmail.isPending}>{createEmail.isPending ? 'Creating...' : 'Create Email'}</Button>
          </div>
        </form>
      </InlineForm>

      {isLoading ? <div className="text-muted-foreground text-sm p-4">Loading emails...</div> : emails?.length === 0 ? (
        <EmptyState 
           icon={Mail} 
           title="No email accounts" 
           description="Create professional email addresses for your domains."
           action={<Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Email Account</Button>}
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Email Address</Th>
              <Th>Domain</Th>
              <Th>Quota Bar</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {emails?.map(email => (
              <Tr key={email.id}>
                <Td className="font-semibold text-foreground text-[15px]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {email.address}@{email.domain}
                  </div>
                </Td>
                <Td className="font-semibold text-foreground">{email.domain}</Td>
                <Td>
                  <div className="w-48">
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold mb-1">
                      <span>{email.used} MB</span>
                      <span>{email.quota} MB</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
                      <div className="h-full bg-primary" style={{ width: `${Math.min((email.used / email.quota) * 100, 100)}%` }} />
                    </div>
                  </div>
                </Td>
                <Td className="text-xs text-muted-foreground">{format(new Date(email.createdAt), "MMM d, yyyy")}</Td>
                <Td className="text-right">
                  <ConfirmButton onConfirm={() => handleDelete(email.id)} title="Delete Email" />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
