import React, { useState, useEffect } from 'react';
import { permissionsApi, PermissionDto } from '../services/api';

export const PermissionsManagementView: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permToDelete, setPermToDelete] = useState<PermissionDto | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formIdentificador, setFormIdentificador] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await permissionsApi.getAll();
      const data = (res.data as any)?.data || res.data;
      setPermissions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al cargar el catálogo de permisos',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await permissionsApi.create({
        nombreAccion: formNombre,
        identificadorAccion: formIdentificador,
      });
      setFeedback({ type: 'success', message: `Permiso "${formIdentificador}" registrado con éxito.` });
      setIsModalOpen(false);
      setFormNombre('');
      setFormIdentificador('');
      fetchPermissions();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al crear el permiso.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!permToDelete) return;
    setSaving(true);
    try {
      await permissionsApi.delete(permToDelete.permisoId);
      setFeedback({ type: 'success', message: `Permiso "${permToDelete.identificadorAccion}" eliminado.` });
      setPermToDelete(null);
      fetchPermissions();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al eliminar el permiso.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Modules list for filtering
  const allModules = Array.from(
    new Set(permissions.map((p) => p.identificadorAccion.split('.')[0] || 'general')),
  ).sort();

  const filteredPermissions = permissions.filter((p) => {
    const mod = p.identificadorAccion.split('.')[0] || 'general';
    const matchMod = moduleFilter === 'ALL' || mod === moduleFilter;
    const matchSearch =
      !searchTerm ||
      p.nombreAccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.identificadorAccion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchMod && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '28px' }}>
              key
            </span>
            Catálogo Único de Permisos
          </h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Acciones auto-descubiertas e inspeccionadas en controladores ({permissions.length} permisos activos)
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add
          </span>
          Nuevo Permiso
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '6px',
            backgroundColor: feedback.type === 'success' ? '#e3fcef' : '#ffebe6',
            color: feedback.type === 'success' ? '#006644' : '#bf2600',
            border: `1px solid ${feedback.type === 'success' ? '#abf5d1' : '#ffbdad'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>
      )}

      {/* Filters Bar */}
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
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div className="input-with-icon">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Buscar por identificador técnico o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field input-compact"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475467' }}>Módulo:</label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="input-field input-compact"
            style={{ width: '190px' }}
          >
            <option value="ALL">Todos los módulos</option>
            {allModules.map((m) => (
              <option key={m} value={m}>
                {m.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '32px' }}>
              sync
            </span>
            <div style={{ marginTop: '12px', fontSize: '14px' }}>Cargando permisos...</div>
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#c3c6d6', marginBottom: '8px' }}>
              key_off
            </span>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>No se encontraron permisos</div>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Modifica los filtros o da de alta una acción.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #edf0f2', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Identificador Técnico</th>
                  <th style={{ padding: '12px 16px' }}>Nombre / Descripción</th>
                  <th style={{ padding: '12px 16px' }}>Módulo</th>
                  <th style={{ padding: '12px 16px' }}>Roles con Acceso</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.map((p) => {
                  const mod = p.identificadorAccion.split('.')[0] || 'general';
                  return (
                    <tr key={p.permisoId} style={{ borderBottom: '1px solid #edf0f2' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#0052cc' }}>
                        {p.identificadorAccion}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#1a1c1c', fontWeight: 500 }}>
                        {p.nombreAccion}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge-status neutral">
                          {mod.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            color: p.rolesCount && p.rolesCount > 0 ? '#00875a' : '#737685',
                            fontWeight: 600,
                          }}
                        >
                          {p.rolesCount ?? p.roles?.length ?? 0} rol(es)
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setPermToDelete(p)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', color: '#de350b' }}
                          title="Eliminar permiso"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
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

      {/* Modal Create Permission */}
      {isModalOpen && (
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
          }}
        >
          <div
            className="precision-card"
            style={{ width: '100%', maxWidth: '480px', padding: '28px', backgroundColor: '#ffffff' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                  key
                </span>
                Registrar Nuevo Permiso
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737685' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="permFormIdentificador">
                  Identificador Técnico <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">key</span>
                  <input
                    id="permFormIdentificador"
                    type="text"
                    required
                    value={formIdentificador}
                    onChange={(e) => setFormIdentificador(e.target.value.toLowerCase().trim())}
                    placeholder="ej. reports.sales.export"
                    className="input-field"
                    style={{ fontFamily: 'JetBrains Mono' }}
                  />
                </div>
                <span className="form-hint">
                  Estructura recomendada: <code>modulo.entidad.accion</code> (en minúsculas).
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="permFormNombre">
                  Nombre Descriptivo de la Acción <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">description</span>
                  <input
                    id="permFormNombre"
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="ej. Exportar Reportes de Ventas"
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Registrando...' : 'Registrar Permiso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {permToDelete && (
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
          }}
        >
          <div
            className="precision-card"
            style={{ width: '100%', maxWidth: '440px', padding: '24px', backgroundColor: '#ffffff' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#de350b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                warning
              </span>
              <h3 style={{ margin: 0, fontSize: '17px' }}>¿Eliminar Permiso?</h3>
            </div>

            <p style={{ fontSize: '13.5px', color: '#434654', lineHeight: 1.5, marginBottom: '20px' }}>
              Estás a punto de remover el permiso{' '}
              <strong>"{permToDelete.identificadorAccion}"</strong>. Los roles que lo tengan asignado perderán esta autorización inmediatamente.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPermToDelete(null)}
                className="btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-primary"
                style={{ backgroundColor: '#de350b', borderColor: '#de350b' }}
                disabled={saving}
              >
                {saving ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
