# GUÍA FRONTEND — ACTIVIDAD CULTURAL

> **Documento fuente de verdad del frontend.**
> Complementa a [`Backend/GUIA-BACKEND-ACTIVIDAD-CULTURAL.md`](../Backend/GUIA-BACKEND-ACTIVIDAD-CULTURAL.md), que sigue siendo la autoridad sobre reglas de negocio, contratos de la API y arquitectura general. Esta guía traduce ese contrato en pantallas, componentes y un sistema visual concretos. Ningún módulo de este frontend debe escribir directo a Supabase ni reinterpretar una regla financiera — todo pasa por la API REST del backend ya construido (`Backend/src`).

---

## 1. Descripción general

Interfaz web para que el personal del centro educativo controle la actividad cultural: buscar estudiantes, registrar pagos (cuota + anticipos + platos extra), generar/regenerar/escanear códigos QR, imprimir comprobantes y revisar el dashboard de ingresos. Un solo tipo de usuario (sin roles): cualquiera autenticado puede operar todos los módulos.

---

## 2. Objetivos

- Ofrecer una **capa visual delgada** sobre la API del backend — ninguna regla financiera se calcula ni se valida de forma autoritativa en el frontend (eso ya lo hace PostgreSQL vía RPC).
- Layout de **aplicación de gestión** (sidebar + topbar), no un sitio de marketing.
- Diseño **responsive**: utilizable desde una laptop en caja y desde un celular/tablet al momento de escanear QR en la entrada del evento.
- Paleta **corporativa azul/blanco**, con **color de botón según la acción** (ver sección 6) para que el personal nunca confunda "registrar pago" con "eliminar" o "regenerar QR".
- Consumir exactamente el contrato ya implementado y probado en `Backend/` (32 pruebas automatizadas pasando, endpoints verificados contra Supabase real).

---

## 3. Stack tecnológico

Obligatorio, ya acordado en la guía del backend (sección 2) y extendido aquí para el frontend:

- **React 18** + **Vite** (`npm create vite@latest -- --template react`)
- **Tailwind CSS** (utility-first, sin CSS-in-JS adicional)
- **React Router v6** — enrutamiento de módulos
- **TanStack Query (React Query)** — caché/estado de datos remotos (fetch, invalidación tras mutaciones, loading/error states). Evita reinventar manejo de caché a mano.
- **React Hook Form** + **Zod** — formularios y validación de UI (espejo, no reemplazo, de la validación del backend)
- **Axios** — cliente HTTP, con interceptor para adjuntar el JWT y mapear errores del formato `{success, message, error}` del backend
- **@supabase/supabase-js`** — **únicamente** para `auth.signInWithPassword` / manejo de sesión en el cliente si se decide loguear directo contra Supabase Auth en vez de `POST /api/auth/login` (ver sección 9). Nunca para `.from(...).insert/update/delete` en tablas financieras.
- **qrcode.react** o **`<img src={data:image/png;base64,...}>`** directo — el backend ya entrega el QR como imagen PNG en base64 (`qrImage`/`qr.image`); el frontend no necesita regenerar el dibujo, salvo que se prefiera renderizarlo client-side a partir del `qr_payload` (opcional).
- **html5-qrcode** (o **`@zxing/browser`**) — lectura de cámara para el módulo de escaneo de QR.
- **Bootstrap Icons** (paquete `bootstrap-icons`) — **toda** la iconografía de la app. Se instala solo la hoja de íconos (`bootstrap-icons/font/bootstrap-icons.css`), **no** el framework Bootstrap completo (evita que su CSS choque con las utilidades de Tailwind). Uso: `<i className="bi bi-credit-card" />`. **Prohibido usar emojis** en cualquier parte de la interfaz (sidebar, botones, badges, mensajes de estado, vacíos, etc.) — siempre un ícono de Bootstrap Icons en su lugar.
- **react-hot-toast** (o `sonner`) — notificaciones de éxito/error.
- Despliegue en **Vercel**.

No usar TypeScript salvo que se pida expresamente (mismo criterio que el backend).

---

## 4. Arquitectura

```text
React + Vite + Tailwind
          ↓
   Axios (cliente API)
          ↓
   API REST (Backend/, Render)
          ↓
      Supabase
