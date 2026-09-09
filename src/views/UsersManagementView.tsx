import React, { useState, useEffect } from 'react';
import { usersApi, rolesApi, UserDto, RoleDto } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const UsersManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);

  // Form state
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formRoleId, setFormRoleId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([usersApi.getAll(), rolesApi.getAll()]);
      const usersData = (usersRes.data as any)?.data || usersRes.data;
      const rolesData = (rolesRes.data as any)?.data || rolesRes.data;
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al cargar usuarios y roles',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPassword('');
    setShowFormPassword(false);
    setFormRoleId(roles.length > 0 ? roles[0].rolId : '');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserDto) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormPassword(''); // Opcional al editar
    setShowFormPassword(false);
    setFormRoleId(u.rol?.rolId || '');
    setFormIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editingUser) {
        const payload: any = {
          username: formUsername,
          roleId: formRoleId,
          isActive: formIsActive,
        };
        if (formPassword.trim().length >= 6) {
          payload.password = formPassword.trim();
        }
        await usersApi.update(editingUser.id, payload);
        setFeedback({ type: 'success', message: `Usuario "${formUsername}" actualizado exitosamente.` });
      } else {
        await usersApi.create({
          username: formUsername,
          password: formPassword,
          roleId: formRoleId,
          isActive: formIsActive,
        });
        setFeedback({ type: 'success', message: `Usuario "${formUsername}" creado exitosamente.` });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al procesar la solicitud de usuario.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setSaving(true);
    try {
      await usersApi.delete(userToDelete.id);
      setFeedback({ type: 'success', message: `Usuario "${userToDelete.username}" eliminado con éxito.` });
      setUserToDelete(null);
      fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'No fue posible eliminar al usuario seleccionado.',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !searchTerm ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole =
      roleFilter === 'ALL' ||
      (u.rol?.rolId === roleFilter) ||
      (u.role === roleFilter);

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '28px' }}>
              manage_accounts
            </span>
            Gestión de Usuarios del Sistema
          </h1>
          <p style={{ color: '#5c6270', fontSize: '13.5px' }}>
            Administración de cuentas, credenciales y asignación de roles ({users.length} usuarios registrados)
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            person_add
          </span>
          Nuevo Usuario
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
              placeholder="Buscar por usuario o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field input-compact"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475467' }}>Rol:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field input-compact"
            style={{ width: '180px' }}
          >
            <option value="ALL">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.rolId} value={r.rolId}>
                {r.nombreRol}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475467' }}>Estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field input-compact"
            style={{ width: '150px' }}
          >
            <option value="ALL">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="precision-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '32px' }}>
              sync
            </span>
            <div style={{ marginTop: '12px', fontSize: '14px' }}>Cargando usuarios...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#737685' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#c3c6d6', marginBottom: '8px' }}>
              person_off
            </span>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>No se encontraron usuarios</div>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Intenta ajustar los filtros de búsqueda o crea un nuevo usuario.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #edf0f2', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Usuario</th>
                  <th style={{ padding: '12px 16px' }}>Rol Asignado</th>
                  <th style={{ padding: '12px 16px' }}>Estado</th>
                  <th style={{ padding: '12px 16px' }}>Fecha Registro</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?.username === u.username;
                  const isSuper = u.role === 'Super Administrador' || u.rol?.nombreRol === 'Super Administrador';
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #edf0f2' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: isSuper ? '#0052cc' : '#edf0f2',
                              color: isSuper ? '#ffffff' : '#1a1c1c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1a1c1c' }}>
                              {u.username}
                              {isCurrent && (
                                <span
                                  style={{
                                    marginLeft: '6px',
                                    fontSize: '10.5px',
                                    padding: '1px 6px',
                                    backgroundColor: '#e3fcef',
                                    color: '#006644',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                  }}
                                >
                                  Tú
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#737685', fontFamily: 'JetBrains Mono' }}>
                              ID: {u.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge-status ${isSuper ? 'info' : 'neutral'}`}>
                          {u.rol?.nombreRol || u.role || 'Sin Rol'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge-status ${u.isActive ? 'success' : 'danger'}`}>
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: u.isActive ? '#00875a' : '#de350b',
                              display: 'inline-block',
                              marginRight: '6px',
                            }}
                          />
                          {u.isActive ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#737685', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(u)}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            title="Editar usuario o contraseña"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={isCurrent || u.username === 'administrator'}
                            className="btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              color: isCurrent || u.username === 'administrator' ? '#c3c6d6' : '#de350b',
                              cursor: isCurrent || u.username === 'administrator' ? 'not-allowed' : 'pointer',
                            }}
                            title={
                              isCurrent
                                ? 'No puedes eliminar tu propia cuenta'
                                : u.username === 'administrator'
                                ? 'No se puede eliminar el administrador principal'
                                : 'Eliminar usuario'
                            }
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create / Edit User */}
      {isModalOpen && (
        <div className="precision-modal-overlay">
          <div className="precision-modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                  {editingUser ? 'manage_accounts' : 'person_add'}
                </span>
                {editingUser ? `Editar Usuario: ${editingUser.username}` : 'Crear Nuevo Usuario'}
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
                <label className="form-label" htmlFor="userFormUsername">
                  Nombre de Usuario <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">person</span>
                  <input
                    id="userFormUsername"
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="ej. operador_ventas"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="userFormPassword">
                  {editingUser ? 'Nueva Contraseña' : 'Contraseña'} {!editingUser && <span className="required-star">*</span>}
                </label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">lock</span>
                  <input
                    id="userFormPassword"
                    type={showFormPassword ? 'text' : 'password'}
                    required={!editingUser}
                    minLength={6}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? '•••••••• (dejar en blanco para conservar actual)' : 'Mínimo 6 caracteres'}
                    className="input-field"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    tabIndex={-1}
                    title={showFormPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    <span className="material-symbols-outlined">
                      {showFormPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {editingUser && (
                  <span className="form-hint">
                    Dejar en blanco si deseas mantener la contraseña existente del usuario.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="userFormRole">
                  Rol en el Sistema <span className="required-star">*</span>
                </label>
                <select
                  id="userFormRole"
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecciona un rol...</option>
                  {roles.map((r) => (
                    <option key={r.rolId} value={r.rolId}>
                      {r.nombreRol} {r.descripcion ? `— ${r.descripcion}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label className={`checkbox-card ${formIsActive ? 'is-active' : ''}`} htmlFor="chkUserActive">
                  <input
                    type="checkbox"
                    id="chkUserActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                  />
                  <div className="checkbox-card-content">
                    <span className="checkbox-card-title">Usuario Habilitado para Iniciar Sesión</span>
                    <span className="checkbox-card-desc">
                      Permite que las credenciales de este usuario tengan acceso inmediato a la plataforma.
                    </span>
                  </div>
                </label>
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
                  {saving ? 'Guardando...' : editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="precision-modal-overlay">
          <div className="precision-modal-card" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#de350b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                warning
              </span>
              <h3 style={{ margin: 0, fontSize: '17px' }}>¿Eliminar Usuario?</h3>
            </div>

            <p style={{ fontSize: '13.5px', color: '#434654', lineHeight: 1.5, marginBottom: '20px' }}>
              Estás a punto de eliminar permanentemente al usuario{' '}
              <strong>"{userToDelete.username}"</strong>. Esta acción revocará de inmediato cualquier sesión activa y no se puede deshacer.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
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
