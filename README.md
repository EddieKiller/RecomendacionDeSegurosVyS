# Sistema de Recomendación de Seguros - Vida y Salud

### **Prompts**
- **Prompt1 (Estructura de Carpetas)**: Haz un refactor de modo que mi arquitectura quede con la siguiente estructura, añade los archivos vacíos y queda a la espera de las siguientes instrucciones

RecomendacionDeSegurosVyS/
├─ app/
│  ├─ cuestionario/page.tsx              # SSR: orquesta CU-2
│  ├─ recomendaciones/page.tsx           # SSR: orquesta CU-3/CU-4
│  └─ layout.tsx
├─ src/
│  ├─ application/
│  │  ├─ usecase/
│  │  │  ├─ GestionarCuestionario.ts     # CU-2 (RF-002): generación + adaptación + validación + edición
│  │  │  ├─ EvaluarPerfilRiesgo.ts       # CU-3 (RF-003)
│  │  │  └─ GenerarRecomendaciones.ts    # CU-4 (RF-003: ranking + justificabilidad)
│  │  └─ adapters/
│  │     ├─ repositorio/UsuarioRepoAdapter.ts
│  │     ├─ repositorio/CuestionarioRepoAdapter.ts
│  │     ├─ repositorio/CatalogoRepoAdapter.ts
│  │     └─ database/MySQLAdapter.ts
│  ├─ domain/
│  │  ├─ model/
│  │  │  ├─ Usuario.ts
│  │  │  ├─ Cuestionario.ts
│  │  │  ├─ Pregunta.ts
│  │  │  ├─ Respuesta.ts
│  │  │  ├─ PerfilRiesgo.ts
│  │  │  └─ Seguro.ts
│  │  └─ port/
│  │     ├─ repositorio/UsuarioRepository.ts
│  │     ├─ repositorio/CuestionarioRepository.ts
│  │     ├─ repositorio/CatalogoRepository.ts
│  │     └─ externo/RegistroCivilPort.ts  # (mockeado desde BD según restricciones)
│  ├─ infrastructure/repository/
│  │  ├─ UsuarioRepositoryDB.ts
│  │  ├─ CuestionarioRepositoryDB.ts
│  │  └─ CatalogoRepositoryDB.ts
│  └─ interfaces/presenters/              # (opcional) helpers para UI
├─ package.json
└─ tsconfig.json

- **Prompt 2(Generacion de codigo con contexto)**: Actúa como un arquitecto de software con 10 años de experiencia en diseño de sistemas, patrones de diseño y desarrollo full stack.

En base a la estructura del proyecto que ya tengo, lee todos los archivos que te entregué previamente y analiza cómo se relacionan las tecnologías con los patrones de diseño y con las distintas capas de la arquitectura.

Tu tarea será desarrollar todo el código del proyecto completo, manteniendo coherencia con la arquitectura existente.

Antes de generar cualquier código, primero debes:

Explicarme detalladamente cómo realizarás el trabajo.

Indicar qué restricciones tomarás en cuenta.

Describir los pasos específicos que seguirás para construir el proyecto de manera ordenada.

Una vez que presentes este plan, debes pedir mi permiso para continuar.
No avances a la generación de código hasta que yo lo autorice.

Contexto para este prompt: RF y RNF-002 + CasosDeUso.txt; Tecnologias a usar.txt; DiagramasMermaid.txt; PatronesDeDiseño.txt (ejemplos de uso); Preguntas Formulario.txt RefactorHexagonalBase.txt BDSeguros.sql



Sistema de recomendación de seguros utilizando **arquitectura hexagonal (Ports & Adapters)** con **Next.js 14** y **TypeScript**.

Este proyecto implementa un sistema que evalúa el perfil de riesgo de usuarios mediante cuestionarios adaptativos y genera recomendaciones personalizadas de seguros de vida y salud.

---

## **Objetivo**
Desarrollar un sistema inteligente de recomendación de seguros que:
- Genera cuestionarios adaptados al perfil del usuario
- Evalúa el perfil de riesgo basado en las respuestas
- Recomienda seguros con ranking y justificación
- Mantiene una arquitectura limpia, escalable y testeable

---

