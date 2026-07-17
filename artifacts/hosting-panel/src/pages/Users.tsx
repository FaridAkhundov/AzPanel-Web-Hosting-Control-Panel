import { useState } from "react";
import { useListUsers, useCreateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, Badge, InlineForm, Button, Input, EmptyState, Select, FormLabel, ConfirmButton } from "@/components/ui-utils";
import { Users as UsersIcon, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Users() {
  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "user" });

  const adminCount = users?.filter(u => u.role === 'admin').length || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ data: formData }, {
      onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); 
        setIsFormOpen(false); 
        setFormData({ username: "", email: "", password: "", role: "user" });
      }
    });
  };

  const handleDelete = (id: number, role: string) => {
     if (role === 'admin' && adminCount <= 1) {
        alert("Cannot delete the last admin user.");
        return;
     }
     deleteUser.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }) });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Panel Users" 
        description="Manage administrators, resellers, and customer accounts."
        action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> Add User</Button>} 
      />
      
      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create User">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Username</FormLabel>
              <Input required value={formData.username} onChange={(e: any) => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Email</FormLabel>
              <Input type="email" required value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Password</FormLabel>
              <Input type="password" required value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Role</FormLabel>
              <Select value={formData.role} onChange={(e: any) => setFormData({...formData, role: e.target.value})}>
                <option value="user">User</option>
                <option value="reseller">Reseller</option>
                <option value="admin">Administrator</option>
              </Select>
            </div>
          </div>
          <div className="pt-2"><Button type="submit" disabled={createUser.isPending}>{createUser.isPending ? 'Creating...' : 'Create User'}</Button></div>
        </form>
      </InlineForm>

      {isLoading ? <div className="text-muted-foreground text-sm p-4">Loading users...</div> : users?.length === 0 ? (
         <EmptyState 
           icon={UsersIcon} 
           title="No users found" 
           description="Add users to allow clients or co-workers to manage hosting resources."
           action={<Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add User</Button>}
         />
      ) : (
        <Table>
          <Thead><Tr><Th>Username</Th><Th>Email</Th><Th>Role</Th><Th>Created</Th><Th className="text-right">Actions</Th></Tr></Thead>
          <Tbody>
            {users?.map(u => (
              <Tr key={u.id}>
                <Td className="font-semibold text-foreground text-[15px]"><div className="flex items-center gap-2"><UsersIcon className="w-4 h-4 text-primary" />{u.username}</div></Td>
                <Td className="text-muted-foreground">{u.email}</Td>
                <Td><Badge variant={u.role === 'admin' ? 'danger' : u.role === 'reseller' ? 'warning' : 'default'}>{u.role}</Badge></Td>
                <Td className="text-xs text-muted-foreground font-mono">{format(new Date(u.createdAt), "MMM d, yyyy")}</Td>
                <Td className="text-right">
                  <ConfirmButton onConfirm={() => handleDelete(u.id, u.role)} title="Delete User" />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
