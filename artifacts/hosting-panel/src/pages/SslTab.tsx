import { useState } from "react";
import { useListSsl, useCreateSsl, useDeleteSsl, getListSslQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, EmptyState, ConfirmButton } from "@/components/ui-utils";
import { Lock, Plus } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function SslTab({ domain }: { domain: any }) {
  const { data: allCerts, isLoading } = useListSsl();
  const createSsl = useCreateSsl();
  const deleteSsl = useDeleteSsl();
  const queryClient = useQueryClient();

  const domainName = domain.name.includes(' [IP:') ? domain.name.split(' [IP:')[0] : domain.name;
  
  // Filter for this domain
  const certs = allCerts?.filter(c => c.domain === domainName) || [];

  const handleIssue = () => {
    createSsl.mutate({ data: { domain: domainName, type: "LetsEncrypt" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSslQueryKey() })
    });
  };

  if (isLoading) return <div className="text-muted-foreground">Loading SSL info...</div>;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">SSL Certificates</h3>
          <Button onClick={handleIssue} disabled={createSsl.isPending} size="sm">
             <Plus className="w-4 h-4 mr-2" /> Issue Let's Encrypt
          </Button>
       </div>

       {certs.length === 0 ? (
          <EmptyState 
             icon={Lock} 
             title="No SSL Certificate" 
             description={`The domain ${domainName} is not secured with SSL.`}
             action={<Button onClick={handleIssue} disabled={createSsl.isPending}>{createSsl.isPending ? 'Issuing...' : 'Issue Let\'s Encrypt SSL'}</Button>}
          />
       ) : (
          <Table>
            <Thead><Tr><Th>Domain</Th><Th>Issuer</Th><Th>Expires</Th><Th>Days Left</Th><Th>Status</Th><Th className="text-right">Actions</Th></Tr></Thead>
            <Tbody>
              {certs.map(cert => {
                 const daysLeft = differenceInDays(new Date(cert.expiresAt), new Date());
                 return (
                   <Tr key={cert.id}>
                     <Td className="font-semibold text-[15px]"><div className="flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-500" />{cert.domain}</div></Td>
                     <Td className="text-muted-foreground">{cert.issuer}</Td>
                     <Td className="text-xs text-muted-foreground font-mono">{format(new Date(cert.expiresAt), "MMM d, yyyy")}</Td>
                     <Td className="text-xs font-semibold">{daysLeft} days</Td>
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
