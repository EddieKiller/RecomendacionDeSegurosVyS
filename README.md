# TestArquitecturaHexagonal

Ejemplo mínimo de **arquitectura hexagonal (Ports & Adapters)** usando **Next.js 14** y **TypeScript**.

Este proyecto muestra cómo organizar código siguiendo principios SOLID y separación por capas: **Dominio**, **Aplicación**, **Infraestructura** e **Interfaces**.

---

## **Objetivo**
Proveer una base simple y reutilizable para entender la arquitectura hexagonal y aplicarla en proyectos reales.

---

## **Estructura del proyecto**
```
TestArquitecturaExagonal/
├─ app/
│  └─ api/products/route.ts           # Endpoint POST /api/products (App Router)
├─ src/
│  ├─ application/                    # Casos de uso y adaptadores
│  │  ├─ usecase/CreateProduct.ts     # Caso de uso: lógica para crear producto
│  │  └─ adapters/                    # Implementaciones concretas de puertos
│  │     ├─ repositorio/ProductRepositoryAdapter.ts
│  │     ├─ externo/ExternalServiceAdapter.ts
│  │     ├─ handlers/EventHandlerAdapter.ts
│  │     └─ database/DatabaseAdapter.ts
│  ├─ domain/                         # Entidades y contratos (puertos)
│  │  ├─ model/Product.ts             # Entidad del dominio
│  │  └─ port/
│  │     ├─ repositorio/ProductRepository.ts  # Puerto para persistencia
│  │     └─ externo/ExternalServicePort.ts    # Puerto para servicios externos
│  ├─ infrastructure/repository/ProductRepositoryDB.ts # Repo en memoria
│  └─ interfaces/controllers/productController.ts      # Controlador HTTP
├─ package.json
└─ tsconfig.json
```

---

## **Explicación de cada carpeta y componente**

### **app/**
- **api/products/route.ts**  
  Define el endpoint HTTP usando el App Router de Next.js.  
  **Responsabilidad:** recibir la petición, validar datos y delegar al controlador.

### **src/domain/**
- **model/Product.ts**  
  Entidad del dominio con reglas básicas (validación, serialización).  
  **Responsabilidad:** representar el concepto central del negocio.

- **port/**  
  Define **puertos** (interfaces) que representan contratos:  
  - `repositorio/ProductRepository.ts`: métodos para persistencia (`save`, `findAll`).  
  - `externo/ExternalServicePort.ts`: contrato para integraciones externas.  
  **Responsabilidad:** abstraer dependencias externas, aplicando DIP.

### **src/application/**
- **usecase/CreateProduct.ts**  
  Caso de uso que orquesta la creación de un producto.  
  **Responsabilidad:** lógica de aplicación, sin detalles de infraestructura.

- **adapters/**  
  Implementaciones concretas que cumplen los puertos:  
  - `repositorio/ProductRepositoryAdapter.ts`: conecta con infraestructura.  
  - `externo/ExternalServiceAdapter.ts`: integra servicios externos.  
  - `handlers/EventHandlerAdapter.ts`: maneja eventos o side-effects.  
  - `database/DatabaseAdapter.ts`: configuración de DB.  
  **Responsabilidad:** aislar detalles técnicos y mantener SRP.

### **src/infrastructure/**
- **repository/ProductRepositoryDB.ts**  
  Implementación en memoria del repositorio (array).  
  **Responsabilidad:** persistencia dummy para pruebas.

### **src/interfaces/**
- **controllers/productController.ts**  
  Orquestador entre capa HTTP y casos de uso.  
  **Responsabilidad:** recibir datos, instanciar dependencias y ejecutar lógica.

---

## **Principios aplicados**
- **SRP**: Cada clase tiene una única responsabilidad.
- **DIP**: El dominio depende de abstracciones, no de implementaciones.
- **OCP**: Puedes añadir adaptadores sin modificar el dominio.

---

## **Cómo probar**
1. Instala dependencias:
   ```bash
   pnpm install
   ```
2. Arranca el servidor:
   ```bash
   pnpm run dev
   ```
3. Envía un `POST` a `http://localhost:3000/api/products` con:
   ```json
   {
     "name": "Producto Test",
     "price": 100
   }
   ```
Respuesta esperada:
```json
{
  "id": "uuid",
  "name": "Producto Test",
  "price": 100,
  "createdAt": "2025-11-19T...Z"
}
```

---

## **Siguientes pasos**
- Añadir endpoints GET para listar productos.
- Implementar persistencia real (SQLite, PostgreSQL).
- Validación con `zod` y manejo de errores.
- Tests unitarios e integración.
- Logging y configuración por entorno.
