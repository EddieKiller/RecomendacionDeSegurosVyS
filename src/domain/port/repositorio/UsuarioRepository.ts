import { Usuario } from '../../model/Usuario';
import { DatosRegistroCivil } from '../../types/interfaces';

/**
 * Port: Repositorio de Usuario
 * Define el contrato para operaciones de persistencia de usuarios
 * Implementa el principio de inversión de dependencias (DIP)
 */
export interface UsuarioRepository {
  /**
   * Busca un usuario por su RUT
   * @param rut - RUT del usuario
   * @returns Usuario si existe, null si no
   */
  findByRut(rut: string): Promise<Usuario | null>;

  /**
   * Guarda o actualiza un usuario
   * @param usuario - Usuario a guardar
   * @returns Usuario guardado con ID asignado
   */
  save(usuario: Usuario): Promise<Usuario>;

  /**
   * Obtiene datos del Registro Civil (mockeado desde BD)
   * @param rut - RUT a consultar
   * @returns Datos del Registro Civil o null si no existe
   */
  consultarRegistroCivil(rut: string): Promise<DatosRegistroCivil | null>;

  /**
   * Verifica si un usuario existe
   * @param rut - RUT del usuario
   */
  exists(rut: string): Promise<boolean>;

  /**
   * Lista todos los usuarios (para propósitos administrativos)
   */
  findAll(): Promise<Usuario[]>;
}
