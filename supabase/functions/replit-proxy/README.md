# Replit Proxy - Supabase Edge Function

Questa Edge Function fa da proxy per le chiamate all'API GraphQL di Replit, evitando problemi CORS.

## Deploy della funzione

### Opzione 1: Deploy da Web UI (PIÙ SEMPLICE)

1. Vai su https://supabase.com/dashboard/project/yqcyglodttblvhwnasjg/functions
2. Click su "Create a new function"
3. Nome funzione: `replit-proxy`
4. Copia e incolla il contenuto di `index.ts` nell'editor
5. Click "Deploy"

### Opzione 2: Deploy da CLI

1. Installa Supabase CLI:
   ```bash
   # Linux/macOS
   brew install supabase/tap/supabase

   # O scarica da: https://github.com/supabase/cli/releases
   ```

2. Login:
   ```bash
   supabase login
   ```

3. Link al progetto:
   ```bash
   supabase link --project-ref yqcyglodttblvhwnasjg
   ```

4. Deploy la funzione:
   ```bash
   supabase functions deploy replit-proxy
   ```

## URL della funzione

Dopo il deploy, la funzione sarà disponibile a:
```
https://yqcyglodttblvhwnasjg.supabase.co/functions/v1/replit-proxy
```

## Test della funzione

Puoi testare la funzione con questo comando:

```bash
curl -X POST https://yqcyglodttblvhwnasjg.supabase.co/functions/v1/replit-proxy \
  -H "Content-Type: application/json" \
  -d '{"query":"query { currentUser { id username } }"}'
```

## Risoluzione problemi

Se la funzione non funziona:

1. Verifica che sia stata deployata correttamente nella dashboard Supabase
2. Controlla i logs nella sezione "Edge Functions" > "Logs"
3. Verifica che il token Replit sia ancora valido (scade il 2025-02-01)
