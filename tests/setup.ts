/**
 * Setup file para Vitest
 * Se ejecuta antes de cada suite de tests
 */

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'seguros_test';
process.env.DB_PORT = '3306';

// Mock global para console si es necesario
// global.console = {
//   ...console,
//   log: vi.fn(),
//   error: vi.fn(),
// };