```

Regla dura heredada del backend (sección 4 de esa guía): **prohibido**

```javascript
supabase.from('payments').insert(...)   // NUNCA desde React
```

Toda operación financiera (pagos, regeneración de QR, validación de QR) va **siempre**:

```text
Frontend → Backend Express (Render) → RPC PostgreSQL → Supabase
```

El frontend solo puede usar el cliente Supabase (si se usa) para autenticación; el resto de datos entra y sale exclusivamente por `VITE_API_URL`.

---

## 5. Layout general

Aplicación de una sola shell con **sidebar fijo** (colapsable en móvil) + **topbar** + área de contenido con scroll propio.

```text
┌─────────────┬──────────────────────────────────────────┐
│             │  Topbar: nombre app · usuario · logout    │
│   Sidebar   ├──────────────────────────────────────────┤
│  (navegación│                                            │
│   por       │        Contenido del módulo activo         │
│   módulo)   │        (scroll independiente)              │
│             │                                            │
└─────────────┴──────────────────────────────────────────┘
```

- **Desktop (≥1024px):** sidebar fijo visible, 240–280px de ancho.
- **Tablet (640–1023px):** sidebar colapsado a solo íconos, expandible.
- **Móvil (<640px):** sidebar oculto por defecto, se abre como drawer/overlay desde un botón hamburguesa en el topbar. El módulo de **Escanear QR** debe ser usable a pantalla completa en este breakpoint, ya que es el caso de uso más probable en móvil.

Ítems del sidebar (uno por módulo, sección 7):

| Ícono (Bootstrap Icons) | Módulo |
|---|---|
| `bi-speedometer2` | Dashboard |
| `bi-mortarboard` | Estudiantes |
| `bi-credit-card` | Pagos |
| `bi-qr-code` | Código QR |
| `bi-receipt` | Comprobantes |
| `bi-camera` | Escanear QR |

Cada ítem resalta con el color primario cuando su ruta está activa (`bg-blue-50 text-blue-700 border-l-4 border-blue-600` o equivalente).

---

## 6. Sistema de diseño

### 6.1 Paleta base (corporativa azul/blanco)

| Token | Valor sugerido (Tailwind) | Uso |
|---|---|---|
| `brand-50` … `brand-900` | escala de `blue-*` de Tailwind | Sidebar activo, enlaces, foco de inputs, encabezados de tarjetas |
| Fondo de app | `bg-slate-50` | Fondo general del área de contenido |
| Superficie/tarjeta | `bg-white` | Tarjetas, tablas, modales |
| Texto principal | `text-slate-900` | Títulos |
| Texto secundario | `text-slate-500` | Descripciones, metadatos |
| Bordes | `border-slate-200` | Separadores, bordes de tarjeta |

El azul (`blue-600`/`blue-700`) es el color de marca: topbar, sidebar activo, enlaces, foco de formularios. El blanco/gris claro domina el fondo — esto es una herramienta de trabajo, no una landing page: prioriza legibilidad y densidad de datos sobre decoración.

### 6.2 Botones por acción (regla explícita del usuario — no mezclar)

Cada botón se colorea según **lo que hace**, no según su jerarquía visual. Definir estas variantes una sola vez como componente `<Button variant="..." />` y prohibir estilos de botón ad-hoc fuera de él:

| Variante | Color | Cuándo usarla |
|---|---|---|
| `primary` | `bg-blue-600 hover:bg-blue-700 text-white` | Navegación principal, "Ver detalle", "Buscar", acciones neutras por defecto |
| `success` | `bg-emerald-600 hover:bg-emerald-700 text-white` | **Registrar pago**, confirmar, guardar cambios exitosos |
| `warning` | `bg-amber-500 hover:bg-amber-600 text-white` | **Regenerar QR** (invalida el anterior — requiere atención), reimprimir |
| `danger` | `bg-red-600 hover:bg-red-700 text-white` | Cancelar una operación en curso, cerrar sesión, cualquier acción destructiva o irreversible |
| `secondary` | `bg-white border border-slate-300 text-slate-700 hover:bg-slate-50` | "Cancelar", "Volver", acciones neutras secundarias dentro de un modal |
| `ghost` | `text-blue-600 hover:bg-blue-50` | Acciones terciarias/enlaces dentro de tablas (ej. "Ver comprobante") |

Estados: `disabled` con `opacity-50 cursor-not-allowed`; todo botón que dispare una llamada a la API muestra un spinner inline y se deshabilita mientras la petición está en curso (evita doble submit de pagos — crítico, ver sección 11).

### 6.3 Badges de estado

| Estado | Clase |
|---|---|
| `estado_cuota: PAGADA` | `bg-emerald-100 text-emerald-800` |
| `estado_cuota: PENDIENTE` | `bg-amber-100 text-amber-800` |
| QR `activo: true` | `bg-emerald-100 text-emerald-800` ("QR vigente") |
| QR `activo: false` | `bg-slate-200 text-slate-600` ("QR reemplazado") |
| Validación `es_valido: true` | fondo verde a pantalla completa en el módulo de escaneo |
| Validación `es_valido: false` | fondo rojo a pantalla completa en el módulo de escaneo |

### 6.4 Tipografía y espaciado

- Fuente del sistema (`font-sans` de Tailwind) — sin cargar fuentes externas, mantiene el bundle liviano.
- Escala de texto: `text-2xl font-semibold` para títulos de módulo, `text-sm text-slate-500` para metadatos, `text-base` para contenido de tabla.
- Radios: `rounded-lg` en tarjetas/botones/inputs, consistente en toda la app.
- Sombra sutil (`shadow-sm`) en tarjetas; nunca sombras pesadas — es una app de gestión, no un dashboard "gamer".

### 6.5 Iconografía

**Bootstrap Icons únicamente — cero emojis en toda la interfaz.** Ni en el sidebar, ni en botones, ni en badges de estado, ni en mensajes de éxito/error, ni en estados vacíos ("sin resultados"). Un emoji se ve distinto según el sistema operativo/navegador del usuario y rompe la consistencia visual corporativa; un ícono de Bootstrap Icons es un SVG/glifo controlado que siempre se ve igual.

```jsx
// Correcto
<i className="bi bi-credit-card text-blue-600" />

