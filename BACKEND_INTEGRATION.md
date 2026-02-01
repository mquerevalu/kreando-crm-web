# Integración con Backend - Conversaciones API

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API Base URL - Apunta a tu Lambda API Gateway
REACT_APP_API_URL=https://abc123.execute-api.us-east-2.amazonaws.com/dev

# Alternativa para desarrollo local
# REACT_APP_API_URL=http://localhost:3000/api
```

### 2. Obtener la URL de la API

Después de desplegar el backend con Serverless:

```bash
cd reg-vectia-facebook-lambda
serverless deploy --stage dev
```

La URL aparecerá en los outputs:

```
endpoints:
  GET https://abc123.execute-api.us-east-2.amazonaws.com/dev/conversations
  GET https://abc123.execute-api.us-east-2.amazonaws.com/dev/conversations/{conversationId}/messages
  POST https://abc123.execute-api.us-east-2.amazonaws.com/dev/conversations/{conversationId}/messages
  PUT https://abc123.execute-api.us-east-2.amazonaws.com/dev/conversations/{conversationId}/read
  PUT https://abc123.execute-api.us-east-2.amazonaws.com/dev/conversations/{conversationId}/archive
```

Usa la URL base (sin el path específico) como `REACT_APP_API_URL`.

## Endpoints Disponibles

### GET /conversations

Obtiene todas las conversaciones de una empresa.

**Parámetros:**
- `companyId` (query): ID de la empresa (pageId en DynamoDB)

**Ejemplo:**
```typescript
const conversations = await conversationService.getConversations('123456789');
```

**Response:**
```json
[
  {
    "id": "conv-123",
    "phoneNumber": "+34612345678",
    "participantName": "Juan García",
    "lastMessage": "Hola, ¿cuál es el precio?",
    "lastMessageTime": "Hace 5 minutos",
    "unreadCount": 2,
    "status": "active"
  }
]
```

---

### GET /conversations/{conversationId}/messages

Obtiene el historial de mensajes de una conversación.

**Parámetros:**
- `conversationId` (path): ID de la conversación
- `limit` (query, opcional): Número máximo de mensajes (default: 50)

**Ejemplo:**
```typescript
const messages = await conversationService.getMessages('conv-123');
```

**Response:**
```json
[
  {
    "id": "msg-1",
    "sender": "Juan García",
    "content": "Hola, ¿cuál es el precio?",
    "timestamp": "2024-01-01T10:00:00.000Z",
    "direction": "inbound"
  },
  {
    "id": "msg-2",
    "sender": "Bot",
    "content": "Hola Juan, nuestros precios van desde $500",
    "timestamp": "2024-01-01T10:00:10.000Z",
    "direction": "outbound"
  }
]
```

---

### POST /conversations/{conversationId}/messages

Envía un mensaje de respuesta.

**Parámetros:**
- `conversationId` (path): ID de la conversación

**Body:**
```json
{
  "content": "Gracias por tu interés. ¿Necesitas más información?"
}
```

**Ejemplo:**
```typescript
const message = await conversationService.sendMessage('conv-123', 'Hola!');
```

**Response:**
```json
{
  "id": "msg-3",
  "sender": "Bot",
  "content": "Hola!",
  "timestamp": "2024-01-01T10:00:20.000Z",
  "direction": "outbound"
}
```

---

### PUT /conversations/{conversationId}/read

Marca una conversación como leída.

**Parámetros:**
- `conversationId` (path): ID de la conversación

**Ejemplo:**
```typescript
await conversationService.markAsRead('conv-123');
```

**Response:**
```json
{
  "success": true
}
```

---

### PUT /conversations/{conversationId}/archive

Archiva una conversación.

**Parámetros:**
- `conversationId` (path): ID de la conversación

**Ejemplo:**
```typescript
await conversationService.archiveConversation('conv-123');
```

**Response:**
```json
{
  "success": true
}
```

---

## Servicio de Conversaciones

El archivo `src/services/conversationService.ts` proporciona una interfaz simplificada:

```typescript
import { conversationService } from '../services/conversationService';

// Obtener conversaciones
const conversations = await conversationService.getConversations(companyId);

// Obtener mensajes
const messages = await conversationService.getMessages(conversationId);

// Enviar mensaje
const message = await conversationService.sendMessage(conversationId, content);

// Marcar como leída
await conversationService.markAsRead(conversationId);

// Archivar
await conversationService.archiveConversation(conversationId);
```

### Fallback a Mock Data

El servicio automáticamente:

1. Intenta conectar con la API real
2. Si falla, usa mock data para desarrollo
3. Registra todas las llamadas en la consola

Esto permite desarrollar sin necesidad de que el backend esté disponible.

---

## Uso en Componentes

### Ejemplo: ConversationsPage

```typescript
import { useEffect, useState } from 'react';
import { conversationService } from '../services/conversationService';

export const ConversationsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      try {
        const data = await conversationService.getConversations('company-123');
        setConversations(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  return (
    <div>
      {loading ? <p>Cargando...</p> : (
        <ul>
          {conversations.map(conv => (
            <li key={conv.id}>{conv.participantName}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

---

## Debugging

### Ver logs de API

Abre la consola del navegador (F12) y verás logs como:

```
[API] GET /conversations?companyId=123456789
[API RESPONSE] GET /conversations?companyId=123456789
```

### Verificar requests en Network

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Realiza una acción que haga una llamada API
4. Verás la request y response

### Errores Comunes

**Error: "Cannot find module '../services/conversationService'"**
- Asegúrate de que el archivo existe en `src/services/conversationService.ts`

**Error: CORS**
- Verifica que `REACT_APP_API_URL` sea correcto
- Asegúrate de que el backend tiene CORS habilitado

**Error: 404 Not Found**
- Verifica que los endpoints están desplegados
- Comprueba que la URL es correcta

**Error: 500 Internal Server Error**
- Revisa los logs de CloudWatch en AWS
- Verifica que DynamoDB tiene los datos correctos

---

## Testing

### Test Local con Mock Data

El servicio usa mock data automáticamente si la API no está disponible:

```bash
npm start
```

Verás en la consola:
```
[API] GET /conversations?companyId=123456789
API error, using mock data: Error: ...
[API RESPONSE] GET /conversations?companyId=123456789
```

### Test con API Real

1. Asegúrate de que el backend está desplegado
2. Configura `REACT_APP_API_URL` correctamente
3. Ejecuta `npm start`
4. Verás en la consola que usa la API real

---

## Deployment

### Frontend

```bash
npm run build
# Desplegar el contenido de 'build/' a tu hosting
```

### Backend

```bash
cd reg-vectia-facebook-lambda
serverless deploy --stage prod
```

---

## Próximas Mejoras

- [ ] Agregar autenticación JWT
- [ ] Agregar WebSockets para mensajes en tiempo real
- [ ] Agregar paginación
- [ ] Agregar búsqueda avanzada
- [ ] Agregar filtros por estado
- [ ] Agregar exportación de conversaciones
- [ ] Agregar notificaciones push

---

## Soporte

Para problemas o preguntas:

1. Revisa los logs en CloudWatch
2. Verifica la consola del navegador
3. Consulta la documentación de endpoints: `CONVERSATIONS_API_ENDPOINTS.md`
