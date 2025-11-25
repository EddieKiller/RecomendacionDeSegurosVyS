import mysql from 'mysql2/promise';

/**
 * MySQLAdapter: Pool de conexiones reutilizable para MySQL
 * Implementa el patrón Singleton para el pool de conexiones
 */
export class MySQLAdapter {
  private static instance: MySQLAdapter;
  private pool: mysql.Pool;

  private constructor() {
    console.log('[MySQLAdapter] Inicializando pool de conexiones...');
    
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'seguros',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    console.log('[MySQLAdapter] Pool de conexiones creado');
  }

  /**
   * Obtiene la instancia única del adaptador (Singleton)
   */
  public static getInstance(): MySQLAdapter {
    if (!MySQLAdapter.instance) {
      MySQLAdapter.instance = new MySQLAdapter();
    }
    return MySQLAdapter.instance;
  }

  /**
   * Obtiene una conexión del pool
   */
  public async getConnection(): Promise<mysql.PoolConnection> {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('[MySQLAdapter] Error obteniendo conexión:', error);
      throw new Error('No se pudo conectar a la base de datos');
    }
  }

  /**
   * Ejecuta una consulta SQL
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const connection = await this.getConnection();
    
    try {
      const [rows] = await connection.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('[MySQLAdapter] Error en query:', error);
      console.error('[MySQLAdapter] SQL:', sql);
      console.error('[MySQLAdapter] Params:', params);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Ejecuta una consulta y retorna la primera fila
   */
  public async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Ejecuta un INSERT y retorna el ID insertado
   */
  public async insert(sql: string, params?: any[]): Promise<number> {
    const connection = await this.getConnection();
    
    try {
      const [result] = await connection.execute(sql, params);
      const insertResult = result as mysql.ResultSetHeader;
      return insertResult.insertId;
    } catch (error) {
      console.error('[MySQLAdapter] Error en insert:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Ejecuta un UPDATE o DELETE y retorna filas afectadas
   */
  public async execute(sql: string, params?: any[]): Promise<number> {
    const connection = await this.getConnection();
    
    try {
      const [result] = await connection.execute(sql, params);
      const executeResult = result as mysql.ResultSetHeader;
      return executeResult.affectedRows;
    } catch (error) {
      console.error('[MySQLAdapter] Error en execute:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Inicia una transacción
   */
  public async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('[MySQLAdapter] Error en transacción:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cierra el pool de conexiones
   */
  public async close(): Promise<void> {
    await this.pool.end();
    console.log('[MySQLAdapter] Pool de conexiones cerrado');
  }

  /**
   * Verifica la conexión a la base de datos
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      console.log('[MySQLAdapter] Conexión a BD exitosa');
      return true;
    } catch (error) {
      console.error('[MySQLAdapter] Error de conexión a BD:', error);
      return false;
    }
  }
}