// Prohibido
<span>💳</span>
```

Tamaño por contexto: `text-base` (íconos inline en botones/tablas), `text-xl` (encabezados de tarjeta/sidebar), `text-5xl` o mayor (resultado a pantalla completa del escaneo de QR, sección 7.6).

---

## 7. Módulos (uno por funcionalidad del backend)

Cada módulo mapea 1:1 con un grupo de endpoints ya construido y probado. No inventar módulos ni pantallas que no tengan un endpoint real detrás.

### 7.1 Autenticación — `/login`

- Formulario email + password → `POST /api/auth/login` (o `supabase.auth.signInWithPassword`, ver sección 9).
- Guarda `access_token` (sesión), redirige a `/dashboard`.
- Botón "Ingresar" = variante `primary`.
- Sin registro público: los usuarios se crean por fuera (Supabase Auth), coherente con la sección 5 de la guía del backend ("no existen roles", "no crear tabla propia de usuarios").

### 7.2 Dashboard — `/dashboard`

Fuente: `GET /api/dashboard`, `GET /api/dashboard/daily`, `GET /api/dashboard/by-grade`.

- Fila de **tarjetas KPI** (grid responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`): Ingresos totales, Ingresos por cuota, Ingresos por platos extra, Saldo pendiente, Cuotas completas / pendientes, Platos totales habilitados, Transacciones.
- **Gráfico de ingresos diarios** (línea o barras) desde `daily`.
- **Tabla/gráfico de ingresos por grado** desde `byGrade`.
- Filtros de fecha (`fecha_inicio`, `fecha_fin`) — inputs tipo `date`, botón `primary` "Aplicar filtro".
- Todos los números vienen ya calculados por PostgreSQL — el frontend solo formatea (moneda `Q`, separadores de miles), nunca sumariza pagos por su cuenta.

### 7.3 Estudiantes — `/estudiantes`

Fuente: `GET /api/students?search=&grado=`, `GET /api/students/:id`, `GET /api/students/:id/account`.

- Barra de búsqueda (debounce ~300ms) que filtra por `search` (nombre/apellidos/grado) + selector de `grado`.
- Tabla responsive (en móvil, colapsa a tarjetas apiladas): Nombre, Apellidos, Grado, badge de estado de cuota (requiere una consulta adicional a `/account` o precargarla — ver nota de rendimiento abajo), botón `ghost` "Ver cuenta".
- **Detalle de estudiante** (`/estudiantes/:id`): datos personales + tarjeta de estado de cuenta (`cuota_pagada`/`cuota_base`, barra de progreso, `saldo_cuota`, `total_platos`, badge de `estado_cuota`) + botón `success` **"Registrar pago"** (abre el módulo 7.4) + botón `primary` "Ver QR actual" + tabla de historial de pagos (`GET /api/students/:studentId/payments`).
- Nota de rendimiento: no llamar a `/account` por cada fila de la tabla general (N+1). La tabla de listado solo muestra datos de `students`; el estado de cuenta se consulta al entrar al detalle.

