# Vectia Workflow - Web B2B

Aplicación web B2B para configurar flujos de WhatsApp con un workflow builder visual. Permite a usuarios de empresas crear, editar y gestionar flujos de conversación para WhatsApp.

## 🎯 Características

- ✅ **Autenticación por Empresa**: Login con email y contraseña asociados a una empresa
- ✅ **Dashboard**: Vista general de flujos y estadísticas
- ✅ **Workflow Builder**: Editor visual para crear flujos
- ✅ **Tipos de Nodos**: Mensaje, Pregunta, Condición, Acción, Inicio, Fin
- ✅ **Gestión de Flujos**: Crear, editar, eliminar, activar/desactivar
- ✅ **Material UI**: Interfaz moderna y responsiva
- ✅ **TypeScript**: Código type-safe

## 📋 Requisitos

- Node.js 16+
- npm o yarn
- Cuenta de AWS con DynamoDB configurado
- Backend API ejecutándose (reg-vectia-facebook-lambda)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
cd /Users/mquerevalu/proyectos/vectia
git clone <repo> reg-vectia-workflow-web-b2b
cd reg-vectia-workflow-web-b2b
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar variables de entorno

Crear archivo `.env`:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development
```

Para producción:

```env
REACT_APP_API_URL=https://api.vectia.com/api
REACT_APP_ENV=production
```

### 4. Iniciar servidor de desarrollo

```bash
npm start
# o
yarn start
```

La aplicación se abrirá en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # Layout principal
│   └── ProtectedRoute.tsx
├── pages/              # Páginas principales
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── WorkflowBuilderPage.tsx
├── services/           # Servicios API
│   ├── authService.ts
│   └── workflowService.ts
├── store/              # Estado global (Zustand)
│   ├── authStore.ts
│   └── workflowStore.ts
├── types/              # Tipos TypeScript
│   └── index.ts
├── App.tsx             # Componente raíz
└── index.tsx           # Punto de entrada
```

## 🔐 Autenticación

### Login

1. Usuario ingresa email y contraseña
2. Backend valida credenciales contra DynamoDB
3. Backend retorna token JWT y datos del usuario
4. Token se guarda en localStorage
5. Usuario es redirigido al dashboard

### Flujo de Autenticación

```
Login Page
    ↓
authService.login(email, password)
    ↓
Backend: POST /api/auth/login
    ↓
DynamoDB: Buscar usuario por email
    ↓
Validar contraseña
    ↓
Generar JWT token
    ↓
Retornar token + user data
    ↓
Guardar en localStorage
    ↓
Redirigir a Dashboard
```

## 📊 Dashboard

Muestra:
- Total de flujos
- Flujos activos
- Lista de flujos con opciones para editar/eliminar
- Botón para crear nuevo flujo

## 🔧 Workflow Builder

### Tipos de Nodos

1. **Inicio (Start)**
   - Punto de entrada del flujo
   - Solo uno por flujo

2. **Mensaje (Message)**
   - Envía un mensaje al usuario
   - Puede incluir botones

3. **Pregunta (Question)**
   - Hace una pregunta al usuario
   - Valida respuesta (email, teléfono, texto, número)

4. **Condición (Condition)**
   - Bifurca el flujo según una condición
   - Soporta: equals, contains, greater, less

5. **Acción (Action)**
   - Ejecuta una acción
   - Tipos: save_data, send_email, call_webhook, assign_agent

6. **Fin (End)**
   - Termina el flujo

### Crear un Flujo

1. Ir a Dashboard
2. Clic en "Nuevo Flujo"
3. Ingresar nombre y descripción
4. Clic en "Crear"
5. Se abre el Workflow Builder
6. Agregar nodos desde la barra lateral
7. Conectar nodos (próxima versión)
8. Guardar flujo
9. Activar flujo

## 🔌 Integración con Backend

### Endpoints Requeridos

```
POST /api/auth/login
  Body: { email, password }
  Response: { token, user }

GET /api/workflows?companyId=xxx
  Response: Workflow[]

GET /api/workflows/:id
  Response: Workflow

POST /api/workflows
  Body: { companyId, name, description, nodes, edges, active }
  Response: Workflow

PUT /api/workflows/:id
  Body: Partial<Workflow>
  Response: Workflow

DELETE /api/workflows/:id
  Response: void

POST /api/workflows/:id/publish
  Response: Workflow

POST /api/workflows/:id/unpublish
  Response: Workflow
```

## 🛠️ Desarrollo

### Agregar Nuevo Componente

```typescript
// src/components/MyComponent.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

interface MyComponentProps {
  title: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return (
    <Box>
      <Typography>{title}</Typography>
    </Box>
  );
};

export default MyComponent;
```

### Agregar Nuevo Store

```typescript
// src/store/myStore.ts
import { create } from 'zustand';

interface MyStore {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyStore>((set) => ({
  value: '',
  setValue: (value: string) => set({ value }),
}));
```

### Agregar Nuevo Servicio

```typescript
// src/services/myService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const myService = {
  getData: async () => {
    const response = await apiClient.get('/my-endpoint');
    return response.data;
  },
};
```

## 📦 Build para Producción

```bash
npm run build
# o
yarn build
```

Genera carpeta `build/` lista para desplegar.

## 🚀 Despliegue

### AWS S3 + CloudFront

```bash
# Build
npm run build

# Desplegar a S3
aws s3 sync build/ s3://mi-bucket/

# Invalidar CloudFront
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t vectia-workflow .
docker run -p 3000:3000 vectia-workflow
```

## 🧪 Testing

```bash
npm test
```

## 📝 Próximas Características

- [ ] Editor visual de nodos con drag & drop
- [ ] Conexión visual de nodos
- [ ] Preview de flujo
- [ ] Historial de cambios
- [ ] Colaboración en tiempo real
- [ ] Plantillas de flujos
- [ ] Análisis de flujos
- [ ] Integración con Pinecone
- [ ] Respuestas con IA (Bedrock)

## 🐛 Troubleshooting

### Error: "Cannot find module '@types/react'"

```bash
npm install --save-dev @types/react @types/react-dom
```

### Error: "API connection refused"

Verificar que:
1. Backend está ejecutándose
2. `REACT_APP_API_URL` es correcto
3. CORS está habilitado en backend

### Error: "Token inválido"

```bash
# Limpiar localStorage
localStorage.clear()

# Volver a iniciar sesión
```

## 📞 Soporte

Para reportar bugs o sugerencias, crear un issue en el repositorio.

## 📄 Licencia

UNLICENSED

---

**Última actualización**: Enero 28, 2026
