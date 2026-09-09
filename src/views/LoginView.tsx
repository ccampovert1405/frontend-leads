import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data.data || response.data;
      const { accessToken, user } = data;

      let resolvedRole = user?.role;
      let resolvedPermissions = user?.permissions || [];
      let resolvedId = user?.id;
      let resolvedUsername = user?.username || username;

      // Si no viene en el body, decodificar el payload firmado del JWT
      if (!resolvedRole && accessToken) {
        try {
          const parts = accessToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            resolvedRole = payload.role;
            resolvedPermissions = payload.permissions || resolvedPermissions;
            resolvedId = payload.sub || resolvedId;
            resolvedUsername = payload.username || resolvedUsername;
          }
        } catch (e) {
          console.error('Error al decodificar token JWT:', e);
        }
      }

      // Almacenar sesión con el rol exacto asignado
      login(accessToken, {
        id: resolvedId,
        username: resolvedUsername,
        role: resolvedRole || 'Analista',
        permissions: resolvedPermissions,
      });

      // Limpiar la ruta /login de la barra del navegador hacia /
      if (window.location.pathname === '/login') {
        window.history.replaceState({}, '', '/');
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Credenciales inválidas o error de conexión con el servidor.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="precision-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px 36px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              backgroundColor: '#091e42',
              borderRadius: '12px',
              marginBottom: '16px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <img
              src="/logo-white.png"
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#1a1c1c' }}>Gestión de Campañas & Leads</h1>
          <p style={{ color: '#5c6270', fontSize: '14px' }}>
            Plataforma Centralizada de Captación & Leads (Meta Ads & TikTok Ads)
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#ffdad6',
              color: '#93000a',
              border: '1px solid #ba1a1a',
              borderRadius: '4px',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1a1c1c',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              Usuario o Correo
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="precision-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="ej: admin"
                style={{ paddingLeft: '38px' }}
              />
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8c919d',
                  fontSize: '20px',
                }}
              >
                person
              </span>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1a1c1c',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="precision-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
              />
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8c919d',
                  fontSize: '20px',
                  pointerEvents: 'none',
                }}
              >
                lock
              </span>
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '11px',
              fontSize: '15px',
              marginTop: '8px',
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear' }}>
                  sync
                </span>
                Autenticando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid #edf0f2',
            textAlign: 'center',
            fontSize: '12px',
            color: '#8c919d',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          Precisión Operativa • Seguridad RBAC & OpenAPI
        </div>
      </div>
    </div>
  );
};
