import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAppToast } from '../context/ToastContext';
import { SystemConfigBanner } from '../components/SystemConfigBanner';

interface SyncScheduleViewProps {
  onNavigateToVariables?: () => void;
}

export const SyncScheduleView: React.FC<SyncScheduleViewProps> = ({ onNavigateToVariables }) => {
  const toast = useAppToast();
  const [activeTab, setActiveTab] = useState<'scheduler' | 'webhook'>('scheduler');

  // Schedule states
  const [schedule, setSchedule] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // Schedule Form states
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [hour, setHour] = useState<number>(8);
  const [minute, setMinute] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [syncMeta, setSyncMeta] = useState<boolean>(true);
  const [syncTikTok, setSyncTikTok] = useState<boolean>(true);
  const [syncLeads, setSyncLeads] = useState<boolean>(true);

  // Webhook states
  const [webhookConfig, setWebhookConfig] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookSecret, setWebhookSecret] = useState<string>('');
  const [webhookAuthToken, setWebhookAuthToken] = useState<string>('');
  const [webhookIsEnabled, setWebhookIsEnabled] = useState<boolean>(false);
  const [webhookDeliveryFormat, setWebhookDeliveryFormat] = useState<'INDIVIDUAL' | 'BATCH' | 'ENVELOPE'>('INDIVIDUAL');
  const [webhookTriggerOnlyWhenLeadsFound, setWebhookTriggerOnlyWhenLeadsFound] = useState<boolean>(true);
  const [webhookRetryAttempts, setWebhookRetryAttempts] = useState<number>(3);
  const [webhookTimeoutMs, setWebhookTimeoutMs] = useState<number>(10000);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loadingWebhookLogs, setLoadingWebhookLogs] = useState(false);

  // Modal de Detalle / Prueba de Webhook
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Resultado de Prueba de Webhook');
  const [modalData, setModalData] = useState<any>(null);

  const daysMapping = [
    { label: 'Lun', val: 1, name: 'Lunes' },
    { label: 'Mar', val: 2, name: 'Martes' },
    { label: 'Mié', val: 3, name: 'Miércoles' },
    { label: 'Jue', val: 4, name: 'Jueves' },
    { label: 'Vie', val: 5, name: 'Viernes' },
    { label: 'Sáb', val: 6, name: 'Sábado' },
    { label: 'Dom', val: 0, name: 'Domingo' },
  ];

  const fetchScheduleAndLogs = async () => {
    setLoading(true);
    try {
      const [schedRes, logsRes] = await Promise.all([
        api.get('/sync-schedules'),
        api.get('/sync-schedules/logs?limit=20'),
      ]);

      const sData = schedRes.data.data || schedRes.data;
      setSchedule(sData);
      setDaysOfWeek(sData.daysOfWeek || [1, 2, 3, 4, 5]);
      setHour(sData.hour ?? 8);
      setMinute(sData.minute ?? 0);
      setIsEnabled(sData.isEnabled ?? true);
      setSyncMeta(sData.syncMeta ?? true);
      setSyncTikTok(sData.syncTikTok ?? true);
      setSyncLeads(sData.syncLeads ?? true);

      const lData = logsRes.data.data || logsRes.data;
      setLogs(lData.items || []);
    } catch (err: any) {
      console.error('Error al consultar configuración de sincronización:', err);
      toast.showError('Error al Cargar Configuración', err.response?.data?.message || 'No se pudo cargar la programación del Crontab.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookConfigAndLogs = async () => {
    setLoadingWebhookLogs(true);
    try {
      const [confRes, logsRes] = await Promise.all([
        api.get('/webhooks/config'),
        api.get('/webhooks/logs?limit=20'),
      ]);

      const cData = confRes.data.data || confRes.data;
      setWebhookConfig(cData);
      setWebhookUrl(cData.url || '');
      setWebhookSecret(cData.secret || '');
      setWebhookAuthToken(cData.authToken || '');
      setWebhookIsEnabled(cData.isEnabled ?? false);
      setWebhookDeliveryFormat(cData.deliveryFormat || 'INDIVIDUAL');
      setWebhookTriggerOnlyWhenLeadsFound(cData.triggerOnlyWhenLeadsFound ?? true);
      setWebhookRetryAttempts(cData.retryAttempts ?? 3);
      setWebhookTimeoutMs(cData.timeoutMs ?? 10000);

      const lData = logsRes.data.data || logsRes.data;
      setWebhookLogs(lData.items || []);
    } catch (err: any) {
      console.error('Error al consultar configuración de webhook:', err);
      // No bloquear si es la primera vez
    } finally {
      setLoadingWebhookLogs(false);
    }
  };

  useEffect(() => {
    fetchScheduleAndLogs();
    fetchWebhookConfigAndLogs();
  }, []);

  const toggleDay = (val: number) => {
    if (daysOfWeek.includes(val)) {
      if (daysOfWeek.length === 1) return; // Al menos 1 día
      setDaysOfWeek(daysOfWeek.filter((d) => d !== val));
    } else {
      setDaysOfWeek([...daysOfWeek, val].sort((a, b) => a - b));
    }
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const payload = {
        daysOfWeek,
        hour,
        minute,
        isEnabled,
        syncMeta,
        syncTikTok,
        syncLeads,
        timezone: 'America/Guayaquil',
      };

      const res = await api.put('/sync-schedules', payload);
      const data = res.data.data || res.data;
      setSchedule(data);
      toast.showSuccess(
        'Programación Guardada',
        `Configuración guardada en BD. Cron reprogramado a: "${data.cronExpression}".`
      );
    } catch (err: any) {
      toast.showError(
        'Error al Guardar Programación',
        err.response?.data?.message || 'No se pudo guardar la configuración de sincronización.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerNow = async () => {
    setTriggering(true);
    try {
      const res = await api.post('/sync-schedules/trigger');
      const data = res.data.data || res.data;
      toast.showSuccess(
        'Sincronización Completada',
        `Ejecutado con éxito: ${data.metaCampaigns ?? 0} camp. Meta, ${data.metaLeads ?? 0} leads Meta, ${data.tiktokCampaigns ?? 0} camp. TikTok, ${data.tiktokLeads ?? 0} leads TikTok`
      );
      fetchScheduleAndLogs();
      fetchWebhookConfigAndLogs();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Error al ejecutar sincronización';
      if (err.response?.status === 412) {
        toast.showWarn('Variables No Configuradas', errMsg);
      } else {
        toast.showError('Error al Sincronizar', errMsg);
      }
    } finally {
      setTriggering(false);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const payload = {
        url: webhookUrl.trim() || undefined,
        secret: webhookSecret.trim() || undefined,
        authToken: webhookAuthToken.trim() || undefined,
        isEnabled: webhookIsEnabled,
        deliveryFormat: webhookDeliveryFormat,
        triggerOnlyWhenLeadsFound: webhookTriggerOnlyWhenLeadsFound,
        retryAttempts: Number(webhookRetryAttempts) || 3,
        timeoutMs: Number(webhookTimeoutMs) || 10000,
      };

      const res = await api.put('/webhooks/config', payload);
      const data = res.data.data || res.data;
      setWebhookConfig(data);
      toast.showSuccess(
        'Webhook Guardado',
        `Configuración de webhook actualizada correctamente. Estado: ${data.isEnabled ? 'ACTIVO' : 'PAUSADO'}.`
      );
      fetchWebhookConfigAndLogs();
    } catch (err: any) {
      toast.showError(
        'Error al Guardar Webhook',
        err.response?.data?.message || 'No se pudo guardar la configuración del webhook.'
      );
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl || webhookUrl.trim().length === 0) {
      toast.showWarn('URL Requerida', 'Por favor ingresa la URL destino del webhook para realizar la prueba.');
      return;
    }

    setTestingWebhook(true);
    try {
      const payload = {
        url: webhookUrl.trim(),
        secret: webhookSecret.trim() || undefined,
        authToken: webhookAuthToken.trim() || undefined,
        deliveryFormat: webhookDeliveryFormat,
      };

      const res = await api.post('/webhooks/test', payload);
      const data = res.data.data || res.data;

      setModalTitle('Resultado de Prueba de Webhook en Vivo');
      setModalData(data);
      setModalOpen(true);

      if (data.success) {
        toast.showSuccess(
          'Prueba Exitosa',
          `El API del cliente respondió con HTTP ${data.httpStatus} en ${data.durationMs}ms.`
        );
      } else {
        toast.showError(
          'Fallo en la Prueba',
          `El servidor respondió con error o no fue alcanzable. Status: ${data.httpStatus || 'Sin conexión'}. Error: ${data.errorMessage || 'Timeout'}`
        );
      }

      fetchWebhookConfigAndLogs();
    } catch (err: any) {
      toast.showError(
        'Error al Probar Webhook',
        err.response?.data?.message || 'Fallo inesperado al ejecutar el test de webhook.'
      );
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleInspectLog = (logItem: any) => {
    setModalTitle(`Detalle de Entrega: ${logItem.deliveryFormat} (${new Date(logItem.createdAt).toLocaleString()})`);
    setModalData({
      success: logItem.status === 'SUCCESS',
      httpStatus: logItem.httpStatus,
      durationMs: logItem.durationMs,
      payload: logItem.requestPayload,
      responseBody: logItem.responseBody,
      errorMessage: logItem.errorMessage,
      attempts: logItem.attempts,
    });
    setModalOpen(true);
  };

  return (
    <div>
      {/* Banner de Estado de Configuración del Sistema */}
      <SystemConfigBanner onNavigateToVariables={onNavigateToVariables} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Programación Crontab & Webhooks de Salida</h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Automatiza la sincronización de leads de Meta y TikTok Ads y notifica a tu API mediante Webhooks en tiempo real
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleTriggerNow} disabled={triggering} className="btn-warning" style={{ fontSize: '13px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {triggering ? 'sync' : 'flash_on'}
            </span>
            {triggering ? 'Ejecutando...' : 'Sincronizar Ahora (Bajo Demanda)'}
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #edf0f2', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('scheduler')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'scheduler' ? '3px solid #0052cc' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'scheduler' ? '#0052cc' : '#5c6270',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            schedule
          </span>
          Parámetros del Crontab
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'webhook' ? '3px solid #0052cc' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'webhook' ? '#0052cc' : '#5c6270',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            webhook
          </span>
          Webhook de Notificación de Leads
          {webhookIsEnabled && (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00875a', marginLeft: '4px' }} />
          )}
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: SCHEDULER */}
      {activeTab === 'scheduler' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '32px' }}>
            {/* Left: Schedule Form */}
            <div className="precision-card">
              <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                  tune
                </span>
                Parámetros del Crontab
              </h3>

              {/* Días de la semana */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '10px' }}>
                  DÍAS DE LA SEMANA DE EJECUCIÓN
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {daysMapping.map((day) => {
                    const selected = daysOfWeek.includes(day.val);
                    return (
                      <button
                        key={day.val}
                        type="button"
                        onClick={() => toggleDay(day.val)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '4px',
                          border: selected ? '1px solid #0052cc' : '1px solid #edf0f2',
                          backgroundColor: selected ? '#0052cc' : '#ffffff',
                          color: selected ? '#ffffff' : '#1a1c1c',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {day.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hora y Minutos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                    HORA DE DISPARO (0 - 23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="precision-input"
                    value={hour}
                    onChange={(e) => setHour(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                    MINUTO DE DISPARO (0 - 59)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="precision-input"
                    value={minute}
                    onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Opciones booleanas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
                  />
                  <span style={{ fontWeight: 600 }}>Cron Habilitado</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                  <input
                    type="checkbox"
                    checked={syncMeta}
                    onChange={(e) => setSyncMeta(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
                  />
                  <span>Sincronizar Meta</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                  <input
                    type="checkbox"
                    checked={syncTikTok}
                    onChange={(e) => setSyncTikTok(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
                  />
                  <span>Sincronizar TikTok</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                  <input
                    type="checkbox"
                    checked={syncLeads}
                    onChange={(e) => setSyncLeads(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
                  />
                  <span>Descargar Leads</span>
                </label>
              </div>

              <button onClick={handleSaveSchedule} disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  save
                </span>
                {saving ? 'Guardando en BD...' : 'Guardar y Reprogramar Cron'}
              </button>
            </div>

            {/* Right: Status & Next Run Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="precision-card">
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                  EXPRESIÓN CRON RESULTANTE
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '20px', fontWeight: 700, color: '#0052cc' }}>
                  {schedule?.cronExpression || `${minute} ${hour} * * ${daysOfWeek.join(',')}`}
                </div>
                <div style={{ fontSize: '12px', color: '#737685', marginTop: '4px' }}>
                  Zona: America/Guayaquil (UTC-5)
                </div>
              </div>

              <div className="precision-card">
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                  PRÓXIMA EJECUCIÓN PROGRAMADA
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '14px', fontWeight: 600, color: '#1a1c1c' }}>
                  {schedule?.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'No calculada (deshabilitado)'}
                </div>
              </div>

              <div className="precision-card">
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                  ÚLTIMO DISPARO
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className={`badge-status ${schedule?.lastRunStatus === 'SUCCESS' ? 'success' : 'warning'}`}>
                    {schedule?.lastRunStatus || 'SIN REGISTRO'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#737685' }}>
                    {schedule?.lastRunAt ? new Date(schedule.lastRunAt).toLocaleTimeString() : '-'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#434654' }}>
                  {schedule?.lastRunMessage || 'Esperando primera ejecución programada.'}
                </div>
              </div>
            </div>
          </div>

          {/* Execution Logs Table */}
          <div className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf0f2', backgroundColor: '#f8f9fa' }}>
              <h3 style={{ fontSize: '15px', color: '#091e42' }}>Historial Cronológico de Sincronizaciones</h3>
            </div>

            {logs.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#737685', fontSize: '13px' }}>
                No hay registros de ejecución todavía.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #edf0f2', textAlign: 'left', backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '10px 14px' }}>Disparador</th>
                      <th style={{ padding: '10px 14px' }}>Estado</th>
                      <th style={{ padding: '10px 14px' }}>Fecha Inicio</th>
                      <th style={{ padding: '10px 14px' }}>Duración</th>
                      <th style={{ padding: '10px 14px' }}>Camp. Meta</th>
                      <th style={{ padding: '10px 14px' }}>Leads Meta</th>
                      <th style={{ padding: '10px 14px' }}>Camp. TikTok</th>
                      <th style={{ padding: '10px 14px' }}>Leads TikTok</th>
                      <th style={{ padding: '10px 14px' }}>Detalles / Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #edf0f2' }}>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono' }}>
                          <span className={`badge-status ${log.triggerType === 'CRON' ? 'info' : 'warning'}`}>
                            {log.triggerType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge-status ${log.status === 'SUCCESS' ? 'success' : 'error'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                          {new Date(log.startedAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                          {log.finishedAt
                            ? `${Math.round((new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s`
                            : 'En curso'}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono' }}>{log.metaCampaignsSynced}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#00875a' }}>
                          {log.metaLeadsSynced}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono' }}>{log.tiktokCampaignsSynced}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#00875a' }}>
                          {log.tiktokLeadsSynced ?? 0}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: log.errorMessage ? '#ba1a1a' : '#5c6270' }}>
                          {log.errorMessage || 'Sincronización completada sin incidencias.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* CONTENIDO PESTAÑA 2: WEBHOOK */}
      {activeTab === 'webhook' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '32px' }}>
            {/* Left: Webhook Configuration Form */}
            <div className="precision-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                      send
                    </span>
                    Configuración del Webhook Saliente (API del Cliente)
                  </h3>
                  <p style={{ color: '#5c6270', fontSize: '13px' }}>
                    Cuando el crontab descargue los leads de Meta y TikTok, se despachará una petición HTTP POST con la información completa del prospecto.
                  </p>
                </div>

                <span className={`badge-status ${webhookIsEnabled ? 'success' : 'warning'}`}>
                  {webhookIsEnabled ? 'WEBHOOK ACTIVO' : 'WEBHOOK PAUSADO'}
                </span>
              </div>

              {/* URL Destino */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                  URL DESTINO DEL ENDPOINT (API DEL CLIENTE / CRM / WEBHOOK) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input
                    type="url"
                    placeholder="https://mi-servidor.com/api/webhooks/leads"
                    className="precision-input"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', color: '#737685', fontSize: '18px' }}>
                    link
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '4px' }}>
                  Ejemplo: <code>https://crm.empresa.com/api/leads</code> o endpoint de Make / Zapier.
                </div>
              </div>

              {/* Formato de Entrega */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                  FORMATO DE ENVÍO DE DATOS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div
                    onClick={() => setWebhookDeliveryFormat('INDIVIDUAL')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: webhookDeliveryFormat === 'INDIVIDUAL' ? '2px solid #0052cc' : '1px solid #edf0f2',
                      backgroundColor: webhookDeliveryFormat === 'INDIVIDUAL' ? '#f0f5ff' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1c1c', marginBottom: '4px' }}>
                      1. Individual (1 por 1)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#5c6270' }}>
                      Un POST individual por cada lead con los 22 campos en el cuerpo. Recomendado para CRMs REST.
                    </div>
                  </div>

                  <div
                    onClick={() => setWebhookDeliveryFormat('BATCH')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: webhookDeliveryFormat === 'BATCH' ? '2px solid #0052cc' : '1px solid #edf0f2',
                      backgroundColor: webhookDeliveryFormat === 'BATCH' ? '#f0f5ff' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1c1c', marginBottom: '4px' }}>
                      2. Lote / Array
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#5c6270' }}>
                      Un solo POST con un array <code>[&#123;...&#125;, &#123;...&#125;]</code> de leads descargados.
                    </div>
                  </div>

                  <div
                    onClick={() => setWebhookDeliveryFormat('ENVELOPE')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: webhookDeliveryFormat === 'ENVELOPE' ? '2px solid #0052cc' : '1px solid #edf0f2',
                      backgroundColor: webhookDeliveryFormat === 'ENVELOPE' ? '#f0f5ff' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1c1c', marginBottom: '4px' }}>
                      3. Envoltorio
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#5c6270' }}>
                      Un solo POST con metadatos del evento: <code>&#123; event, total, leads: [...] &#125;</code>.
                    </div>
                  </div>
                </div>
              </div>

              {/* Autenticación & Seguridad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                    TOKEN DE AUTORIZACIÓN (OPCIONAL)
                  </label>
                  <input
                    type="password"
                    placeholder="Bearer eyJhbGciOiJIUzI1Ni..."
                    className="precision-input"
                    value={webhookAuthToken}
                    onChange={(e) => setWebhookAuthToken(e.target.value)}
                  />
                  <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '4px' }}>
                    Se enviará en la cabecera <code>Authorization</code>.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '8px' }}>
                    SECRETO HMAC SHA-256 (OPCIONAL)
                  </label>
                  <input
                    type="password"
                    placeholder="clave_secreta_compartida"
                    className="precision-input"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                  />
                  <div style={{ fontSize: '11.5px', color: '#737685', marginTop: '4px' }}>
                    Firma digital en cabecera <code>X-Webhook-Signature</code>.
                  </div>
                </div>
              </div>

              {/* Switches y Parámetros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                  <input
                    type="checkbox"
                    checked={webhookIsEnabled}
                    onChange={(e) => setWebhookIsEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
                  />
                  <span style={{ fontWeight: 600 }}>Habilitar Webhook Saliente</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                  <input
                    type="checkbox"
                    checked={webhookTriggerOnlyWhenLeadsFound}
                    onChange={(e) => setWebhookTriggerOnlyWhenLeadsFound(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
                  />
                  <span>Disparar solo si hay leads nuevos</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={handleSaveWebhook} disabled={savingWebhook} className="btn-primary" style={{ padding: '10px 24px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    save
                  </span>
                  {savingWebhook ? 'Guardando...' : 'Guardar Configuración de Webhook'}
                </button>

                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !webhookUrl}
                  className="btn-secondary"
                  style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0052cc' }}>
                    {testingWebhook ? 'hourglass_top' : 'send_and_archive'}
                  </span>
                  {testingWebhook ? 'Enviando Prueba...' : 'Probar Webhook (Test Ping)'}
                </button>
              </div>
            </div>

            {/* Right: Security & Integration Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="precision-card">
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                  ESTRUCTURA DEL PAYLOAD
                </div>
                <div style={{ fontSize: '12.5px', color: '#1a1c1c', lineHeight: 1.5, marginBottom: '8px' }}>
                  Cada prospecto se envía con <strong>todos sus 22 campos</strong>:
                </div>
                <ul style={{ fontSize: '12px', color: '#5c6270', paddingLeft: '16px', margin: 0, lineHeight: 1.6 }}>
                  <li><code>id</code>, <code>source</code> ('META' | 'TIKTOK')</li>
                  <li><code>fullName</code>, <code>email</code>, <code>phone</code>, <code>cedula</code></li>
                  <li><code>ciudadDeclarada</code>, <code>contactPreference</code></li>
                  <li><code>canton</code>, <code>provincia</code>, <code>dependencia</code></li>
                  <li><code>rawPayload</code> (formulario y respuestas)</li>
                  <li><code>sourceCampaignId</code>, <code>campaignId</code></li>
                </ul>
              </div>

              <div className="precision-card">
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                  SEGURIDAD HMAC SHA-256
                </div>
                <div style={{ fontSize: '12px', color: '#434654', lineHeight: 1.5 }}>
                  Si defines un secreto, cada petición incluirá la cabecera:
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', backgroundColor: '#f8f9fa', padding: '6px', borderRadius: '4px', marginTop: '6px', wordBreak: 'break-all' }}>
                    X-Webhook-Signature: sha256=&lt;hash&gt;
                  </div>
                </div>
              </div>

              <div className="precision-card">
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#737685', textTransform: 'uppercase', marginBottom: '8px' }}>
                  POLÍTICA DE REINTENTOS
                </div>
                <div style={{ fontSize: '12px', color: '#5c6270' }}>
                  Si el servidor del cliente devuelve error 5xx o timeout, nuestro sistema aplica hasta 3 reintentos con retraso exponencial progresivo sin congelar el Crontab.
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Delivery Logs Table */}
          <div className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf0f2', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', color: '#091e42' }}>Historial de Entregas del Webhook</h3>
              <button
                onClick={fetchWebhookConfigAndLogs}
                disabled={loadingWebhookLogs}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0052cc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  refresh
                </span>
                Refrescar
              </button>
            </div>

            {webhookLogs.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#737685', fontSize: '13px' }}>
                No hay registros de envíos de webhook todavía. Haz clic en "Probar Webhook" para realizar el primer envío.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #edf0f2', textAlign: 'left', backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '10px 14px' }}>Fecha / Hora</th>
                      <th style={{ padding: '10px 14px' }}>Estado</th>
                      <th style={{ padding: '10px 14px' }}>Código HTTP</th>
                      <th style={{ padding: '10px 14px' }}>Latencia</th>
                      <th style={{ padding: '10px 14px' }}>Formato</th>
                      <th style={{ padding: '10px 14px' }}>Leads</th>
                      <th style={{ padding: '10px 14px' }}>URL Destino</th>
                      <th style={{ padding: '10px 14px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #edf0f2' }}>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge-status ${log.status === 'SUCCESS' ? 'success' : 'error'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                          {log.httpStatus ? (
                            <span style={{ color: log.httpStatus >= 200 && log.httpStatus < 300 ? '#00875a' : '#ba1a1a' }}>
                              HTTP {log.httpStatus}
                            </span>
                          ) : (
                            <span style={{ color: '#ba1a1a' }}>Fallo de Red</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                          {log.durationMs}ms
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                          {log.deliveryFormat}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                          {log.leadsCount}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.url}>
                          {log.url}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            type="button"
                            onClick={() => handleInspectLog(log)}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#edf0f2',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              visibility
                            </span>
                            Ver Carga
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL DE DETALLE / INSPECCIÓN DE PAYLOAD */}
      {modalOpen && (
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
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #edf0f2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
              }}
            >
              <h3 style={{ fontSize: '16px', margin: 0, color: '#091e42' }}>{modalTitle}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#5c6270',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Badges de Estado */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <span className={`badge-status ${modalData?.success ? 'success' : 'error'}`}>
                  {modalData?.success ? 'ENTREGA EXITOSA' : 'ERROR EN ENTREGA'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1c1c' }}>
                  Código HTTP: {modalData?.httpStatus ? `HTTP ${modalData.httpStatus}` : 'Sin Respuesta HTTP'}
                </span>
                <span style={{ fontSize: '13px', color: '#5c6270' }}>
                  Latencia: {modalData?.durationMs ?? 0}ms
                </span>
                {modalData?.attempts && (
                  <span style={{ fontSize: '13px', color: '#5c6270' }}>
                    Intentos: {modalData.attempts}
                  </span>
                )}
              </div>

              {modalData?.errorMessage && (
                <div style={{ backgroundColor: '#ffebe6', color: '#ba1a1a', padding: '10px 14px', borderRadius: '4px', fontSize: '12.5px', marginBottom: '16px' }}>
                  <strong>Mensaje de Error:</strong> {modalData.errorMessage}
                </div>
              )}

              {/* Respuesta del Servidor */}
              {modalData?.responseBody && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '6px' }}>
                    RESPUESTA RECIBIDA DEL SERVIDOR DEL CLIENTE:
                  </label>
                  <pre
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #edf0f2',
                      borderRadius: '4px',
                      padding: '12px',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace',
                      overflowX: 'auto',
                      maxHeight: '140px',
                    }}
                  >
                    {modalData.responseBody}
                  </pre>
                </div>
              )}

              {/* Payload JSON Enviado */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#737685', marginBottom: '6px' }}>
                  PAYLOAD JSON ENVIADO (ESTRUCTURA EXACTA DE LEADS):
                </label>
                <pre
                  style={{
                    backgroundColor: '#1a1c1c',
                    color: '#e2e3e4',
                    borderRadius: '6px',
                    padding: '14px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    overflowX: 'auto',
                    maxHeight: '320px',
                  }}
                >
                  {JSON.stringify(modalData?.payload || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #edf0f2', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8f9fa' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary"
                style={{ padding: '8px 20px' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
