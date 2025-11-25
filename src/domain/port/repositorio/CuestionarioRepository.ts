import { Cuestionario } from '../../model/Cuestionario';
import { Pregunta } from '../../model/Pregunta';
import { Respuesta } from '../../model/Respuesta';

/**
 * Port: Repositorio de Cuestionario
 * Define el contrato para operaciones de gestión de cuestionarios
 */
export interface CuestionarioRepository {
  /**
   * Crea un nuevo cuestionario para un usuario
   * @param cuestionario - Cuestionario a crear
   * @returns Cuestionario creado con ID asignado
   */
  create(cuestionario: Cuestionario): Promise<Cuestionario>;

  /**
   * Busca un cuestionario por su ID
   * @param idCuestionario - ID del cuestionario
   */
  findById(idCuestionario: number): Promise<Cuestionario | null>;

  /**
   * Busca el cuestionario activo de un usuario
   * @param rut - RUT del usuario
   * @returns Cuestionario en progreso o null
   */
  findActivoByUsuario(rut: string): Promise<Cuestionario | null>;

  /**
   * Obtiene todas las preguntas del sistema
   * @returns Array de todas las preguntas
   */
  getAllPreguntas(): Promise<Pregunta[]>;

  /**
   * Obtiene preguntas de un bloque específico
   * @param bloque - Nombre del bloque
   */
  getPreguntasByBloque(bloque: string): Promise<Pregunta[]>;

  /**
   * Guarda una respuesta en el cuestionario
   * @param respuesta - Respuesta a guardar
   */
  saveRespuesta(respuesta: Respuesta): Promise<Respuesta>;

  /**
   * Obtiene todas las respuestas de un cuestionario
   * @param idCuestionario - ID del cuestionario
   */
  getRespuestas(idCuestionario: number): Promise<Respuesta[]>;

  /**
   * Actualiza el estado de un cuestionario
   * @param idCuestionario - ID del cuestionario
   * @param estado - Nuevo estado
   */
  updateEstado(idCuestionario: number, estado: string): Promise<void>;

  /**
   * Obtiene el historial de cuestionarios de un usuario
   * @param rut - RUT del usuario
   */
  getHistorial(rut: string): Promise<Cuestionario[]>;
}
