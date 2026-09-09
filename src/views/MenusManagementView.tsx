import React, { useState, useEffect } from 'react';
import { menusApi, MenuDto } from '../services/api';

export const SECTION_LABEL_MAP: Record<string, string> = {
  Principal: 'Reportes & Analítica de Rendimiento',
  Operaciones: 'Gestión & Operaciones de Leads',
  Variables: 'Variables del Sistema',
  Administracion: 'Seguridad & Control de Acceso',
  Plataforma: 'Plataforma & Integraciones',
};

const COMMON_ICONS = [
  'monitoring',
  'compare_arrows',
  'campaign',
  'rule',
  'contacts',
  'ads_click',
  'schedule',
  'api',
  'manage_accounts',
  'admin_panel_settings',
  'key',
  'menu_open',
  'bar_chart',
  'table_chart',
  'settings',
  'database',
  'security',
  'folder',
];

export const MenusManagementView: React.FC = () => {
  const [menus, setMenus] = useState<MenuDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuDto | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<MenuDto | null>(null);

  // Form State
  const [formLabel, setFormLabel] = useState('');
  const [formRuta, setFormRuta] = useState('');
  const [formIcono, setFormIcono] = useState('circle');
  const [formOrden, setFormOrden] = useState(0);
  const [formTipo, setFormTipo] = useState('Principal');
  const [saving, setSaving] = useState(false);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await menusApi.getAll();
      const data = (res.data as any)?.data || res.data;
      setMenus(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al cargar los menús',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const openCreateModal = () => {
    setEditingMenu(null);
    setFormLabel('');
    setFormRuta('');
    setFormIcono('circle');
    setFormOrden((menus.length + 1) * 1);
    setFormTipo('Principal');
    setIsModalOpen(true);
  };

  const openEditModal = (m: MenuDto) => {
    setEditingMenu(m);
    setFormLabel(m.label);
    setFormRuta(m.ruta);
    setFormIcono(m.icono || 'circle');
    setFormOrden(m.orden);
    setFormTipo(m.tipo || 'Principal');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editingMenu) {
        await menusApi.update(editingMenu.id, {
          label: formLabel,
          ruta: formRuta,
          icono: formIcono,
          orden: Number(formOrden),
          tipo: formTipo,
        });
        setFeedback({ type: 'success', message: `Menú "${formLabel}" actualizado exitosamente.` });
      } else {
        await menusApi.create({
          label: formLabel,
          ruta: formRuta,
          icono: formIcono,
          orden: Number(formOrden),
          tipo: formTipo,
        });
        setFeedback({ type: 'success', message: `Menú "${formLabel}" creado exitosamente.` });
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al guardar el menú.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!menuToDelete) return;
    setSaving(true);
    try {
      await menusApi.delete(menuToDelete.id);
      setFeedback({ type: 'success', message: `Menú "${menuToDelete.label}" eliminado.` });
      setMenuToDelete(null);
      fetchMenus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'No fue posible eliminar el menú.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Group by tipo
  const sections = Array.from(new Set(menus.map((m) => m.tipo || 'Principal'))).sort();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '28px' }}>
              menu_open
            </span>
            Gestión de Menús Dinámicos
          </h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Estructuración y ordenamiento de rutas y vistas para asignación por roles ({menus.length} menús registrados)
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add
          </span>
          Nuevo Menú
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

      {/* Menus List by Sections */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '32px' }}>
            sync
          </span>
          <div style={{ marginTop: '12px', fontSize: '14px' }}>Cargando catálogo de menús...</div>
        </div>
      ) : menus.length === 0 ? (
        <div className="precision-card" style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#c3c6d6', marginBottom: '8px' }}>
            menu
          </span>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>No hay menús registrados</div>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Crea los menús base para asignarlos a roles.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sections.map((section) => {
            const sectionMenus = menus
              .filter((m) => (m.tipo || 'Principal') === section)
              .sort((a, b) => a.orden - b.orden);

            return (
              <div key={section} className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '14px 20px',
                    backgroundColor: '#fafbfc',
                    borderBottom: '1px solid #edf0f2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '20px' }}>
                    folder
                  </span>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>
                    Sección: {SECTION_LABEL_MAP[section] || section} {section !== (SECTION_LABEL_MAP[section] || section) ? `(${section})` : ''}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#737685', marginLeft: 'auto' }}>
                    {sectionMenus.length} ítem(s)
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #edf0f2', textAlign: 'left', color: '#5c6270' }}>
                        <th style={{ padding: '10px 16px', width: '70px' }}>Orden</th>
                        <th style={{ padding: '10px 16px' }}>Icono & Etiqueta</th>
                        <th style={{ padding: '10px 16px' }}>Ruta / ID de Tab</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionMenus.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #edf0f2' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#737685' }}>
                            #{m.orden}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: '#edf0f2',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#0052cc',
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                  {m.icono || 'circle'}
                                </span>
                              </div>
                              <span style={{ fontWeight: 600, color: '#1a1c1c' }}>{m.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#0052cc' }}>
                            /{m.ruta}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => openEditModal(m)}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                title="Editar menú"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                              </button>
                              <button
                                onClick={() => setMenuToDelete(m)}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '12px', color: '#de350b' }}
                                title="Eliminar menú"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create / Edit Menu */}
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
            style={{ width: '100%', maxWidth: '500px', padding: '28px', backgroundColor: '#ffffff' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                  menu_open
                </span>
                {editingMenu ? `Editar Menú: ${editingMenu.label}` : 'Crear Nuevo Menú'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737685' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="menuFormLabel">
                  Etiqueta Visible <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">label</span>
                  <input
                    id="menuFormLabel"
                    type="text"
                    required
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="ej. Auditoría de Cuentas"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="menuFormRuta">
                  Ruta o ID de Pestaña <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">link</span>
                  <input
                    id="menuFormRuta"
                    type="text"
                    required
                    value={formRuta}
                    onChange={(e) => setFormRuta(e.target.value)}
                    placeholder="ej. audit o /audit"
                    className="input-field"
                    style={{ fontFamily: 'JetBrains Mono' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="menuFormTipo">
                    Sección / Categoría
                  </label>
                  <select
                    id="menuFormTipo"
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="input-field"
                  >
                    <option value="Principal">Reportes & Analítica (Principal)</option>
                    <option value="Operaciones">Gestión & Operaciones de Leads (Operaciones)</option>
                    <option value="Variables">Variables del Sistema (Variables)</option>
                    <option value="Administracion">Seguridad & Control de Acceso (Administracion)</option>
                    <option value="Plataforma">Plataforma & Integraciones (Plataforma)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="menuFormOrden">
                    Orden Numérico
                  </label>
                  <input
                    id="menuFormOrden"
                    type="number"
                    value={formOrden}
                    onChange={(e) => setFormOrden(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="menuFormIcon">
                  Icono (Google Material Symbol)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      backgroundColor: '#f0f5ff',
                      border: '1px solid #d0d5dd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0052cc',
                      flexShrink: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                      {formIcono || 'circle'}
                    </span>
                  </div>
                  <input
                    id="menuFormIcon"
                    type="text"
                    value={formIcono}
                    onChange={(e) => setFormIcono(e.target.value.toLowerCase().trim())}
                    placeholder="nombre del icono (ej. monitoring)"
                    className="input-field"
                    style={{ flex: 1, fontFamily: 'JetBrains Mono' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {COMMON_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setFormIcono(ic)}
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: formIcono === ic ? '2px solid #0052cc' : '1px solid #edf0f2',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={ic}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#434654' }}>
                        {ic}
                      </span>
                    </button>
                  ))}
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
                  {saving ? 'Guardando...' : editingMenu ? 'Guardar Cambios' : 'Crear Menú'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {menuToDelete && (
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
              <h3 style={{ margin: 0, fontSize: '17px' }}>¿Eliminar Menú?</h3>
            </div>

            <p style={{ fontSize: '13.5px', color: '#434654', lineHeight: 1.5, marginBottom: '20px' }}>
              Estás a punto de eliminar el menú <strong>"{menuToDelete.label}"</strong> ({menuToDelete.ruta}).
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setMenuToDelete(null)}
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
