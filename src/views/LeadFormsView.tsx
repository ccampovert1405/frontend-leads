import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAppToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SystemConfigBanner } from '../components/SystemConfigBanner';

export interface LeadFormItem {
  id: string;
  name: string;
  status: string;
  leadsCount: number;
  pageId: string;
  pageName: string;
  createdTime: string | null;
}

interface LeadFormsViewProps {
  onNavigateToVariables?: () => void;
  onNavigateToLeads?: () => void;
}

export const LeadFormsView: React.FC<LeadFormsViewProps> = ({
  onNavigateToVariables,
  onNavigateToLeads,
}) => {
  const { isSuperAdmin } = useAuth();
  const toast = useAppToast();
  const [forms, setForms] = useState<LeadFormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingFormId, setSyncingFormId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedPageId, setSelectedPageId] = useState<string>('ALL');
  const [canExtractLeads, setCanExtractLeads] = useState<boolean>(true);

  // Verificar estado de variables del sistema
  const checkSystemStatus = async () => {
    try {
      const res = await api.get('/platform-credentials/system-status');
      const data = res.data.data || res.data;
      if (data && typeof data.canExtractLeads === 'boolean') {
        setCanExtractLeads(data.canExtractLeads);
      }
    } catch {
      // Ignorar fallback
    }
  };

  const fetchForms = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedPageId !== 'ALL' && selectedPageId.trim().length > 0) {
        params.pageId = selectedPageId;
      }
      const res = await api.get('/meta-ads/campaigns/leads/forms', { params });
      const data = res.data.data || res.data;
      setForms(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al cargar formularios de Meta:', err);
      const rawMsg = err.response?.data?.message;
      const errMsg = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : rawMsg || 'No se pudieron consultar los formularios de Meta Ads.';
      toast.showError('Error al Cargar Formularios', errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    fetchForms();
  }, [selectedPageId]);

  const handleSyncLeads = async (pageId?: string, formId?: string) => {
    if (!canExtractLeads && !isSuperAdmin) {
      toast.showWarn(
        'Sincronización Bloqueada',
        'Las variables de entorno de Meta Ads y TikTok Ads no están configuradas en el sistema. Debe comunicarse con el Administrador para configurar las variables.'
      );
      return;
    }

    if (formId) {
      setSyncingFormId(formId);
    } else {
      setSyncing(true);
    }

    try {
      const payload: any = {};
      if (pageId) payload.pageId = pageId;

      const res = await api.post('/meta-ads/campaigns/leads/sync', payload);
      const data = res.data.data || res.data;
      toast.showSuccess(
        'Sincronización Completada',
        `Se han procesado ${data.leadsFetched ?? 0} prospectos (${data.leadsSaved ?? 0} nuevos guardados en BD).`
      );
      fetchForms();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      toast.showError('Error al Sincronizar Leads', errMsg);
    } finally {
      setSyncing(false);
      setSyncingFormId(null);
    }
  };

  const handleCopyId = (id: string, name: string) => {
    navigator.clipboard.writeText(id);
    toast.showInfo('ID Copiado', `El ID del formulario "${name}" ha sido copiado al portapapeles.`);
  };

  // Extraer lista única de páginas para el filtro
  const uniquePages = Array.from(
    new Map(forms.map((f) => [f.pageId, { id: f.pageId, name: f.pageName }])).values()
  );

  // Filtrado de formularios en memoria
  const filteredForms = forms.filter((f) => {
    if (statusFilter === 'ACTIVE' && f.status !== 'ACTIVE') return false;
    if (statusFilter === 'INACTIVE' && f.status === 'ACTIVE') return false;

    if (searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase();
      const matchName = f.name && f.name.toLowerCase().includes(term);
      const matchId = f.id && f.id.toLowerCase().includes(term);
      const matchPage = f.pageName && f.pageName.toLowerCase().includes(term);
      const matchPageId = f.pageId && f.pageId.toLowerCase().includes(term);
      if (!matchName && !matchId && !matchPage && !matchPageId) return false;
    }

    return true;
  });

  const totalLeadsAccumulated = forms.reduce((sum, f) => sum + (f.leadsCount || 0), 0);
  const activeFormsCount = forms.filter((f) => f.status === 'ACTIVE').length;

  return (
    <div>
      {/* Banner de Estado de Configuración del Sistema */}
      <SystemConfigBanner onNavigateToVariables={onNavigateToVariables} />

      {/* Header y Acciones Principales */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '28px', color: '#0052cc' }}
            >
              dynamic_form
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              Formularios de Lead Ads (Instant Forms)
            </h1>
          </div>
          <p style={{ color: '#5c6270', fontSize: '13.5px', marginTop: '4px' }}>
            Catálogo de formularios instantáneos de Meta Ads vinculados a tus Páginas de Facebook/Instagram
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onNavigateToLeads && (
            <button
              onClick={onNavigateToLeads}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '8px 14px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                contacts
              </span>
              Ver Leads Recibidos
            </button>
          )}

          <button
            onClick={fetchForms}
            disabled={loading}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 14px',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '18px',
                animation: loading ? 'spin 1s infinite linear' : 'none',
              }}
            >
              refresh
            </span>
            Actualizar
          </button>

          <button
            onClick={() => handleSyncLeads()}
            disabled={syncing || (!canExtractLeads && !isSuperAdmin)}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 16px',
              opacity: !canExtractLeads && !isSuperAdmin ? 0.6 : 1,
              cursor: !canExtractLeads && !isSuperAdmin ? 'not-allowed' : 'pointer',
            }}
            title={
              !canExtractLeads && !isSuperAdmin
                ? 'Variables de Meta Ads no configuradas'
                : 'Sincronizar prospectos de todos los formularios'
            }
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {syncing ? 'sync' : 'cloud_download'}
            </span>
            {syncing ? 'Sincronizando Leads...' : 'Sincronizar Todos los Leads'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="precision-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#737685', letterSpacing: '0.05em' }}>
              TOTAL FORMULARIOS
            </span>
            <span
              className="material-symbols-outlined"
              style={{ color: '#0052cc', backgroundColor: '#dae2ff', padding: '6px', borderRadius: '6px', fontSize: '20px' }}
            >
              description
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '10px', color: '#1a1c1c' }}>
            {forms.length}
          </div>
          <div style={{ fontSize: '12px', color: '#5c6270', marginTop: '4px' }}>
            En páginas autorizadas de Meta
          </div>
        </div>

        <div className="precision-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#737685', letterSpacing: '0.05em' }}>
              FORMULARIOS ACTIVOS
            </span>
            <span
              className="material-symbols-outlined"
              style={{ color: '#00875a', backgroundColor: '#e3fcef', padding: '6px', borderRadius: '6px', fontSize: '20px' }}
            >
              check_circle
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '10px', color: '#00875a' }}>
            {activeFormsCount}
          </div>
          <div style={{ fontSize: '12px', color: '#5c6270', marginTop: '4px' }}>
            Captando prospectos actualmente
          </div>
        </div>

        <div className="precision-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#737685', letterSpacing: '0.05em' }}>
              LEADS ACUMULADOS EN META
            </span>
            <span
              className="material-symbols-outlined"
              style={{ color: '#0052cc', backgroundColor: '#e6f0ff', padding: '6px', borderRadius: '6px', fontSize: '20px' }}
            >
              group
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '10px', color: '#0052cc' }}>
            {totalLeadsAccumulated.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#5c6270', marginTop: '4px' }}>
            Suma de leads_count en formularios
          </div>
        </div>

        <div className="precision-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#737685', letterSpacing: '0.05em' }}>
              PÁGINAS DETECTADAS
            </span>
            <span
              className="material-symbols-outlined"
              style={{ color: '#5c6270', backgroundColor: '#f0f2f5', padding: '6px', borderRadius: '6px', fontSize: '20px' }}
            >
              flag
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '10px', color: '#1a1c1c' }}>
            {uniquePages.length}
          </div>
          <div style={{ fontSize: '12px', color: '#5c6270', marginTop: '4px' }}>
            Páginas de Facebook vinculadas
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div
        className="precision-card"
        style={{
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8c919d',
              fontSize: '20px',
            }}
          >
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de formulario, ID o página..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              borderRadius: '6px',
              border: '1px solid #d2d7df',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {uniquePages.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#5c6270' }}>Página:</span>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d2d7df',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Todas las Páginas ({forms.length})</option>
              {uniquePages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#5c6270', marginRight: '4px' }}>
            Estado:
          </span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={statusFilter === st ? 'btn-primary' : 'btn-secondary'}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
              }}
            >
              {st === 'ALL' ? 'Todos' : st === 'ACTIVE' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Formularios */}
      <div className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#737685' }}>
            <span
              className="material-symbols-outlined"
              style={{ animation: 'spin 1s infinite linear', fontSize: '32px', color: '#0052cc' }}
            >
              sync
            </span>
            <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 500 }}>
              Consultando formularios de Meta Ads en tiempo real...
            </div>
          </div>
        ) : filteredForms.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '42px', color: '#c3c6d6' }}>
              dynamic_form
            </span>
            <div style={{ marginTop: '10px', fontSize: '15px', fontWeight: 600, color: '#1a1c1c' }}>
              No se encontraron formularios
            </div>
            <p style={{ fontSize: '13px', marginTop: '6px', color: '#5c6270' }}>
              {searchTerm
                ? 'Ningún formulario coincide con el criterio de búsqueda especificado.'
                : 'No se detectaron formularios instantáneos en las páginas asociadas al token configurado.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #edf0f2', textAlign: 'left' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475467' }}>
                    Formulario / Nombre
                  </th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475467' }}>
                    Página de Meta
                  </th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475467' }}>
                    Estado
                  </th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475467', textAlign: 'right' }}>
                    Leads Acumulados
                  </th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475467' }}>
                    Fecha de Creación
                  </th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475467', textAlign: 'center' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map((form) => {
                  const isThisSyncing = syncingFormId === form.id;
                  const isActive = form.status === 'ACTIVE';

                  return (
                    <tr
                      key={form.id}
                      style={{
                        borderBottom: '1px solid #edf0f2',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Formulario / Nombre & ID */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: '#dae2ff',
                              color: '#0052cc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              dynamic_form
                            </span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1a1c1c', fontSize: '13.5px' }}>
                              {form.name}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '2px',
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: '11px',
                                  color: '#737685',
                                  backgroundColor: '#f3f4f6',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                ID: {form.id}
                              </span>
                              <button
                                onClick={() => handleCopyId(form.id, form.name)}
                                title="Copiar ID del Formulario"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#8c919d',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: '14px' }}
                                >
                                  content_copy
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Página de Meta */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: '#1a1c1c' }}>
                            {form.pageName}
                          </span>
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '11px',
                              color: '#737685',
                            }}
                          >
                            Page ID: {form.pageId}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          className={`badge-status ${isActive ? 'success' : 'warning'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: isActive ? '#e3fcef' : '#f0f2f5',
                            color: isActive ? '#00875a' : '#5c6270',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isActive ? '#00875a' : '#8c919d',
                            }}
                          />
                          {isActive ? 'ACTIVO' : form.status || 'INACTIVO'}
                        </span>
                      </td>

                      {/* Leads Acumulados */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#e6f0ff',
                            color: '#0052cc',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '13px',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            group
                          </span>
                          {(form.leadsCount || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Fecha de Creación */}
                      <td style={{ padding: '14px 16px', color: '#5c6270', fontSize: '12.5px' }}>
                        {form.createdTime ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: '15px', color: '#8c919d' }}
                            >
                              calendar_today
                            </span>
                            <span>{new Date(form.createdTime).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleSyncLeads(form.pageId, form.id)}
                          disabled={isThisSyncing || syncing || (!canExtractLeads && !isSuperAdmin)}
                          className="btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: isThisSyncing ? 'wait' : 'pointer',
                          }}
                          title="Sincronizar prospectos captados por este formulario"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: '15px',
                              animation: isThisSyncing ? 'spin 1s infinite linear' : 'none',
                            }}
                          >
                            {isThisSyncing ? 'sync' : 'cloud_download'}
                          </span>
                          {isThisSyncing ? 'Sincronizando...' : 'Sincronizar Leads'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadFormsView;
