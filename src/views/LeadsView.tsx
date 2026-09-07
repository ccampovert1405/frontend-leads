import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';

interface LeadItem {
  id: string;
  source: 'meta' | 'tiktok';
  sourceLeadId: string;
  campaignId: string | null;
  formName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  receivedAt: string;
  createdAt: string;
}

export const LeadsView: React.FC = () => {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'meta' | 'tiktok'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (sourceFilter !== 'ALL') params.source = sourceFilter;
      const res = await api.get('/leads', { params });
      const data = res.data.data || res.data;
      setLeads(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error al cargar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [sourceFilter]);

  const handleExportCsv = () => {
    const token = localStorage.getItem('token');
    window.open(`${API_BASE_URL}/v1/leads/export?token=${token}`, '_blank');
  };

  const filteredLeads = leads.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (l.fullName && l.fullName.toLowerCase().includes(term)) ||
      (l.email && l.email.toLowerCase().includes(term)) ||
      (l.phone && l.phone.includes(term)) ||
      (l.campaignId && l.campaignId.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Gestión de Leads Unificados</h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Base consolidada de prospectos captados en Meta Ads y TikTok Ads ({total} registrados)
          </p>
        </div>

        <button onClick={handleExportCsv} className="btn-secondary" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            download
          </span>
          Exportar CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="precision-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="precision-input"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8c919d',
              fontSize: '18px',
            }}
          >
            search
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#737685', textTransform: 'uppercase' }}>
            Origen:
          </span>
          <button
            onClick={() => setSourceFilter('ALL')}
            className={sourceFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
          >
            Todos
          </button>
          <button
            onClick={() => setSourceFilter('meta')}
            className={sourceFilter === 'meta' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
          >
            Meta Ads
          </button>
          <button
            onClick={() => setSourceFilter('tiktok')}
            className={sourceFilter === 'tiktok' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
          >
            TikTok Ads
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '28px' }}>
              sync
            </span>
            <div style={{ marginTop: '8px', fontSize: '13.5px' }}>Cargando leads desde base de datos...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#c3c6d6' }}>
              inbox
            </span>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>No se encontraron leads</div>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Ejecuta una sincronización desde el gestor de Crontab para descargar los leads más recientes.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #edf0f2', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Origen</th>
                  <th style={{ padding: '12px 16px' }}>Nombre Completo</th>
                  <th style={{ padding: '12px 16px' }}>Correo Electrónico</th>
                  <th style={{ padding: '12px 16px' }}>Teléfono</th>
                  <th style={{ padding: '12px 16px' }}>ID Campaña</th>
                  <th style={{ padding: '12px 16px' }}>Fecha Captura</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #edf0f2' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge-status ${lead.source === 'meta' ? 'info' : 'warning'}`}>
                        {lead.source === 'meta' ? 'Meta Ads' : 'TikTok Ads'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1c1c' }}>
                      {lead.fullName || 'No especificado'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#434654' }}>{lead.email || '-'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono' }}>{lead.phone || '-'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#737685', fontSize: '12px' }}>
                      {lead.campaignId || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#737685', fontSize: '12px' }}>
                      {lead.receivedAt ? new Date(lead.receivedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