### 7.4 Pagos — formulario dentro del detalle de estudiante, o `/pagos/nuevo?studentId=`

Fuente: `POST /api/payments`.

Formulario:
- Estudiante (preseleccionado si viene de la ficha del estudiante; si no, buscador tipo autocomplete reutilizando 7.3).
- Monto de cuota (`montoCuota`) — input numérico, **el frontend puede sugerir** el máximo permitido (`saldo_cuota` de la cuenta) como placeholder/ayuda, pero **nunca** bloquea ni recalcula el límite real: eso lo hace PostgreSQL. Mostrar el error `409` tal cual lo devuelve el backend ("El monto excede el saldo pendiente. Saldo disponible: Q…") si ocurre.
- Cantidad de platos extra (`cantidadPlatosExtra`) — input numérico, default 0. El precio (`Q40`) se muestra solo como referencia visual tomada de la respuesta de la actividad activa (`GET /api/activities/active`), nunca hardcodeado ni enviado como parte del cálculo.
- Método de pago (`metodoPago`) — select (`EFECTIVO`, `TARJETA`, u otros que se definan).
- Observaciones — textarea opcional.
- Botón **`success`** "Registrar pago" — deshabilitado mientras la petición está en curso.

Al confirmar con éxito: mostrar de inmediato (misma pantalla o modal) el resumen que ya devuelve el RPC (`pago_actual`, `estado_cuenta`, `numero_comprobante`) + el QR recién generado (`qr.payload`/imagen si se decide pintarlo aquí) + botones `primary` "Ver comprobante" y `secondary` "Registrar otro pago".

### 7.5 Código QR — `/estudiantes/:id/qr` (o pestaña dentro del detalle)

Fuente: `GET /api/qr/:accountId/current`, `GET /api/qr/:accountId/history`, `POST /api/qr/:accountId/regenerate`.

- Imagen del QR grande y centrada (`qr.qrImage`, ya viene en base64 desde el backend — un `<img>` simple, sin librería adicional).
- Debajo: versión actual, cantidad de generaciones, badge "QR vigente".
- Botón **`warning`** "Regenerar QR" → modal de confirmación (acción irreversible: invalida el anterior) → al confirmar, refresca la imagen.
- Tabla de historial (`v_historial_qr`): versión, generado el, invalidado el, badge activo/inactivo.

### 7.6 Escanear QR — `/qr/escanear`

- Vista a pantalla completa en móvil (es el caso de uso principal).
- Lector de cámara (`html5-qrcode`) que captura el `token` del QR escaneado.
- Llama a `POST /api/qr/validate { token }`.
- Resultado **grande, imposible de malinterpretar**:
  - `es_valido: true` → pantalla/tarjeta verde, ícono `bi-check-circle-fill` grande, nombre del estudiante, grado, `total_platos`, `estado_cuota`.
  - `es_valido: false` → pantalla/tarjeta roja, ícono `bi-x-circle-fill` grande, mensaje exacto del backend (ej. "Fue reemplazado por una versión más reciente" / "QR inexistente").
- Botón `primary` "Escanear otro" reinicia la cámara.
- Nunca decidir válido/inválido en el frontend a partir del contenido leído del QR — siempre esperar la respuesta de `/api/qr/validate` (regla de la guía del backend, sección 16).

### 7.7 Comprobantes — `/pagos/:paymentId/comprobante`

Fuente: `GET /api/payments/:id/receipt`.

- Renderiza **dos copias visuales idénticas** una debajo de la otra (o en pestañas): "COPIA CONTRIBUYENTE" / "COPIA REGISTRO" — el array `copias` que ya entrega el backend indica los dos encabezados a usar. Un solo objeto de datos, nunca dos llamadas ni dos registros.
- Layout tipo recibo angosto (`max-w-md`), pensado para imprimirse (`@media print` en Tailwind: ocultar sidebar/topbar, forzar fondo blanco).
- Muestra todos los campos de la sección 18 de la guía del backend: número de comprobante, actividad, fecha, estudiante, grado, monto de cuota, platos extra + precio + total, total recibido, cuota acumulada, saldo pendiente, estado de cuota, total de platos, QR (si `activo`, con imagen; si no, la nota que ya entrega el backend), usuario que registró.
- Botón **`primary`** "Imprimir" (`window.print()`).

