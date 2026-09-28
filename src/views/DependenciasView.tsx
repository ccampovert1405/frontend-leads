import React, { useState, useEffect } from 'react';
import { dependenciasApi, geoApi, DependenciaDto, ProvinciaDto, CantonDto } from '../services/api';
import { useAppToast } from '../context/ToastContext';

export const DependenciasView: React.FC = () => {
  const toast = useAppToast();
  const [dependencias, setDependencias] = useState<DependenciaDto[]>([]);
  const [provincias, setProvincias] = useState<ProvinciaDto[]>([]);
  const [cantonesPorProvincia, setCantonesPorProvincia] = useState<CantonDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [provinciaFilter, setProvinciaFilter] = useState<number | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('ALL');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formIdProvincia, setFormIdProvincia] = useState<number | ''>('');
  const [formIdCanton, setFormIdCanton] = useState<number | ''>('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formEstado, setFormEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');

  // Confirmar eliminación
  const [depToDelete, setDepToDelete] = useState<DependenciaDto | null>(null);

  const fetchProvincias = async () => {
    try {
      const res = await geoApi.getProvincias();
      const data = (res.data as any)?.data || res.data;
      setProvincias(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al cargar provincias:', err);
    }
  };

  const fetchDependencias = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (provinciaFilter !== '') params.idProvincia = Number(provinciaFilter);
      if (estadoFilter !== 'ALL') params.estado = estadoFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await dependenciasApi.getAll(params);
      const data = (res.data as any)?.data || res.data;
      setDependencias(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al cargar dependencias:', err);
      toast.showError('Error', err.response?.data?.message || 'No se pudieron consultar las dependencias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvincias();
  }, []);

  useEffect(() => {
    fetchDependencias();
  }, [provinciaFilter, estadoFilter]);

  // Cuando cambia la provincia seleccionada en el formulario modal, cargar sus cantones
  useEffect(() => {
    if (formIdProvincia) {
      geoApi.getCantones(Number(formIdProvincia)).then((res) => {
        const data = (res.data as any)?.data || res.data;
        setCantonesPorProvincia(Array.isArray(data) ? data : []);
      }).catch(() => setCantonesPorProvincia([]));
    } else {
      setCantonesPorProvincia([]);
      setFormIdCanton('');
    }
  }, [formIdProvincia]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormNombre('');
    setFormCodigo('');
    setFormIdProvincia('');
    setFormIdCanton('');
    setFormDireccion('');
    setFormTelefono('');
    setFormCorreo('');
    setFormEstado('ACTIVO');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dep: DependenciaDto) => {
    setEditingId(dep.id);
    setFormNombre(dep.nombre);
    setFormCodigo(dep.codigo || '');
    setFormIdProvincia(dep.idProvincia);
    setFormIdCanton(dep.idCanton || '');
    setFormDireccion(dep.direccion || '');
    setFormTelefono(dep.telefono || '');
    setFormCorreo(dep.correo || '');
    setFormEstado(dep.estado);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      toast.showWarn('Validación', 'El nombre de la dependencia es obligatorio.');
      return;
    }
    if (!formIdProvincia) {
      toast.showWarn('Validación', 'Debe seleccionar una provincia para la dependencia.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<DependenciaDto> = {
        nombre: formNombre.trim(),
        codigo: formCodigo.trim() || null,
        idProvincia: Number(formIdProvincia),
        idCanton: formIdCanton ? Number(formIdCanton) : null,
        direccion: formDireccion.trim() || null,
        telefono: formTelefono.trim() || null,
        correo: formCorreo.trim() || null,
        estado: formEstado,
      };

      if (editingId) {
        await dependenciasApi.update(editingId, payload);
        toast.showSuccess('Dependencia Actualizada', `Se actualizó "${formNombre}" correctamente.`);
      } else {
        await dependenciasApi.create(payload);
        toast.showSuccess('Dependencia Creada', `Se creó "${formNombre}" exitosamente.`);
      }

      setIsModalOpen(false);
      fetchDependencias();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar dependencia';
      toast.showError('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!depToDelete) return;
    try {
      await dependenciasApi.delete(depToDelete.id);
      toast.showSuccess('Dependencia Eliminada', `Se eliminó "${depToDelete.nombre}" correctamente.`);
      setDepToDelete(null);
      fetchDependencias();
    } catch (err: any) {
      toast.showError('Error al eliminar', err.response?.data?.message || 'No se pudo eliminar la dependencia.');
    }
  };

  // Filtrado local por término de búsqueda adicional
  const filteredDependencias = dependencias.filter((dep) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      dep.nombre.toLowerCase().includes(term) ||
      (dep.codigo && dep.codigo.toLowerCase().includes(term)) ||
      (dep.provincia?.provincia && dep.provincia.provincia.toLowerCase().includes(term)) ||
      (dep.canton?.canton && dep.canton.canton.toLowerCase().includes(term)) ||
      (dep.direccion && dep.direccion.toLowerCase().includes(term))
    );
  });

  const totalActivas = dependencias.filter((d) => d.estado === 'ACTIVO').length;
  const provinciasCubiertas = new Set(dependencias.map((d) => d.idProvincia)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#0052cc' }}>
              store
            </span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a1c1c' }}>
              Dependencias & Sucursales del Cliente
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', color: '#5e6c84', fontSize: '13.5px' }}>
            Puntos de atención y agencias asociadas a provincias para la derivación y asignación de prospectos
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchDependencias}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#fff',
              border: '1px solid #dfe1e6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              color: '#344563',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              refresh
            </span>
            Actualizar
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#0052cc',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(0, 82, 204, 0.2)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              add
            </span>
            Nueva Dependencia
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '18px 20px',
            border: '1px solid #ebecf0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#deebff',
              color: '#0052cc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              corporate_fare
            </span>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1c1c' }}>{dependencias.length}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a869a', textTransform: 'uppercase' }}>
              Total Dependencias
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '18px 20px',
            border: '1px solid #ebecf0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#e3fcef',
              color: '#00875a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              check_circle
            </span>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#00875a' }}>{totalActivas}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a869a', textTransform: 'uppercase' }}>
              Agencias Activas
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '18px 20px',
            border: '1px solid #ebecf0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#eae6ff',
              color: '#5243aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              map
            </span>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#5243aa' }}>
              {provinciasCubiertas} <span style={{ fontSize: '14px', fontWeight: 400, color: '#7a869a' }}>/ 24</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a869a', textTransform: 'uppercase' }}>
              Provincias con Cobertura
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '14px 18px',
          border: '1px solid #ebecf0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f4f5f7',
              padding: '6px 12px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '340px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7a869a' }}>
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por agencia, código, dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Selector de Provincia */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#7a869a' }}>Provincia:</span>
            <select
              value={provinciaFilter}
              onChange={(e) => setProvinciaFilter(e.target.value ? Number(e.target.value) : '')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #dfe1e6',
                fontSize: '13px',
                backgroundColor: '#fff',
                color: '#344563',
                outline: 'none',
              }}
            >
              <option value="">Todas las Provincias</option>
              {provincias.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.provincia}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#7a869a' }}>Estado:</span>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #dfe1e6',
                fontSize: '13px',
                backgroundColor: '#fff',
                color: '#344563',
                outline: 'none',
              }}
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #ebecf0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafbfc', borderBottom: '1px solid #ebecf0', color: '#5e6c84' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>AGENCIA / DEPENDENCIA</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>CÓDIGO</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>PROVINCIA</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>CANTÓN</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>DIRECCIÓN / CONTACTO</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>ESTADO</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#7a869a' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px', animation: 'spin 1s linear infinite' }}>
                      progress_activity
                    </span>
                    <span>Cargando dependencias del sistema...</span>
                  </div>
                </td>
              </tr>
            ) : filteredDependencias.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#7a869a' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#c1c7d0' }}>
                      store_mall_directory
                    </span>
                    <span style={{ fontWeight: 600, color: '#344563' }}>No se encontraron dependencias</span>
                    <span style={{ fontSize: '12.5px' }}>Prueba ajustando los filtros o registra una nueva dependencia</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDependencias.map((dep) => (
                <tr
                  key={dep.id}
                  style={{
                    borderBottom: '1px solid #f4f5f7',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#172b4d' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#0052cc' }}>
                        storefront
                      </span>
                      <span>{dep.nombre}</span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    {dep.codigo ? (
                      <span
                        style={{
                          backgroundColor: '#f4f5f7',
                          color: '#42526e',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '11.5px',
                        }}
                      >
                        {dep.codigo}
                      </span>
                    ) : (
                      <span style={{ color: '#a5b2c6' }}>-</span>
                    )}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        backgroundColor: '#deebff',
                        color: '#0747a6',
                        padding: '3px 9px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        fontSize: '11.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                        location_on
                      </span>
                      {dep.provincia?.provincia || 'Provincia #' + dep.idProvincia}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', color: '#42526e' }}>
                    {dep.canton?.canton ? (
                      <span
                        style={{
                          backgroundColor: '#f4f5f7',
                          color: '#344563',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        {dep.canton.canton}
                      </span>
                    ) : (
                      <span style={{ color: '#8993a4', fontStyle: 'italic', fontSize: '12px' }}>
                        Toda la provincia
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '12px 16px', color: '#5e6c84', fontSize: '12px' }}>
                    <div>{dep.direccion || 'Sin dirección registrada'}</div>
                    {(dep.telefono || dep.correo) && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '2px', color: '#7a869a' }}>
                        {dep.telefono && <span>📞 {dep.telefono}</span>}
                        {dep.correo && <span>✉️ {dep.correo}</span>}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        backgroundColor: dep.estado === 'ACTIVO' ? '#e3fcef' : '#ffebe6',
                        color: dep.estado === 'ACTIVO' ? '#006644' : '#bf2600',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {dep.estado}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEdit(dep)}
                        title="Editar dependencia"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#0052cc',
                          padding: '4px',
                          borderRadius: '4px',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          edit
                        </span>
                      </button>

                      <button
                        onClick={() => setDepToDelete(dep)}
                        title="Eliminar dependencia"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#de350b',
                          padding: '4px',
                          borderRadius: '4px',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
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
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid #ebecf0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#172b4d' }}>
                {editingId ? 'Editar Dependencia' : 'Nueva Dependencia o Sucursal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b778c' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#344563', marginBottom: '4px' }}>
                    Nombre de la Dependencia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Agencia Latacunga Matriz"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dfe1e6',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#344563', marginBottom: '4px' }}>
                    Código Interno
                  </label>
                  <input
                    type="text"
                    placeholder="AG-COT-01"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dfe1e6',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#344563', marginBottom: '4px' }}>
                    Provincia Asociada *
                  </label>
                  <select
                    required
                    value={formIdProvincia}
                    onChange={(e) => setFormIdProvincia(e.target.value ? Number(e.target.value) : '')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dfe1e6',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="">-- Seleccionar Provincia --</option>
                    {provincias.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.provincia}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#344563', marginBottom: '4px' }}>
                    Cantón (Opcional)
                  </label>
                  <select
                    value={formIdCanton}
                    onChange={(e) => setFormIdCanton(e.target.value ? Number(e.target.value) : '')}
                    disabled={!formIdProvincia || cantonesPorProvincia.length === 0}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dfe1e6',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: !formIdProvincia ? '#f4f5f7' : '#fff',
                    }}
                  >
                    <option value="">-- Toda la provincia --</option>
                    {cantonesPorProvincia.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.canton}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#344563', marginBottom: '4px' }}>
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Calle, avenida o referencia"
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #dfe1e6',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#344563', marginBottom: '4px' }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="0992... / (03) 280..."
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dfe1e6',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#344563', marginBottom: '4px' }}>
                    Estado
                  </label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as 'ACTIVO' | 'INACTIVO')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dfe1e6',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '12px',
                  paddingTop: '14px',
                  borderTop: '1px solid #ebecf0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #dfe1e6',
                    backgroundColor: '#fff',
                    color: '#344563',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0052cc',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Dependencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo Confirmar Eliminación */}
      {depToDelete && (
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
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              maxWidth: '440px',
              width: '100%',
              padding: '22px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '17px', color: '#de350b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined">warning</span>
              Confirmar Eliminación
            </h3>
            <p style={{ margin: '0 0 18px', color: '#42526e', fontSize: '13.5px', lineHeight: '1.4' }}>
              ¿Estás seguro de que deseas eliminar la dependencia <strong>"{depToDelete.nombre}"</strong>?
              Los leads asociados conservarán su historial pero quedarán desvinculados de esta agencia.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDepToDelete(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #dfe1e6',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#de350b',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
