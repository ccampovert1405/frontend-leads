import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface SystemStatusData {
  meta: {
    configured: boolean;
    hasAccessToken: boolean;
    hasAdAccountId: boolean;
    adAccountId: string;
    isActive: boolean;
    isExpired: boolean;
  };
  tiktok: {
    configured: boolean;
    hasAccessToken: boolean;
    hasAdvertiserId: boolean;
    advertiserId: string;
    isActive: boolean;
  };
  syncSchedule: {
    isEnabled: boolean;
    cronExpression: string;
  };
  variablesConfigured: boolean;
  canExtractLeads: boolean;
  message: string | null;
}

interface SystemConfigBannerProps {
  onNavigateToVariables?: () => void;
  onNavigateToScheduler?: () => void;
  onStatusLoaded?: (status: SystemStatusData) => void;
}

export const SystemConfigBanner: React.FC<SystemConfigBannerProps> = ({
  onNavigateToVariables,
  onNavigateToScheduler,
  onStatusLoaded,
}) => {
  const { isSuperAdmin } = useAuth();
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/platform-credentials/system-status');
      const data = res.data.data || res.data;
      setStatus(data);
      onStatusLoaded?.(data);
    } catch (err) {
      console.warn('No se pudo verificar el estado del sistema:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading || !status) return null;

  const hasVariablesIssue = !status.canExtractLeads;
  const hasSyncIssue = !status.syncSchedule?.isEnabled;

  if (!hasVariablesIssue && !hasSyncIssue) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
      {/* 1. Alerta si las variables de Meta/TikTok no están configuradas */}
      {hasVariablesIssue && (
        <div
          style={{
            backgroundColor: isSuperAdmin ? '#fff8e6' : '#fff0f0',
            border: `1px solid ${isSuperAdmin ? '#ffe08a' : '#ffcdd2'}`,
            borderRadius: '6px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '24px',
                color: isSuperAdmin ? '#b78103' : '#d32f2f',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              {isSuperAdmin ? 'settings_alert' : 'gpp_maybe'}
            </span>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '13.5px',
                  color: isSuperAdmin ? '#7a5400' : '#b71c1c',
                  marginBottom: '3px',
                }}
              >
                {isSuperAdmin
                  ? 'Configuración de Variables Requerida'
                  : 'Variables de Entorno No Configuradas'}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: isSuperAdmin ? '#614300' : '#5c6270',
                  lineHeight: '1.45',
                }}
              >
                {isSuperAdmin
                  ? 'Las variables de entorno de Meta Ads y TikTok Ads no se encuentran configuradas en el sistema. Como Super Administrador, debe configurarlas para habilitar la extracción de prospectos y sincronización de campañas.'
                  : 'Las variables de entorno tanto de Meta Ads como de TikTok Ads no están configuradas en el sistema. Debe comunicarse con el Administrador para configurar las variables y poder extraer los leads.'}
              </div>
            </div>
          </div>

          {isSuperAdmin && onNavigateToVariables && (
            <button
              onClick={onNavigateToVariables}
              className="btn-primary"
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                tune
              </span>
              Configurar Variables
            </button>
          )}
        </div>
      )}

      {/* 2. Alerta si la sincronización Crontab está inactiva */}
      {hasSyncIssue && (
        <div
          style={{
            backgroundColor: '#f0f7ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '22px', color: '#1d4ed8', flexShrink: 0 }}
            >
              info
            </span>
            <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.4' }}>
              <strong>Sincronización Inactiva:</strong> La sincronización automática de campañas y leads se encuentra actualmente inactiva. Comuníquese con el administrador para activarla o configure la programación Crontab.
            </div>
          </div>

          {isSuperAdmin && onNavigateToScheduler && (
            <button
              onClick={onNavigateToScheduler}
              className="btn-secondary"
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                schedule
              </span>
              Programación Crontab
            </button>
          )}
        </div>
      )}
    </div>
  );
};