## **Estructura del proyecto**
```
RecomendacionDeSegurosVyS/
├─ app/
│  ├─ cuestionario/page.tsx              # SSR: orquesta CU-2
│  ├─ recomendaciones/page.tsx           # SSR: orquesta CU-3/CU-4
│  └─ layout.tsx
├─ src/
│  ├─ application/
│  │  ├─ usecase/
│  │  │  ├─ GestionarCuestionario.ts     # CU-2 (RF-002): generación + adaptación + validación + edición
│  │  │  ├─ EvaluarPerfilRiesgo.ts       # CU-3 (RF-003): evaluación de perfil
│  │  │  └─ GenerarRecomendaciones.ts    # CU-4 (RF-003): ranking + justificabilidad
│  │  └─ adapters/
│  │     ├─ repositorio/UsuarioRepoAdapter.ts
│  │     ├─ repositorio/CuestionarioRepoAdapter.ts
│  │     ├─ repositorio/CatalogoRepoAdapter.ts
│  │     └─ database/MySQLAdapter.ts
│  ├─ domain/
│  │  ├─ model/
│  │  │  ├─ Usuario.ts                   # Entidad: datos del usuario
│  │  │  ├─ Cuestionario.ts              # Entidad: cuestionario adaptativo
│  │  │  ├─ Pregunta.ts                  # Entidad: pregunta individual
│  │  │  ├─ Respuesta.ts                 # Entidad: respuesta del usuario
│  │  │  ├─ PerfilRiesgo.ts              # Entidad: evaluación de riesgo
│  │  │  └─ Seguro.ts                    # Entidad: producto de seguro
│  │  └─ port/
│  │     ├─ repositorio/UsuarioRepository.ts
│  │     ├─ repositorio/CuestionarioRepository.ts
│  │     ├─ repositorio/CatalogoRepository.ts
│  │     └─ externo/RegistroCivilPort.ts  # (mockeado desde BD según restricciones)
│  ├─ infrastructure/repository/
│  │  ├─ UsuarioRepositoryDB.ts          # Implementación con MySQL
│  │  ├─ CuestionarioRepositoryDB.ts     # Implementación con MySQL
│  │  └─ CatalogoRepositoryDB.ts         # Implementación con MySQL
│  └─ interfaces/presenters/             # Helpers opcionales para UI
├─ package.json
└─ tsconfig.json
```

---

## **Casos de uso implementados**

### **CU-2: Gestionar Cuestionario (RF-002)**
- **Responsabilidad:** Generar cuestionario base, adaptarlo según el perfil, validar respuestas y permitir edición
- **Ubicación:** `src/application/usecase/GestionarCuestionario.ts`
- **Página:** `app/cuestionario/page.tsx`

### **CU-3: Evaluar Perfil de Riesgo (RF-003)**
- **Responsabilidad:** Analizar respuestas del cuestionario y calcular nivel de riesgo
- **Ubicación:** `src/application/usecase/EvaluarPerfilRiesgo.ts`
- **Página:** `app/recomendaciones/page.tsx`

### **CU-4: Generar Recomendaciones (RF-003)**
- **Responsabilidad:** Crear ranking de seguros recomendados con justificación
- **Ubicación:** `src/application/usecase/GenerarRecomendaciones.ts`
- **Página:** `app/recomendaciones/page.tsx`

---

## **Explicación de cada capa**

### **app/ (Capa de presentación SSR)**
- **cuestionario/page.tsx**  
  Página Next.js que orquesta la gestión del cuestionario adaptativo.  
  **Responsabilidad:** renderizar UI y conectar con el caso de uso CU-2.

- **recomendaciones/page.tsx**  
  Página Next.js que muestra el perfil de riesgo y recomendaciones.  
  **Responsabilidad:** renderizar resultados de CU-3 y CU-4.

### **src/domain/ (Núcleo del negocio)**
- **model/**  
  Entidades del dominio con reglas de negocio:
  - `Usuario`: datos personales y demográficos
  - `Cuestionario`: conjunto de preguntas adaptativas
  - `Pregunta` y `Respuesta`: unidades del cuestionario
  - `PerfilRiesgo`: evaluación calculada
  - `Seguro`: productos del catálogo
  
- **port/**  
  Contratos (interfaces) que definen dependencias:
  - Repositorios para persistencia
  - Puerto externo para integración con Registro Civil (mockeado)

### **src/application/ (Lógica de aplicación)**
- **usecase/**  
  Casos de uso que implementan los requisitos funcionales.  
  **Responsabilidad:** orquestar la lógica sin depender de detalles técnicos.

- **adapters/**  
  Implementaciones que conectan con infraestructura.  
  **Responsabilidad:** aislar detalles técnicos (BD, APIs externas).

### **src/infrastructure/ (Detalles técnicos)**
- **repository/**  
  Implementaciones de repositorios con MySQL.  
  **Responsabilidad:** persistencia real de datos.

### **src/interfaces/ (Helpers UI)**
- **presenters/**  
  Utilidades opcionales para transformar datos del dominio a formato UI.

---

## **Principios aplicados**
- **SRP (Single Responsibility)**: Cada clase tiene una única razón para cambiar
- **DIP (Dependency Inversion)**: El dominio depende de abstracciones (ports), no de implementaciones
- **OCP (Open/Closed)**: Extensible sin modificar el core del dominio
- **Arquitectura hexagonal**: El dominio está aislado de frameworks y tecnologías externas

---

## **Instalación y ejecución**

1. Instala dependencias:
   ```bash
   pnpm install
   ```

2. Configura las variables de entorno (crear `.env.local`):
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/seguros_db"
   ```

3. Arranca el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```

4. Accede a las páginas:
   - Cuestionario: `http://localhost:3000/cuestionario`
   - Recomendaciones: `http://localhost:3000/recomendaciones`

---

## **Estado del proyecto**
- ✅ Estructura de arquitectura hexagonal implementada
- ⏳ Implementación de casos de uso en progreso
- ⏳ Integración con base de datos pendiente
- ⏳ UI y formularios pendientes

---

## **Próximos pasos**
- Implementar lógica de negocio en casos de uso
- Configurar conexión a MySQL
- Desarrollar formularios del cuestionario
- Implementar algoritmo de evaluación de riesgo
- Crear sistema de ranking de seguros
- Tests unitarios e integración
- Documentación de API interna
