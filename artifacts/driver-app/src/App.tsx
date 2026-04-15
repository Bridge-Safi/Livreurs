import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

import RoleSelection from "@/pages/index";
import LivreurDashboard from "@/pages/livreur/index";
import LivreurLivraisons from "@/pages/livreur/livraisons";
import LivreurLivraisonDetail from "@/pages/livreur/livraison";
import LivreurProfil from "@/pages/livreur/profil";
import ChauffeurDashboard from "@/pages/chauffeur/index";
import ChauffeurTrajets from "@/pages/chauffeur/trajets";
import ChauffeurTrajetDetail from "@/pages/chauffeur/trajet";
import ChauffeurProfil from "@/pages/chauffeur/profil";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={RoleSelection} />
      
      {/* Livreur Routes */}
      <Route path="/livreur" component={LivreurDashboard} />
      <Route path="/livreur/livraisons" component={LivreurLivraisons} />
      <Route path="/livreur/livraison/:id" component={LivreurLivraisonDetail} />
      <Route path="/livreur/profil" component={LivreurProfil} />
      
      {/* Chauffeur Routes */}
      <Route path="/chauffeur" component={ChauffeurDashboard} />
      <Route path="/chauffeur/trajets" component={ChauffeurTrajets} />
      <Route path="/chauffeur/trajet/:id" component={ChauffeurTrajetDetail} />
      <Route path="/chauffeur/profil" component={ChauffeurProfil} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
