import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface StepItemProps {
  number: number;
  title: string;
  badge?: string;
  children: React.ReactNode;
}

const StepItem: React.FC<StepItemProps> = ({ number, title, badge, children }) => (
  <div
    style={{
      display: 'flex',
      gap: '16px',
      position: 'relative',
      paddingBottom: '28px',
    }}
  >
    {/* Line Connector */}
    <div
      style={{
        position: 'absolute',
        top: '36px',
        left: '17px',
        bottom: 0,
        width: '2px',
        backgroundColor: '#edf0f2',
      }}
    />

    {/* Step Number Circle */}
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#0052cc',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '14px',
        flexShrink: 0,
        zIndex: 1,
        boxShadow: '0 2px 6px rgba(0, 82, 204, 0.25)',
      }}
    >
      {number}
    </div>

    {/* Content */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#1a1c1c' }}>
          {title}
        </h3>
        {badge && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: '#e6f0ff',
              color: '#0052cc',
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ color: '#474d57', fontSize: '13.5px', lineHeight: 1.6 }}>{children}</div>
    </div>
  </div>
);

const CodeSnippet: React.FC<{ code: string; label?: string }> = ({ code, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        margin: '10px 0',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          backgroundColor: '#1e293b',
          color: '#94a3b8',
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <span>{label || 'CÓDIGO / CONSULTA'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? '#4ade80' : '#cbd5e1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          color: '#f8fafc',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12.5px',
          overflowX: 'auto',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {code}
      </pre>
    </div>
  );
};

interface TutorialVariablesViewProps {
  onNavigateToVariables?: () => void;
}

export const TutorialVariablesView: React.FC<TutorialVariablesViewProps> = ({ onNavigateToVariables }) => {
  const { isSuperAdmin } = useAuth();
  const [activePlatform, setActivePlatform] = useState<'meta' | 'tiktok'>('meta');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              className="material-symbols-outlined"
              style={{ color: '#0052cc', fontSize: '28px' }}
            >
              menu_book
            </span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1a1c1c' }}>
              Tutorial para Obtener Variables & Credenciales
            </h1>
          </div>
          <p style={{ margin: 0, color: '#5c6270', fontSize: '13.5px' }}>
            Guía oficial paso a paso para configurar las integraciones con Meta Ads (Graph API) y TikTok Business API
          </p>
        </div>

        {isSuperAdmin && onNavigateToVariables && (
          <button
            onClick={onNavigateToVariables}
            className="btn-primary"
            style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              tune
            </span>
            Ir a Variables del Sistema
          </button>
        )}
      </div>

      {/* Tabs Selector: Meta Ads vs TikTok Ads */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '2px solid #edf0f2',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActivePlatform('meta')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: activePlatform === 'meta' ? '#0052cc' : '#ffffff',
            color: activePlatform === 'meta' ? '#ffffff' : '#5c6270',
            border: activePlatform === 'meta' ? 'none' : '1px solid #dcdfe4',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activePlatform === 'meta' ? '0 2px 6px rgba(0, 82, 204, 0.25)' : 'none',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            campaign
          </span>
          Meta Ads (Facebook & Instagram)
        </button>

        <button
          onClick={() => setActivePlatform('tiktok')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: activePlatform === 'tiktok' ? '#091e42' : '#ffffff',
            color: activePlatform === 'tiktok' ? '#ffffff' : '#5c6270',
            border: activePlatform === 'tiktok' ? 'none' : '1px solid #dcdfe4',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activePlatform === 'tiktok' ? '0 2px 6px rgba(9, 30, 66, 0.25)' : 'none',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            video_camera_front
          </span>
          TikTok Ads (Business API)
        </button>
      </div>

      {/* TAB 1: META ADS */}
      {activePlatform === 'meta' && (
        <div>
          {/* Important Security Notice Card */}
          <div
            className="precision-card"
            style={{
              padding: '18px 20px',
              marginBottom: '24px',
              borderLeft: '4px solid #0052cc',
              backgroundColor: '#f4f7fc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '24px' }}>
                shield
              </span>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#0052cc' }}>
                  ¿Por qué este proceso requiere pasos en Meta for Developers?
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                  Meta exige estrictamente que la autorización de acceso (OAuth) y la configuración de permisos
                  en Business Manager ocurran directamente en sus dominios oficiales (
                  <code>facebook.com</code>, <code>business.facebook.com</code>). Ninguna aplicación de terceros
                  puede replicar estas pantallas por regulaciones antifraude y antiphishing.
                  <strong> Este proceso se realiza una sola vez</strong>; una vez obtenido el token de larga duración,
                  la renovación semanal es 100% automática por el sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Target Variables Summary */}
          <div
            className="precision-card"
            style={{ padding: '16px 20px', marginBottom: '24px', backgroundColor: '#fafbfc' }}
          >
            <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '8px', color: '#1a1c1c' }}>
              Variables que obtendrás al completar esta guía:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
              }}
            >
              {[
                { key: 'META_GRAPH_API_URL', desc: 'https://graph.facebook.com/v19.0 (Fija)' },
                { key: 'META_ACCESS_TOKEN', desc: 'Token de Página de larga duración (~60 días)' },
                { key: 'META_APP_ID', desc: 'Identificador único de la App en Meta Dev' },
                { key: 'META_APP_SECRET', desc: 'Clave secreta privada de la App' },
                { key: 'META_AD_ACCOUNT_ID', desc: 'ID con prefijo act_ (ej. act_123456789)' },
              ].map((v) => (
                <div
                  key={v.key}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #edf0f2',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11.5px', fontWeight: 700, color: '#0052cc' }}>
                    {v.key}
                  </div>
                  <div style={{ fontSize: '11px', color: '#737685', marginTop: '2px' }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div
            className="precision-card"
            style={{ padding: '16px 20px', marginBottom: '24px', borderLeft: '4px solid #ffab00' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="material-symbols-outlined" style={{ color: '#ffab00', fontSize: '20px' }}>
                checklist
              </span>
              <strong style={{ fontSize: '14px', color: '#1a1c1c' }}>Requisitos Previos</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#474d57', lineHeight: 1.6 }}>
              <li>
                Una cuenta de Facebook con acceso habilitado a{' '}
                <a
                  href="https://developers.facebook.com/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0052cc', fontWeight: 600 }}
                >
                  developers.facebook.com ↗
                </a>
              </li>
              <li>
                Que el cliente (dueño de la Página de Facebook) haya compartido acceso a su Página mediante{' '}
                <strong>Business Manager</strong> con el permiso de <strong>"Anuncios"</strong> activado.
              </li>
            </ul>
          </div>

          {/* Stepper Guide */}
          <div className="precision-card" style={{ padding: '24px' }}>
            <StepItem number={1} title="Crear la aplicación en Meta for Developers" badge="developers.facebook.com">
              <p style={{ margin: '0 0 8px 0' }}>
                Ingresa al asistente oficial de creación de apps en{' '}
                <a
                  href="https://developers.facebook.com/apps/creation/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0052cc', fontWeight: 600 }}
                >
                  developers.facebook.com/apps/creation ↗
                </a>
              </p>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>En <strong>"Casos de uso"</strong>, selecciona: <em>"Captar y administrar clientes potenciales de anuncios con la API de marketing"</em>.</li>
                <li>En <strong>"Negocio"</strong>, vincula tu portafolio comercial (Business Portfolio) o crea uno si aún no lo tienes.</li>
                <li>Completa el wizard hasta el final y confirma la creación de la aplicación.</li>
              </ol>
            </StepItem>

            <StepItem number={2} title="Activar los permisos necesarios y copiar App ID / App Secret" badge="Configuración Básica">
              <p style={{ margin: '0 0 8px 0' }}>
                Dentro de tu app, dirígete a <strong>Casos de uso</strong> en el menú lateral izquierdo y verifica que los siguientes 4 permisos figuren como <em>"Listo para la prueba"</em>:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '8px 0 12px 0' }}>
                {['leads_retrieval (Crítico para leer leads)', 'pages_show_list', 'pages_read_engagement', 'ads_management'].map((perm) => (
                  <span
                    key={perm}
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '11.5px',
                      backgroundColor: '#e3fcef',
                      color: '#006644',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #abf5d1',
                      fontWeight: 600,
                    }}
                  >
                    ✓ {perm}
                  </span>
                ))}
              </div>
              <p style={{ margin: '0 0 8px 0' }}>
                Para obtener tus credenciales, ingresa en el menú lateral a: <strong>Configuración de la app ➔ Básica</strong>:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><code>META_APP_ID</code> = Identificador de la app (valor numérico público).</li>
                <li><code>META_APP_SECRET</code> = Clave secreta (haz clic en "Mostrar" e introduce tu contraseña de Facebook).</li>
              </ul>
            </StepItem>

            <StepItem number={3} title="Confirmar acceso a la Página del cliente en Business Manager" badge="business.facebook.com">
              <p style={{ margin: '0 0 8px 0' }}>
                Ve a{' '}
                <a
                  href="https://business.facebook.com/settings/pages"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0052cc', fontWeight: 600 }}
                >
                  business.facebook.com/settings/pages ↗
                </a>{' '}
                dentro del negocio correspondiente:
              </p>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Selecciona la Página correspondiente ➔ pestaña <strong>Personas</strong>.</li>
                <li>Confirma que tu cuenta aparece vinculada con el toggle <strong>"Anuncios"</strong> activado (este control otorga el permiso técnico <code>ADVERTISE</code>, indispensable para <code>leads_retrieval</code>).</li>
                <li>Si no apareces, el cliente debe asignarte mediante <em>"Asignar personas"</em> ingresando tu correo y tildando "Anuncios".</li>
              </ol>
            </StepItem>

            <StepItem number={4} title="Obtener el Ad Account ID (META_AD_ACCOUNT_ID)" badge="Graph API Explorer">
              <p style={{ margin: '0 0 8px 0' }}>
                Abre la herramienta{' '}
                <a
                  href="https://developers.facebook.com/tools/explorer"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0052cc', fontWeight: 600 }}
                >
                  Meta Graph API Explorer ↗
                </a>. Asegúrate de tener seleccionado el Token de Usuario y realiza la siguiente consulta:
              </p>
              <CodeSnippet code="me/adaccounts?fields=id,name,account_status" label="GRAPH EXPLORER GET" />
              <p style={{ margin: '8px 0 4px 0' }}>La respuesta retornará un listado como este:</p>
              <CodeSnippet
                code={`{\n  "data": [\n    {\n      "id": "act_1234567890123",\n      "name": "Cuenta del cliente",\n      "account_status": 1\n    }\n  ]\n}`}
                label="RESPUESTA JSON"
              />
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Copia el <code>id</code> completo incluyendo el prefijo <strong><code>act_</code></strong> (ejemplo: <code>act_1234567890123</code>). Ese es tu <code>META_AD_ACCOUNT_ID</code>.</li>
                <li>Verifica que <code>account_status: 1</code> (1 = Activa; 2 o 3 = deshabilitada o en revisión).</li>
              </ul>
            </StepItem>

            <StepItem number={5} title="Generar el token de usuario inicial" badge="Permisos de Acceso">
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>En Graph API Explorer, selecciona tu aplicación en el menú desplegable superior.</li>
                <li>Haz clic en el botón <strong>"Generate Access Token"</strong>.</li>
                <li>Verifica que los 4 permisos estén seleccionados: <code>leads_retrieval</code>, <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>ads_management</code>.</li>
                <li>En el popup de autorización de Facebook, elige la opción <strong>"Activar solo las Páginas actuales"</strong> y marca la Página del cliente.</li>
                <li>Haz clic en <strong>Guardar</strong>.</li>
              </ol>
            </StepItem>

            <StepItem number={6} title="Obtener el Token de Página (Page Access Token)" badge="Paso Clave">
              <p style={{ margin: '0 0 8px 0' }}>
                El token del paso anterior es de Usuario y <strong>no permite leer leads directamente</strong>. Para transformarlo a Token de Página, ingresa en la barra del Explorer:
              </p>
              <CodeSnippet code="{page_id}?fields=access_token,name" label="GRAPH EXPLORER GET" />
              <p style={{ margin: 0, fontSize: '12.5px', color: '#5c6270' }}>
                *(Reemplaza <code>{'{page_id}'}</code> por el ID numérico de la Página de Facebook del cliente, ubicado en Business Settings ➔ Páginas).*
              </p>
              <p style={{ margin: '8px 0 0 0' }}>
                Al presionar <strong>Enviar</strong>, la respuesta incluirá un <code>access_token</code>. Cópialo: este es tu <strong>Page Token temporal</strong>.
              </p>
            </StepItem>

            <StepItem number={7} title="Convertir a Token de Larga Duración (~60 días)" badge="META_ACCESS_TOKEN">
              <p style={{ margin: '0 0 8px 0' }}>
                Para que el token no expire en 1 hora, ejecútalo en la barra de búsqueda del Explorer para intercambiarlo por uno de 60 días:
              </p>
              <CodeSnippet
                code="oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={PAGE_TOKEN_DEL_PASO_6}"
                label="OAUTH EXCHANGE"
              />
              <p style={{ margin: '8px 0 4px 0' }}>La respuesta generará el token de larga duración:</p>
              <CodeSnippet
                code={`{\n  "access_token": "EAA...",\n  "token_type": "bearer",\n  "expires_in": 5184000\n}`}
                label="RESPUESTA FINAL"
              />
              <p style={{ margin: 0 }}>
                El valor <code>expires_in: 5184000</code> equivale a ~60 días. Ese <code>access_token</code> es el valor definitivo para <strong><code>META_ACCESS_TOKEN</code></strong>.
              </p>
            </StepItem>

            <StepItem number={8} title="Verificar y validar el token (debug_token)" badge="Recomendado">
              <p style={{ margin: '0 0 8px 0' }}>Confirma la validez y tipo de token ejecutando:</p>
              <CodeSnippet
                code="debug_token?input_token={TOKEN_DEL_PASO_7}&access_token={APP_ID}|{APP_SECRET}"
                label="TOKEN DEBUGGER"
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {['"type": "PAGE"', '"is_valid": true', '"scopes": incluye leads_retrieval'].map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                      backgroundColor: '#e6f0ff',
                      color: '#0052cc',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    ✓ {c}
                  </span>
                ))}
              </div>
            </StepItem>

            <StepItem number={9} title="Cargar las variables en el sistema" badge="Final">
              <p style={{ margin: '0 0 8px 0' }}>
                Copia los valores en el módulo de <strong>Variables del Sistema</strong> (o en tu archivo <code>.env</code>):
              </p>
              <CodeSnippet
                code={`META_GRAPH_API_URL=https://graph.facebook.com/v19.0\nMETA_ACCESS_TOKEN=<el token verificado en el Paso 8>\nMETA_APP_ID=<del Paso 2>\nMETA_APP_SECRET=<del Paso 2>\nMETA_AD_ACCOUNT_ID=<del Paso 4>`}
                label="ENV VARIABLES"
              />
            </StepItem>
          </div>

          {/* Automation Lifecycle Card */}
          <div
            className="precision-card"
            style={{ padding: '18px 20px', marginTop: '24px', backgroundColor: '#e3fcef', border: '1px solid #abf5d1' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#006644', fontSize: '22px' }}>
                autorenew
              </span>
              <strong style={{ fontSize: '14.5px', color: '#006644' }}>
                ¿Qué sucede después? (Renovación 100% Automática)
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#1a1c1c', lineHeight: 1.5 }}>
              Una vez cargado <code>META_ACCESS_TOKEN</code> por primera vez, el backend lo almacena en la tabla
              <code>platform_credentials</code> de PostgreSQL y ejecuta un proceso Crontab semanal que renueva el token
              automáticamente sin requerir intervención manual, siempre y cuando <code>META_APP_ID</code> y <code>META_APP_SECRET</code>
              sigan siendo válidos.
            </p>
          </div>

          {/* Common Errors Table */}
          <div className="precision-card" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', backgroundColor: '#fafbfc', borderBottom: '1px solid #edf0f2' }}>
              <h3 style={{ margin: 0, fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#de350b', fontSize: '20px' }}>
                  help
                </span>
                Resolución de Errores Comunes en Meta Ads
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #edf0f2', textAlign: 'left', color: '#5c6270' }}>
                  <th style={{ padding: '12px 16px', width: '35%' }}>Síntoma / Mensaje</th>
                  <th style={{ padding: '12px 16px' }}>Causa Probable y Solución</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#bf2600' }}>
                    me/accounts devuelve data: []
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    El acceso en Business Manager aún no se propagó, o tu cuenta solo tiene acceso parcial sin el toggle de <strong>Anuncios</strong> activado.
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#bf2600' }}>
                    me/adaccounts devuelve data: []
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    La Cuenta Publicitaria no está vinculada al Business Manager del cliente, o solo compartieron la Página pero no la cuenta de anuncios.
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#bf2600' }}>
                    debug_token muestra "type": "USER"
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    En el Paso 7 intercambiaste el token de usuario en lugar del <strong>Token de Página</strong> del Paso 6.
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#bf2600' }}>
                    Error (#190) Must be called with Page Access Token
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    Estás intentando leer prospectos con un Token de Usuario; debes generar y usar el Token de Página.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#bf2600' }}>
                    {'{page_id}'}/leadgen_forms devuelve data: []
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    La Página de Facebook no tiene formularios de anuncios creados actualmente. No es un error de credenciales.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TIKTOK ADS */}
      {activePlatform === 'tiktok' && (
        <div>
          {/* Important Security Notice Card */}
          <div
            className="precision-card"
            style={{
              padding: '18px 20px',
              marginBottom: '24px',
              borderLeft: '4px solid #091e42',
              backgroundColor: '#f8f9fa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#091e42', fontSize: '24px' }}>
                lock
              </span>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#091e42' }}>
                  Seguridad y Autorización OAuth en TikTok Business API
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                  Al igual que Meta, TikTok exige que la autorización ocurra directamente en sus dominios oficiales
                  (<code>business.tiktok.com</code>, <code>business-api.tiktok.com</code>). Ninguna app externa puede
                  solicitar usuarios ni contraseñas. Este proceso se completa una sola vez y los tokens de TikTok
                  son de larga vigencia mientras no se revoque el permiso en TikTok Business Center.
                </p>
              </div>
            </div>
          </div>

          {/* Target Variables Summary */}
          <div
            className="precision-card"
            style={{ padding: '16px 20px', marginBottom: '24px', backgroundColor: '#fafbfc' }}
          >
            <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '8px', color: '#1a1c1c' }}>
              Variables que obtendrás al completar esta guía:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
              }}
            >
              {[
                { key: 'TIKTOK_API_BASE_URL', desc: 'https://business-api.tiktok.com/open_api/v1.3' },
                { key: 'TIKTOK_ACCESS_TOKEN', desc: 'Token de acceso obtenido con el auth_code' },
                { key: 'TIKTOK_APP_ID', desc: 'Identificador numérico de la app en TikTok Portal' },
                { key: 'TIKTOK_APP_SECRET', desc: 'Clave secreta asignada a la app' },
                { key: 'TIKTOK_ADVERTISER_ID', desc: 'ID de la cuenta publicitaria del anunciante' },
              ].map((v) => (
                <div
                  key={v.key}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #edf0f2',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11.5px', fontWeight: 700, color: '#091e42' }}>
                    {v.key}
                  </div>
                  <div style={{ fontSize: '11px', color: '#737685', marginTop: '2px' }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div
            className="precision-card"
            style={{ padding: '16px 20px', marginBottom: '24px', borderLeft: '4px solid #ffab00' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="material-symbols-outlined" style={{ color: '#ffab00', fontSize: '20px' }}>
                checklist
              </span>
              <strong style={{ fontSize: '14px', color: '#1a1c1c' }}>Requisitos Previos</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#474d57', lineHeight: 1.6 }}>
              <li>Una cuenta de <strong>TikTok for Business</strong> (no es suficiente una cuenta personal de la app móvil).</li>
              <li>Que el cliente te haya otorgado acceso a su cuenta publicitaria a través de <strong>TikTok Business Center</strong>.</li>
            </ul>
          </div>

          {/* Stepper Guide */}
          <div className="precision-card" style={{ padding: '24px' }}>
            <StepItem number={1} title="Registrarte como Developer en TikTok Business API" badge="Portal Oficial">
              <p style={{ margin: '0 0 8px 0' }}>
                Ingresa al portal específico de Marketing API en{' '}
                <a
                  href="https://business-api.tiktok.com/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0052cc', fontWeight: 600 }}
                >
                  business-api.tiktok.com ↗
                </a>{' '}
                <em>(Importante: no utilices developers.tiktok.com, ya que este último es solo para Content Posting API)</em>.
              </p>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Haz clic en <strong>"Become a Developer"</strong>.</li>
                <li>
                  <strong>Correo de contacto:</strong> Debe ser un correo con dominio corporativo propio (ej. <code>tu@empresa.com</code>). TikTok rechaza automáticamente dominios genéricos como Gmail o Hotmail.
                </li>
                <li>En <em>"¿Qué servicios ofreces?"</em>, selecciona <strong>Campaign Management</strong> y <strong>Reporting</strong>. Evita "Marketing Partner" para evitar burocracia innecesaria.</li>
                <li>Describe en inglés que la integración es directa para un solo anunciante y envía el formulario.</li>
              </ol>
            </StepItem>

            <StepItem number={2} title="Crear la aplicación y solicitar los Scopes necesarios" badge="business-api.tiktok.com/portal/apps">
              <p style={{ margin: '0 0 8px 0' }}>
                Ve a <strong>App Management</strong> y haz clic en <strong>"Create New App"</strong>:
              </p>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>App name:</strong> Nombre descriptivo (ej. <em>Condelpi Leads Integration</em>).</li>
                <li><strong>Advertiser redirect URL:</strong> Ingresa la URL de redirección (ej. <code>http://localhost:3000/tiktok/callback</code> para entorno local o tu dominio HTTPS).</li>
                <li>
                  En <strong>"Scope of permission"</strong>, busca y selecciona obligatoriamente:
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '8px 0' }}>
                    {[
                      'Lead Management ➔ Leads Retrieval (Crítico)',
                      'Ads Management ➔ Campaign',
                      'Ad Account Management (Permiso raíz)',
                    ].map((s) => (
                      <span
                        key={s}
                        style={{
                          fontFamily: 'JetBrains Mono',
                          fontSize: '11.5px',
                          backgroundColor: '#e3fcef',
                          color: '#006644',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #abf5d1',
                          fontWeight: 600,
                        }}
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </li>
                <li>Envía la app. Pasará a estado <strong>"Pending"</strong> mientras TikTok valida los scopes.</li>
              </ol>
            </StepItem>

            <StepItem number={3} title="Copiar TIKTOK_APP_ID y TIKTOK_APP_SECRET" badge="Detalle de App">
              <p style={{ margin: 0 }}>
                Una vez aprobada la app por TikTok, entra a su detalle en el portal y copia:
              </p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li><code>TIKTOK_APP_ID</code> = App ID numérico.</li>
                <li><code>TIKTOK_APP_SECRET</code> = App Secret privado.</li>
              </ul>
            </StepItem>

            <StepItem number={4} title="Generar el link de autorización y obtener el auth_code" badge="Autorización">
              <p style={{ margin: '0 0 8px 0' }}>
                Arma la URL de autorización con tus datos y ábrela con la cuenta administradora del cliente:
              </p>
              <CodeSnippet
                code="https://business-api.tiktok.com/portal/auth?app_id={TIKTOK_APP_ID}&state=active&redirect_uri={tu_redirect_uri}"
                label="AUTH URL"
              />
              <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Inicia sesión con la cuenta de TikTok Business del cliente y marca la cuenta publicitaria correcta.</li>
                <li>Haz clic en autorizar. El navegador redirigirá a tu <code>redirect_uri</code>.</li>
                <li>
                  En la barra de direcciones del navegador, copia el parámetro <strong><code>auth_code</code></strong> que aparece en la URL (ej. <code>?auth_code=abc123xyz...</code>).
                </li>
              </ol>
            </StepItem>

            <StepItem number={5} title="Intercambiar el auth_code por el Token de Acceso" badge="TIKTOK_ACCESS_TOKEN">
              <p style={{ margin: '0 0 8px 0' }}>
                Ejecuta la siguiente llamada HTTP POST para obtener las credenciales definitivas:
              </p>
              <CodeSnippet
                code={`curl -X POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/ \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "app_id": "TU_APP_ID",\n    "secret": "TU_APP_SECRET",\n    "auth_code": "EL_AUTH_CODE_QUE_COPIASTE"\n  }'`}
                label="CURL POST EXCHANGE"
              />
              <p style={{ margin: '8px 0 4px 0' }}>La respuesta retornará:</p>
              <CodeSnippet
                code={`{\n  "data": {\n    "access_token": "act.example123456...",\n    "advertiser_ids": ["1234567890123456789"],\n    "scope": [...]\n  }\n}`}
                label="RESPUESTA JSON"
              />
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li><code>TIKTOK_ACCESS_TOKEN</code> = El valor de <code>access_token</code>.</li>
                <li><code>TIKTOK_ADVERTISER_ID</code> = El primer elemento del arreglo <code>advertiser_ids</code>.</li>
              </ul>
            </StepItem>

            <StepItem number={6} title="Validar las credenciales con una llamada de prueba" badge="Verificación">
              <p style={{ margin: '0 0 8px 0' }}>Prueba una consulta simple de información para verificar conectividad:</p>
              <CodeSnippet
                code={`curl -X GET "https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=[\\"TU_ADVERTISER_ID\\"]" \\\n  -H "Access-Token: TU_ACCESS_TOKEN"`}
                label="CURL TEST"
              />
              <p style={{ margin: 0, fontSize: '13px', color: '#006644', fontWeight: 600 }}>
                ✓ Si devuelve el nombre de la cuenta, moneda y país, las credenciales están 100% operativas.
              </p>
            </StepItem>

            <StepItem number={7} title="Caso especial para descarga de Leads (page_id)" badge="Instant Forms">
              <div
                style={{
                  backgroundColor: '#fffbe6',
                  border: '1px solid #ffe58f',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#874d00',
                }}
              >
                A diferencia de la sincronización de campañas que solo requiere <code>advertiser_id</code>, para descargar prospectos de TikTok se requiere el <strong><code>page_id</code></strong> de cada Instant Form.
                Este valor se ubica en <em>TikTok Ads Manager ➔ Assets ➔ Instant Page/Forms</em> y se pasa como parámetro al ejecutar la descarga manual de leads.
              </div>
            </StepItem>
          </div>

          {/* Common Errors Table */}
          <div className="precision-card" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', backgroundColor: '#fafbfc', borderBottom: '1px solid #edf0f2' }}>
              <h3 style={{ margin: 0, fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#de350b', fontSize: '20px' }}>
                  help
                </span>
                Resolución de Errores Comunes en TikTok Ads
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #edf0f2', textAlign: 'left', color: '#5c6270' }}>
                  <th style={{ padding: '12px 16px', width: '35%' }}>Síntoma / Mensaje</th>
                  <th style={{ padding: '12px 16px' }}>Causa Probable y Solución</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                  <td style={{ padding: '12px 16px', color: '#bf2600', fontWeight: 600 }}>
                    Correo rechazado al registrarse como developer
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    TikTok exige un correo corporativo con dominio propio; no admite correos gratuitos (@gmail, @hotmail, @outlook).
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                  <td style={{ padding: '12px 16px', color: '#bf2600', fontWeight: 600 }}>
                    App queda en estado "Pending" varios días
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    Es el flujo habitual de revisión manual de TikTok. Revisa el correo corporativo registrado por si solicitaron aclaraciones del uso.
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                  <td style={{ padding: '12px 16px', color: '#bf2600', fontWeight: 600 }}>
                    El parámetro auth_code no aparece en la redirección
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    El <code>redirect_uri</code> en la URL del link de autorización debe coincidir exactamente con el configurado en la app (respetando https, barras finales y puertos).
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #edf0f2' }}>
                  <td style={{ padding: '12px 16px', color: '#bf2600', fontWeight: 600 }}>
                    advertiser_ids viene vacío []
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    El cliente no seleccionó ninguna cuenta publicitaria durante el popup de autorización o no tiene cuentas asociadas a su Business Center.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', color: '#bf2600', fontWeight: 600 }}>
                    Error de permisos al descargar leads
                  </td>
                  <td style={{ padding: '12px 16px', color: '#474d57' }}>
                    Faltó seleccionar el sub-scope <strong>"Leads Retrieval"</strong> dentro de "Lead Management" al crear la aplicación en el Paso 2.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