---

## 8. Estructura de carpetas

```text
frontend/
│
├── src/
│   ├── api/
│   │   ├── client.js              # instancia de Axios + interceptores (JWT, errores)
│   │   ├── auth.api.js
│   │   ├── students.api.js
│   │   ├── payments.api.js
│   │   ├── qr.api.js
│   │   ├── receipts.api.js
│   │   ├── activities.api.js
│   │   └── dashboard.api.js
│   │
│   ├── hooks/                     # hooks de React Query por dominio
│   │   ├── useAuth.js
│   │   ├── useStudents.js
│   │   ├── usePayments.js
│   │   ├── useQr.js
│   │   ├── useReceipt.js
│   │   └── useDashboard.js
│   │
│   ├── components/
│   │   ├── ui/                    # Button, Card, Badge, Modal, Table, Input, Select, Spinner, Toast
│   │   ├── layout/                # Sidebar, Topbar, AppShell, MobileDrawer
│   │   └── shared/                # EstadoCuotaBadge, QrImage, MoneyDisplay, DateFilter
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── StudentsListPage.jsx
│   │   ├── StudentDetailPage.jsx
│   │   ├── PaymentFormPage.jsx
│   │   ├── QrCurrentPage.jsx
│   │   ├── QrScanPage.jsx
│   │   └── ReceiptPage.jsx
│   │
│   ├── routes/
│   │   ├── AppRouter.jsx
│   │   └── ProtectedRoute.jsx     # exige sesión válida, si no -> /login
│   │
│   ├── context/
│   │   └── AuthContext.jsx        # usuario actual, token, login/logout
│   │
│   ├── lib/
│   │   ├── supabaseClient.js      # solo para Auth (ver sección 9)
│   │   ├── formatters.js          # moneda, fechas
│   │   └── constants.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

Regla de separación: **`pages/` orquesta, `components/` presenta, `hooks/` habla con `api/`**. Ninguna page hace `fetch`/`axios` directo — siempre a través de un hook.

---

## 9. Autenticación en el frontend

Dos caminos válidos, ambos ya soportados por el backend (sección 6 de su guía: "Supabase Auth directo o vía endpoint del backend"). **Elegir uno y ser consistente**; se recomienda:

- **Login:** `POST /api/auth/login` (el backend ya lo expone y ya devuelve `{user, session:{access_token, refresh_token, expires_at}}`) — evita instanciar el cliente Supabase en el navegador solo para esto.
- **Sesión:** guardar `access_token` en memoria (`AuthContext`) + `sessionStorage`/`localStorage` para persistir entre recargas. Adjuntarlo en cada request:

```javascript
// src/api/client.js
axiosInstance.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

- **Expiración/401:** interceptor de respuesta que, ante un `401`, limpia la sesión y redirige a `/login`.
- **Logout:** `POST /api/auth/logout` (revoca la sesión en el servidor, ya verificado en el backend) + limpiar el storage local.
- **Rutas protegidas:** `ProtectedRoute` envuelve todo el `AppShell`; sin sesión válida, redirige a `/login` antes de montar cualquier módulo.

No hay pantalla de "registro" ni de "recuperar contraseña" en el alcance actual — los usuarios se administran fuera de la app (Supabase Auth), igual que en el backend.

---

## 10. Capa de integración con la API

### 10.1 Mapa de endpoints

Los **17 endpoints** ya construidos y probados en `Backend/` (32 pruebas automatizadas pasando). Ninguno de estos se reinventa ni se llama con una ruta distinta a la real; todos exigen `Authorization: Bearer <token>` salvo el login.

