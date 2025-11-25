import { Usuario } from '../../domain/model/Usuario';
import { UsuarioRepository } from '../../domain/port/repositorio/UsuarioRepository';
import { Genero, EstadoCivil } from '../../domain/types/enums';
import { DatosRegistroCivil } from '../../domain/types/interfaces';
import { MySQLAdapter } from '../../application/adapters/database/MySQLAdapter';

/**
 * Implementación del repositorio de Usuario usando MySQL
 */
export class UsuarioRepositoryDB implements UsuarioRepository {
  private db: MySQLAdapter;

  constructor() {
    this.db = MySQLAdapter.getInstance();
    console.log('[UsuarioRepositoryDB] Repositorio inicializado');
  }

  async findByRut(rut: string): Promise<Usuario | null> {
    try {
      const sql = 'SELECT * FROM USUARIO WHERE rut = ?';
      const row = await this.db.queryOne<any>(sql, [rut]);

      if (!row) {
        return null;
      }

      return Usuario.create({
        rut: row.rut,
        nombre: row.nombre,
        fechaNacimiento: new Date(row.fecha_nacimiento),
        genero: row.genero as Genero,
        estadoCivil: row.estado_civil as EstadoCivil
      });
    } catch (error) {
      console.error('[UsuarioRepositoryDB] Error en findByRut:', error);
      throw error;
    }
  }

  async save(usuario: Usuario): Promise<Usuario> {
    try {
      const exists = await this.exists(usuario.rut);

      if (exists) {
        // UPDATE
        const sql = `
          UPDATE USUARIO 
          SET nombre = ?, fecha_nacimiento = ?, genero = ?, estado_civil = ?
          WHERE rut = ?
        `;
        
        await this.db.execute(sql, [
          usuario.nombre,
          usuario.fechaNacimiento,
          usuario.genero,
          usuario.estadoCivil,
          usuario.rut
        ]);

        console.log(`[UsuarioRepositoryDB] Usuario actualizado: ${usuario.rut}`);
      } else {
        // INSERT
        const sql = `
          INSERT INTO USUARIO (rut, nombre, fecha_nacimiento, genero, estado_civil)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        await this.db.insert(sql, [
          usuario.rut,
          usuario.nombre,
          usuario.fechaNacimiento,
          usuario.genero,
          usuario.estadoCivil
        ]);

        console.log(`[UsuarioRepositoryDB] Usuario creado: ${usuario.rut}`);
      }

      return usuario;
    } catch (error) {
      console.error('[UsuarioRepositoryDB] Error en save:', error);
      throw error;
    }
  }

  async consultarRegistroCivil(rut: string): Promise<DatosRegistroCivil | null> {
    try {
      const sql = 'SELECT * FROM REGISTRO_CIVIL WHERE rut = ?';
      const row = await this.db.queryOne<any>(sql, [rut]);

      if (!row) {
        console.log(`[UsuarioRepositoryDB] RUT no encontrado en Registro Civil: ${rut}`);
        return null;
      }

      return {
        rut: row.rut,
        nombre: row.nombre,
        fechaNacimiento: new Date(row.fecha_nacimiento),
        genero: row.genero,
        estadoCivil: row.estado_civil
      };
    } catch (error) {
      console.error('[UsuarioRepositoryDB] Error en consultarRegistroCivil:', error);
      throw error;
    }
  }

  async exists(rut: string): Promise<boolean> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM USUARIO WHERE rut = ?';
      const row = await this.db.queryOne<{ count: number }>(sql, [rut]);
      return (row?.count || 0) > 0;
    } catch (error) {
      console.error('[UsuarioRepositoryDB] Error en exists:', error);
      throw error;
    }
  }

  async findAll(): Promise<Usuario[]> {
    try {
      const sql = 'SELECT * FROM USUARIO ORDER BY nombre';
      const rows = await this.db.query<any>(sql);

      return rows.map(row => Usuario.create({
        rut: row.rut,
        nombre: row.nombre,
        fechaNacimiento: new Date(row.fecha_nacimiento),
        genero: row.genero as Genero,
        estadoCivil: row.estado_civil as EstadoCivil
      }));
    } catch (error) {
      console.error('[UsuarioRepositoryDB] Error en findAll:', error);
      throw error;
    }
  }
}
