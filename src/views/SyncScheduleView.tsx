import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAppToast } from '../context/ToastContext';
import { SystemConfigBanner } from '../components/SystemConfigBanner';

interface SyncScheduleViewProps {
  onNavigateToVariables?: () => void;
}

export const SyncScheduleView: React.FC<SyncScheduleViewProps> = ({ onNavigateToVariables }) => {
  const toast = useAppToast();
  const [schedule, setSchedule] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // Form states
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [hour, setHour] = useState<number>(8);
  const [minute, setMinute] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [syncMeta, setSyncMeta] = useState<boolean>(true);
  const [syncTikTok, setSyncTikTok] = useState<boolean>(true);
  const [syncLeads, setSyncLeads] = useState<boolean>(true);

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

  useEffect(() => {
    fetchScheduleAndLogs();
  }, []);

  const toggleDay = (val: number) => {
    if (daysOfWeek.includes(val)) {
      if (daysOfWeek.length === 1) return; // Al menos 1 día
      setDaysOfWeek(daysOfWeek.filter((d) => d !== val));
    } else {
      setDaysOfWeek([...daysOfWeek, val].sort((a, b) => a - b));
    }
  };

  const handleSave = async () => {
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
        `Ejecutado con éxito: ${data.metaCampaigns ?? 0} camp. Meta, ${data.metaLeads ?? 0} leads Meta, ${data.tiktokCampaigns ?? 0} camp. TikTok`
      );
      fetchScheduleAndLogs();
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

  return (
    <div>
      {/* Banner de Estado de Configuración del Sistema */}
      <SystemConfigBanner onNavigateToVariables={onNavigateToVariables} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Programación Crontab en Base de Datos</h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Parametriza los días de la semana, hora y minuto de ejecución automática con reprogramación en memoria
          </p>
        </div>

        <button onClick={handleTriggerNow} disabled={triggering} className="btn-warning" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {triggering ? 'sync' : 'flash_on'}
          </span>
          {triggering ? 'Ejecutando...' : 'Sincronizar Ahora (Bajo Demanda)'}
        </button>
      </div>

      {/* Configuration Cards Grid */}
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

          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
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
    </div>
  );
};
