import React from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export type NavigationTab =
  | 'dashboard'
  | 'tactical'
  | 'creatives'
  | 'matrix'
  | 'leads'
  | 'campaigns'
  | 'lead-forms'
  | 'dependencias'
  | 'scheduler'
  | 'variables'
  | 'swagger'
  | 'tutorial'
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
  const { user, logout, hasPermission, isSuperAdmin, isAdmin } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [assignedRoutes, setAssignedRoutes] = React.useState<Set<string> | null>(null);

  // Cargar menús asignados dinámicamente desde el backend según el rol activo
  React.useEffect(() => {
    let isMounted = true;
    const loadMyMenus = async () => {
      try {
        const res = await api.get('/menus/my-menus');
        const data = res.data?.data || res.data || [];
        if (isMounted && Array.isArray(data)) {
          setAssignedRoutes(new Set(data.map((m: any) => m.ruta)));
        }
      } catch (err) {
        console.warn('No se pudieron cargar los menús asignados:', err);
      }
    };

    loadMyMenus();
    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  // Definición de ítems del menú con permisos estilo RBAC
  const menuSections = [
    {
      id: 'reports',
      title: 'Reportes & Analítica de Rendimiento',
      adminOnly: false,
      superAdminOnly: false,
      items: [
        {
          id: 'dashboard' as NavigationTab,
          label: 'Vista Ejecutiva C-Suite',
          icon: 'monitoring',
          permission: null,
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
      id: 'leads',
      title: 'Gestión & Operaciones de Leads',
      adminOnly: false,
      superAdminOnly: false,
      items: [
        {
          id: 'leads' as NavigationTab,
          label: 'Leads Unificados',
          icon: 'contacts',
          permission: 'leads.list',
        },
        {
          id: 'lead-forms' as NavigationTab,
          label: 'Formularios de Leads',
          icon: 'dynamic_form',
          permission: 'meta.leads.forms.list',
        },
        {
          id: 'dependencias' as NavigationTab,
          label: 'Dependencias & Sucursales',
          icon: 'store',
          permission: 'dependencias.list',
        },
        {
          id: 'campaigns' as NavigationTab,
          label: 'Campañas Publicitarias',
          icon: 'ads_click',
          permission: 'meta.campaigns.list',
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
      id: 'variables',
      title: 'Variables del Sistema',
      adminOnly: true,
      superAdminOnly: true, // Visible exclusivamente para el rol Super Administrador
      items: [
        {
          id: 'variables' as NavigationTab,
          label: 'Variables Meta & TikTok',
          icon: 'tune',
          permission: null,
        },
      ],
    },
    {
      id: 'security',
      title: 'Seguridad & Control de Acceso',
      adminOnly: true,
      superAdminOnly: false,
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
      id: 'platform',
      title: 'Plataforma & Integraciones',
      adminOnly: false,
      superAdminOnly: false,
      items: [
        {
          id: 'swagger' as NavigationTab,
          label: 'APIs Asignadas (Swagger RBAC)',
          icon: 'api',
          permission: 'swagger.read',
        },
        {
          id: 'tutorial' as NavigationTab,
          label: 'Tutorial para Obtener Variables',
          icon: 'menu_book',
          permission: null,
        },
      ],
    },
  ];

  // Estado del Acordeón para colapsar/expandir secciones
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    reports: true,
    leads: true,
    variables: true,
    security: true,
    platform: true,
  });

  // Asegurar que la sección que contiene el tab activo permanezca expandida
  React.useEffect(() => {
    const parentSection = menuSections.find((s) => s.items.some((it) => it.id === activeTab));
    if (parentSection) {
      setOpenSections((prev) => ({
        ...prev,
        [parentSection.id]: true,
      }));
    }
  }, [activeTab]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

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
            padding: '16px',
            borderBottom: '1px solid #edf0f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                backgroundColor: '#0052cc',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: '5px',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0, 82, 204, 0.25)',
              }}
            >
              <img
                src="/logo-white.png"
                alt="Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  fontWeight: 800,
                  fontSize: '14.5px',
                  color: '#1a1c1c',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Inteligencia Comercial
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '9.5px',
                  color: '#737685',
                  letterSpacing: '0.05em',
                  lineHeight: 1.3,
                  fontWeight: 600,
                }}
              >
                PRECISIÓN OPERATIVA
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

        {/* Menu Navigation Items with Accordion Behavior */}
        <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {menuSections.map((section) => {
            // Ocultar sección si es exclusiva de Super Administrador
            if (section.superAdminOnly && !isSuperAdmin) {
              return null;
            }

            // Ocultar sección si es exclusiva de Administrador y el usuario no es admin
            if (section.adminOnly && !isAdmin) {
              return null;
            }

            // Filtrar ítems que el usuario tiene asignados en BD y permitidos ver
            const visibleItems = section.items.filter((item) => {
              if (section.superAdminOnly && !isSuperAdmin) return false;
              if (section.adminOnly && !isAdmin) return false;

              // Si se cargaron los menús asignados por rol desde BD, verificar coincidencia de ruta
              if (assignedRoutes && !isSuperAdmin) {
                // El tutorial está disponible por defecto para cualquier rol
                if (item.id !== 'tutorial' && item.id !== 'lead-forms' && !assignedRoutes.has(item.id)) {
                  return false;
                }
              }

              if (!item.permission) return true;
              return hasPermission(item.permission);
            });

            if (visibleItems.length === 0) return null;

            const isOpen = !!openSections[section.id];

            return (
              <div key={section.id} style={{ marginBottom: '14px' }}>
                {/* Accordion Header */}
                <button
                  type="button"
                  className="sidebar-accordion-header"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                >
                  <span className="sidebar-accordion-title">{section.title}</span>
                  <span
                    className={`material-symbols-outlined sidebar-accordion-icon ${isOpen ? 'is-open' : ''
                      }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Accordion Items List */}
                {isOpen && (
                  <div className="sidebar-accordion-content">
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
                            padding: '9px 12px',
                            borderRadius: '4px',
                            border: isActive ? '1px solid #bfd1ff' : '1px solid transparent',
                            backgroundColor: isActive ? '#f0f4ff' : 'transparent',
                            color: isActive ? '#0052cc' : '#1a1c1c',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '13px',
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
                              fontSize: '19px',
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
                )}
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
                  backgroundColor: isSuperAdmin ? '#091e42' : '#0747a6',
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
                    fontWeight: 600,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: isSuperAdmin ? '#0052cc' : '#00875a',
                  }}
                >
                  {user?.role || 'Analista'}
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
                {activeTab === 'leads' && 'Gestión de Leads (Meta & TikTok)'}
                {activeTab === 'lead-forms' && 'Formularios de Captura de Leads'}
                {activeTab === 'dependencias' && 'Dependencias & Sucursales'}
                {activeTab === 'campaigns' && 'Campañas Publicitarias'}
                {activeTab === 'scheduler' && 'Configuración Crontab'}
                {activeTab === 'variables' && 'Variables del Sistema & Plataformas'}
                {activeTab === 'swagger' && 'APIs Asignadas (RBAC)'}
                {activeTab === 'users' && 'Gestión de Usuarios'}
                {activeTab === 'roles' && 'Roles & Permisos'}
                {activeTab === 'permissions' && 'Catálogo de Permisos'}
                {activeTab === 'menus' && 'Gestión de Menús'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div
              className="badge-status info"
              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                verified_user
              </span>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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


