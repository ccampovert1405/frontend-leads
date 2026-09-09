import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAppToast } from '../context/ToastContext';

interface PlatformVarState {
  platform: 'META' | 'TIKTOK';
  accessToken: string;
  accessTokenMasked?: string;
  appId: string;
  appSecret: string;
  appSecretMasked?: string;
  accountId: string;
  apiUrl: string;
  isActive: boolean;
  isConfigured: boolean;
  expiresAt: string | null;
  lastRenewedAt: string | null;
  lastRenewalStatus: string;
  lastRenewalError: string | null;
  updatedAt: string | null;
}

interface VariablesConfigViewProps {
  onNavigateToTutorial?: () => void;
}

export const VariablesConfigView: React.FC<VariablesConfigViewProps> = ({ onNavigateToTutorial }) => {
  const { isSuperAdmin } = useAuth();
  const toast = useAppToast();

  const [activePlatform, setActivePlatform] = useState<'META' | 'TIKTOK'>('META');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Estados de formularios
  const [metaForm, setMetaForm] = useState<PlatformVarState>({
    platform: 'META',
    accessToken: '',
    appId: '',
    appSecret: '',
    accountId: '',
    apiUrl: 'https://graph.facebook.com/v19.0',
    isActive: true,
    isConfigured: false,
    expiresAt: null,
    lastRenewedAt: null,
    lastRenewalStatus: 'NEVER_RENEWED',
    lastRenewalError: null,
    updatedAt: null,
  });

  const [tiktokForm, setTiktokForm] = useState<PlatformVarState>({
    platform: 'TIKTOK',
    accessToken: '',
    appId: '',
    appSecret: '',
    accountId: '',
    apiUrl: 'https://business-api.tiktok.com/open_api/v1.3',
    isActive: true,
    isConfigured: false,
    expiresAt: null,
    lastRenewedAt: null,
    lastRenewalStatus: 'NEVER_RENEWED',
    lastRenewalError: null,
    updatedAt: null,
  });

  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showMetaSecret, setShowMetaSecret] = useState(false);
  const [showTiktokToken, setShowTiktokToken] = useState(false);
  const [showTiktokSecret, setShowTiktokSecret] = useState(false);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform-credentials');
      const data: PlatformVarState[] = res.data.data || res.data;

      const meta = data.find((c) => c.platform === 'META');
      const tiktok = data.find((c) => c.platform === 'TIKTOK');

      if (meta) {
        setMetaForm({
          ...meta,
          accessToken: meta.accessTokenMasked || meta.accessToken,
          appSecret: meta.appSecretMasked || meta.appSecret,
        });
      }
      if (tiktok) {
        setTiktokForm({
          ...tiktok,
          accessToken: tiktok.accessTokenMasked || tiktok.accessToken,
          appSecret: tiktok.appSecretMasked || tiktok.appSecret,
        });
      }
    } catch (err: any) {
      toast.showError(
        'Error al cargar variables',
        err.response?.data?.message || 'No se pudieron recuperar las credenciales.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCredentials();
    }
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="precision-card" style={{ padding: '40px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ba1a1a', marginBottom: '16px' }}>
          block
        </span>
        <h2 style={{ fontSize: '18px', color: '#ba1a1a', marginBottom: '8px' }}>
          Acceso Restringido
        </h2>
        <p style={{ color: '#5c6270', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
          Solo los usuarios con rol <strong>Super Administrador</strong> tienen permisos para visualizar y configurar las variables de entorno de las plataformas externas.
        </p>
      </div>
    );
  }

  const currentForm = activePlatform === 'META' ? metaForm : tiktokForm;
  const setForm = (field: keyof PlatformVarState, value: any) => {
    if (activePlatform === 'META') {
      setMetaForm((prev) => ({ ...prev, [field]: value }));
    } else {
      setTiktokForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        accessToken: currentForm.accessToken,
        appId: currentForm.appId,
        appSecret: currentForm.appSecret,
        accountId: currentForm.accountId,
        apiUrl: currentForm.apiUrl,
        isActive: currentForm.isActive,
      };

      const res = await api.put(`/platform-credentials/${activePlatform}`, payload);
      const data = res.data.data || res.data;

      if (activePlatform === 'META') {
        setMetaForm({
          ...data,
          accessToken: data.accessTokenMasked || data.accessToken,
          appSecret: data.appSecretMasked || data.appSecret,
        });
      } else {
        setTiktokForm({
          ...data,
          accessToken: data.accessTokenMasked || data.accessToken,
          appSecret: data.appSecretMasked || data.appSecret,
        });
      }

      toast.showSuccess(
        'Variables Guardadas',
        `Configuración de ${activePlatform === 'META' ? 'Meta Ads' : 'TikTok Ads'} actualizada en base de datos.`,
      );
    } catch (err: any) {
      toast.showError(
        'Error al guardar',
        err.response?.data?.message || 'No se pudieron actualizar las variables.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await api.post(`/platform-credentials/${activePlatform}/test`);
      const data = res.data.data || res.data;

      if (data.success) {
        toast.showSuccess('Conexión Exitosa', data.message);
      } else {
        toast.showWarn('Prueba no completada', data.message);
      }
    } catch (err: any) {
      toast.showError(
        'Fallo de Conexión',
        err.response?.data?.message || err.message || 'Error al conectar con la API.',
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Variables del Sistema & Plataformas</h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Panel de control exclusivo del Super Administrador para parametrizar tokens, IDs de cuentas y URLs de Meta Ads y TikTok Ads
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onNavigateToTutorial && (
            <button
              type="button"
              onClick={onNavigateToTutorial}
              className="btn-secondary"
              style={{ fontSize: '13px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0052cc' }}>
                menu_book
              </span>
              Ver Tutorial de Variables
            </button>
          )}

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving || loading}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0052cc' }}>
              {testing ? 'sync' : 'network_check'}
            </span>
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary"
            style={{ fontSize: '13px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              save
            </span>
            {saving ? 'Guardando en BD...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Platform Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActivePlatform('META')}
          className={activePlatform === 'META' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 20px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            hub
          </span>
          Meta Ads Graph API
          <span
            className={`badge-status ${metaForm.isConfigured ? 'success' : 'warning'}`}
            style={{ fontSize: '11px', padding: '2px 6px', marginLeft: '4px' }}
          >
            {metaForm.isConfigured ? 'Configurado' : 'Incompleto'}
          </span>
        </button>

        <button
          onClick={() => setActivePlatform('TIKTOK')}
          className={activePlatform === 'TIKTOK' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 20px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            video_camera_front
          </span>
          TikTok Ads Business API
          <span
            className={`badge-status ${tiktokForm.isConfigured ? 'success' : 'warning'}`}
            style={{ fontSize: '11px', padding: '2px 6px', marginLeft: '4px' }}
          >
            {tiktokForm.isConfigured ? 'Configurado' : 'Incompleto'}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="precision-card" style={{ padding: '50px', textAlign: 'center', color: '#737685' }}>
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '32px' }}>
            sync
          </span>
          <div style={{ marginTop: '12px', fontSize: '14px' }}>Cargando variables desde base de datos...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          {/* Main Form */}
          <form onSubmit={handleSave} className="precision-card">
            <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                tune
              </span>
              Variables de Configuración ({activePlatform === 'META' ? 'Meta Ads' : 'TikTok Ads'})
            </h3>

            {/* Switch Integración Activa */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #edf0f2',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#1a1c1c' }}>Integración Activa</div>
                <div style={{ fontSize: '12px', color: '#5c6270' }}>
                  Habilita o deshabilita el consumo y sincronización de esta plataforma en el sistema
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={currentForm.isActive}
                  onChange={(e) => setForm('isActive', e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#0052cc' }}
                />
              </label>
            </div>

            {/* Token de Acceso */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                ACCESS TOKEN ({activePlatform === 'META' ? 'META_ACCESS_TOKEN' : 'TIKTOK_ACCESS_TOKEN'}) *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={
                    activePlatform === 'META'
                      ? showMetaToken
                        ? 'text'
                        : 'password'
                      : showTiktokToken
                      ? 'text'
                      : 'password'
                  }
                  className="precision-input"
                  placeholder="Pegue aquí el token de acceso vigente..."
                  value={currentForm.accessToken}
                  onChange={(e) => setForm('accessToken', e.target.value)}
                  style={{ fontFamily: 'JetBrains Mono', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (activePlatform === 'META') setShowMetaToken(!showMetaToken);
                    else setShowTiktokToken(!showTiktokToken);
                  }}
                  className="btn-secondary"
                  style={{ padding: '0 12px', flexShrink: 0 }}
                  title="Mostrar / Ocultar"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {(activePlatform === 'META' ? showMetaToken : showTiktokToken) ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '4px' }}>
                {activePlatform === 'META'
                  ? 'Token de Sistema o de Usuario de Larga Duración generado en Meta for Developers con permisos ads_read y leads_retrieval.'
                  : 'Token emitido en el TikTok Marketing API Portal con permisos para Lead Ads y Campaign Management.'}
              </div>
            </div>

            {/* ID de Cuenta Publicitaria / Anunciante */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                {activePlatform === 'META'
                  ? 'ID DE CUENTA PUBLICITARIA (META_AD_ACCOUNT_ID) *'
                  : 'ID DE ANUNCIANTE (TIKTOK_ADVERTISER_ID) *'}
              </label>
              <input
                type="text"
                className="precision-input"
                placeholder={activePlatform === 'META' ? 'act_123456789012345' : '7012345678901234567'}
                value={currentForm.accountId}
                onChange={(e) => setForm('accountId', e.target.value)}
                style={{ fontFamily: 'JetBrains Mono', fontSize: '13px' }}
              />
              <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '4px' }}>
                {activePlatform === 'META'
                  ? 'Identificador de la cuenta de anuncios. Debe iniciar obligatoriamente con el prefijo "act_".'
                  : 'Identificador numérico de la cuenta publicitaria en TikTok Ads Manager.'}
              </div>
            </div>

            {/* Grid App ID & App Secret */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                  APP ID ({activePlatform === 'META' ? 'META_APP_ID' : 'TIKTOK_APP_ID'})
                </label>
                <input
                  type="text"
                  className="precision-input"
                  placeholder="Identificador de la aplicación"
                  value={currentForm.appId}
                  onChange={(e) => setForm('appId', e.target.value)}
                  style={{ fontFamily: 'JetBrains Mono', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                  APP SECRET ({activePlatform === 'META' ? 'META_APP_SECRET' : 'TIKTOK_APP_SECRET'})
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type={
                      activePlatform === 'META'
                        ? showMetaSecret
                          ? 'text'
                          : 'password'
                        : showTiktokSecret
                        ? 'text'
                        : 'password'
                    }
                    className="precision-input"
                    placeholder="Clave secreta"
                    value={currentForm.appSecret}
                    onChange={(e) => setForm('appSecret', e.target.value)}
                    style={{ fontFamily: 'JetBrains Mono', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (activePlatform === 'META') setShowMetaSecret(!showMetaSecret);
                      else setShowTiktokSecret(!showTiktokSecret);
                    }}
                    className="btn-secondary"
                    style={{ padding: '0 10px', flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {(activePlatform === 'META' ? showMetaSecret : showTiktokSecret) ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* URL Base de la API */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                ENDPOINT BASE DE LA API ({activePlatform === 'META' ? 'META_GRAPH_API_URL' : 'TIKTOK_API_BASE_URL'})
              </label>
              <input
                type="text"
                className="precision-input"
                value={currentForm.apiUrl}
                onChange={(e) => setForm('apiUrl', e.target.value)}
                style={{ fontFamily: 'JetBrains Mono', fontSize: '13px' }}
              />
              <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '4px' }}>
                URL del endpoint oficial. Por defecto:{' '}
                <code>{activePlatform === 'META' ? 'https://graph.facebook.com/v19.0' : 'https://business-api.tiktok.com/open_api/v1.3'}</code>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                save
              </span>
              {saving ? 'Guardando Variables...' : 'Guardar y Aplicar en Caliente'}
            </button>
          </form>

          {/* Sidebar Info & Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="precision-card">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                ESTADO DE CONFIGURACIÓN
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`badge-status ${currentForm.isConfigured ? 'success' : 'warning'}`}>
                  {currentForm.isConfigured ? 'COMPLETO & OPERATIVO' : 'CONFIGURACIÓN INCOMPLETA'}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#5c6270', lineHeight: '1.4' }}>
                {currentForm.isConfigured
                  ? 'Las variables requeridas están persistidas en base de datos. Los analistas y roles operativos pueden extraer y sincronizar campañas.'
                  : 'Falta configurar el Token o ID de cuenta. Los roles no superadministradores verán un aviso informando que deben comunicarse con el Administrador.'}
              </p>
            </div>

            <div className="precision-card">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                ÚLTIMA ACTUALIZACIÓN EN BD
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', fontWeight: 600, color: '#1a1c1c' }}>
                {currentForm.updatedAt ? new Date(currentForm.updatedAt).toLocaleString() : 'Sin modificaciones'}
              </div>
            </div>

            <div className="precision-card">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                AUDITORÍA DE RENOVACIÓN
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className={`badge-status ${currentForm.lastRenewalStatus === 'OK' ? 'success' : 'info'}`}>
                  {currentForm.lastRenewalStatus}
                </span>
                <span style={{ fontSize: '12px', color: '#737685' }}>
                  {currentForm.lastRenewedAt ? new Date(currentForm.lastRenewedAt).toLocaleTimeString() : '-'}
                </span>
              </div>
              {currentForm.lastRenewalError && (
                <div style={{ fontSize: '12px', color: '#ba1a1a', marginTop: '6px' }}>
                  {currentForm.lastRenewalError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
