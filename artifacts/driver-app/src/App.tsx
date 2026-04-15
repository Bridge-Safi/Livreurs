import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { registerServiceWorker } from "@/lib/push";
import { useEffect } from "react";

import RoleSelection from "@/pages/index";
import LivreurLogin from "@/pages/livreur/login";
import LivreurDashboard from "@/pages/livreur/index";
import LivreurLivraisons from "@/pages/livreur/livraisons";
import LivreurLivraisonDetail from "@/pages/livreur/livraison";
import LivreurProfil from "@/pages/livreur/profil";
import ChauffeurLogin from "@/pages/chauffeur/login";
import ChauffeurDashboard from "@/pages/chauffeur/index";
import ChauffeurTrajets from "@/pages/chauffeur/trajets";
import ChauffeurTrajetDetail from "@/pages/chauffeur/trajet";
import ChauffeurProfil from "@/pages/chauffeur/profil";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function LivreurGuard({ component: Component }: { component: React.ComponentType }) {
  const { livreur } = useAuth();
  if (!livreur) return <Redirect to="/livreur/login" />;
  return <Component />;
}

function ChauffeurGuard({ component: Component }: { component: React.ComponentType }) {
  const { chauffeur } = useAuth();
  if (!chauffeur) return <Redirect to="/chauffeur/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RoleSelection} />

      {/* Livreur Auth */}
      <Route path="/livreur/login" component={LivreurLogin} />

      {/* Livreur Routes (protected) */}
      <Route path="/livreur">{() => <LivreurGuard component={LivreurDashboard} />}</Route>
      <Route path="/livreur/livraisons">{() => <LivreurGuard component={LivreurLivraisons} />}</Route>
      <Route path="/livreur/livraison/:id">{() => <LivreurGuard component={LivreurLivraisonDetail} />}</Route>
      <Route path="/livreur/profil">{() => <LivreurGuard component={LivreurProfil} />}</Route>

      {/* Chauffeur Auth */}
      <Route path="/chauffeur/login" component={ChauffeurLogin} />

      {/* Chauffeur Routes (protected) */}
      <Route path="/chauffeur">{() => <ChauffeurGuard component={ChauffeurDashboard} />}</Route>
      <Route path="/chauffeur/trajets">{() => <ChauffeurGuard component={ChauffeurTrajets} />}</Route>
      <Route path="/chauffeur/trajet/:id">{() => <ChauffeurGuard component={ChauffeurTrajetDetail} />}</Route>
      <Route path="/chauffeur/profil">{() => <ChauffeurGuard component={ChauffeurProfil} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
