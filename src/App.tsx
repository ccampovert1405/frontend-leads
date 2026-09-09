import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';
import { AppLayout, NavigationTab } from './components/AppLayout';
import { DashboardView } from './views/DashboardView';
import { LeadsView } from './views/LeadsView';
import { CampaignsView } from './views/CampaignsView';
import { SyncScheduleView } from './views/SyncScheduleView';
import { SwaggerRbacView } from './views/SwaggerRbacView';
import { UsersManagementView } from './views/UsersManagementView';
import { RolesManagementView } from './views/RolesManagementView';
import { PermissionsManagementView } from './views/PermissionsManagementView';
import { MenusManagementView } from './views/MenusManagementView';
import { VariablesConfigView } from './views/VariablesConfigView';
import { TutorialVariablesView } from './views/TutorialVariablesView';

export const App: React.FC = () => {
  const { isAuthenticated, isSuperAdmin, isAdmin, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView initialSubTab="executive" />}
      {activeTab === 'tactical' && <DashboardView initialSubTab="tactical" />}
      {activeTab === 'creatives' && <DashboardView initialSubTab="creatives" />}
      {activeTab === 'matrix' && <DashboardView initialSubTab="matrix" />}
      {activeTab === 'leads' && <LeadsView onNavigateToVariables={() => setActiveTab('variables')} />}
      {activeTab === 'campaigns' && <CampaignsView onNavigateToVariables={() => setActiveTab('variables')} />}
      {activeTab === 'scheduler' && (isAdmin ? <SyncScheduleView onNavigateToVariables={() => setActiveTab('variables')} /> : <DashboardView initialSubTab="executive" />)}
      {activeTab === 'swagger' && (hasPermission('swagger.read') || isAdmin ? <SwaggerRbacView /> : <DashboardView initialSubTab="executive" />)}
      {activeTab === 'tutorial' && <TutorialVariablesView onNavigateToVariables={() => setActiveTab('variables')} />}

      {/* Vista restringida exclusivamente para Super Administrador */}
      {activeTab === 'variables' && (isSuperAdmin ? <VariablesConfigView onNavigateToTutorial={() => setActiveTab('tutorial')} /> : <DashboardView initialSubTab="executive" />)}

      {/* Vistas restringidas exclusivamente para Administradores */}
      {activeTab === 'users' && (isAdmin ? <UsersManagementView /> : <DashboardView initialSubTab="executive" />)}
      {activeTab === 'roles' && (isAdmin ? <RolesManagementView /> : <DashboardView initialSubTab="executive" />)}
      {activeTab === 'permissions' && (isAdmin ? <PermissionsManagementView /> : <DashboardView initialSubTab="executive" />)}
      {activeTab === 'menus' && (isAdmin ? <MenusManagementView /> : <DashboardView initialSubTab="executive" />)}
    </AppLayout>
  );
};

export default App;
