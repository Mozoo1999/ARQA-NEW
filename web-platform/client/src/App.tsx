import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages - lazy loaded for performance
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const ControlTower = lazy(() => import("./pages/ControlTower"));
const SmartPricingPage = lazy(() => import("./pages/smart-pricing/SmartPricingPage"));
const CommandsPage = lazy(() => import("./pages/commands/CommandsPage"));
const WhatsAppIntegrationPage = lazy(() => import("./pages/integrations/WhatsAppIntegrationPage"));
const OcrIntakePage = lazy(() => import("./pages/ocr/OcrIntakePage"));
const CompanyPage = lazy(() => import("./pages/organization/CompanyPage"));
const BranchesPage = lazy(() => import("./pages/organization/BranchesPage"));
const DepartmentsPage = lazy(() => import("./pages/organization/DepartmentsPage"));
const ProjectsPage = lazy(() => import("./pages/projects/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/projects/ProjectDetailPage"));
const SuppliersPage = lazy(() => import("./pages/suppliers/SuppliersPage"));
const SupplierDetailPage = lazy(() => import("./pages/suppliers/SupplierDetailPage"));
const PurchaseRequestsPage = lazy(() => import("./pages/procurement/PurchaseRequestsPage"));
const PurchaseRequestDetailPage = lazy(() => import("./pages/procurement/PurchaseRequestDetailPage"));
const CreatePurchaseRequestPage = lazy(() => import("./pages/procurement/PurchaseRequestsPage").then(m => ({ default: m.NewPurchaseRequestPage })));
const ArchitectureReviewsPage = lazy(() => import("./pages/governance/ArchitectureReviewsPage"));
const ArchitectureDecisionsPage = lazy(() => import("./pages/governance/ArchitectureDecisionsPage"));
const TraceabilityPage = lazy(() => import("./pages/governance/TraceabilityPage"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const ReportsExportPage = lazy(() => import("./pages/reports/ReportsExportPage"));
const ErdExplorerPage = lazy(() => import("./pages/erd/ErdExplorerPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={ControlTower} />
          <Route path="/smart-pricing" component={SmartPricingPage} />
          <Route path="/commands" component={CommandsPage} />
          <Route path="/integrations/whatsapp" component={WhatsAppIntegrationPage} />
          <Route path="/ocr" component={OcrIntakePage} />
          <Route path="/organization/company" component={CompanyPage} />
          <Route path="/organization/branches" component={BranchesPage} />
          <Route path="/organization/departments" component={DepartmentsPage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/projects/:id" component={ProjectDetailPage} />
          <Route path="/suppliers" component={SuppliersPage} />
          <Route path="/suppliers/:id" component={SupplierDetailPage} />
          <Route path="/procurement/requests" component={PurchaseRequestsPage} />
          <Route path="/procurement/requests/new" component={CreatePurchaseRequestPage} />
          <Route path="/procurement/requests/:id" component={PurchaseRequestDetailPage} />
          <Route path="/governance/reviews" component={ArchitectureReviewsPage} />
          <Route path="/governance/decisions" component={ArchitectureDecisionsPage} />
          <Route path="/governance/traceability" component={TraceabilityPage} />
          <Route path="/admin/users" component={UsersPage} />
          <Route path="/reports/export" component={ReportsExportPage} />
          <Route path="/erd/explorer" component={ErdExplorerPage} />
          <Route path="/admin/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-left" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
