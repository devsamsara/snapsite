# Diagnóstico del problema "usuario deslogueado"

## Raíz del problema

### Backend
- `ErrorUtils.unauthorized()` lanza un `ErrorUtils` (extends Error), NO un `GraphQLError`
- Apollo Server 4 convierte errores no-GraphQLError a errores con `extensions.code = 'INTERNAL_SERVER_ERROR'`
- Por tanto, el error "You must be logged in" llega al cliente con `extensions.code = 'INTERNAL_SERVER_ERROR'`, NO con `'UNAUTHENTICATED'`
- El `formatError` en app.ts no transforma el ErrorUtils a GraphQLError (no llama `.toGraphQLError()`)

### Frontend (graphql-client.ts)
- `isAuthenticationError()` busca `extensions.code === 'UNAUTHENTICATED'` o mensajes con 'unauthorized'/'unauthenticated'/'token'/'jwt'
- El mensaje "You must be logged in" NO contiene ninguna de esas palabras
- Por tanto, el error link NO detecta el error como de autenticación y NO intenta el refresh
- La request falla silenciosamente con "You must be logged in" sin que el frontend intente renovar el token

## Solución

### Opción A (recomendada): Corregir el backend
En `src/app.ts`, el `formatError` debe convertir `ErrorUtils` a `GraphQLError` con el código correcto:
```ts
formatError: (formattedError, error) => {
  if (error instanceof ErrorUtils) {
    return error.toGraphQLError();
  }
  return formattedError;
}
```
O alternativamente, en cada resolver lanzar `throw ErrorUtils.unauthorized(...).toGraphQLError()`

### Opción B: Corregir el frontend
En `isAuthenticationError()` añadir detección del mensaje "must be logged in":
```ts
err.message?.toLowerCase().includes('must be logged in') ||
err.message?.toLowerCase().includes('logged in')
```

## Flujo de tokens
- Access token: 1 día (hardcoded en auth.service.ts línea 87)
- Refresh token: 30 días (línea 88)
- El refresh token se borra al usarse (rotation) — línea 359: `this.em.remove(rt)`
- El nuevo refresh token se devuelve en la respuesta del refresh

## Estado del toggle de notificaciones
- `IsPushTokenEnabledDocument` ya existe en gql/graphql.ts (línea 998)
- El backend devuelve `notFound` si el token no está registrado (no devuelve false)
- La corrección en settings.tsx maneja este caso correctamente
