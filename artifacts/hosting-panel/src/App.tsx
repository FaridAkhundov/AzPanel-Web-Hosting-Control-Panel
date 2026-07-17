import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout/Layout';

import Dashboard from '@/pages/Dashboard';
import Domains from '@/pages/Domains';
import DomainManage from '@/pages/DomainManage';
import DnsRecords from '@/pages/DnsRecords';
import Subdomains from '@/pages/Subdomains';
import Databases from '@/pages/Databases';
import Emails from '@/pages/Emails';
import Ftp from '@/pages/Ftp';
import Ssl from '@/pages/Ssl';
import Users from '@/pages/Users';
import Backups from '@/pages/Backups';
import CronJobs from '@/pages/CronJobs';
import Services from '@/pages/Services';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/domains" component={Domains} />
        <Route path="/domains/:id/manage" component={DomainManage} />
        <Route path="/domains/:id/dns" component={DnsRecords} />
        <Route path="/subdomains" component={Subdomains} />
        <Route path="/databases" component={Databases} />
        <Route path="/emails" component={Emails} />
        <Route path="/ftp" component={Ftp} />
        <Route path="/ssl" component={Ssl} />
        <Route path="/users" component={Users} />
        <Route path="/backups" component={Backups} />
        <Route path="/cronjobs" component={CronJobs} />
        <Route path="/services" component={Services} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
