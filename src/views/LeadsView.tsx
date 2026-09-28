import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL, geoApi, dependenciasApi, ProvinciaDto, DependenciaDto } from '../services/api';
import { useAppToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SystemConfigBanner } from '../components/SystemConfigBanner';
import { LeadFormsView } from './LeadFormsView';

interface LeadItem {
  id: string;
  source: 'meta' | 'tiktok' | 'META' | 'TIKTOK';
  sourceLeadId: string;
  sourceCampaignId?: string | null;
  campaignId: string | null;
  rawPayload?: any;
  formName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  cedula?: string | null;
  submissionCount?: number;
  ciudadDeclarada?: string | null;
  contactPreference?: string | null;
  idCanton?: number | null;
  idProvincia?: number | null;
  idDependencia?: string | null;
  lastSubmissionAt?: string | null;
  canton?: { id: number; nombre: string } | null;
  provincia?: { id: number; nombre: string } | null;
  dependencia?: { id: string; nombre: string; codigo?: string | null } | null;
  receivedAt: string;
  createdAt: string;
}

interface LeadsViewProps {
  onNavigateToVariables?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ onNavigateToVariables }) => {
  const { isSuperAdmin } = useAuth();
  const toast = useAppToast();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [provincias, setProvincias] = useState<ProvinciaDto[]>([]);
  const [dependencias, setDependencias] = useState<DependenciaDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'META' | 'TIKTOK'>('ALL');
  const [provinciaFilter, setProvinciaFilter] = useState<number | ''>('');
  const [dependenciaFilter, setDependenciaFilter] = useState<string>('');
  const [contactPrefFilter, setContactPrefFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);

  // Estados del sistema y navegación
  const [canExtractLeads, setCanExtractLeads] = useState<boolean>(true);
  const [syncing, setSyncing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'forms'>('leads');

  // Modal de Detalle
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [showRawPayload, setShowRawPayload] = useState(false);

  const getLeadCampaignId = (l: LeadItem): string | null => {
    return l.sourceCampaignId || l.campaignId || l.rawPayload?.campaign_id || null;
  };

  // Cargar catálogo de provincias y dependencias para los filtros
  useEffect(() => {
    geoApi.getProvincias().then((res) => {
      const data = (res.data as any)?.data || res.data;
      setProvincias(Array.isArray(data) ? data : []);
    }).catch((err) => console.error('Error al cargar provincias:', err));

    dependenciasApi.getAll().then((res) => {
      const data = (res.data as any)?.data || res.data;
      setDependencias(Array.isArray(data) ? data : []);
    }).catch((err) => console.error('Error al cargar dependencias:', err));
  }, []);

  // Consultar estado de configuración del sistema
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

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: any = { pageSize: 100 };
      if (sourceFilter !== 'ALL') {
        params.source = sourceFilter;
      }
      if (provinciaFilter !== '') {
        params.provinciaId = Number(provinciaFilter);
      }
      if (dependenciaFilter) {
        params.dependenciaId = dependenciaFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await api.get('/leads', { params });
      const data = res.data.data || res.data;
      setLeads(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Error al cargar leads:', err);
      const rawMsg = err.response?.data?.message;
      const errMsg = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : rawMsg || 'No se pudieron consultar los prospectos desde la base de datos.';
      toast.showError('Error al Cargar Leads', errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    fetchLeads();
  }, [sourceFilter, provinciaFilter, dependenciaFilter]);

  const handleExportCsv = () => {
    if (!canExtractLeads && !isSuperAdmin) {
      toast.showWarn(
        'Extracción de Leads Bloqueada',
        'Las variables de entorno de Meta Ads y TikTok Ads no están configuradas en el sistema. Debe comunicarse con el Administrador para configurar las variables y poder extraer los leads.'
      );
      return;
    }

    const token = localStorage.getItem('token');
    let url = `${API_BASE_URL}/v1/leads/export?token=${token}`;
    if (sourceFilter !== 'ALL') url += `&source=${sourceFilter}`;
    if (provinciaFilter !== '') url += `&provinciaId=${provinciaFilter}`;
    if (dependenciaFilter) url += `&dependenciaId=${dependenciaFilter}`;
    if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;

    window.open(url, '_blank');
    toast.showInfo('Descarga de Leads', 'Generando y descargando archivo CSV consolidado...');
  };

  const handleSyncLeads = async () => {
    if (!canExtractLeads && !isSuperAdmin) {
      toast.showWarn(
        'Sincronización Bloqueada',
        'Las credenciales de las plataformas no están activas o configuradas. Comuníquese con el Administrador.'
      );
      return;
    }

    setSyncing(true);
    try {
      // Ejecutar sincronización unificada del crontab (Meta Ads y TikTok Ads)
      try {
        const triggerRes = await api.post('/sync-schedules/trigger');
        const data = triggerRes.data?.data || triggerRes.data;
        toast.showSuccess(
          'Sincronización Unificada Exitosa',
          `Sincronización completada: ${data.metaLeads ?? 0} leads de Meta guardados y campañas sincronizadas.`
        );
      } catch (triggerErr: any) {
        // Fallback a sincronización directa de leads de Meta si no tiene permiso de crontab
        const metaRes = await api.post('/meta-ads/campaigns/leads/sync');
        const data = metaRes.data?.data || metaRes.data;
        toast.showSuccess(
          'Sincronización Exitosa',
          `Se procesaron ${data.leadsFetched || 0} prospectos (${data.leadsSaved || 0} guardados/actualizados en base de datos).`
        );
      }
      fetchLeads();
    } catch (err: any) {
      console.error('Error al sincronizar leads:', err);
      const rawMsg = err.response?.data?.message;
      const errMsg = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : rawMsg || 'Ocurrió un error al ejecutar la sincronización unificada.';
      toast.showError('Error de Sincronización', errMsg);
    } finally {
      setSyncing(false);
    }
  };

  // Filtrado local por término de búsqueda y canal de contacto
  const filteredLeads = leads.filter((l) => {
    if (contactPrefFilter !== 'ALL') {
      const pref = (l.contactPreference || '').toLowerCase();
      if (contactPrefFilter === 'whatsapp' && !pref.includes('whatsapp')) return false;
      if (contactPrefFilter === 'call' && !pref.includes('llamada') && !pref.includes('telefono') && !pref.includes('phone')) return false;
      if (contactPrefFilter === 'email' && !pref.includes('correo') && !pref.includes('email')) return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const campId = getLeadCampaignId(l);
    return (
      (l.fullName && l.fullName.toLowerCase().includes(term)) ||
      (l.email && l.email.toLowerCase().includes(term)) ||
      (l.phone && l.phone.includes(term)) ||
      (l.cedula && l.cedula.includes(term)) ||
      (l.ciudadDeclarada && l.ciudadDeclarada.toLowerCase().includes(term)) ||
      (l.provincia?.nombre && l.provincia.nombre.toLowerCase().includes(term)) ||
      (l.dependencia?.nombre && l.dependencia.nombre.toLowerCase().includes(term)) ||
      (campId && campId.toLowerCase().includes(term)) ||
      (l.formName && l.formName.toLowerCase().includes(term))
    );
  });

  // Métricas para KPI Cards
  const totalMeta = leads.filter((l) => l.source?.toUpperCase() === 'META').length;
  const totalTikTok = leads.filter((l) => l.source?.toUpperCase() === 'TIKTOK').length;
  const conDependencia = leads.filter((l) => !!l.dependencia).length;
  const recurrentes = leads.filter((l) => (l.submissionCount || 1) > 1).length;

  // Dependencias filtradas por provincia para el selector en cascada
  const dependenciasDisponibles = provinciaFilter !== ''
    ? dependencias.filter((d) => d.idProvincia === Number(provinciaFilter))
    : dependencias;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner de bloqueo si faltan credenciales */}
      <SystemConfigBanner onNavigateToVariables={onNavigateToVariables} onStatusLoaded={(st) => setCanExtractLeads(st.canExtractLeads)} />

      {/* Subtab Switcher */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #edf0f2',
          gap: '8px',
          paddingBottom: '0px',
        }}
      >
        <button
          onClick={() => setActiveSubTab('leads')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: activeSubTab === 'leads' ? 700 : 500,
            color: activeSubTab === 'leads' ? '#0052cc' : '#5c6270',
            borderBottom: activeSubTab === 'leads' ? '2.5px solid #0052cc' : '2.5px solid transparent',
            marginBottom: '-2px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            contacts
          </span>
          Leads Capturados ({total})
        </button>

        <button
          onClick={() => setActiveSubTab('forms')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: activeSubTab === 'forms' ? 700 : 500,
            color: activeSubTab === 'forms' ? '#0052cc' : '#5c6270',
            borderBottom: activeSubTab === 'forms' ? '2.5px solid #0052cc' : '2.5px solid transparent',
            marginBottom: '-2px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            dynamic_form
          </span>
          Formularios de Captura
        </button>
      </div>

      {activeSubTab === 'forms' ? (
        <LeadFormsView
          onNavigateToVariables={onNavigateToVariables}
          onNavigateToLeads={() => {
            setActiveSubTab('leads');
            fetchLeads();
          }}
        />
      ) : (
        <>
          {/* Header de la Vista */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1a1c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '26px' }}>
                  badge
                </span>
                Gestión & Operaciones de Leads
              </h1>
              <p style={{ margin: '4px 0 0', color: '#5c6270', fontSize: '13.5px' }}>
                Base consolidada con deduplicación por cédula, normalización geográfica de provincias y asignación a dependencias para Meta Ads y TikTok Ads
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={fetchLeads}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #dcdfe4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#1a1c1c',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5c6270' }}>
                  refresh
                </span>
                Actualizar
              </button>

              <button
                onClick={handleSyncLeads}
                disabled={syncing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#0052cc',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 4px rgba(0, 82, 204, 0.2)',
                }}
                title="Sincronizar prospectos y campañas de forma unificada para Meta Ads y TikTok Ads"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '18px',
                    animation: syncing ? 'spin 1s infinite linear' : 'none',
                  }}
                >
                  {syncing ? 'sync' : 'cloud_sync'}
                </span>
                {syncing ? 'Sincronizando Leads...' : 'Sincronizar Leads'}
              </button>

              <button
                onClick={handleExportCsv}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  color: '#1a1c1c',
                  border: '1px solid #dcdfe4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  download
                </span>
                Exportar CSV
              </button>
            </div>
          </div>

          {/* KPI Cards con Indicadores de Dependencias y Recurrencia */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Total Registrados */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #edf0f2',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase' }}>
                  Total Registrados
                </span>
                <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '18px' }}>
                  group
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1a1c1c', marginTop: '6px' }}>{total}</div>
              <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '2px' }}>
                Prospectos en base de datos
              </div>
            </div>

            {/* Meta Ads */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #edf0f2',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase' }}>
                  Origen Meta Ads
                </span>
                <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '18px' }}>
                  campaign
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0052cc', marginTop: '6px' }}>{totalMeta}</div>
              <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '2px' }}>
                Facebook & Instagram
              </div>
            </div>

            {/* TikTok Ads */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #edf0f2',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase' }}>
                  Origen TikTok Ads
                </span>
                <span className="material-symbols-outlined" style={{ color: '#161823', fontSize: '18px' }}>
                  music_note
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#161823', marginTop: '6px' }}>{totalTikTok}</div>
              <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '2px' }}>
                Instant Forms TikTok
              </div>
            </div>

            {/* Asignación a Dependencia */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #edf0f2',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase' }}>
                  Con Dependencia
                </span>
                <span className="material-symbols-outlined" style={{ color: '#00875a', fontSize: '18px' }}>
                  store
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#00875a', marginTop: '6px' }}>
                {conDependencia}{' '}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#7a869a' }}>
                  ({total > 0 ? Math.round((conDependencia / total) * 100) : 0}%)
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '2px' }}>
                {total - conDependencia} sin agencia física
              </div>
            </div>

            {/* Prospectos Recurrentes */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #edf0f2',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase' }}>
                  Prospectos Recurrentes
                </span>
                <span className="material-symbols-outlined" style={{ color: '#ff9900', fontSize: '18px' }}>
                  repeat
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ff9900', marginTop: '6px' }}>
                {recurrentes}
              </div>
              <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '2px' }}>
                Enviaron formulario &gt; 1 vez
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros Avanzados */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '14px 18px',
              border: '1px solid #edf0f2',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Buscador */}
              <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8c919d',
                    fontSize: '18px',
                  }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar por cédula, nombre, email, teléfono, ciudad o campaña..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #dcdfe4',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#fbfbfb',
                  }}
                />
              </div>

              {/* Selector Plataforma */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0f2f5', padding: '3px', borderRadius: '8px' }}>
                <button
                  onClick={() => setSourceFilter('ALL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sourceFilter === 'ALL' ? '#0052cc' : 'transparent',
                    color: sourceFilter === 'ALL' ? '#ffffff' : '#475467',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Todos ({total})
                </button>
                <button
                  onClick={() => setSourceFilter('META')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sourceFilter === 'META' ? '#0052cc' : 'transparent',
                    color: sourceFilter === 'META' ? '#ffffff' : '#475467',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Meta Ads
                </button>
                <button
                  onClick={() => setSourceFilter('TIKTOK')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sourceFilter === 'TIKTOK' ? '#0052cc' : 'transparent',
                    color: sourceFilter === 'TIKTOK' ? '#ffffff' : '#475467',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  TikTok Ads
                </button>
              </div>
            </div>

            {/* Filtros Geográficos y Dependencia */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #f4f5f7' }}>
              {/* Filtro Provincia */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0052cc' }}>
                  map
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475467' }}>Provincia:</span>
                <select
                  value={provinciaFilter}
                  onChange={(e) => {
                    setProvinciaFilter(e.target.value ? Number(e.target.value) : '');
                    setDependenciaFilter('');
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #dcdfe4',
                    fontSize: '12.5px',
                    backgroundColor: '#fff',
                    color: '#1a1c1c',
                    outline: 'none',
                  }}
                >
                  <option value="">Todas las Provincias</option>
                  {provincias.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.provincia}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Dependencia */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#00875a' }}>
                  storefront
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475467' }}>Dependencia:</span>
                <select
                  value={dependenciaFilter}
                  onChange={(e) => setDependenciaFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #dcdfe4',
                    fontSize: '12.5px',
                    backgroundColor: '#fff',
                    color: '#1a1c1c',
                    outline: 'none',
                    maxWidth: '220px',
                  }}
                >
                  <option value="">Todas las Dependencias</option>
                  {dependenciasDisponibles.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} ({d.provincia?.provincia || 'Provincia'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Medio de Contacto */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#25d366' }}>
                  chat
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475467' }}>Preferencia:</span>
                <select
                  value={contactPrefFilter}
                  onChange={(e) => setContactPrefFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #dcdfe4',
                    fontSize: '12.5px',
                    backgroundColor: '#fff',
                    color: '#1a1c1c',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">Cualquier Canal</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="call">Llamada Telefónica</option>
                  <option value="email">Correo Electrónico</option>
                </select>
              </div>

              {(provinciaFilter !== '' || dependenciaFilter || contactPrefFilter !== 'ALL' || searchTerm) && (
                <button
                  onClick={() => {
                    setProvinciaFilter('');
                    setDependenciaFilter('');
                    setContactPrefFilter('ALL');
                    setSearchTerm('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#de350b',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    close
                  </span>
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabla Principal de Leads */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #edf0f2',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#737685' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1.2s linear infinite', color: '#0052cc' }}>
                  progress_activity
                </span>
                <p style={{ marginTop: '8px', fontSize: '13px' }}>Consultando leads y dependencias...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '42px', color: '#b0b5c1' }}>
                  person_search
                </span>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1c1c', marginTop: '6px' }}>
                  No se encontraron prospectos
                </div>
                <p style={{ fontSize: '13px', color: '#5c6270', marginTop: '4px' }}>
                  Prueba cambiando los filtros de provincia, dependencia o término de búsqueda.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #edf0f2' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                        Origen
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                        Prospecto / Cédula
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                        Contacto &amp; Canal
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                        Ubicación &amp; Dependencia
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                        Campaña / Formulario
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                        Fecha Captura
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>
                        Detalle
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => {
                      const isMeta = lead.source?.toUpperCase() === 'META';
                      const count = lead.submissionCount || 1;
                      const hasWhatsapp = (lead.contactPreference || '').toLowerCase().includes('whatsapp');
                      const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';

                      return (
                        <tr
                          key={lead.id}
                          style={{ borderBottom: '1px solid #edf0f2', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {/* Origen */}
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isMeta ? '#e8f1ff' : '#f3f4f6',
                                color: isMeta ? '#0052cc' : '#111827',
                                border: `1px solid ${isMeta ? '#bfd1ff' : '#e5e7eb'}`,
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                                {isMeta ? 'campaign' : 'music_note'}
                              </span>
                              {isMeta ? 'Meta Ads' : 'TikTok Ads'}
                            </span>
                          </td>

                          {/* Prospecto / Cédula / Conteo */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontWeight: 600, color: '#1a1c1c', fontSize: '13px' }}>
                                {lead.fullName || 'Sin Nombre'}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                {lead.cedula ? (
                                  <span
                                    title="Cédula de Identidad"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      backgroundColor: '#f0f2f5',
                                      color: '#344563',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontFamily: 'monospace',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                      badge
                                    </span>
                                    {lead.cedula}
                                  </span>
                                ) : (
                                  <span style={{ color: '#8c919d', fontSize: '11px' }}>Sin Cédula</span>
                                )}

                                {count > 1 && (
                                  <span
                                    title={`Este prospecto ha enviado el formulario ${count} veces`}
                                    style={{
                                      backgroundColor: '#fff0b3',
                                      color: '#8a6b00',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                    }}
                                  >
                                    🔁 {count} envíos
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Contacto & Canal */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {lead.email && (
                                <span style={{ color: '#475467', fontSize: '12px' }}>
                                  ✉️ {lead.email}
                                </span>
                              )}
                              {lead.phone && (
                                <span style={{ color: '#475467', fontSize: '12px', fontWeight: 500 }}>
                                  📞 {lead.phone}
                                </span>
                              )}
                              {lead.contactPreference && (
                                <div style={{ marginTop: '2px' }}>
                                  {hasWhatsapp ? (
                                    <a
                                      href={`https://wa.me/${cleanPhone}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Contactar directamente por WhatsApp"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        backgroundColor: '#e3fcef',
                                        color: '#00875a',
                                        padding: '1px 7px',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                        chat
                                      </span>
                                      WhatsApp
                                    </a>
                                  ) : (
                                    <span
                                      style={{
                                        backgroundColor: '#f4f5f7',
                                        color: '#5e6c84',
                                        padding: '1px 6px',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                      }}
                                    >
                                      Preferido: {lead.contactPreference}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Ubicación & Dependencia */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {/* Tag Provincia / Cantón */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                {lead.provincia?.nombre ? (
                                  <span
                                    style={{
                                      backgroundColor: '#deebff',
                                      color: '#0747a6',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontWeight: 600,
                                      fontSize: '11.5px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                                      location_on
                                    </span>
                                    {lead.provincia.nombre}
                                    {lead.canton?.nombre ? ` (${lead.canton.nombre})` : ''}
                                  </span>
                                ) : lead.ciudadDeclarada ? (
                                  <span style={{ fontSize: '11.5px', color: '#5e6c84' }}>
                                    📍 {lead.ciudadDeclarada}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11.5px', color: '#8c919d' }}>Sin ubicación</span>
                                )}
                              </div>

                              {/* Tag Dependencia */}
                              <div>
                                {lead.dependencia?.nombre ? (
                                  <span
                                    title="Dependencia / Agencia del cliente asignada"
                                    style={{
                                      backgroundColor: '#e3fcef',
                                      color: '#006644',
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                      store
                                    </span>
                                    {lead.dependencia.nombre}
                                  </span>
                                ) : (
                                  <span style={{ color: '#8993a4', fontSize: '11px', fontStyle: 'italic' }}>
                                    Sin Dependencia Asignada
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Campaña / Formulario */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {lead.formName && (
                                <span style={{ fontSize: '12.5px', color: '#1a1c1c', fontWeight: 500 }}>
                                  {lead.formName}
                                </span>
                              )}
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  color: '#737685',
                                  fontSize: '11px',
                                }}
                              >
                                {getLeadCampaignId(lead) ? `Campaña: ${getLeadCampaignId(lead)}` : 'Sin ID de Campaña'}
                              </span>
                            </div>
                          </td>

                          {/* Fecha Captura */}
                          <td style={{ padding: '12px 16px', color: '#475467', fontSize: '12px' }}>
                            {lead.receivedAt ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#8c919d' }}>
                                  schedule
                                </span>
                                <span>{new Date(lead.receivedAt).toLocaleString()}</span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Acción Ver Detalle */}
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedLead(lead)}
                              title="Ver detalle del prospecto"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #dfe1e6',
                                backgroundColor: '#ffffff',
                                color: '#0052cc',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                visibility
                              </span>
                              Detalle
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

          {/* Modal Pop-up: Detalle Completo del Lead */}
          {selectedLead && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(9, 30, 66, 0.54)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  maxWidth: '580px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header Modal */}
                <div
                  style={{
                    padding: '16px 22px',
                    borderBottom: '1px solid #edf0f2',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fafbfc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#0052cc' }}>
                      account_circle
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#172b4d' }}>
                        {selectedLead.fullName || 'Detalle del Prospecto'}
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#5e6c84' }}>
                        ID Origen: {selectedLead.sourceLeadId}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedLead(null);
                      setShowRawPayload(false);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b778c' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      close
                    </span>
                  </button>
                </div>

                {/* Contenido Modal */}
                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Tarjeta Datos Personales */}
                  <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', padding: '14px 16px', border: '1px solid #eaecf0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a869a', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Identificación &amp; Contacto
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#5e6c84', fontSize: '11.5px', display: 'block' }}>Cédula de Identidad:</span>
                        <strong style={{ color: '#172b4d', fontFamily: 'monospace', fontSize: '13.5px' }}>
                          {selectedLead.cedula || 'No registrada'}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: '#5e6c84', fontSize: '11.5px', display: 'block' }}>Envíos Formulario:</span>
                        <span
                          style={{
                            backgroundColor: (selectedLead.submissionCount || 1) > 1 ? '#fff0b3' : '#e8f1ff',
                            color: (selectedLead.submissionCount || 1) > 1 ? '#8a6b00' : '#0052cc',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '11.5px',
                          }}
                        >
                          {(selectedLead.submissionCount || 1)} vez/veces
                        </span>
                      </div>

                      <div>
                        <span style={{ color: '#5e6c84', fontSize: '11.5px', display: 'block' }}>Teléfono:</span>
                        <span style={{ color: '#172b4d', fontWeight: 500 }}>
                          {selectedLead.phone || 'No registrado'}
                        </span>
                      </div>

                      <div>
                        <span style={{ color: '#5e6c84', fontSize: '11.5px', display: 'block' }}>Correo Electrónico:</span>
                        <span style={{ color: '#172b4d', wordBreak: 'break-all' }}>
                          {selectedLead.email || 'No registrado'}
                        </span>
                      </div>
                    </div>

                    {selectedLead.phone && (
                      <div style={{ marginTop: '12px' }}>
                        <a
                          href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#25d366',
                            color: '#ffffff',
                            padding: '7px 14px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '12.5px',
                            fontWeight: 600,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            chat
                          </span>
                          Contactar por WhatsApp
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Tarjeta Geografía & Dependencia */}
                  <div style={{ backgroundColor: '#f0f5ff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #bfd1ff' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0052cc', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Ubicación &amp; Dependencia de Atención
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#5e6c84', fontSize: '11.5px', display: 'block' }}>Ciudad / Cantón declarado:</span>
                        <strong style={{ color: '#172b4d' }}>
                          {selectedLead.ciudadDeclarada || 'No especificada'}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: '#5e6c84', fontSize: '11.5px', display: 'block' }}>Provincia Mapeada:</span>
                        <span
                          style={{
                            backgroundColor: '#deebff',
                            color: '#0747a6',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '11.5px',
                          }}
                        >
                          {selectedLead.provincia?.nombre || 'No determinada'}
                        </span>
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#5e6c84', fontSize: '11.5px', display: 'block' }}>Dependencia Asignada:</span>
                        {selectedLead.dependencia?.nombre ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00875a' }}>
                              store
                            </span>
                            <strong style={{ color: '#00875a', fontSize: '13.5px' }}>
                              {selectedLead.dependencia.nombre}
                            </strong>
                            {selectedLead.dependencia.codigo && (
                              <span style={{ color: '#7a869a', fontSize: '11.5px', fontFamily: 'monospace' }}>
                                ({selectedLead.dependencia.codigo})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#8993a4', fontStyle: 'italic', fontSize: '12.5px' }}>
                            Sin dependencia asignada en esta provincia
                          </span>
                        )}
                      </div>

                      <div>
                        <span style={{ color: '#5e6c84', fontSize: '11.5px', display: 'block' }}>Preferencia de Contacto:</span>
                        <span style={{ color: '#172b4d', fontWeight: 600, textTransform: 'capitalize' }}>
                          {selectedLead.contactPreference || 'No indicada'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Origen de Pauta */}
                  <div style={{ fontSize: '12.5px', color: '#5e6c84', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>
                      <strong>Formulario:</strong> {selectedLead.formName || 'Sin formulario'}
                    </div>
                    <div>
                      <strong>Campaña ID:</strong> {getLeadCampaignId(selectedLead) || 'Sin ID'}
                    </div>
                    <div>
                      <strong>Fecha de Recepción:</strong> {new Date(selectedLead.receivedAt).toLocaleString()}
                    </div>
                    {selectedLead.lastSubmissionAt && (
                      <div>
                        <strong>Último Reingreso:</strong> {new Date(selectedLead.lastSubmissionAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Visor JSON Crudo */}
                  <div>
                    <button
                      onClick={() => setShowRawPayload(!showRawPayload)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0052cc',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        {showRawPayload ? 'expand_less' : 'expand_more'}
                      </span>
                      {showRawPayload ? 'Ocultar JSON crudo de Meta' : 'Ver payload original de Meta Ads (JSON)'}
                    </button>

                    {showRawPayload && (
                      <pre
                        style={{
                          marginTop: '8px',
                          backgroundColor: '#1e293b',
                          color: '#e2e8f0',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          overflowX: 'auto',
                          maxHeight: '200px',
                        }}
                      >
                        {JSON.stringify(selectedLead.rawPayload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Footer Modal */}
                <div
                  style={{
                    padding: '12px 22px',
                    borderTop: '1px solid #edf0f2',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    backgroundColor: '#fafbfc',
                  }}
                >
                  <button
                    onClick={() => {
                      setSelectedLead(null);
                      setShowRawPayload(false);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #dfe1e6',
                      backgroundColor: '#ffffff',
                      color: '#344563',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
