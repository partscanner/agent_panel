# Implementación de Scroll Infinito

## Resumen

Se implementó scroll infinito en la lista de conversaciones para optimizar el rendimiento cuando hay un gran volumen de conversaciones (ej: 1000+).

## Cambios Realizados

### 1. Hook `useConversations` (src/hooks/useConversations.ts)

**Antes:**
- Usaba `useQuery` que cargaba todas las conversaciones de una sola vez
- Límite fijo de 50 conversaciones

**Después:**
- Usa `useInfiniteQuery` de React Query
- Carga 50 conversaciones por página
- Carga páginas adicionales bajo demanda
- Devuelve:
  - `data.pages`: Array de páginas con conversaciones
  - `fetchNextPage()`: Función para cargar más
  - `hasNextPage`: Indica si hay más páginas
  - `isFetchingNextPage`: Estado de carga

### 2. Componente `ConversationList` (src/components/conversations/ConversationList.tsx)

**Cambios principales:**

1. **Flatten de páginas:**
   ```typescript
   const conversations = data?.pages.flatMap(page => page.items) || [];
   ```

2. **Contador total real:**
   ```typescript
   const totalConversations = data?.pages[0]?.total || 0;
   ```
   - Muestra "X de Y" cuando hay más por cargar
   - Muestra "Y conversations" cuando todas están cargadas

3. **Intersection Observer:**
   - Detecta cuando el usuario llega al final de la lista
   - Carga automáticamente la siguiente página
   - `rootMargin: '100px'` - Comienza a cargar 100px antes del final

4. **Indicador de carga:**
   - Muestra "Cargando más conversaciones..." mientras carga
   - Muestra "Todas las conversaciones cargadas" al final

### 3. Hooks de Mutación Actualizados

Los siguientes hooks fueron actualizados para trabajar con la estructura de páginas:

- `useSendMessage`: Actualiza unreadCount en todas las páginas
- `useAssignConversation`: Actualiza conversación asignada en todas las páginas
- `useUpdateWorkflowStatus`: Actualiza workflow status en todas las páginas

**Estructura de actualización:**
```typescript
pages: oldData.pages.map((page: any) => ({
  ...page,
  items: page.items.map((conv: any) => 
    conv.id === conversationId ? updatedConversation : conv
  ),
}))
```

## Beneficios

### 1. **Rendimiento Optimizado**
- ✅ Solo carga 50 conversaciones inicialmente
- ✅ DOM más ligero (menos elementos renderizados)
- ✅ Carga incremental bajo demanda
- ✅ Funciona eficientemente con 1000+ conversaciones

### 2. **Experiencia de Usuario**
- ✅ Carga inicial más rápida
- ✅ Scroll suave sin lags
- ✅ Contador muestra el total real (ej: "50 de 237")
- ✅ Carga automática al hacer scroll (sin botones)

### 3. **Precisión de Datos**
- ✅ El contador siempre muestra el total real del backend
- ✅ No limitado a 50 conversaciones
- ✅ Mantiene sincronización con WebSocket

## Ejemplo de Uso

```typescript
// El hook ahora devuelve estructura de infinite query
const { 
  data,              // { pages: [...], pageParams: [...] }
  fetchNextPage,     // Función para cargar más
  hasNextPage,       // true si hay más páginas
  isFetchingNextPage // true mientras carga
} = useConversations({ status: 'open' });

// Flatten todas las páginas
const conversations = data?.pages.flatMap(page => page.items) || [];

// Total real del backend
const total = data?.pages[0]?.total || 0;
```

## Configuración

### Tamaño de Página
Actualmente configurado en **50 conversaciones por página**. Para cambiar:

```typescript
// src/hooks/useConversations.ts
pageSize: 50  // Cambiar este valor
```

### Distancia de Pre-carga
Actualmente comienza a cargar **100px antes** del final. Para cambiar:

```typescript
// src/components/conversations/ConversationList.tsx
rootMargin: '100px'  // Cambiar este valor
```

## Compatibilidad

- ✅ Compatible con filtros existentes (status, workflowStatus, mine)
- ✅ Compatible con WebSocket (invalidación automática)
- ✅ Compatible con asignación de agentes
- ✅ Compatible con actualización de workflow status
- ✅ Compatible con envío de mensajes

## Testing Recomendado

1. **Con pocas conversaciones (< 50):**
   - Verificar que no aparece el indicador de carga
   - Verificar que el contador muestra el total correcto

2. **Con muchas conversaciones (> 50):**
   - Verificar que carga 50 inicialmente
   - Verificar que el contador muestra "50 de X"
   - Hacer scroll al final y verificar que carga más
   - Verificar que el indicador de carga aparece

3. **Filtros:**
   - Cambiar filtros y verificar que resetea correctamente
   - Verificar que cada filtro muestra su propio total

4. **Actualizaciones en tiempo real:**
   - Verificar que nuevos mensajes actualizan correctamente
   - Verificar que asignaciones funcionan en todas las páginas

## Notas Técnicas

- React Query maneja automáticamente el caché de páginas
- Las páginas se mantienen en caché incluso después de cambiar de conversación
- `invalidateQueries` recarga todas las páginas cargadas
- El Intersection Observer se limpia automáticamente al desmontar el componente

