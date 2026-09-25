import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
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
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'META' | 'TIKTOK'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [canExtractLeads, setCanExtractLeads] = useState<boolean>(true);
  const [syncing, setSyncing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'forms'>('leads');

  const getLeadCampaignId = (l: LeadItem): string | null => {
    return l.sourceCampaignId || l.campaignId || l.rawPayload?.campaign_id || null;
  };

  // Consultar estado de configuraciÃ³n del sistema
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
      const params: any = { pageSize: 50 };
      if (sourceFilter !== 'ALL') {
        params.source = sourceFilter;
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
  }, [sourceFilter]);

  const handleExportCsv = () => {
    if (!canExtractLeads && !isSuperAdmin) {
      toast.showWarn(
        'ExtracciÃ³n de Leads Bloqueada',
        'Las variables de entorno de Meta Ads y TikTok Ads no estÃ¡n configuradas en el sistema. Debe comunicarse con el Administrador para configurar las variables y poder extraer los leads.'
      );
      return;
    }

    const token = localStorage.getItem('token');
    window.open(`${API_BASE_URL}/v1/leads/export?token=${token}`, '_blank');
    toast.showInfo('Descarga de Leads', 'Generando y descargando archivo CSV consolidado...');
  };

  const handleSyncMetaLeads = async () => {
    if (!canExtractLeads && !isSuperAdmin) {
      toast.showWarn(
        'ExtracciÃ³n de Leads Bloqueada',
        'Las variables de entorno de Meta Ads y TikTok Ads no estÃ¡n configuradas en el sistema. Debe comunicarse con el Administrador para configurar las variables y poder extraer los leads.'
      );
      return;
    }

    setSyncing(true);
    try {
      const res = await api.post('/meta-ads/campaigns/leads/sync');
      const data = res.data?.data || res.data;
      const fetched = data?.leadsFetched ?? 0;
      const saved = data?.leadsSaved ?? 0;
      toast.showSuccess(
        'SincronizaciÃ³n de Meta Exitosa',
        `Se extrajeron prospectos desde formularios y campaÃ±as de Meta Ads. Obtenidos: ${fetched} (${saved} guardados en base de datos).`
      );
      await fetchLeads();
    } catch (err: any) {
      console.error('Error al sincronizar leads de Meta:', err);
      const rawMsg = err.response?.data?.message;
      const errMsg = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : rawMsg || err.response?.data?.detail || 'No se pudieron sincronizar los prospectos desde Meta Ads.';
      toast.showError('Error en SincronizaciÃ³n', errMsg);
    } finally {
      setSyncing(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (l.fullName && l.fullName.toLowerCase().includes(term)) ||
      (l.email && l.email.toLowerCase().includes(term)) ||
      (l.phone && l.phone.includes(term)) ||
      ((getLeadCampaignId(l)) && getLeadCampaignId(l)!.toLowerCase().includes(term))
    );
  });

  const metaCount = leads.filter((l) => l.source?.toUpperCase() === 'META').length;
  const tiktokCount = leads.filter((l) => l.source?.toUpperCase() === 'TIKTOK').length;
  const verifiedContactCount = leads.filter((l) => Boolean(l.phone || l.email)).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Banner Informativo de Estado de Variables & Crontab */}
      <SystemConfigBanner onNavigateToVariables={onNavigateToVariables} />

      {/* Header Principal con Acciones */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '22px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#0052cc' }}>
              contacts
            </span>
            <h1 style={{ fontSize: '22px', margin: 0, fontWeight: 700 }}>GestiÃ³n & Operaciones de Leads</h1>
          </div>
          <p style={{ color: '#5c6270', fontSize: '13px', margin: 0 }}>
            Base consolidada y unificada de prospectos captados en Meta Ads y TikTok Ads
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => fetchLeads()}
            disabled={loading}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px' }}
            title="Recargar listado de prospectos"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '18px',
                animation: loading ? 'spin 1s linear infinite' : 'none',
              }}
            >
              sync
            </span>
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleSyncMetaLeads}
            disabled={syncing || (!canExtractLeads && !isSuperAdmin)}
            className="btn-secondary"
            style={{
              fontSize: '13px',
              padding: '8px 14px',
              color: '#0052cc',
              borderColor: '#bfd1ff',
              backgroundColor: '#f0f5ff',
              fontWeight: 600,
              opacity: !canExtractLeads && !isSuperAdmin ? 0.6 : 1,
              cursor: !canExtractLeads && !isSuperAdmin ? 'not-allowed' : 'pointer',
            }}
            title={
              !canExtractLeads && !isSuperAdmin
                ? 'Debe comunicarse con el Administrador para configurar las variables y poder extraer los leads.'
                : 'Consultar y extraer los prospectos mÃ¡s recientes de Meta Ads (PÃ¡gina y CampaÃ±as)'
            }
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '18px',
                animation: syncing ? 'spin 1s linear infinite' : 'none',
              }}
            >
              cloud_download
            </span>
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Meta Leads'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="btn-primary"
            style={{
              fontSize: '13px',
              padding: '8px 16px',
              opacity: !canExtractLeads && !isSuperAdmin ? 0.6 : 1,
              cursor: !canExtractLeads && !isSuperAdmin ? 'not-allowed' : 'pointer',
            }}
            title={
              !canExtractLeads && !isSuperAdmin
                ? 'Debe comunicarse con el Administrador para configurar las variables y poder extraer los leads.'
                : 'Exportar archivo CSV con todos los leads registrados'
            }
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              download
            </span>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Selector de Subpestañas: Leads Recibidos vs Formularios Instantáneos */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid #edf0f2',
          paddingBottom: '12px',
        }}
      >
        <button
          onClick={() => setActiveSubTab('leads')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'leads' ? '#0052cc' : '#f0f2f5',
            color: activeSubTab === 'leads' ? '#ffffff' : '#475467',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            contacts
          </span>
          Prospectos Recibidos ({total})
        </button>

        <button
          onClick={() => setActiveSubTab('forms')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'forms' ? '#0052cc' : '#f0f2f5',
            color: activeSubTab === 'forms' ? '#ffffff' : '#475467',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            dynamic_form
          </span>
          Formularios de Lead Ads (Meta Instant Forms)
        </button>
      </div>

      {activeSubTab === 'forms' ? (
        <LeadFormsView
          onNavigateToVariables={onNavigateToVariables}
          onNavigateToLeads={() => setActiveSubTab('leads')}
        />
      ) : (
        <>
      {/* Tarjetas Resumen / KPIs ArmÃ³nicas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '22px',
        }}
      >
        <div className="precision-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#737685', textTransform: 'uppercase' }}>
              Total Registrados
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#eff4ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0052cc',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                people
              </span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1a1c1c', marginTop: '6px' }}>
            {total.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#737685', marginTop: '2px' }}>
            Leads consolidados en base de datos
          </div>
        </div>

        <div className="precision-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0052cc', textTransform: 'uppercase' }}>
              Origen Meta Ads
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#e8f1ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0052cc',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                campaign
              </span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0052cc', marginTop: '6px' }}>
            {metaCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#737685', marginTop: '2px' }}>
            Prospectos captados en Facebook & Instagram
          </div>
        </div>

        <div className="precision-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>
              Origen TikTok Ads
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111827',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                music_note
              </span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '6px' }}>
            {tiktokCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#737685', marginTop: '2px' }}>
            Prospectos captados en TikTok Business
          </div>
        </div>

        <div className="precision-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#00875a', textTransform: 'uppercase' }}>
              Contacto Directo
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#e3fcef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00875a',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                verified
              </span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#00875a', marginTop: '6px' }}>
            {verifiedContactCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#737685', marginTop: '2px' }}>
            Con telÃ©fono y/o correo verificado
          </div>
        </div>
      </div>

      {/* Barra de Filtro y BÃºsqueda ArmÃ³nica */}
      <div
        className="precision-card"
        style={{
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="precision-input"
            placeholder="Buscar por nombre, email, telÃ©fono o campaÃ±a..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px', fontSize: '13px' }}
          />
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8c919d',
              fontSize: '19px',
            }}
          >
            search
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8c919d',
                padding: '2px',
              }}
              title="Limpiar bÃºsqueda"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                close
              </span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginRight: '4px' }}>
            Plataforma:
          </span>
          <button
            onClick={() => setSourceFilter('ALL')}
            className={sourceFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px' }}
          >
            Todos ({total})
          </button>
          <button
            onClick={() => setSourceFilter('META')}
            className={sourceFilter === 'META' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px' }}
          >
            Meta Ads
          </button>
          <button
            onClick={() => setSourceFilter('TIKTOK')}
            className={sourceFilter === 'TIKTOK' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px' }}
          >
            TikTok Ads
          </button>
        </div>
      </div>

      {/* Tabla de Leads Estilizada */}
      <div className="precision-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #edf0f2' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '32px', color: '#0052cc' }}>
              sync
            </span>
            <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#1a1c1c' }}>
              Consultando prospectos desde base de datos...
            </div>
            <p style={{ fontSize: '12px', color: '#737685', marginTop: '4px' }}>
              Recuperando registros consolidados de Meta y TikTok Ads
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ padding: '52px 24px', textAlign: 'center', color: '#737685' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#f4f5f7',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: '#8c919d',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>
                inbox
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1c1c' }}>
              No se encontraron prospectos
            </div>
            <p style={{ fontSize: '13px', color: '#5c6270', marginTop: '4px', maxWidth: '420px', margin: '6px auto 0' }}>
              {searchTerm
                ? 'No hay registros que coincidan con el tÃ©rmino de bÃºsqueda ingresado.'
                : 'AÃºn no hay prospectos captados. Ejecuta una sincronizaciÃ³n desde el gestor de Crontab o sincroniza campaÃ±as.'}
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
                    Prospecto / Nombre
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                    Correo ElectrÃ³nico
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                    TelÃ©fono
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                    CampaÃ±a / Formulario
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475467', fontSize: '11px', textTransform: 'uppercase' }}>
                    Fecha Captura
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const isMeta = lead.source?.toUpperCase() === 'META';
                  return (
                    <tr
                      key={lead.id}
                      style={{ borderBottom: '1px solid #edf0f2', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            backgroundColor: isMeta ? '#e8f1ff' : '#f3f4f6',
                            color: isMeta ? '#0052cc' : '#111827',
                            border: `1px solid ${isMeta ? '#bfd1ff' : '#e5e7eb'}`,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            {isMeta ? 'campaign' : 'music_note'}
                          </span>
                          {isMeta ? 'Meta Ads' : 'TikTok Ads'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: isMeta ? '#0052cc' : '#111827',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {lead.fullName?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <span style={{ fontWeight: 600, color: '#1a1c1c' }}>
                            {lead.fullName || 'No especificado'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {lead.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#344054' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#8c919d' }}>
                              mail
                            </span>
                            <span>{lead.email}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#98a2b3' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {lead.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#1a1c1c', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#00875a' }}>
                              call
                            </span>
                            <span>{lead.phone}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#98a2b3' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {lead.formName && (
                            <span style={{ fontSize: '12.5px', color: '#1a1c1c', fontWeight: 500 }}>
                              {lead.formName}
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              color: '#737685',
                              fontSize: '11px',
                            }}
                          >
                            {getLeadCampaignId(lead) ? ('Campaña: ' + getLeadCampaignId(lead)) : 'Sin ID de Campaña'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: '#475467', fontSize: '12px' }}>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pie de tabla con conteo de registros */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid #edf0f2',
                backgroundColor: '#fbfcfd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#737685',
              }}
            >
              <span>
                Mostrando <strong>{filteredLeads.length}</strong> de <strong>{total}</strong> leads registrados
              </span>
              <span>LÃ­mite de consulta: 50 filas</span>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

