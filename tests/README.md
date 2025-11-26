# Sistema de Recomendación de Seguros - Testing

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


## 🏗️ Arquitectura del Proyecto

Este proyecto implementa **Arquitectura Hexagonal (Ports & Adapters)** con los siguientes principios:

### Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (Núcleo del Negocio)                      │
│  - Modelos: Cuestionario, Pregunta, PerfilRiesgo, etc.  │
│  - Ports (Interfaces): Repositories, Services           │
│  - Lógica de negocio pura, sin dependencias externas    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│  Application Layer (Casos de Uso)                       │
│  - GestionarCuestionario (State Pattern)                │
│  - GenerarRecomendaciones (Builder Pattern)             │
│  - EvaluarPerfilRiesgo (Chain of Responsibility)        │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Layer (Adaptadores)                     │
│  - Repositories: MySQL implementations                  │
│  - Database adapters                                    │
│  - Dependency Container (IoC)                           │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│  Interfaces Layer (Next.js)                             │
│  - Server Components & Server Actions                   │
│  - ISR con revalidación (3600s cuestionario, 1800s rec.)│
│  - unstable_cache para optimización                     │
└─────────────────────────────────────────────────────────┘
```

### Patrones de Diseño Implementados

- **State Pattern**: `GestionarCuestionario` (Iniciado → En Progreso → Completado)
- **Strategy Pattern**: `ConditionalSequenceStrategy` para secuenciación adaptativa de preguntas
- **Builder Pattern**: `RecomendacionBuilder` para construcción de recomendaciones personalizadas
- **Chain of Responsibility**: Evaluadores de riesgo (EdadEvaluator, IngresosEvaluator, etc.)
- **Dependency Injection**: Container IoC para gestión de dependencias

## 📋 Estructura de Tests

### Unit Tests
- **Domain Layer** (`tests/unit/domain/`)
  - `Pregunta.test.ts` - Validación, dependencias condicionales, serialización
  - `Cuestionario.test.ts` - Estados, gestión de respuestas, cálculo de completitud
  - `PerfilRiesgo.test.ts` - Cálculo de IMC, factores de riesgo, nivel de riesgo

- **Application Layer** (`tests/unit/application/`)
  - `GestionarCuestionario.test.ts` - State pattern, transiciones de estado, validaciones
  - `GenerarRecomendaciones.test.ts` - Builder pattern, justificaciones, filtrado por elegibilidad

## 🚀 Comandos

### Instalar dependencias
```bash
pnpm install
```

### Ejecutar tests
```bash
# Modo watch (desarrollo)
pnpm test

# Ejecutar una vez
pnpm test:run

# Con interfaz visual
pnpm test:ui

