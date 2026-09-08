# ==============================================================================
# STAGE 1: Build Frontend Artifacts with Vite
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias con caché óptima de capas
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Argumento opcional para inyectar URL base de la API en build-time
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Compilar aplicación para producción
RUN npm run build

# ==============================================================================
# STAGE 2: Production Web Server with Nginx Alpine
# ==============================================================================
FROM nginx:1.25-alpine AS runner

# Metadatos del contenedor
LABEL maintainer="Growth Intelligence Team"
LABEL description="Producción optimizada frontend SPA en Nginx Alpine"

# Eliminar configuración predeterminada de Nginx
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copiar configuración personalizada de Nginx (como template para envsubst)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copiar bundle compilado desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto HTTP estándar
EXPOSE 80

# Comprobación de salud (Healthcheck)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

# Arrancar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
