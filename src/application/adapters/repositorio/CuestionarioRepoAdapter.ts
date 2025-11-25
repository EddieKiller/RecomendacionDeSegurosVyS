import { Cuestionario } from '../../../domain/model/Cuestionario';
import { Pregunta } from '../../../domain/model/Pregunta';
import { Respuesta } from '../../../domain/model/Respuesta';
import { CuestionarioRepository } from '../../../domain/port/repositorio/CuestionarioRepository';

/**
 * Adapter para el repositorio de Cuestionario
 * Delega a la implementación de infraestructura
 */
export class CuestionarioRepoAdapter implements CuestionarioRepository {
  
  constructor(private implementation: CuestionarioRepository) {
    console.log('[CuestionarioRepoAdapter] Inicializado');
  }

  async create(cuestionario: Cuestionario): Promise<Cuestionario> {
    console.log(`[CuestionarioRepoAdapter] Creando cuestionario para: ${cuestionario.idUsuario}`);
    return await this.implementation.create(cuestionario);
  }

  async findById(idCuestionario: number): Promise<Cuestionario | null> {
    console.log(`[CuestionarioRepoAdapter] Buscando cuestionario: ${idCuestionario}`);
    return await this.implementation.findById(idCuestionario);
  }

  async findActivoByUsuario(rut: string): Promise<Cuestionario | null> {
    console.log(`[CuestionarioRepoAdapter] Buscando cuestionario activo para: ${rut}`);
    return await this.implementation.findActivoByUsuario(rut);
  }

  async getAllPreguntas(): Promise<Pregunta[]> {
    console.log('[CuestionarioRepoAdapter] Cargando todas las preguntas');
    return await this.implementation.getAllPreguntas();
  }

  async getPreguntasByBloque(bloque: string): Promise<Pregunta[]> {
    console.log(`[CuestionarioRepoAdapter] Cargando preguntas del bloque: ${bloque}`);
    return await this.implementation.getPreguntasByBloque(bloque);
  }

  async saveRespuesta(respuesta: Respuesta): Promise<Respuesta> {
    console.log(`[CuestionarioRepoAdapter] Guardando respuesta para pregunta: ${respuesta.idPregunta}`);
    return await this.implementation.saveRespuesta(respuesta);
  }

  async getRespuestas(idCuestionario: number): Promise<Respuesta[]> {
    console.log(`[CuestionarioRepoAdapter] Cargando respuestas del cuestionario: ${idCuestionario}`);
    return await this.implementation.getRespuestas(idCuestionario);
  }

  async updateEstado(idCuestionario: number, estado: string): Promise<void> {
    console.log(`[CuestionarioRepoAdapter] Actualizando estado a: ${estado}`);
    return await this.implementation.updateEstado(idCuestionario, estado);
  }

  async getHistorial(rut: string): Promise<Cuestionario[]> {
    console.log(`[CuestionarioRepoAdapter] Cargando historial para: ${rut}`);
    return await this.implementation.getHistorial(rut);
  }
}
