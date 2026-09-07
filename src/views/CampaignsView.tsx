import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const CampaignsView: React.FC = () => {
  const [platform, setPlatform] = useState<'meta' | 'tiktok'>('meta');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const endpoint = platform === 'meta' ? '/meta-ads/campaigns' : '/tiktok-ads/campaigns';
      const res = await api.get(endpoint);
      const data = res.data.data || res.data;
      setCampaigns(Array.isArray(data) ? data : data.items || []);
    } catch (err: any) {
      console.error('Error al cargar campañas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [platform]);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const endpoint =
        platform === 'meta' ? '/meta-ads/campaigns/sync' : '/tiktok-ads/campaigns/sync';
      const res = await api.post(endpoint, {});
      const data = res.data.data || res.data;
      setMessage(`Sincronización exitosa: ${data.synced} campañas actualizadas.`);
      fetchCampaigns();
    } catch (err: any) {
      setMessage(`Error en sincronización: ${err.response?.data?.message || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Campañas Publicitarias</h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Listado y estado de campañas sincronizadas desde las APIs oficiales de Meta y TikTok
          </p>
        </div>

        <button onClick={handleSync} disabled={syncing} className="btn-primary" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {syncing ? 'sync' : 'cloud_sync'}
          </span>
          {syncing ? 'Sincronizando...' : `Sincronizar ${platform === 'meta' ? 'Meta' : 'TikTok'}`}
        </button>
      </div>

      {/* Message notification */}
      {message && (
        <div
          style={{
            backgroundColor: message.includes('Error') ? '#ffdad6' : '#e3fcef',
            color: message.includes('Error') ? '#ba1a1a' : '#00875a',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {message.includes('Error') ? 'error' : 'check_circle'}
          </span>
          <span>{message}</span>
        </div>
      )}

      {/* Platform Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setPlatform('meta')}
          className={platform === 'meta' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          Meta Ads ({platform === 'meta' ? campaigns.length : '...'})
        </button>
        <button
          onClick={() => setPlatform('tiktok')}
          className={platform === 'tiktok' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          TikTok Ads ({platform === 'tiktok' ? campaigns.length : '...'})
        </button>
      </div>

      {/* Table */}
      <div className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '28px' }}>
              sync
            </span>
            <div style={{ marginTop: '8px', fontSize: '13.5px' }}>Cargando campañas...</div>
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#c3c6d6' }}>
              folder_off
            </span>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>No hay campañas guardadas</div>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Haz clic en "Sincronizar" para descargar las campañas desde la cuenta configurada.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #edf0f2', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Nombre de Campaña</th>
                  <th style={{ padding: '12px 16px' }}>ID Plataforma</th>
                  <th style={{ padding: '12px 16px' }}>Estado</th>
                  <th style={{ padding: '12px 16px' }}>Objetivo</th>
                  <th style={{ padding: '12px 16px' }}>Presupuesto Diario</th>
                  <th style={{ padding: '12px 16px' }}>Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id || c.metaCampaignId || c.tiktokCampaignId} style={{ borderBottom: '1px solid #edf0f2' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1c1c' }}>
                      {c.name || 'Sin Nombre'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#737685', fontSize: '12px' }}>
                      {c.metaCampaignId || c.tiktokCampaignId || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`badge-status ${
                          c.status === 'ACTIVE' || c.status === 'CAMPAIGN_STATUS_ENABLE' ? 'success' : 'warning'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#434654' }}>{c.objective || '-'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono' }}>
                      {c.dailyBudget ? `$${c.dailyBudget}` : 'N/D'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#737685', fontSize: '12px' }}>
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '-'}
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
