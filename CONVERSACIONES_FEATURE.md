# Feature: Gestión de Conversaciones WhatsApp

## Descripción
Se ha agregado una nueva sección de **Conversaciones** al CRM que permite:
- Listar todas las conversaciones de WhatsApp
- Ver el historial completo de mensajes de cada conversación
- Responder a los clientes directamente desde la plataforma
- Buscar conversaciones por número de teléfono o nombre del participante
- Ver indicadores de mensajes no leídos

## Cambios Realizados

### 1. Nuevos Archivos Creados

#### `src/pages/ConversationsPage.tsx`
Página principal que muestra:
- **Panel izquierdo**: Lista de conversaciones con búsqueda
- **Panel derecho**: Historial de mensajes y área de respuesta
- Indicadores de mensajes no leídos
- Información del participante (nombre y número de teléfono)

#### `src/services/conversationService.ts`
Servicio que proporciona:
- `getConversations(companyId)` - Obtiene todas las conversaciones
- `getMessages(conversationId)` - Obtiene el historial de mensajes
- `sendMessage(conversationId, content)` - Envía una respuesta
- `archiveConversation(conversationId)` - Archiva una conversación
- `markAsRead(conversationId)` - Marca como leída

### 2. Archivos Modificados

#### `src/App.tsx`
- Importado `ConversationsPage`
- Agregada ruta `/conversations`

#### `src/components/Layout.tsx`
- Agregado botón de navegación "💬 Conversaciones" en el sidebar
- Navegación a `/conversations`

## Características

### Interfaz de Usuario
- **Diseño responsivo** con dos paneles (lista y detalle)
- **Búsqueda en tiempo real** de conversaciones
- **Indicadores visuales** de mensajes no leídos
- **Timestamps** en cada mensaje
- **Diferenciación visual** entre mensajes entrantes y salientes

### Funcionalidades
- Listar conversaciones ordenadas por última actividad
- Ver historial completo de mensajes
- Enviar respuestas con Enter o botón
- Búsqueda por número de teléfono o nombre
- Actualización automática de conversaciones después de enviar

## Estructura de Datos

### Conversation
```typescript
{
  id: string;
  phoneNumber: string;
  participantName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'archived';
}
```

### Message
```typescript
{
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
}
```

## Integración con API Real

Para conectar con tu API real de WhatsApp, actualiza `src/services/conversationService.ts`:

```typescript
// Reemplaza los endpoints mock con tus endpoints reales
export const conversationService = {
  getConversations: async (companyId: string): Promise<Conversation[]> => {
    const response = await apiClient.get(`/conversations?companyId=${companyId}`);
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    const response = await apiClient.post(`/conversations/${conversationId}/messages`, { content });
    return response.data;
  },
  // ... resto de métodos
};
```

## Configuración de Variables de Entorno

Asegúrate de que `REACT_APP_API_URL` esté configurado en tu `.env`:

```
REACT_APP_API_URL=http://localhost:3000/api
```

## Uso

1. Navega a la sección "Conversaciones" desde el sidebar
2. Verás la lista de conversaciones en el panel izquierdo
3. Haz clic en una conversación para ver el historial
4. Escribe tu respuesta en el campo de texto
5. Presiona Enter o haz clic en "Enviar"

## Próximas Mejoras Sugeridas

- [ ] Agregar filtros por estado (activas, archivadas)
- [ ] Implementar notificaciones en tiempo real
- [ ] Agregar plantillas de respuestas rápidas
- [ ] Exportar conversaciones a PDF
- [ ] Agregar etiquetas/tags a conversaciones
- [ ] Implementar asignación de conversaciones a agentes
- [ ] Agregar análisis de sentimiento
- [ ] Soporte para archivos/imágenes en mensajes
