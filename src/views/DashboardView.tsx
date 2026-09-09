import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { SystemConfigBanner } from '../components/SystemConfigBanner';

interface DashboardViewProps {
  initialSubTab?: 'executive' | 'tactical' | 'creatives' | 'matrix';
}

interface CampaignItem {
  id: string;
  name: string;
  status: string;
  objective?: string;
  dailyBudget?: number | null;
  budget?: number | null;
  platform: 'meta' | 'tiktok';
  platformId?: string;
  insights?: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    cpm?: number;
    cpc?: number;
    ctr?: number;
    conversions?: number;
    cpl?: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ScheduleInfo {
  id?: string;
  name?: string;
  isEnabled?: boolean;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  lastRunMessage?: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ initialSubTab = 'executive' }) => {
  const subTab = initialSubTab;
  const [loading, setLoading] = useState(true);
  const [metaCampaigns, setMetaCampaigns] = useState<CampaignItem[]>([]);
  const [tiktokCampaigns, setTiktokCampaigns] = useState<CampaignItem[]>([]);
  const [metaLeadsTotal, setMetaLeadsTotal] = useState(0);
  const [tiktokLeadsTotal, setTiktokLeadsTotal] = useState(0);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metaCampRes, tiktokCampRes, metaLeadsRes, tiktokLeadsRes, schedRes] = await Promise.allSettled([
        api.get('/meta-ads/campaigns'),
        api.get('/tiktok-ads/campaigns'),
        api.get('/leads', { params: { source: 'meta', pageSize: 1 } }),
        api.get('/leads', { params: { source: 'tiktok', pageSize: 1 } }),
        api.get('/sync-schedules'),
      ]);

      if (metaCampRes.status === 'fulfilled') {
        const raw = metaCampRes.value.data?.data ?? metaCampRes.value.data;
        const items = Array.isArray(raw) ? raw : raw?.items ?? [];
        setMetaCampaigns(
          items.map((c: any) => ({
            ...c,
            platform: 'meta',
            platformId: c.metaCampaignId,
          })),
        );
      } else {
        setMetaCampaigns([]);
      }

      if (tiktokCampRes.status === 'fulfilled') {
        const raw = tiktokCampRes.value.data?.data ?? tiktokCampRes.value.data;
        const items = Array.isArray(raw) ? raw : raw?.items ?? [];
        setTiktokCampaigns(
          items.map((c: any) => ({
            ...c,
            platform: 'tiktok',
            platformId: c.tiktokCampaignId,
          })),
        );
      } else {
        setTiktokCampaigns([]);
      }

      if (metaLeadsRes.status === 'fulfilled') {
        const raw = metaLeadsRes.value.data?.data ?? metaLeadsRes.value.data;
        setMetaLeadsTotal(raw?.total ?? (Array.isArray(raw?.items) ? raw.items.length : 0));
      } else {
        setMetaLeadsTotal(0);
      }

      if (tiktokLeadsRes.status === 'fulfilled') {
        const raw = tiktokLeadsRes.value.data?.data ?? tiktokLeadsRes.value.data;
        setTiktokLeadsTotal(raw?.total ?? (Array.isArray(raw?.items) ? raw.items.length : 0));
      } else {
        setTiktokLeadsTotal(0);
      }

      if (schedRes.status === 'fulfilled') {
        const raw = schedRes.value.data?.data ?? schedRes.value.data;
        setScheduleInfo(raw);
      }
    } catch (err) {
      console.error('Error cargando métricas en DashboardView:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Cálculos dinámicos reales basados en la API
  const metaSpend = metaCampaigns.reduce(
    (acc, c) => acc + Number(c.insights?.spend ?? c.dailyBudget ?? 0),
    0,
  );
  const tiktokSpend = tiktokCampaigns.reduce(
    (acc, c) => acc + Number(c.insights?.spend ?? c.budget ?? 0),
    0,
  );
  const totalSpend = metaSpend + tiktokSpend;

  const metaActive = metaCampaigns.filter(
    (c) => c.status === 'ACTIVE' || c.status === 'CAMPAIGN_STATUS_ENABLE',
  ).length;
  const tiktokActive = tiktokCampaigns.filter(
    (c) => c.status === 'ACTIVE' || c.status === 'CAMPAIGN_STATUS_ENABLE',
  ).length;
  const totalActive = metaActive + tiktokActive;

  const totalLeads = metaLeadsTotal + tiktokLeadsTotal;
  const totalCampaigns = metaCampaigns.length + tiktokCampaigns.length;

  const metaImpressions = metaCampaigns.reduce(
    (acc, c) => acc + Number(c.insights?.impressions ?? 0),
    0,
  );
  const tiktokImpressions = tiktokCampaigns.reduce(
    (acc, c) => acc + Number(c.insights?.impressions ?? 0),
    0,
  );
  const totalImpressions = metaImpressions + tiktokImpressions;

  const metaClicks = metaCampaigns.reduce((acc, c) => acc + Number(c.insights?.clicks ?? 0), 0);
  const tiktokClicks = tiktokCampaigns.reduce((acc, c) => acc + Number(c.insights?.clicks ?? 0), 0);
  const totalClicks = metaClicks + tiktokClicks;

  const blendedCpl = totalLeads > 0 && totalSpend > 0 ? totalSpend / totalLeads : 0;
  const metaCpl = metaLeadsTotal > 0 && metaSpend > 0 ? metaSpend / metaLeadsTotal : 0;
  const tiktokCpl = tiktokLeadsTotal > 0 && tiktokSpend > 0 ? tiktokSpend / tiktokLeadsTotal : 0;

  const blendedCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const metaCtr = metaImpressions > 0 ? (metaClicks / metaImpressions) * 100 : 0;
  const tiktokCtr = tiktokImpressions > 0 ? (tiktokClicks / tiktokImpressions) * 100 : 0;

  const metaSpendShare = totalSpend > 0 ? (metaSpend / totalSpend) * 100 : 0;
  const tiktokSpendShare = totalSpend > 0 ? (tiktokSpend / totalSpend) * 100 : 0;

  const metaLeadsShare = totalLeads > 0 ? (metaLeadsTotal / totalLeads) * 100 : 0;
  const tiktokLeadsShare = totalLeads > 0 ? (tiktokLeadsTotal / totalLeads) * 100 : 0;

  const allCampaigns: CampaignItem[] = [...metaCampaigns, ...tiktokCampaigns];

  return (
    <div>
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>
            {subTab === 'executive' && 'Panel Ejecutivo de Rendimiento'}
            {subTab === 'tactical' && 'Análisis Táctico (Meta vs. TikTok)'}
            {subTab === 'creatives' && 'Creativos & Audiencias Publicitarias'}
            {subTab === 'matrix' && 'Matriz de Decisiones & Diagnóstico Operativo'}
          </h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            {subTab === 'executive' && 'Métricas consolidadas de adquisición, inversión y captación de leads en Meta Ads y TikTok Ads'}
            {subTab === 'tactical' && 'Comparativa directa de eficiencia, costo por lead (CPL), CTR y volumen entre plataformas'}
            {subTab === 'creatives' && 'Evaluación y desglose de campañas, creativos y audiencias segmentadas'}
            {subTab === 'matrix' && 'Matriz de diagnóstico operativo y evaluación de rendimiento automatizada'}
          </p>
        </div>

        {/* Global Controls Pill */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12.5px',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '16px', animation: loading ? 'spin 1s infinite linear' : 'none' }}
            >
              sync
            </span>
            <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      <SystemConfigBanner />

      {/* Info notice if no data exists yet */}
      {!loading && totalCampaigns === 0 && totalLeads === 0 && (
        <div
          style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #edf0f2',
            borderRadius: '6px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#434654',
            fontSize: '13.5px',
          }}
        >
          <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '22px' }}>
            info
          </span>
          <div>
            <strong>Base de datos lista:</strong> No hay campañas ni leads descargados aún en el sistema.
            Ve a la sección <strong>Campañas Publicitarias</strong> para sincronizar los datos de Meta y TikTok.
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '32px' }}>
            sync
          </span>
          <div style={{ marginTop: '12px', fontSize: '14px' }}>Cargando datos desde la API...</div>
        </div>
      ) : (
        <>
          {/* TAB 1: VISTA EJECUTIVA */}
          {subTab === 'executive' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 6 Real Scorecards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div className="kpi-stat-card">
                  <div className="kpi-title">
                    <span>Inversión Registrada</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      payments
                    </span>
                  </div>
                  <div className="kpi-value">${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="kpi-subtext">
                    Meta: ${metaSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })} • TikTok: ${tiktokSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="kpi-stat-card">
                  <div className="kpi-title">
                    <span>Leads Captados</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      group_add
                    </span>
                  </div>
                  <div className="kpi-value">{totalLeads.toLocaleString()}</div>
                  <div className="kpi-subtext">Meta: {metaLeadsTotal} • TikTok: {tiktokLeadsTotal}</div>
                </div>

                <div className="kpi-stat-card">
                  <div className="kpi-title">
                    <span>CPL Promedio (Blended)</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      price_change
                    </span>
                  </div>
                  <div className="kpi-value">
                    {blendedCpl > 0 ? `$${blendedCpl.toFixed(2)}` : 'N/D'}
                  </div>
                  <div className="kpi-subtext">
                    {totalLeads > 0 ? 'Costo por lead consolidado' : 'Requiere leads e inversión'}
                  </div>
                </div>

                <div className="kpi-stat-card">
                  <div className="kpi-title">
                    <span>Campañas Activas</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      ads_click
                    </span>
                  </div>
                  <div className="kpi-value" style={{ color: '#0052cc' }}>
                    {totalActive} / {totalCampaigns}
                  </div>
                  <div className="kpi-subtext">Meta: {metaActive} • TikTok: {tiktokActive}</div>
                </div>

                <div className="kpi-stat-card">
                  <div className="kpi-title">
                    <span>Impresiones Totales</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      visibility
                    </span>
                  </div>
                  <div className="kpi-value">
                    {totalImpressions > 0 ? totalImpressions.toLocaleString() : '0'}
                  </div>
                  <div className="kpi-subtext">
                    Meta: {metaImpressions.toLocaleString()} • TikTok: {tiktokImpressions.toLocaleString()}
                  </div>
                </div>

                <div className="kpi-stat-card">
                  <div className="kpi-title">
                    <span>Clics Totales</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      touch_app
                    </span>
                  </div>
                  <div className="kpi-value" style={{ color: '#00875a' }}>
                    {totalClicks > 0 ? totalClicks.toLocaleString() : '0'}
                  </div>
                  <div className="kpi-subtext">CTR Blended: {blendedCtr.toFixed(2)}%</div>
                </div>
              </div>

              {/* Visual Funnel Card */}
              <div className="precision-card">
                <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                    filter_alt
                  </span>
                  Embudo de Conversión Consolidado
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div style={{ padding: '14px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#737685', textTransform: 'uppercase', marginBottom: '4px' }}>
                      1. Impresiones
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '20px', fontWeight: 700 }}>
                      {totalImpressions.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#737685', marginTop: '4px' }}>
                      Meta: {metaImpressions.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#737685', textTransform: 'uppercase', marginBottom: '4px' }}>
                      2. Clics Salientes
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '20px', fontWeight: 700 }}>
                      {totalClicks.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00875a', fontWeight: 600, marginTop: '4px' }}>
                      CTR {blendedCtr.toFixed(2)}%
                    </div>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#737685', textTransform: 'uppercase', marginBottom: '4px' }}>
                      3. Leads Captados
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '20px', fontWeight: 700 }}>
                      {totalLeads.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0052cc', fontWeight: 600, marginTop: '4px' }}>
                      {totalClicks > 0 ? `Conv. ${((totalLeads / totalClicks) * 100).toFixed(2)}%` : 'Sin clics'}
                    </div>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: '#f0f4ff', border: '1px solid #bfd1ff', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#0052cc', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                      4. Campañas Activas
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '20px', fontWeight: 700, color: '#0052cc' }}>
                      {totalActive}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0052cc', fontWeight: 600, marginTop: '4px' }}>
                      Total {totalCampaigns} registradas
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Distribution Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="precision-card">
                  <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Distribución de Presupuesto / Inversión</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600 }}>Meta Ads</span>
                        <span style={{ fontFamily: 'JetBrains Mono' }}>
                          ${metaSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({metaSpendShare.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#edf0f2', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${metaSpendShare}%`, height: '100%', backgroundColor: '#0052cc' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600 }}>TikTok Ads</span>
                        <span style={{ fontFamily: 'JetBrains Mono' }}>
                          ${tiktokSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({tiktokSpendShare.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#edf0f2', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${tiktokSpendShare}%`, height: '100%', backgroundColor: '#091e42' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="precision-card">
                  <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Aporte por Canal de Leads</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600 }}>Meta Ads ({metaLeadsTotal} leads)</span>
                        <span style={{ fontFamily: 'JetBrains Mono', color: '#00875a', fontWeight: 700 }}>
                          {metaLeadsShare.toFixed(1)}% del total
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#edf0f2', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${metaLeadsShare}%`, height: '100%', backgroundColor: '#00875a' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600 }}>TikTok Ads ({tiktokLeadsTotal} leads)</span>
                        <span style={{ fontFamily: 'JetBrains Mono', color: '#737685' }}>
                          {tiktokLeadsShare.toFixed(1)}% del total
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#edf0f2', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${tiktokLeadsShare}%`, height: '100%', backgroundColor: '#737685' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISTA TÁCTICA META VS TIKTOK */}
          {subTab === 'tactical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="precision-card">
                <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                    balance
                  </span>
                  Comparativa Cara a Cara: Meta Ads vs. TikTok Ads
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #edf0f2', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>Plataforma</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>Campañas</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>Activas</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>Inversión / Presupuesto</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>Impresiones</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>Clics</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>CTR</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>Leads</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#091e42' }}>CPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0052cc' }}>
                            hub
                          </span>
                          Meta Ads
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{metaCampaigns.length}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono', color: '#0052cc', fontWeight: 600 }}>{metaActive}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>${metaSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{metaImpressions.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{metaClicks.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{metaCtr.toFixed(2)}%</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{metaLeadsTotal}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{metaCpl > 0 ? `$${metaCpl.toFixed(2)}` : 'N/D'}</td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#091e42' }}>
                            smart_display
                          </span>
                          TikTok Ads
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{tiktokCampaigns.length}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono', color: '#091e42', fontWeight: 600 }}>{tiktokActive}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>${tiktokSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{tiktokImpressions.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{tiktokClicks.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{tiktokCtr.toFixed(2)}%</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{tiktokLeadsTotal}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono' }}>{tiktokCpl > 0 ? `$${tiktokCpl.toFixed(2)}` : 'N/D'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Executive Takeaway Card */}
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #edf0f2',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '28px' }}>
                  query_stats
                </span>
                <div>
                  <h4 style={{ color: '#1a1c1c', marginBottom: '6px' }}>
                    Resumen de Rendimiento Comparativo
                  </h4>
                  <p style={{ fontSize: '13.5px', color: '#434654', lineHeight: 1.5 }}>
                    {totalCampaigns === 0 ? (
                      'No hay campañas sincronizadas aún en el sistema. Al sincronizar con Meta y TikTok Ads, este panel comparará automáticamente el Costo por Lead (CPL) y el volumen de conversión de cada plataforma.'
                    ) : (
                      <>
                        Actualmente hay <strong>{totalActive} campañas activas</strong> entre Meta y TikTok Ads con un total de{' '}
                        <strong>{totalLeads} leads captados</strong>.
                        {metaLeadsTotal > 0 && tiktokLeadsTotal > 0 ? (
                          <>
                            {' '}Meta Ads registra un CPL de <strong>${metaCpl.toFixed(2)}</strong> frente a{' '}
                            <strong>${tiktokCpl.toFixed(2)}</strong> en TikTok Ads.
                          </>
                        ) : null}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREATIVOS Y CAMPAÑAS */}
          {subTab === 'creatives' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #edf0f2' }}>
                  <h3 style={{ fontSize: '16px', margin: 0 }}>Listado Consolidado de Campañas</h3>
                  <p style={{ color: '#5c6270', fontSize: '13px', margin: '4px 0 0 0' }}>
                    Campañas reales registradas en base de datos desde las APIs de Meta Ads y TikTok Ads
                  </p>
                </div>

                {allCampaigns.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#737685' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#c3c6d6' }}>
                      folder_off
                    </span>
                    <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>No hay campañas registradas</div>
                    <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Sincroniza tus campañas desde la vista de Campañas Publicitarias para comenzar a monitorear.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #edf0f2', textAlign: 'left' }}>
                          <th style={{ padding: '12px 16px' }}>Nombre de Campaña</th>
                          <th style={{ padding: '12px 16px' }}>Plataforma</th>
                          <th style={{ padding: '12px 16px' }}>ID Plataforma</th>
                          <th style={{ padding: '12px 16px' }}>Estado</th>
                          <th style={{ padding: '12px 16px' }}>Objetivo</th>
                          <th style={{ padding: '12px 16px' }}>Presupuesto</th>
                          <th style={{ padding: '12px 16px' }}>Fecha Creación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCampaigns.map((c) => (
                          <tr key={c.id || c.platformId} style={{ borderBottom: '1px solid #edf0f2' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1c1c' }}>
                              {c.name || 'Sin Nombre'}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span className={`badge-status ${c.platform === 'meta' ? 'info' : 'warning'}`}>
                                {c.platform === 'meta' ? 'Meta Ads' : 'TikTok Ads'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#737685', fontSize: '12px' }}>
                              {c.platformId || '-'}
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
                              {c.dailyBudget ?? c.budget ? `$${c.dailyBudget ?? c.budget}` : 'N/D'}
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#737685', fontSize: '12px' }}>
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MATRIZ DE DECISIONES & DIAGNÓSTICO */}
          {subTab === 'matrix' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="precision-card">
                <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                    traffic
                  </span>
                  Diagnóstico y Matriz Operativa de Cuentas
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Status 1: Crontab Sync Health */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #edf0f2',
                      borderLeft: `4px solid ${scheduleInfo?.isEnabled ? '#00875a' : '#ffab00'}`,
                      borderRadius: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: scheduleInfo?.isEnabled ? '#e3fcef' : '#fff0b3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: scheduleInfo?.isEnabled ? '#00875a' : '#b76e00', fontSize: '20px' }}
                      >
                        schedule
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1a1c1c', fontSize: '14px', marginBottom: '2px' }}>
                        Programador Crontab de Sincronización:{' '}
                        <span style={{ color: scheduleInfo?.isEnabled ? '#00875a' : '#b76e00' }}>
                          {scheduleInfo?.isEnabled ? 'Habilitado y Activo' : 'Deshabilitado'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#434654' }}>
                        Última ejecución:{' '}
                        <strong>{scheduleInfo?.lastRunAt ? new Date(scheduleInfo.lastRunAt).toLocaleString() : 'Sin ejecuciones registradas'}</strong>
                        {scheduleInfo?.lastRunStatus && (
                          <span> • Estado: <strong>{scheduleInfo.lastRunStatus}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status 2: Active campaigns check */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #edf0f2',
                      borderLeft: `4px solid ${totalActive > 0 ? '#00875a' : '#ffab00'}`,
                      borderRadius: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: totalActive > 0 ? '#e3fcef' : '#fff0b3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: totalActive > 0 ? '#00875a' : '#b76e00', fontSize: '20px' }}
                      >
                        ads_click
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1a1c1c', fontSize: '14px', marginBottom: '2px' }}>
                        Monitoreo de Campañas Activas ({totalActive} en ejecución)
                      </div>
                      <div style={{ fontSize: '13px', color: '#434654' }}>
                        {totalActive > 0
                          ? `Hay ${metaActive} campañas activas en Meta Ads y ${tiktokActive} en TikTok Ads recibiendo impresiones.`
                          : 'No se detectaron campañas con estado ACTIVE actualmente en base de datos.'}
                      </div>
                    </div>
                  </div>

                  {/* Status 3: Lead capture rate */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #edf0f2',
                      borderLeft: `4px solid ${totalLeads > 0 ? '#00875a' : '#737685'}`,
                      borderRadius: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: totalLeads > 0 ? '#e3fcef' : '#edf0f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: totalLeads > 0 ? '#00875a' : '#737685', fontSize: '20px' }}
                      >
                        group
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1a1c1c', fontSize: '14px', marginBottom: '2px' }}>
                        Volumen de Captación: {totalLeads} leads consolidados
                      </div>
                      <div style={{ fontSize: '13px', color: '#434654' }}>
                        {totalLeads > 0
                          ? `La base de datos unificada registra ${metaLeadsTotal} prospectos provenientes de Meta y ${tiktokLeadsTotal} de TikTok.`
                          : 'Aún no hay prospectos descargados. Utiliza la opción de sincronizar leads o activa el cron.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Tactical Guidance with Vector Material Icons */}
              <div className="precision-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '20px' }}>
                    gavel
                  </span>
                  <h3 style={{ fontSize: '15px', margin: 0 }}>Reglas Tácticas de Decisión & Optimización de Inversión</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Regla 1: Escalamiento */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      backgroundColor: '#f8fdf9',
                      border: '1px solid #d3f3df',
                      borderLeft: '4px solid #00875a',
                      borderRadius: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        backgroundColor: '#e3fcef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ color: '#00875a', fontSize: '22px' }}>
                        trending_up
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#006644' }}>
                          Regla de Escalamiento
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'JetBrains Mono, monospace',
                            backgroundColor: '#e3fcef',
                            color: '#006644',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          CPL &lt; $10.00 • Estabilidad &gt; 48h
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#434654', lineHeight: 1.5 }}>
                        <strong>Acción:</strong> Incrementar presupuesto vertical en +20% cada 48 horas sin alterar la estructura del adset para no reiniciar la fase de aprendizaje.
                      </div>
                    </div>
                  </div>

                  {/* Regla 2: Optimización */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      backgroundColor: '#fffdf5',
                      border: '1px solid #ffe399',
                      borderLeft: '4px solid #ffab00',
                      borderRadius: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        backgroundColor: '#fff0b3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ color: '#b76e00', fontSize: '22px' }}>
                        tune
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#974f00' }}>
                          Regla de Optimización
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'JetBrains Mono, monospace',
                            backgroundColor: '#fff0b3',
                            color: '#974f00',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          CTR &gt; 1.8% • Conv. Leads &lt; 5%
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#434654', lineHeight: 1.5 }}>
                        <strong>Acción:</strong> Mantener el anuncio activo. El gancho creativo capta interés pero la fuga se produce en el formulario o landing. Auditar y reducir campos obligatorios.
                      </div>
                    </div>
                  </div>

                  {/* Regla 3: Apagado / Kill Rule */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      backgroundColor: '#fff9f9',
                      border: '1px solid #ffd2cc',
                      borderLeft: '4px solid #de350b',
                      borderRadius: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        backgroundColor: '#ffebe6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ color: '#de350b', fontSize: '22px' }}>
                        pause_circle
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#bf2600' }}>
                          Regla de Apagado (Kill Rule)
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'JetBrains Mono, monospace',
                            backgroundColor: '#ffebe6',
                            color: '#bf2600',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          Gasto &gt; 2x CPL Objetivo • 0 Leads
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#434654', lineHeight: 1.5 }}>
                        <strong>Acción:</strong> Pausa inmediata del conjunto de anuncios o adset. El ángulo publicitario o la segmentación no presentan afinidad comercial. Reemplazar ángulo por completo.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
