import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  permission: string;
  category: string;
  defaultPayload?: string;
  description: string;
}

export const SwaggerRbacView: React.FC = () => {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const [filterOnlyAssigned, setFilterOnlyAssigned] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [testPayload, setTestPayload] = useState<string>('{}');
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Catálogo completo de endpoints mapeados con sus permisos declarados en @RequirePermissions
  const endpoints: ApiEndpoint[] = [
    {
      id: 'auth-login',
      method: 'POST',
      path: '/auth/login',
      summary: 'Iniciar sesión y obtener JWT',
      permission: 'public',
      category: 'Autenticación',
      defaultPayload: '{\n  "username": "admin",\n  "password": "••••••••"\n}',
      description: 'Genera el token de acceso JWT con claims de rol y permisos asociados.',
    },
    {
      id: 'leads-read',
      method: 'GET',
      path: '/leads',
      summary: 'Consultar leads unificados (Meta + TikTok)',
      permission: 'leads.list',
      category: 'Leads',
      description: 'Devuelve la lista paginada de leads con filtros por plataforma y rango de fechas.',
    },
    {
      id: 'leads-export',
      method: 'GET',
      path: '/leads/export',
      summary: 'Exportar leads a CSV',
      permission: 'leads.export',
      category: 'Leads',
      description: 'Descarga un archivo CSV con hasta 5,000 registros ordenados cronológicamente.',
    },
    {
      id: 'meta-campaigns-read',
      method: 'GET',
      path: '/meta-ads/campaigns',
      summary: 'Listar campañas de Meta Ads',
      permission: 'meta.campaigns.list',
      category: 'Meta Ads',
      description: 'Obtiene las campañas de Meta guardadas en base de datos.',
    },
    {
      id: 'meta-campaigns-sync',
      method: 'POST',
      path: '/meta-ads/campaigns/sync',
      summary: 'Sincronizar campañas desde Meta Graph API',
      permission: 'meta.campaigns.sync',
      category: 'Meta Ads',
      defaultPayload: '{\n  "adAccountId": ""\n}',
      description: 'Descarga las campañas de la cuenta publicitaria Meta (toma .env si está vacío).',
    },
    {
      id: 'meta-leads-sync',
      method: 'POST',
      path: '/meta-ads/campaigns/leads/sync',
      summary: 'Sincronizar leads de todas las campañas de Meta',
      permission: 'meta.leads.sync',
      category: 'Meta Ads',
      defaultPayload: '{\n  "campaignId": ""\n}',
      description: 'Itera sobre las campañas de Meta y descarga e inserta sus leads en la tabla leads.',
    },
    {
      id: 'tiktok-campaigns-read',
      method: 'GET',
      path: '/tiktok-ads/campaigns',
      summary: 'Listar campañas de TikTok Ads',
      permission: 'tiktok.campaigns.list',
      category: 'TikTok Ads',
      description: 'Obtiene las campañas de TikTok guardadas en la base de datos.',
    },
    {
      id: 'tiktok-campaigns-sync',
      method: 'POST',
      path: '/tiktok-ads/campaigns/sync',
      summary: 'Sincronizar campañas de TikTok Ads',
      permission: 'tiktok.campaigns.sync',
      category: 'TikTok Ads',
      defaultPayload: '{\n  "advertiserId": ""\n}',
      description: 'Descarga las campañas desde TikTok Marketing API hacia la base de datos.',
    },
    {
      id: 'swagger-status',
      method: 'GET',
      path: '/platform-credentials/swagger/status',
      summary: 'Verificar acceso y estado de Swagger RBAC',
      permission: 'swagger.read',
      category: 'Plataforma',
      description: 'Valida los permisos RBAC para consumo interactivo de APIs.',
    },
    {
      id: 'sync-schedules-read',
      method: 'GET',
      path: '/sync-schedules',
      summary: 'Consultar programación del Crontab en BD',
      permission: 'sync.schedules.read',
      category: 'Crontab Scheduler',
      description: 'Obtiene la configuración activa del cron, la expresión y la próxima ejecución.',
    },
    {
      id: 'sync-schedules-update',
      method: 'PUT',
      path: '/sync-schedules',
      summary: 'Actualizar configuración del Crontab y reprogramar',
      permission: 'sync.schedules.update',
      category: 'Crontab Scheduler',
      defaultPayload: '{\n  "daysOfWeek": [1, 2, 3, 4, 5],\n  "hour": 8,\n  "minute": 30,\n  "isEnabled": true,\n  "syncMeta": true,\n  "syncTikTok": true,\n  "syncLeads": true\n}',
      description: 'Guarda nuevos días/horas en PostgreSQL y actualiza el cron en memoria de inmediato.',
    },
    {
      id: 'sync-schedules-trigger',
      method: 'POST',
      path: '/sync-schedules/trigger',
      summary: 'Disparar sincronización manual bajo demanda',
      permission: 'sync.schedules.trigger',
      category: 'Crontab Scheduler',
      defaultPayload: '{}',
      description: 'Ejecuta en este instante la sincronización completa de campañas y leads.',
    },
    {
      id: 'sync-schedules-logs',
      method: 'GET',
      path: '/sync-schedules/logs',
      summary: 'Consultar logs de ejecución del cron',
      permission: 'sync.schedules.logs.read',
      category: 'Crontab Scheduler',
      description: 'Historial de corridas automáticas y manuales con métricas de éxito y error.',
    },
  ];

  const visibleEndpoints = endpoints.filter((ep) => {
    if (ep.permission === 'public') return true;
    const allowed = hasPermission(ep.permission);
    if (filterOnlyAssigned) return allowed;
    return true;
  });

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setTestPayload(ep.defaultPayload || '{}');
    setResponseOutput(null);
  };

  const handleExecuteRequest = async () => {
    if (!selectedEndpoint) return;
    setLoading(true);
    setResponseOutput(null);

    try {
      let res;
      if (selectedEndpoint.method === 'GET') {
        res = await api.get(selectedEndpoint.path);
      } else if (selectedEndpoint.method === 'POST') {
        const body = testPayload ? JSON.parse(testPayload) : {};
        res = await api.post(selectedEndpoint.path, body);
      } else if (selectedEndpoint.method === 'PUT') {
        const body = testPayload ? JSON.parse(testPayload) : {};
        res = await api.put(selectedEndpoint.path, body);
      } else if (selectedEndpoint.method === 'DELETE') {
        res = await api.delete(selectedEndpoint.path);
      }

      setResponseOutput({
        status: res?.status,
        statusText: res?.statusText,
        data: res?.data,
      });
    } catch (err: any) {
      setResponseOutput({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        error: err.response?.data || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>APIs Asignadas (Swagger RBAC Dinámico)</h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Catálogo interactivo de endpoints OpenAPI filtrado según los permisos asignados a tu rol: {user?.role}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: '#f8f9fa',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #edf0f2',
            }}
          >
            <input
              type="checkbox"
              checked={filterOnlyAssigned}
              onChange={(e) => setFilterOnlyAssigned(e.target.checked)}
              style={{ accentColor: '#0052cc' }}
            />
            <span style={{ fontWeight: 600 }}>Solo APIs asignadas a mi rol</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px' }}>
        {/* Endpoints List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visibleEndpoints.map((ep) => {
            const hasAccess = ep.permission === 'public' || hasPermission(ep.permission);
            const isSelected = selectedEndpoint?.id === ep.id;

            return (
              <div
                key={ep.id}
                onClick={() => handleSelectEndpoint(ep)}
                style={{
                  border: isSelected ? '1px solid #0052cc' : '1px solid #edf0f2',
                  backgroundColor: isSelected ? '#fbfcfd' : '#ffffff',
                  borderRadius: '6px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 0 1px #0052cc' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        fontSize: '12px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          ep.method === 'GET'
                            ? '#e3fcef'
                            : ep.method === 'POST'
                            ? '#deebff'
                            : ep.method === 'PUT'
                            ? '#fff0b3'
                            : '#ffebe6',
                        color:
                          ep.method === 'GET'
                            ? '#00875a'
                            : ep.method === 'POST'
                            ? '#0052cc'
                            : ep.method === 'PUT'
                            ? '#ff991f'
                            : '#de350b',
                      }}
                    >
                      {ep.method}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13.5px', fontWeight: 600, color: '#1a1c1c' }}>
                      {ep.path}
                    </span>
                  </div>

                  <span className={`badge-status ${hasAccess ? 'success' : 'error'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      {hasAccess ? 'check' : 'lock'}
                    </span>
                    {hasAccess ? 'Acceso Autorizado' : 'Requiere Permiso'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#434654', marginBottom: '6px' }}>{ep.summary}</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#737685' }}>
                  <span>
                    Permiso requerido: <strong style={{ fontFamily: 'JetBrains Mono' }}>{ep.permission}</strong>
                  </span>
                  <span>•</span>
                  <span>Módulo: {ep.category}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* API Interactive Tester Drawer */}
        <div className="precision-card" style={{ height: 'fit-content', position: 'sticky', top: '88px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
              play_circle
            </span>
            Probador Interactivo de API (Try It Out)
          </h3>

          {selectedEndpoint ? (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#737685', textTransform: 'uppercase', fontWeight: 700 }}>
                  ENDPOINT SELECCIONADO
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '13px', marginTop: '4px' }}>
                  {selectedEndpoint.method} {selectedEndpoint.path}
                </div>
                <div style={{ fontSize: '12.5px', color: '#5c6270', marginTop: '4px' }}>
                  {selectedEndpoint.description}
                </div>
              </div>

              {selectedEndpoint.method !== 'GET' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '6px' }}>
                    JSON REQUEST BODY
                  </label>
                  <textarea
                    rows={6}
                    className="precision-input font-mono"
                    style={{ fontSize: '12px', resize: 'vertical' }}
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                  />
                </div>
              )}

              <button
                onClick={handleExecuteRequest}
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {loading ? 'sync' : 'send'}
                </span>
                {loading ? 'Ejecutando llamada...' : 'Enviar Petición con JWT'}
              </button>

              {/* Response Output */}
              {responseOutput && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase' }}>
                      RESPUESTA
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 700,
                        color: responseOutput.status < 400 ? '#00875a' : '#ba1a1a',
                      }}
                    >
                      Status: {responseOutput.status} {responseOutput.statusText}
                    </span>
                  </div>

                  <pre
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #edf0f2',
                      borderRadius: '4px',
                      padding: '12px',
                      fontSize: '11.5px',
                      fontFamily: 'JetBrains Mono, monospace',
                      overflowX: 'auto',
                      maxHeight: '260px',
                      color: '#1a1c1c',
                    }}
                  >
                    {JSON.stringify(responseOutput.data || responseOutput.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#737685', fontSize: '13px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#c3c6d6', marginBottom: '8px' }}>
                touch_app
              </span>
              <div>Selecciona un endpoint del catálogo de la izquierda para probarlo en vivo.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
