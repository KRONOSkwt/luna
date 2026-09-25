# El Observatorio — Bóveda Celeste

Una bóveda celeste de los dos: una línea de tiempo privada con los momentos que
hacen la historia de Sebas y su persona amada. Cinco noches se siembran el día
uno; el resto se escribe con los ojos puestos en el cielo de La Paz.

## Stack

| Capa    | Elección                                            |
| ------- | --------------------------------------------------- |
| UI      | React 18 + TypeScript + Vite                        |
| Estilos | Tailwind CSS (tokens Obsidiana/Ámbar/Polvo Estelar) |
| Datos   | Supabase (Postgres + RLS) · React Query             |
| Escena  | React Three Fiber (futuro: observatorio 3D)         |

## Empezar

```sh
pnpm install
pnpm dev          # http://localhost:5173
```

El placeholder inicial es solo la marca — «El Observatorio · Bóveda Celeste ·
La Paz» — hasta que la línea de tiempo (siguiente slice) la muestre.

## Supabase — setup de una página

1. Crea un proyecto en [supabase.com](https://supabase.com) y copia la URL y la
   anon key a `.env.local` (plantilla en `.env.example`).
2. Enlaza el CLI local:

   ```sh
   supabase login
   supabase link --project-ref <tu-ref>
   supabase db push        # aplica las migraciones
   supabase db reset       # (local) migraciones + seed de las 5 noches
   ```

3. Tú eres el único admin: añade tu correo a la allowlist.

   ```sql
   insert into public.admins (email) values ('tu@correo.com');
   ```

> ⚠️ La anon key es **pública por diseño** — se envía al navegador. La
> seguridad real la pone RLS (debajo). La `SUPABASE_SERVICE_ROLE_KEY` jamás va
> al cliente; CI la rechaza si aparece fuera de `.env.example`.

## Modelo de seguridad (RLS) — en un vistazo

| Acción            | Anónimo  | Usuario normal | Admin (allowlist)        |
| ----------------- | -------- | -------------- | ------------------------ |
| Leer memories     | ✅       | ✅             | ✅                       |
| Escribir memories | ❌ 42501 | ❌ 42501       | ✅                       |
| Leer admins       | ❌       | ❌             | ❌ (solo bypass service) |

- `memories` — lectura pública, escritura solo si `is_admin()`.
- `admins` — deny-all: sin policies ni grants; solo la service key la lee.
- `is_admin()` — función `security definer` que compara el email del JWT con
  la allowlist (case-insensitive).

### Probarlo tú mismo (fallback manual de CI)

```sh
supabase start
supabase db reset
node scripts/verify-rls.mjs    # a–f: read/42501/no-op/guest/admin/deny-all
```

El script **se niega a correr contra un Supabase remoto** (solo `127.0.0.1` /
`localhost`), así que es seguro ejecutarlo en cualquier máquina.

## Scripts

| Comando          | Qué hace                                          |
| ---------------- | ------------------------------------------------- |
| `pnpm dev`       | Servidor de desarrollo                            |
| `pnpm test`      | Vitest (strict TDD: cada pieza con su RED→GREEN)  |
| `pnpm lint`      | ESLint + typecheck ×2 + `node --check` del script |
| `pnpm typecheck` | `tsc --noEmit` sobre la app                       |
| `pnpm build`     | Typecheck + build de producción                   |
| `pnpm format`    | Prettier en todo el repo                          |

## CI

`pnpm test · pnpm typecheck · pnpm lint · pnpm build` en cada push/PR, más dos
guardas: ninguna mención de `service_role` fuera de `.env.example` y
`src/core/astronomy.ts` libre de `Date` (matemática pura y testeable). Un job
`verify-rls` levanta Supabase local, aplica migraciones + seed y corre el
script de prueba (se salta con warning si Docker no está disponible).

## Roadmap visual

La línea de tiempo 3D (slice W1/W2) pinta las 5 noches sembradas como
constelación sobre el Illimani. Este slice solo entrega los cimientos:
scaffold, tokens, clientes core, esquema + RLS y despliegue zero-config en
Vercel.
