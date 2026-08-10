Este es el combo de tecnologías seleccionado para cumplir con **todas** las características funcionales, de rendimiento móvil y de seguridad bancaria que definimos:

Plaintext

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (UI/UX)                          │
│ React.js / Next.js (App Router) + Tailwind CSS + Lucide Icons   │
│  • Enfoque Mobile-First, componentes táctiles rápidos.           │
│  • Capacidad PWA (Instalable como App nativa en el celular).    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND & AUTENTICACIÓN                        │
│ Next.js API Routes + NextAuth.js / Auth.js + Zod                │
│  • Middleware de Borde (Protección de rutas contra extraños).  │
│  • Tokens JWT en cookies HTTP-Only y SameSite=Strict.          │
│  • Validación estricta de tipos de datos de entrada.           │
└────────────────────────────────┬────────────────────────────────┘
                                 │ ORM: Prisma
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BASE DE DATOS & INFRAESTRUCTURA                 │
│ PostgreSQL Serverless en Neon.tech + Vercel Platform            │
│  • Conexión segura TLS 1.3 y datos encriptados en reposo.      │
│  • Despliegue automático desde GitHub.                         │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes del Stack Explicados

### 1. Frontend & Framework Principal: Next.js (React) + Tailwind CSS

- **¿Por qué este combo?** Next.js permite tener en **un solo repositorio y proyecto** tanto la interfaz gráfica (Frontend) como los endpoints de la API (Backend).
    
- **Tailwind CSS:** Indispensable para aplicar las reglas _Mobile-First_, logrando interfaces rápidas, responsivas y con botones aptos para ser presionados con el pulgar (_Thumb-Friendly_).
    

### 2. Autenticación y Seguridad: NextAuth.js + Zod

- **NextAuth.js (Auth.js):** Maneja la sesión de los empleados utilizando tokens JWT cifrados guardados en **cookies `HttpOnly` y `Secure`**. Nadie sin un usuario creado podrá ver la pantalla principal ni interactuar con la API.
    
- **Zod:** Librería de validación de esquema. Evita que envíen datos corruptos o ataques maliciosos desde los formularios del celular.
    

### 3. Base de Datos y Capa ORM: Neon.tech + Prisma ORM

- **Prisma ORM:** Actúa como el conector entre Next.js y PostgreSQL. Permite mapear fácilmente los precios por rodado, el stock, los usuarios y los detalles de las ventas escribiendo código TypeScript seguro (previniendo inyecciones SQL por completo).
    
- **Neon.tech (PostgreSQL):** Base de datos relacional serverless. Es 100% compatible con Vercel y maneja la encriptación bancaria de datos (AES-256).
    

### 4. Alojamiento e Infraestructura: Vercel + GitHub

- **GitHub (Repositorio Privado):** Todo el código fuente se guarda ahí.
    
- **Vercel:** Al conectar Vercel con GitHub, cada vez que hagas un cambio en el código, Vercel lo compila e implementa en segundos de forma automática.
    

## Hoja de Ruta Sugerida para el Desarrollo (Paso a Paso)

1. **Fase 1 (Setup e Infraestructura inicial):** Crear el proyecto en Next.js, conectar el repositorio de GitHub con Vercel y crear la base de datos vacía en Neon.tech.
    
2. **Fase 2 (Modelado de Base de Datos y Autenticación):** Escribir el esquema con Prisma (`schema.prisma`) con las tablas de usuarios, roles, ítems y ventas. Configurar el inicio de sesión.
    
3. **Fase 3 (Módulo de Catálogo y Modificación):** Programar la gestión de servicios/productos, la matriz de precios por rodado/medida y la carga de fotos.
    
4. **Fase 4 (Módulo de Ventas / Carrito Móvil):** Desarrollar la interfaz rápida para el celular con selección de rodado, carrito, medios de pago y descuento de stock en tiempo real.
    
5. **Fase 5 (Módulo de Informes Financieros):** Crear las consultas SQL/Prisma para los cierres de mes automáticos, desglose por productos/servicios y canales de cobro.