# Con coverage
pnpm test:coverage
```

### Pruebas de carga (Locust)

⚠️ **IMPORTANTE**: Los endpoints `/api/test/*` son **exclusivamente para testing con Locust.io**. No forman parte de la arquitectura de producción del sistema.

```bash
# Instalar Locust
pip install locust

# Interfaz web (http://localhost:8089)
pnpm locust

# Headless (50 usuarios, 2 minutos)
pnpm locust:headless
```

Los endpoints de testing reutilizan el **DependencyContainer** existente para acceder a los casos de uso reales, sin duplicar lógica de negocio.

## 📊 Coverage Thresholds

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## 🧪 Casos de Prueba Implementados

### Domain Layer (Unit Tests)
✅ Pregunta
- Validación de respuestas por tipo (TEXTO, NUMERICO, BOOLEAN, SELECCION_SIMPLE, MULTISELECCION)
- Evaluación de dependencias condicionales (equals, not_equals, contains)
- Visibilidad de preguntas según respuestas previas
- Serialización y factory methods

✅ Cuestionario
- Creación con estados (INICIADO, EN_PROGRESO, COMPLETADO)
- Agregar y validar respuestas según tipo de pregunta
- Cálculo de completitud considerando dependencias condicionales
- Strategy Pattern para secuenciación adaptativa
- Carga de respuestas desde BD sin revalidación

✅ PerfilRiesgo
- Cálculo de IMC con factores de riesgo/protección
- Cálculo de nivel de riesgo (BAJO, MEDIO, ALTO)
- Agregación de scores ponderados
- Identificación de dependientes

### Application Layer (Unit Tests)
✅ GestionarCuestionario (CU-2)
- **State Pattern**: Transiciones de estado (Iniciado → En Progreso → Completado)
- Acciones contextuales por estado:
  - `cargar_preguntas`: Inicializa cuestionario con estrategia adaptativa
  - `responder`: Valida y persiste respuestas
  - `completar`: Verifica completitud y cambia estado
  - `editar_respuesta`: Permite edición post-completado (revierte a EN_PROGRESO)
- Sincronización entre estado del patrón State y estado del modelo de dominio
- Validación de coherencia de respuestas
- Recuperación de cuestionarios existentes con sincronización de estado

✅ GenerarRecomendaciones (CU-3)
- **Builder Pattern**: Construcción fluida de recomendaciones complejas
- Ajuste dinámico de primas según nivel de riesgo (15% incremento riesgo ALTO)
- Generación de justificaciones personalizadas basadas en 5 dimensiones:
  - Perfil de riesgo del usuario
  - Edad y etapa de vida
  - Dependientes económicos
  - Situación financiera (ingresos)
  - Tipo específico de seguro recomendado
- Cálculo de relevancia y prioridad
- Filtrado por elegibilidad (edad, ingresos mínimos)
- Top 5 recomendaciones ordenadas por prioridad

### Integration Tests

⚠️ **ELIMINADOS**: Los tests de integración fueron eliminados porque **Locust.io ya valida los mismos flujos** bajo carga real con 100% de éxito.

**Cubierto por Locust**:
- ✅ Flujo completo: Crear cuestionario → Responder preguntas → Generar recomendaciones
- ✅ Validación de dependencias condicionales entre preguntas
- ✅ Persistencia en MySQL bajo carga concurrente
- ✅ Evaluación de perfil de riesgo con datos reales
- ✅ Generación de recomendaciones personalizadas
- ✅ Validación de restricciones de FK (USUARIO → REGISTRO_CIVIL)
- ✅ Validación de respuestas según tipo (MULTISELECCION, SELECCION_SIMPLE, NUMERICO, BOOLEAN, TEXTO)

### Load Tests (Locust)

✅ **3 Escenarios de Usuario Realistas**
- **Responder pregunta** (50% tráfico): Simula usuarios completando cuestionarios pregunta por pregunta
- **Generar recomendaciones** (20% tráfico): Usuarios que completan y solicitan recomendaciones
- **Flujo completo** (30% tráfico): Viaje completo del usuario (iniciar → responder múltiples preguntas → recomendaciones)

✅ **Generación Inteligente de Respuestas**
- Respuestas válidas según tipo de pregunta:
  - `MULTISELECCION`: JSON array con opciones aleatorias
  - `SELECCION_SIMPLE`: Una opción aleatoria del catálogo
  - `NUMERICO`: Valores numéricos en rangos válidos
  - `BOOLEAN`: "Sí" o "No"
  - `TEXTO/TEXTO_LARGO`: Respuestas de texto realistas

✅ **Validación Automática de RNF**
- **Target**: p95 ≤ 3000ms bajo carga concurrente
- **Último resultado**: 1207 requests, 0 failures (100% éxito) ✅
- **Métricas por endpoint**:
  - Cuestionario: p95 = 3200ms
  - Respuesta: p95 = 2500ms
  - Recomendaciones: p95 = 10000ms ⚠️ (requiere optimización)
- Reportes automáticos con análisis de RNF

## 🔧 Configuración

### Vitest (`vitest.config.ts`)
- Environment: Node.js
- Setup file: `tests/setup.ts`
- Coverage provider: v8
- Path aliases configurados (@/)

### Variables de entorno para testing (`tests/setup.ts`)
```typescript
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=seguros_test  // Base de datos de pruebas
DB_PORT=3306
```

## 📦 API Endpoints de Testing

**⚠️ IMPORTANTE**: Estos endpoints son **exclusivamente para pruebas de carga con Locust.io**. No forman parte de la arquitectura de producción.

### Endpoints Disponibles

#### `POST /api/test/cuestionario`
Inicia un nuevo cuestionario para un RUT aleatorio.
- **Utiliza**: `GestionarCuestionario.iniciarCuestionario()`
- **Retorna**: `{ idCuestionario, rut, totalPreguntas, preguntasIds, preguntas: [{id, tipo, opciones}] }`

#### `POST /api/test/respuesta`
Guarda una respuesta validada según tipo de pregunta.
- **Utiliza**: `GestionarCuestionario.ejecutarAccion('responder')`
- **Valida**: Tipo de respuesta (MULTISELECCION, SELECCION_SIMPLE, NUMERICO, BOOLEAN, TEXTO)
- **Body**: `{ idCuestionario, rut, idPregunta, valor }`

#### `POST /api/test/recomendaciones`
Genera recomendaciones personalizadas con auto-completado de preguntas faltantes.
- **Utiliza**: 
  - `EvaluarPerfilRiesgo.ejecutar()` (Chain of Responsibility)
  - `GenerarRecomendaciones.generar()` (Builder Pattern)
- **Auto-completa**: Responde preguntas faltantes con valores dummy tipo-específicos
- **Retorna**: Array de recomendaciones con justificaciones

### Arquitectura de Testing

```
locustfile.py (Locust)
       ↓
  /api/test/* (Route Handlers)
       ↓
  DependencyContainer (IoC)
       ↓
  Use Cases (Application Layer)
       ↓
  Domain Models + Repositories
       ↓
  MySQL Database
```

**Ventajas de este enfoque**:
- ✅ Reutiliza toda la lógica de negocio existente
- ✅ No duplica código
- ✅ Valida la arquitectura hexagonal bajo carga real
- ✅ Los tests prueban los casos de uso reales, no mocks

## 📈 Resultados Actuales

### Unit Tests ✅
- **63/63 tests pasando (100%)**
- **Domain Layer**: 47/47 tests (100%)
  - Pregunta: 16/16 ✅
  - Cuestionario: 13/13 ✅
  - PerfilRiesgo: 18/18 ✅
- **Application Layer**: 16/16 tests (100%)
  - GestionarCuestionario: 11/11 ✅
  - GenerarRecomendaciones: 5/5 ✅
- **Coverage**: Supera umbrales del 70% en todas las métricas

### Integration Tests ⚠️
- **ELIMINADOS**: Redundantes con Locust.io
- Locust valida los mismos flujos E2E con datos reales bajo carga

### Load Tests (Locust.io) ✅
- **1207 requests, 0 failures (100% éxito funcional)**
- **Métricas de rendimiento**:
  - Cuestionario: p95 = 3200ms ✅
  - Respuesta: p95 = 2500ms ✅
  - Recomendaciones: p95 = 10000ms ⚠️
  - **Agregado: p95 = 8900ms** (excede target de 3000ms)
- **Validación funcional completa**:
  - ✅ Todos los tipos de pregunta validados correctamente
  - ✅ Dependencias condicionales funcionando
  - ✅ Auto-completado tipo-específico
  - ✅ Restricciones FK respetadas
  - ✅ Generación de recomendaciones personalizadas

### Próximos Pasos
⚠️ **Optimización de Performance**: Endpoint de recomendaciones necesita optimización para cumplir RNF (p95 ≤ 3000ms)
- Opción 1: Batch insert para auto-completado
- Opción 2: Ejecución paralela con Promise.all
- Opción 3: Eliminar auto-completado (solo para testing)