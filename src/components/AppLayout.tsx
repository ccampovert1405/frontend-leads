import React from 'react';
import { useAuth } from '../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'tactical'
  | 'creatives'
  | 'matrix'
  | 'leads'
  | 'campaigns'
  | 'scheduler'
  | 'swagger'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'menus';

interface AppLayoutProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { user, logout, hasPermission, isSuperAdmin } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Definición de ítems del menú con permisos estilo Petra
  const menuSections = [
    {
      title: 'Reportes Power BI & Growth',
      adminOnly: false,
      items: [
        {
          id: 'dashboard' as NavigationTab,
          label: 'Vista Ejecutiva C-Suite',
          icon: 'monitoring',
          permission: null, // Visible para todos
        },
        {
          id: 'tactical' as NavigationTab,
          label: 'Vista Táctica Meta vs TikTok',
          icon: 'compare_arrows',
          permission: null,
        },
        {
          id: 'creatives' as NavigationTab,
          label: 'Creativos & Audiencias',
          icon: 'campaign',
          permission: null,
        },
        {
          id: 'matrix' as NavigationTab,
          label: 'Matriz de Decisiones',
          icon: 'rule',
          permission: null,
        },
      ],
    },
    {
      title: 'Operaciones de Adquisición',
      adminOnly: false,
      items: [
        {
          id: 'leads' as NavigationTab,
          label: 'Leads Unificados',
          icon: 'contacts',
          permission: 'leads.read',
        },
        {
          id: 'campaigns' as NavigationTab,
          label: 'Campañas Publicitarias',
          icon: 'ads_click',
          permission: 'meta.campaigns.read',
        },
        {
          id: 'scheduler' as NavigationTab,
          label: 'Programación Crontab',
          icon: 'schedule',
          permission: 'sync.schedules.read',
        },
      ],
    },
    {
      title: 'Seguridad & Control de Acceso',
      adminOnly: true, // Visible exclusivamente para Super Administrador / Administrador
      items: [
        {
          id: 'users' as NavigationTab,
          label: 'Gestión de Usuarios',
          icon: 'manage_accounts',
          permission: 'users.read',
        },
        {
          id: 'roles' as NavigationTab,
          label: 'Roles & Autorizaciones',
          icon: 'admin_panel_settings',
          permission: 'roles.read',
        },
        {
          id: 'permissions' as NavigationTab,
          label: 'Catálogo de Permisos',
          icon: 'key',
          permission: 'permissions.read',
        },
        {
          id: 'menus' as NavigationTab,
          label: 'Gestión de Menús',
          icon: 'menu_open',
          permission: 'menus.read',
        },
      ],
    },
    {
      title: 'Plataforma & Integraciones',
      adminOnly: false,
      items: [
        {
          id: 'swagger' as NavigationTab,
          label: 'APIs Asignadas (Swagger RBAC)',
          icon: 'api',
          permission: null, // Siempre visible para ver sus APIs permitidas
        },
      ],
    },
  ];


  return (
    <div className="app-layout-root">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-sidebar-backdrop ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${isMobileOpen ? 'is-mobile-open' : ''}`}>
        {/* Brand Header */}
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid #edf0f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#0052cc',
                color: '#ffffff',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                insights
              </span>
            </div>
            <div>
              <div style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontWeight: 800, fontSize: '15px', color: '#1a1c1c' }}>
                Growth Intelligence
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#737685', letterSpacing: '0.04em' }}>
                PRODUCTIVE PRECISION
              </div>
            </div>
          </div>

          <button
            className="mobile-sidebar-close"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Cerrar navegación"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              close
            </span>
          </button>
        </div>

        {/* Menu Navigation Items (Filtered by RBAC like Petra) */}
        <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {menuSections.map((section, idx) => {
            // Ocultar sección completa si es exclusiva de administración y el usuario no es admin/superadmin
            if (section.adminOnly && !isSuperAdmin && !user?.role?.toLowerCase().includes('admin')) {
              return null;
            }

            // Filtrar ítems que el usuario tiene permitido ver
            const visibleItems = section.items.filter((item) => {
              if (!item.permission) return true;
              return hasPermission(item.permission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#737685',
                    padding: '0 12px 8px 12px',
                    letterSpacing: '0.06em',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {section.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {visibleItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '4px',
                          border: isActive ? '1px solid #bfd1ff' : '1px solid transparent',
                          backgroundColor: isActive ? '#f0f4ff' : 'transparent',
                          color: isActive ? '#0052cc' : '#1a1c1c',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: '20px',
                            color: isActive ? '#0052cc' : '#737685',
                          }}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Session & Logout Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #edf0f2',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: '#091e42',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1c1c' }}>{user?.username}</div>
                <div
                  style={{
                    fontSize: '10.5px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: isSuperAdmin ? '#0052cc' : '#737685',
                  }}
                >
                  {user?.role}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '7px 12px',
              fontSize: '12.5px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              logout
            </span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-content-wrapper">
        {/* Topbar */}
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              className="mobile-hamburger-btn"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Abrir Menú de Navegación"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                menu
              </span>
            </button>

            <div className="app-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ fontSize: '12px', color: '#737685', fontFamily: 'JetBrains Mono, monospace' }}>
                SISTEMA
              </span>
              <span style={{ color: '#c3c6d6' }}>/</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1a1c1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeTab === 'dashboard' && 'Vista Ejecutiva C-Suite'}
                {activeTab === 'tactical' && 'Vista Táctica (Meta vs. TikTok)'}
                {activeTab === 'creatives' && 'Creativos & Audiencias'}
                {activeTab === 'matrix' && 'Matriz de Decisiones'}
                {activeTab === 'leads' && 'Leads Unificados'}
                {activeTab === 'campaigns' && 'Campañas Publicitarias'}
                {activeTab === 'scheduler' && 'Configuración Crontab'}
                {activeTab === 'swagger' && 'APIs Asignadas (RBAC)'}
                {activeTab === 'users' && 'Gestión de Usuarios'}
                {activeTab === 'roles' && 'Roles & Permisos'}
                {activeTab === 'permissions' && 'Catálogo de Permisos'}
                {activeTab === 'menus' && 'Gestión de Menús'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {hasPermission('sync.schedules.trigger') && (
              <button
                onClick={() => setActiveTab('scheduler')}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0052cc' }}>
                  sync
                </span>
                <span className="hide-on-mobile">Gestor Crontab</span>
              </button>
            )}

            <div
              className="badge-status info"
              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                verified_user
              </span>
              <span style={{ maxWidth: '105px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Body */}
        <main className="app-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
