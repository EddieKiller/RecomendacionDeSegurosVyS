/**
 * Contenedor de Inyección de Dependencias (Singleton)
 * 
 * Centraliza la creación e inyección de dependencias para toda la aplicación.
 * Implementa el patrón Singleton para garantizar una única instancia.
 * 
 * @pattern Singleton
 * @layer Infrastructure
 */

import { MySQLAdapter } from '../../application/adapters/database/MySQLAdapter';
import { UsuarioRepositoryDB } from '../repository/UsuarioRepositoryDB';
import { CuestionarioRepositoryDB } from '../repository/CuestionarioRepositoryDB';
import { CatalogoRepositoryDB } from '../repository/CatalogoRepositoryDB';
import { UsuarioRepoAdapter } from '../../application/adapters/repositorio/UsuarioRepoAdapter';
import { CuestionarioRepoAdapter } from '../../application/adapters/repositorio/CuestionarioRepoAdapter';
import { CatalogoRepoAdapter } from '../../application/adapters/repositorio/CatalogoRepoAdapter';
import { GestionarCuestionario } from '../../application/usecase/GestionarCuestionario';
import { EvaluarPerfilRiesgo } from '../../application/usecase/EvaluarPerfilRiesgo';
import { GenerarRecomendaciones } from '../../application/usecase/GenerarRecomendaciones';

/**
 * Contenedor Singleton para gestión de dependencias
 */
export class DependencyContainer {
  private static instance: DependencyContainer | null = null;

  // Infrastructure Layer
  private mysqlAdapter: MySQLAdapter;
  private usuarioRepositoryDB: UsuarioRepositoryDB;
  private cuestionarioRepositoryDB: CuestionarioRepositoryDB;
  private catalogoRepositoryDB: CatalogoRepositoryDB;

  // Application Layer - Adapters
  private usuarioRepoAdapter: UsuarioRepoAdapter;
  private cuestionarioRepoAdapter: CuestionarioRepoAdapter;
  private catalogoRepoAdapter: CatalogoRepoAdapter;

  /**
   * Constructor privado para implementar Singleton
   */
  private constructor() {
    console.log('[DependencyContainer] Inicializando contenedor de dependencias...');

    // Inicializar capa de infraestructura
    this.mysqlAdapter = MySQLAdapter.getInstance();
    this.usuarioRepositoryDB = new UsuarioRepositoryDB();
    this.cuestionarioRepositoryDB = new CuestionarioRepositoryDB();
    this.catalogoRepositoryDB = new CatalogoRepositoryDB();

    // Inicializar adaptadores
    this.usuarioRepoAdapter = new UsuarioRepoAdapter(this.usuarioRepositoryDB);
    this.cuestionarioRepoAdapter = new CuestionarioRepoAdapter(this.cuestionarioRepositoryDB);
    this.catalogoRepoAdapter = new CatalogoRepoAdapter(this.catalogoRepositoryDB);

    console.log('[DependencyContainer] Contenedor inicializado correctamente');
  }

  /**
   * Obtiene la instancia única del contenedor (Singleton)
   */
  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Factory method para caso de uso: Gestionar Cuestionario (CU-2)
   * @returns Instancia configurada de GestionarCuestionario
   */
  public getGestionarCuestionarioUseCase(): GestionarCuestionario {
    return new GestionarCuestionario(
      this.cuestionarioRepoAdapter,
      this.usuarioRepoAdapter
    );
  }

  /**
   * Factory method para caso de uso: Evaluar Perfil de Riesgo (CU-3)
   * @returns Instancia configurada de EvaluarPerfilRiesgo
   */
  public getEvaluarPerfilRiesgoUseCase(): EvaluarPerfilRiesgo {
    return new EvaluarPerfilRiesgo();
  }

  /**
   * Factory method para caso de uso: Generar Recomendaciones (CU-4)
   * @returns Instancia configurada de GenerarRecomendaciones
   */
  public getGenerarRecomendacionesUseCase(): GenerarRecomendaciones {
    return new GenerarRecomendaciones(this.catalogoRepoAdapter);
  }

  /**
   * Obtiene el adaptador de MySQL (para operaciones directas si es necesario)
   */
  public getMySQLAdapter(): MySQLAdapter {
    return this.mysqlAdapter;
  }

  /**
   * Cierra todas las conexiones (útil para testing o shutdown)
   */
  public async closeConnections(): Promise<void> {
    console.log('[DependencyContainer] Cerrando conexiones...');
    // MySQLAdapter maneja el cierre del pool internamente
    await this.mysqlAdapter.testConnection(); // Verifica estado antes de cerrar
  }
}
