import { PageHeader } from "@/components/ui-utils";
import SubdomainsList from "./SubdomainsList";

export default function Subdomains() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Subdomains" 
        description="Manage subdomains across all your hosted websites."
      />
      <SubdomainsList />
    </div>
  );
}