| Método | Endpoint | Archivo API (`src/api/`) | Módulo (sección 7) |
|---|---|---|---|
| `POST` | `/api/auth/login` | `auth.api.js` | 7.1 Autenticación |
| `GET` | `/api/auth/me` | `auth.api.js` | 7.1 Autenticación (verificación de sesión) |
| `POST` | `/api/auth/logout` | `auth.api.js` | 7.1 Autenticación (logout en topbar) |
| `GET` | `/api/activities/active` | `activities.api.js` | 7.4 Pagos (referencia de cuota/precio de extra) |
| `GET` | `/api/students?search=&grado=` | `students.api.js` | 7.3 Estudiantes (listado) |
| `GET` | `/api/students/:id` | `students.api.js` | 7.3 Estudiantes (detalle) |
| `GET` | `/api/students/:id/account` | `students.api.js` | 7.3 Estudiantes (estado de cuenta) |
| `GET` | `/api/students/:studentId/payments` | `payments.api.js` | 7.3 Estudiantes (historial de pagos) |
| `POST` | `/api/payments` | `payments.api.js` | 7.4 Pagos (registrar) |
| `GET` | `/api/payments/:id` | `payments.api.js` | 7.4 Pagos (detalle) |
| `GET` | `/api/payments/:id/receipt` | `receipts.api.js` | 7.7 Comprobantes |
| `GET` | `/api/qr/:accountId/current` | `qr.api.js` | 7.5 Código QR (actual) |
| `GET` | `/api/qr/:accountId/history` | `qr.api.js` | 7.5 Código QR (historial) |
| `POST` | `/api/qr/:accountId/regenerate` | `qr.api.js` | 7.5 Código QR (regenerar) |
| `POST` | `/api/qr/validate` | `qr.api.js` | 7.6 Escanear QR |
| `GET` | `/api/dashboard` | `dashboard.api.js` | 7.2 Dashboard (totales) |
| `GET` | `/api/dashboard/daily?fecha_inicio=&fecha_fin=` | `dashboard.api.js` | 7.2 Dashboard (ingresos diarios) |
| `GET` | `/api/dashboard/by-grade?grado=` | `dashboard.api.js` | 7.2 Dashboard (ingresos por grado) |

Todas las rutas son relativas a `VITE_API_URL` (sección 13) — nunca hardcodear `http://localhost:3000` dentro de un `api/*.api.js`, siempre a través de la instancia de `apiClient`.

### 10.2 Cliente y hooks

Un archivo `api/*.api.js` por dominio, cada función retorna directamente `response.data.data` (ya desenvuelto del sobre `{success, message, data}`):

```javascript
// src/api/payments.api.js
import { apiClient } from './client';

export async function createPayment(payload) {
  const { data } = await apiClient.post('/payments', payload);
  return data.data; // { ok, qr, pago_actual, estado_cuenta, payment_id, numero_comprobante, ... }
}

export async function getPaymentReceipt(paymentId) {
  const { data } = await apiClient.get(`/payments/${paymentId}/receipt`);
  return data.data.receipt;
}
```

Los hooks de React Query envuelven esto:

```javascript
// src/hooks/usePayments.js
export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: (result) => {
      queryClient.invalidateQueries(['student-account', result.student_id]);
      queryClient.invalidateQueries(['student-payments', result.student_id]);
    },
  });
}
```

Manejo de errores centralizado: el interceptor de Axios normaliza cualquier `4xx/5xx` a un objeto `{ status, message }` tomando `error.response.data.message` (el backend ya entrega mensajes en español listos para mostrar — ver sección 26 de la guía del backend), y los componentes lo muestran vía toast o inline en el formulario según el código:

| Código | Tratamiento en UI |
|---|---|
| `401` | Redirigir a `/login` (sesión inválida/expirada) |
| `404` | Mensaje inline "No encontrado" / redirigir a listado |
| `409` | Mensaje inline en el formulario (conflicto de negocio, ej. saldo excedido) — **no** es un error técnico, es información para el usuario |
| `422` | Errores de validación bajo cada campo del formulario |
| `500` | Toast genérico "Ocurrió un error, intenta de nuevo" |

---

## 11. Estado y reglas de UX críticas

- **No doble submit:** todo botón de mutación (`registrar pago`, `regenerar QR`) se deshabilita apenas se hace clic y hasta que la petición resuelve. Un doble clic en "Registrar pago" nunca debe poder disparar dos `POST /api/payments`.
- **Optimistic UI: NO** para pagos ni QR — son operaciones financieras/de acceso; esperar siempre la confirmación del backend antes de actualizar la UI como exitosa.
- **Invalidación de caché:** tras un pago exitoso, invalidar el estado de cuenta, el historial de pagos, el QR actual y los totales del dashboard del estudiante afectado (React Query `invalidateQueries`).
- **Confirmación explícita** antes de acciones con efecto irreversible visible al usuario: regenerar QR (invalida el anterior) y logout.

---

## 12. Responsive

