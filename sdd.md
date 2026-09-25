SPEC-DRIVEN DEVELOPMENT (SDD)
Proyecto: El Observatorio — Sector 0: Bóveda Celeste
code
Code
Repository: https://github.com/KRONOSkwt/luna.git
Version: 1.0.0 (Sector 0 + Admin CRUD)
Target Platform: Mobile-First Web (Optimizado para Android)
Guiding Motto: «Por más noches estrelladas admirando a mi Luna»
Status: En desarrollo inicial (Sectores futuros estrictamente congelados)
1. Alcance y Arquitectura de Extensibilidad
1.1 Regla Estricta de Alcance (Scope Boundary)
Este documento define única y exclusivamente el Sector 0: Bóveda Celeste y el Panel de Administración Privado (CRUD).
Directiva de Ingeniería: El sistema está diseñado conceptualmente para recibir nuevos módulos mes a mes (Grafo Cósmico, Tocadiscos/Spotify, Oráculo Cultural, Despacho 7:30 y Wrapped Anual). Sin embargo, estos futuros módulos NO deben aparecer en la interfaz de usuario actual (cero botones inactivos, cero pestañas rotas) y NO deben desarrollarse en este sprint. El código debe ser modular para facilitar su adición posterior sin contaminar la experiencia actual.
2. Stack Tecnológico & Dependencias
Bundler & Runtime: Vite + React 18 + TypeScript
Estilos & Tokens: Tailwind CSS + clsx + tailwind-merge
Renderizado 3D / WebGL: Three.js + @react-three/fiber + @react-three/drei
Motor de Animación: framer-motion
Capa de Datos y Estado: @supabase/supabase-js + @tanstack/react-query
Tipografías:
Editorial / Títulos: Cormorant Garamond o Cinzel
Técnica / Metadatos: JetBrains Mono
3. Modelo de Datos en Supabase (PostgreSQL + RLS)
El esquema almacena las fechas y los recuerdos reales que Sebas ingresará manualmente.
code
SQL
-- Tabla de Recuerdos Celestiales
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,               -- Formato YYYY-MM-DD
  title text not null,                     -- Qué pasó (título/resumen)
  description text not null,               -- Qué pasó (nota detallada escrita por Sebas)
  is_first_kiss boolean default false,     -- Dispara el efecto visual especial del 21.09
  location text default 'La Paz, Bolivia', -- Coordenadas de referencia
  order_index int default 0,
  created_at timestamptz default now()
);

-- Políticas RLS (Row Level Security)
alter table public.memories enable row level security;

-- 1. Acceso público de lectura para Luna
create policy "Permitir lectura publica a anon"
  on public.memories for select
  to anon
  using (true);

-- 2. Acceso total de escritura solo para Sebas (autenticado)
create policy "Permitir gestion completa a administradores autenticados"
  on public.memories for all
  to authenticated
  using (true)
  with check (true);
