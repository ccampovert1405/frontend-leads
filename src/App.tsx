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

export const App: React.FC = () => {
  const { isAuthenticated, isSuperAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const isAdmin = isSuperAdmin || user?.role?.toLowerCase().includes('admin');

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView initialSubTab="executive" />}
      {activeTab === 'tactical' && <DashboardView initialSubTab="tactical" />}
      {activeTab === 'creatives' && <DashboardView initialSubTab="creatives" />}
      {activeTab === 'matrix' && <DashboardView initialSubTab="matrix" />}
      {activeTab === 'leads' && <LeadsView />}
      {activeTab === 'campaigns' && <CampaignsView />}
      {activeTab === 'scheduler' && <SyncScheduleView />}
      {activeTab === 'swagger' && <SwaggerRbacView />}

      {/* Vistas restringidas exclusivamente para Administradores */}
      {activeTab === 'users' && (isAdmin ? <UsersManagementView /> : <DashboardView initialSubTab="executive" />)}
      {activeTab === 'roles' && (isAdmin ? <RolesManagementView /> : <DashboardView initialSubTab="executive" />)}
      {activeTab === 'permissions' && (isAdmin ? <PermissionsManagementView /> : <DashboardView initialSubTab="executive" />)}
      {activeTab === 'menus' && (isAdmin ? <MenusManagementView /> : <DashboardView initialSubTab="executive" />)}
    </AppLayout>
  );
};

export default App;