- Enfoque **mobile-first** con utilidades de Tailwind (`sm:`, `md:`, `lg:`).
- Tablas: en `<640px` se transforman en listas de tarjetas (cada fila → una tarjeta con pares etiqueta/valor), nunca scroll horizontal forzado de una tabla ancha sin envoltura.
- El módulo de **Escanear QR** (7.6) es el único que puede ir a pantalla completa sin sidebar en móvil (mejor uso del viewport para la cámara).
- Formularios: una columna en móvil, dos columnas en `md:` en adelante para campos cortos (monto, método de pago).
- Todos los modales usan `max-w-md` con márgenes laterales en móvil (`mx-4`), nunca ocupan el 100% del ancho sin padding.

---

## 13. Variables de entorno

```env
VITE_API_URL=http://localhost:3000/api

# Solo si se opta por login directo con Supabase Auth (ver sección 9)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

En producción, `VITE_API_URL` apunta al backend desplegado en Render (`https://<tu-servicio>.onrender.com/api`). **Nunca** incluir `SUPABASE_SERVICE_ROLE_KEY` en el frontend — ni siquiera la `anon key` debe usarse para tocar tablas financieras directamente (sección 4).

---

## 14. Despliegue en Vercel

- Proyecto Vite estándar: build command `npm run build`, output `dist/`.
- Variable de entorno `VITE_API_URL` configurada en el panel de Vercel apuntando al backend en Render.
- El backend ya tiene `FRONTEND_URL` como variable de CORS (sección 24 de la guía del backend) — actualizarla con el dominio real de Vercel antes de ir a producción, o las peticiones fallarán por CORS.
- Sin variables sensibles en el bundle del frontend (todo lo que empiece con `VITE_` termina expuesto en el cliente — nunca poner ahí una service role key ni ningún secreto).

---

## 15. Reglas que no deben romperse

Espejo, a nivel de frontend, de la sección 33/35 de la guía del backend:

1. El frontend **nunca** escribe pagos, QR ni comprobantes directo en Supabase.
2. El precio del plato extra, el límite de Q150 y el estado de la cuota **siempre** se leen de la respuesta del backend — nunca se recalculan ni se hardcodean en el frontend.
3. El token de QR escaneado **siempre** se valida contra `POST /api/qr/validate` — nunca se confía en el contenido leído del QR para decidir válido/inválido.
4. No hay pantallas ni lógica de roles — un solo tipo de usuario ve y hace todo.
5. Los botones de acción respetan el mapeo de color de la sección 6.2 sin excepciones (no usar rojo para "guardar" ni verde para "eliminar").
6. Ninguna page llama a `axios`/`fetch` directamente — siempre a través de `api/*.api.js` + hooks.
7. No agregar módulos/pantallas sin un endpoint real en el backend que los respalde.
8. Mantener Vite + Tailwind + React Router; no introducir un framework de UI pesado (Material UI, Ant Design) que contradiga el sistema de diseño de la sección 6 sin autorización explícita.
9. **Cero emojis en la interfaz.** Toda la iconografía se resuelve con Bootstrap Icons (`bi-*`), como se define en la sección 6.5.

---

## 16. Checklist final

- [ ] `AppShell` con sidebar responsive (fijo en desktop, drawer en móvil) y topbar con logout.
- [ ] Login funcional contra `POST /api/auth/login`, con `ProtectedRoute` cubriendo el resto de la app.
- [ ] Dashboard con KPIs, gráfico diario y tabla por grado, con filtro de fechas.
- [ ] Listado de estudiantes con búsqueda + filtro de grado, y ficha de detalle con estado de cuenta.
- [ ] Formulario de pago con los 4 campos del contrato (`montoCuota`, `cantidadPlatosExtra`, `metodoPago`, `observaciones`), manejo explícito del error `409`.
- [ ] Vista de QR actual + historial + regenerar (con confirmación).
- [ ] Escaneo de QR a pantalla completa en móvil, resultado visual inequívoco (verde/rojo).
- [ ] Comprobante con las dos copias, listo para imprimir.
- [ ] Sistema de botones por color de acción aplicado sin excepciones.
- [ ] Iconografía 100% Bootstrap Icons — verificado que no quede ningún emoji en la interfaz.
- [ ] Responsive verificado en los tres breakpoints (móvil/tablet/desktop).
- [ ] `VITE_API_URL` configurada y `FRONTEND_URL` del backend actualizada antes de desplegar a Vercel.