4. Arquitectura de Directorios (Modular)
code
Text
luna/
├── public/
│   └── favicon.ico
├── src/
│   ├── core/
│   │   ├── supabase.ts                 # Instancia cliente de Supabase
│   │   ├── queryClient.ts              # TanStack Query Client
│   │   └── astronomy.ts                # Cálculos de posición estelar (La Paz: 16.5° S, 68.1° O)
│   ├── features/
│   │   ├── boveda/                     # SECTOR 0 (Público)
│   │   │   ├── components/
│   │   │   │   ├── CelestialCanvas.tsx # Canvas Three.js/R3F (Cielo estrellado dinámico)
│   │   │   │   ├── DateTimeline.tsx    # Selector horizontal de fechas
│   │   │   │   ├── MemoryCard.tsx      # Tarjeta flotante con la fecha y "qué pasó"
│   │   │   │   └── FirstKissBloom.tsx  # Resplandor estelar dorado para el 21 de septiembre
│   │   │   ├── hooks/
│   │   │   │   └── useMemories.ts      # Fetch de recuerdos desde Supabase
│   │   │   └── BovedaPage.tsx          # Vista principal
│   │   │
│   │   ├── admin/                      # PANEL PRIVADO (CRUD)
│   │   │   ├── components/
│   │   │   │   ├── AuthModal.tsx       # Modal de login Supabase
│   │   │   │   ├── MemoryForm.tsx      # Formulario para Crear / Editar recuerdos
│   │   │   │   └── MemoryList.tsx      # Tabla/Listado interactivo de recuerdos
│   │   │   └── AdminDashboard.tsx      # Panel de control
│   │   │
│   │   └── terminal/                   # Conector secreto
│   │       ├── SecretTerminal.tsx      # Consola emergente (_sh)
│   │       └── useTerminalAuth.ts      # Listener para el comando 'sudo admin'
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   └── HeroHeader.tsx          # Frase: "Por más noches estrelladas admirando a mi Luna"
│   │   └── tokens.ts                   # Paleta (Obsidiana, Ámbar, Polvo Estelar)
│   │
│   ├── App.tsx                         # Router y coordinadores de estado
│   └── main.tsx
├── .env.example
├── package.json
└── tsconfig.json
5. Requerimientos Funcionales y de Interacción
5.1 Vista Pública: La Bóveda Celeste
Cabecera Central:
Muestra con sutileza editorial el lema:
«Por más noches estrelladas admirando a mi Luna»
El Domo Estelar 3D (CelestialCanvas.tsx):
Renderiza una semiesfera con miles de partículas estelares sobre fondo Obsidiana Pura (#07080A).
Toma como parámetros de latitud y longitud las coordenadas de La Paz, Bolivia.
Al seleccionar una fecha en la línea de tiempo, la cámara rota de forma suave hacia la orientación estelar calculada para esa noche.
Línea de Tiempo de Fechas (DateTimeline.tsx):
Barra deslizante táctil horizontal en la base de la pantalla que lista las fechas disponibles (ej. 06.09.2026, 11.09.2026, 14.09.2026, 17.09.2026, 21.09.2026).
Tarjeta de Recuerdo (MemoryCard.tsx):
Muestra la fecha seleccionada con tipografía monospace limpia (JetBrains Mono).
Muestra el título y el relato de qué pasó, escrito por ti.
Tratamiento Especial del 21 de Septiembre (Primer Beso):
Si la fecha tiene is_first_kiss: true:
El canvas 3D activa un resplandor dorado suave (bloom filter) en las estrellas centrales.
La tarjeta despliega un indicador sutil: [ NUESTRO PRIMER BESO ].
En Android, dispara un pulso háptico doble (navigator.vibrate([40, 60, 40])).
La Declaración:
No tendrá ningún efecto pirotécnico o pregunta en pantalla. La fecha de ese día se registrará en el sistema como un recuerdo más de lo que vivieron esa noche, ya que la propuesta se hará en persona.
5.2 El Acceso Secreto y Panel CRUD (Sebas)
Activador del Panel:
En la esquina inferior derecha hay un prompt casi invisible con el glifo _sh.
Al presionarlo, se abre una línea de comandos minimalista.
Si escribes: sudo admin (o atajo de teclado configurado):
Se despliega discretamente el modal de autenticación (AuthModal.tsx).
Autenticación:
Login mediante correo y contraseña administrados por Supabase Auth.
Panel CRUD (AdminDashboard.tsx):
Una vez autenticado, se habilita la interfaz de gestión:
Crear Fecha: Selector de fecha (YYYY-MM-DD), título del evento, texto detallado de "qué pasó" y checkbox [ ] ¿Es el Primer Beso?.
Editar: Permite ajustar cualquier recuerdo en caliente sin tocar código.
Eliminar: Borrar recuerdos si es necesario.
Toda mutación invalida la caché de TanStack Query para que la Bóveda Celeste se actualice de inmediato.
6. Variables de Entorno (.env)
code
Ini
# Conexión Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
7. Plan de Implementación (Scaffolding Inicial)
Paso 1: Clonar el repositorio https://github.com/KRONOSkwt/luna.git e inicializar el proyecto con pnpm create vite . --template react-ts.
Paso 2: Instalar dependencias de UI, 3D y backend (@react-three/fiber, @react-three/drei, three, framer-motion, tailwindcss, @supabase/supabase-js, @tanstack/react-query, lucide-react).
Paso 3: Configurar clientes de Supabase y la tabla memories con sus políticas RLS.
Paso 4: Desarrollar el CelestialCanvas en Three.js con rotación de coordenadas según la fecha.
Paso 5: Implementar la línea de tiempo y la tarjeta de recuerdos con el tratamiento del primer beso (21 de septiembre).
Paso 6: Integrar el comando sudo admin en la consola secreta y la pantalla CRUD de administración.
