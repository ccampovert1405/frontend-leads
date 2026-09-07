import React, { useState, useEffect } from 'react';
import { rolesApi, permissionsApi, menusApi, RoleDto, PermissionDto, MenuDto } from '../services/api';

export const RolesManagementView: React.FC = () => {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([]);
  const [allMenus, setAllMenus] = useState<MenuDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleDto | null>(null);
  const [modalTab, setModalTab] = useState<'info' | 'perms' | 'menus'>('info');

  // Form State
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, menusRes] = await Promise.all([
        rolesApi.getAll(),
        permissionsApi.getAll(),
        menusApi.getAll(),
      ]);
      const rolesData = (rolesRes.data as any)?.data || rolesRes.data;
      const permsData = (permsRes.data as any)?.data || permsRes.data;
      const menusData = (menusRes.data as any)?.data || menusRes.data;

      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setAllPermissions(Array.isArray(permsData) ? permsData : []);
      setAllMenus(Array.isArray(menusData) ? menusData : []);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al cargar roles, permisos y menús',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setFormNombre('');
    setFormDescripcion('');
    setSelectedPermIds([]);
    setSelectedMenuIds([]);
    setModalTab('info');
    setIsModalOpen(true);
  };

  const openEditModal = (r: RoleDto) => {
    setEditingRole(r);
    setFormNombre(r.nombreRol);
    setFormDescripcion(r.descripcion || '');
    setSelectedPermIds(r.permisos ? r.permisos.map((p) => p.permisoId) : []);
    setSelectedMenuIds(r.menus ? r.menus.map((m) => m.id) : []);
    setModalTab('info');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editingRole) {
        await rolesApi.update(editingRole.rolId, {
          nombreRol: formNombre,
          descripcion: formDescripcion,
          permissionIds: selectedPermIds,
          menuIds: selectedMenuIds,
        });
        setFeedback({ type: 'success', message: `Rol "${formNombre}" actualizado exitosamente.` });
      } else {
        await rolesApi.create({
          nombreRol: formNombre,
          descripcion: formDescripcion,
          permissionIds: selectedPermIds,
          menuIds: selectedMenuIds,
        });
        setFeedback({ type: 'success', message: `Rol "${formNombre}" creado con éxito.` });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al guardar el rol.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    setSaving(true);
    try {
      await rolesApi.delete(roleToDelete.rolId);
      setFeedback({ type: 'success', message: `Rol "${roleToDelete.nombreRol}" eliminado exitosamente.` });
      setRoleToDelete(null);
      fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'No fue posible eliminar el rol.',
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  };

  const toggleMenu = (menuId: string) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId],
    );
  };

  // Group permissions by prefix/module
  const groupedPermissions: Record<string, PermissionDto[]> = {};
  allPermissions.forEach((p) => {
    const prefix = p.identificadorAccion.split('.')[0] || 'general';
    if (!groupedPermissions[prefix]) groupedPermissions[prefix] = [];
    groupedPermissions[prefix].push(p);
  });

  // Group menus by tipo
  const groupedMenus: Record<string, MenuDto[]> = {};
  allMenus.forEach((m) => {
    const tipo = m.tipo || 'General';
    if (!groupedMenus[tipo]) groupedMenus[tipo] = [];
    groupedMenus[tipo].push(m);
  });

  const filteredRoles = roles.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.nombreRol.toLowerCase().includes(term) ||
      (r.descripcion && r.descripcion.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '28px' }}>
              admin_panel_settings
            </span>
            Roles & Autorizaciones (RBAC)
          </h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Definición de perfiles de acceso, asignación de permisos granulares y menús autorizados ({roles.length} roles)
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add_moderator
          </span>
          Nuevo Rol
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

      {/* Search Bar */}
      <div className="precision-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div className="input-with-icon">
          <span className="material-symbols-outlined">search</span>
          <input
            type="search"
            placeholder="Buscar rol por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field input-compact"
          />
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '32px' }}>
            sync
          </span>
          <div style={{ marginTop: '12px', fontSize: '14px' }}>Cargando catálogo de roles...</div>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="precision-card" style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#c3c6d6', marginBottom: '8px' }}>
            shield
          </span>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>No se encontraron roles</div>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Crea un nuevo rol para estructurar los permisos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredRoles.map((r) => {
            const isSuper = r.nombreRol === 'Super Administrador';
            return (
              <div
                key={r.rolId}
                className="precision-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: isSuper ? '4px solid #0052cc' : '4px solid #5c6270',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#1a1c1c' }}>{r.nombreRol}</h3>
                    <span className={`badge-status ${isSuper ? 'info' : 'neutral'}`}>
                      {isSuper ? 'Sistema' : 'Personalizado'}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#5c6270', minHeight: '38px', marginBottom: '16px', lineHeight: 1.4 }}>
                    {r.descripcion || 'Sin descripción configurada.'}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #edf0f2',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0052cc' }}>
                        key
                      </span>
                      <span><strong>{isSuper ? 'Todos' : r.permisosCount ?? r.permisos?.length ?? 0}</strong> Permisos</span>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #edf0f2',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#00875a' }}>
                        menu_open
                      </span>
                      <span><strong>{isSuper ? 'Todos' : r.menusCount ?? r.menus?.length ?? 0}</strong> Menús</span>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #edf0f2',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ffab00' }}>
                        group
                      </span>
                      <span><strong>{r.usersCount ?? 0}</strong> Usuarios</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #edf0f2', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(r)}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
                    Configurar
                  </button>

                  <button
                    onClick={() => setRoleToDelete(r)}
                    disabled={isSuper || (r.usersCount ? r.usersCount > 0 : false)}
                    className="btn-secondary"
                    style={{
                      fontSize: '12px',
                      padding: '6px 10px',
                      color: isSuper || (r.usersCount ? r.usersCount > 0 : false) ? '#c3c6d6' : '#de350b',
                      cursor: isSuper || (r.usersCount ? r.usersCount > 0 : false) ? 'not-allowed' : 'pointer',
                    }}
                    title={
                      isSuper
                        ? 'No se puede eliminar el rol del sistema'
                        : r.usersCount && r.usersCount > 0
                        ? 'Tiene usuarios vinculados'
                        : 'Eliminar rol'
                    }
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create / Edit Role with Permissions & Menus Tabs */}
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
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                  security
                </span>
                {editingRole ? `Configurar Rol: ${editingRole.nombreRol}` : 'Crear Nuevo Rol'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737685' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #edf0f2', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setModalTab('info')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'info' ? '2px solid #0052cc' : '2px solid transparent',
                  color: modalTab === 'info' ? '#0052cc' : '#5c6270',
                  fontWeight: modalTab === 'info' ? 700 : 500,
                  fontSize: '13px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
                Información General
              </button>

              <button
                type="button"
                onClick={() => setModalTab('perms')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'perms' ? '2px solid #0052cc' : '2px solid transparent',
                  color: modalTab === 'perms' ? '#0052cc' : '#5c6270',
                  fontWeight: modalTab === 'perms' ? 700 : 500,
                  fontSize: '13px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>key</span>
                Permisos Granulares ({selectedPermIds.length})
              </button>

              <button
                type="button"
                onClick={() => setModalTab('menus')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'menus' ? '2px solid #0052cc' : '2px solid transparent',
                  color: modalTab === 'menus' ? '#0052cc' : '#5c6270',
                  fontWeight: modalTab === 'menus' ? 700 : 500,
                  fontSize: '13px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>menu_open</span>
                Menús Asignados ({selectedMenuIds.length})
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '20px' }}>
                {modalTab === 'info' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="roleFormNombre">
                        Nombre del Rol <span className="required-star">*</span>
                      </label>
                      <input
                        id="roleFormNombre"
                        type="text"
                        required
                        disabled={editingRole?.nombreRol === 'Super Administrador'}
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        placeholder="ej. Supervisor de Cuentas"
                        className="input-field"
                      />
                      {editingRole?.nombreRol === 'Super Administrador' && (
                        <span className="form-hint">
                          El rol Super Administrador es un rol reservado del sistema.
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="roleFormDesc">
                        Descripción
                      </label>
                      <textarea
                        id="roleFormDesc"
                        rows={3}
                        value={formDescripcion}
                        onChange={(e) => setFormDescripcion(e.target.value)}
                        placeholder="Indica el propósito y alcance de este rol..."
                        className="input-field"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )}

                {modalTab === 'perms' && (
                  <div>
                    <p style={{ fontSize: '12.5px', color: '#5c6270', marginBottom: '12px' }}>
                      Selecciona las acciones y operaciones autorizadas para este rol:
                    </p>

                    {Object.entries(groupedPermissions).map(([domain, perms]) => {
                      const allDomainSelected = perms.every((p) => selectedPermIds.includes(p.permisoId));
                      return (
                        <div
                          key={domain}
                          style={{
                            border: '1px solid #edf0f2',
                            borderRadius: '6px',
                            padding: '12px',
                            marginBottom: '12px',
                            backgroundColor: '#fafbfc',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px',
                              borderBottom: '1px solid #edf0f2',
                              paddingBottom: '6px',
                            }}
                          >
                            <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', color: '#0052cc' }}>
                              Módulo: {domain}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (allDomainSelected) {
                                  const domainIds = new Set(perms.map((p) => p.permisoId));
                                  setSelectedPermIds((prev) => prev.filter((id) => !domainIds.has(id)));
                                } else {
                                  const newIds = perms.map((p) => p.permisoId);
                                  setSelectedPermIds((prev) => Array.from(new Set([...prev, ...newIds])));
                                }
                              }}
                              className="btn-secondary"
                              style={{ fontSize: '11px', padding: '2px 8px' }}
                            >
                              {allDomainSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                            {perms.map((p) => (
                              <label
                                key={p.permisoId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  fontSize: '12.5px',
                                  cursor: 'pointer',
                                  backgroundColor: '#ffffff',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #edf0f2',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPermIds.includes(p.permisoId)}
                                  onChange={() => togglePermission(p.permisoId)}
                                  style={{ marginTop: '2px' }}
                                />
                                <div>
                                  <div style={{ fontWeight: 600, color: '#1a1c1c' }}>{p.nombreAccion}</div>
                                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10.5px', color: '#737685' }}>
                                    {p.identificadorAccion}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {modalTab === 'menus' && (
                  <div>
                    <p style={{ fontSize: '12.5px', color: '#5c6270', marginBottom: '12px' }}>
                      Activa los menús visibles en el panel de navegación para los usuarios con este rol:
                    </p>

                    {Object.entries(groupedMenus).map(([tipo, mList]) => (
                      <div
                        key={tipo}
                        style={{
                          border: '1px solid #edf0f2',
                          borderRadius: '6px',
                          padding: '12px',
                          marginBottom: '12px',
                          backgroundColor: '#fafbfc',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1c1c', marginBottom: '8px' }}>
                          Sección: {tipo}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                          {mList.map((m) => (
                            <label
                              key={m.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                backgroundColor: '#ffffff',
                                padding: '8px 10px',
                                borderRadius: '4px',
                                border: '1px solid #edf0f2',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedMenuIds.includes(m.id)}
                                onChange={() => toggleMenu(m.id)}
                              />
                              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0052cc' }}>
                                {m.icono || 'circle'}
                              </span>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1a1c1c' }}>{m.label}</div>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#737685' }}>
                                  /{m.ruta}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ borderTop: '1px solid #edf0f2', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingRole ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {roleToDelete && (
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
              <h3 style={{ margin: 0, fontSize: '17px' }}>¿Eliminar Rol?</h3>
            </div>

            <p style={{ fontSize: '13.5px', color: '#434654', lineHeight: 1.5, marginBottom: '20px' }}>
              Estás a punto de eliminar el rol <strong>"{roleToDelete.nombreRol}"</strong>. Esta acción desvinculará todos los permisos y menús asociados.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
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
                {saving ? 'Eliminando...' : 'Sí, Eliminar Rol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
