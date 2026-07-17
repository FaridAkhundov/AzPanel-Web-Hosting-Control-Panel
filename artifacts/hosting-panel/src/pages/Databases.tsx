import { useState } from "react";
import { useListDatabases, useCreateDatabase, useDeleteDatabase, getListDatabasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, InlineForm, Button, Input, EmptyState, FormLabel, ConfirmButton } from "@/components/ui-utils";
import { Database, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Databases() {
  const { data: databases, isLoading } = useListDatabases();
  const createDatabase = useCreateDatabase();
  const deleteDatabase = useDeleteDatabase();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "", dbUser: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    createDatabase.mutate({ data: { name: formData.name, dbUser: formData.dbUser, password: formData.password } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDatabasesQueryKey() });
        setIsFormOpen(false);
        setFormData({ name: "", dbUser: "", password: "", confirmPassword: "" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteDatabase.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDatabasesQueryKey() });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="MySQL Databases" 
        description="Manage databases and users."
        action={<Button onClick={() => setIsFormOpen(!isFormOpen)}><Plus className="w-4 h-4 mr-2" /> Add Database</Button>}
      />

      <InlineForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create Database">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
          {error && <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded text-sm font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Database Name</FormLabel>
              <div className="flex rounded-md border border-input bg-background shadow-sm">
                 <span className="flex items-center px-3 border-r border-input bg-muted/50 text-muted-foreground text-sm rounded-l-md font-mono">db_</span>
                 <input required className="flex h-9 w-full bg-transparent px-3 py-1 text-sm focus-visible:outline-none placeholder:text-muted-foreground rounded-r-md" placeholder="name" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Database User</FormLabel>
              <div className="flex rounded-md border border-input bg-background shadow-sm">
                 <span className="flex items-center px-3 border-r border-input bg-muted/50 text-muted-foreground text-sm rounded-l-md font-mono">usr_</span>
                 <input required className="flex h-9 w-full bg-transparent px-3 py-1 text-sm focus-visible:outline-none placeholder:text-muted-foreground rounded-r-md" placeholder="name" value={formData.dbUser} onChange={(e: any) => setFormData({...formData, dbUser: e.target.value})} />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Password</FormLabel>
              <Input type="password" required value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <FormLabel>Confirm Password</FormLabel>
              <Input type="password" required value={formData.confirmPassword} onChange={(e: any) => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={createDatabase.isPending}>{createDatabase.isPending ? 'Creating...' : 'Create Database'}</Button>
          </div>
        </form>
      </InlineForm>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-4">Loading databases...</div>
      ) : databases?.length === 0 ? (
        <EmptyState 
           icon={Database} 
           title="No databases found" 
           description="Create a MySQL database to power your dynamic websites and applications."
           action={<Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Database</Button>}
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>User</Th>
              <Th>Size</Th>
              <Th>Host</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {databases?.map(db => (
              <Tr key={db.id}>
                <Td className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    db_{db.name}
                  </div>
                </Td>
                <Td className="font-mono text-xs font-semibold">usr_{db.dbUser}</Td>
                <Td className="text-muted-foreground font-mono text-xs">{db.size} MB</Td>
                <Td className="text-muted-foreground font-mono text-xs">localhost</Td>
                <Td className="text-xs text-muted-foreground">{format(new Date(db.createdAt), "MMM d, yyyy")}</Td>
                <Td className="text-right">
                  <ConfirmButton onConfirm={() => handleDelete(db.id)} title="Delete Database" />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
