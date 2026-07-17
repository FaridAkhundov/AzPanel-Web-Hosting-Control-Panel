import { useState } from "react";
import { useListFtp, useCreateFtp, useDeleteFtp, useListDomains, getListFtpQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, InlineForm, Button, Input, EmptyState, Select, FormLabel, ConfirmButton } from "@/components/ui-utils";
import { FolderOpen, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Ftp() {
  const { data: accounts, isLoading } = useListFtp();
  const { data: domains } = useListDomains();
  const createFtp = useCreateFtp();
  const deleteFtp = useDeleteFtp();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", directory: "/", domain: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFtp.mutate({ data: { ...formData, directory: formData.directory || "/" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFtpQueryKey() });
        setIsFormOpen(false);
        setFormData({ username: "", password: "", directory: "/", domain: "" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="FTP Accounts" 
        description="Manage file transfer protocol access to your domains."
        action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> Add FTP Account</Button>} 
      />
      
      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create FTP Account">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Username</FormLabel>
              <Input required value={formData.username} onChange={(e: any) => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Password</FormLabel>
              <Input type="password" required value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Restrict to Domain</FormLabel>
              <Select value={formData.domain} onChange={(e: any) => setFormData({...formData, domain: e.target.value})}>
                <option value="">(No restriction)</option>
                {domains?.map(d => {
                  const name = d.name.split(' ')[0];
                  return <option key={name} value={name}>{name}</option>;
                })}
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Home Directory</FormLabel>
              <Input required value={formData.directory} onChange={(e: any) => setFormData({...formData, directory: e.target.value})} />
            </div>
          </div>
          <div className="pt-2"><Button type="submit" disabled={createFtp.isPending}>{createFtp.isPending ? 'Creating...' : 'Create FTP Account'}</Button></div>
        </form>
      </InlineForm>

      {isLoading ? <div className="text-muted-foreground text-sm p-4">Loading FTP accounts...</div> : accounts?.length === 0 ? (
        <EmptyState 
           icon={FolderOpen} 
           title="No FTP accounts" 
           description="Create an FTP account to upload files to your server."
           action={<Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add FTP Account</Button>}
        />
      ) : (
        <Table>
          <Thead><Tr><Th>Username</Th><Th>Home Directory</Th><Th>Domain</Th><Th>Created</Th><Th className="text-right">Actions</Th></Tr></Thead>
          <Tbody>
            {accounts?.map(acc => (
              <Tr key={acc.id}>
                <Td className="font-semibold text-foreground text-[15px]"><div className="flex items-center gap-2"><FolderOpen className="w-4 h-4 text-primary" />{acc.username}</div></Td>
                <Td className="font-mono text-xs text-muted-foreground">{acc.directory}</Td>
                <Td className="font-semibold">{acc.domain || '-'}</Td>
                <Td className="text-xs text-muted-foreground">{format(new Date(acc.createdAt), "MMM d, yyyy")}</Td>
                <Td className="text-right">
                  <ConfirmButton onConfirm={() => deleteFtp.mutate({ id: acc.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFtpQueryKey() }) })} title="Delete FTP" />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
