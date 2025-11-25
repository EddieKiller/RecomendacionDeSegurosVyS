import { Cuestionario, ConditionalSequenceStrategy } from '../../domain/model/Cuestionario';
import { Pregunta } from '../../domain/model/Pregunta';
import { Respuesta } from '../../domain/model/Respuesta';
import { EstadoCuestionario } from '../../domain/types/enums';
import { CuestionarioRepository } from '../../domain/port/repositorio/CuestionarioRepository';
import { UsuarioRepository } from '../../domain/port/repositorio/UsuarioRepository';

/**
 * Patrón State: Estados del flujo del cuestionario
 */
interface CuestionarioState {
  manejarAccion(contexto: GestionarCuestionario, accion: string, datos?: any): Promise<any>;
  getNombreEstado(): string;
}

/**
 * Estado: Iniciado
 */
class EstadoIniciado implements CuestionarioState {
  getNombreEstado(): string {
    return 'Iniciado';
  }

  async manejarAccion(contexto: GestionarCuestionario, accion: string, datos?: any): Promise<any> {
    switch (accion) {
      case 'cargar_preguntas':
        await contexto.cargarPreguntasInterno();
        contexto.cambiarEstado(new EstadoEnProgreso());
        return { success: true, mensaje: 'Cuestionario listo para responder' };
      
      default:
        throw new Error(`Acción '${accion}' no permitida en estado Iniciado`);
    }
  }
}

/**
 * Estado: En Progreso
 */
class EstadoEnProgreso implements CuestionarioState {
  getNombreEstado(): string {
    return 'En Progreso';
  }

  async manejarAccion(contexto: GestionarCuestionario, accion: string, datos?: any): Promise<any> {
    switch (accion) {
      case 'cargar_preguntas':
        // Permitir recargar preguntas si es necesario (ej: después de recuperar de BD)
        await contexto.cargarPreguntasInterno();
        return { success: true, mensaje: 'Preguntas cargadas' };
      
      case 'responder':
        return await contexto.responderPreguntaInterno(datos);
      
      case 'obtener_siguiente':
        return contexto.obtenerSiguientePreguntaInterno();
      
      case 'editar_respuesta':
        return await contexto.editarRespuestaInterno({
          idPregunta: datos.idPregunta,
          nuevoValor: datos.valor
        });
      
      case 'completar':
        if (contexto.getCuestionario().estaCompleto()) {
          contexto.getCuestionario().completar();
          await contexto.updateEstadoCuestionario(EstadoCuestionario.COMPLETADO);
          contexto.cambiarEstado(new EstadoCompletado());
          return { success: true, mensaje: 'Cuestionario completado exitosamente' };
        }
        throw new Error('El cuestionario aún no está completo');
      
      default:
        throw new Error(`Acción '${accion}' no permitida en estado En Progreso`);
    }
  }
}

/**
 * Estado: Completado
 */
class EstadoCompletado implements CuestionarioState {
  getNombreEstado(): string {
    return 'Completado';
  }

  async manejarAccion(contexto: GestionarCuestionario, accion: string, datos?: any): Promise<any> {
    switch (accion) {
      case 'obtener_respuestas':
        return contexto.getCuestionario().getRespuestasMap();
      
      case 'editar_respuesta':
        // Permitir edición incluso después de completado
        contexto.cambiarEstado(new EstadoEnProgreso());
        // Cambiar el estado del modelo también usando método público
        if (contexto.getCuestionario().estado === EstadoCuestionario.COMPLETADO) {
          contexto.getCuestionario().revertirAEnProgreso();
          await contexto.updateEstadoCuestionario(EstadoCuestionario.EN_PROGRESO);
        }
        return await contexto.editarRespuestaInterno({
          idPregunta: datos.idPregunta,
          nuevoValor: datos.valor
        });
      
      default:
        throw new Error(`Acción '${accion}' no permitida en estado Completado`);
    }
  }
}

/**
 * CU-2: Gestionar Cuestionario
 * Implementa RF-002: generación + adaptación + validación + edición
 * 
 * Patrones implementados:
 * - State: Manejo del flujo del cuestionario (Iniciado → En Progreso → Completado)
 * - Strategy: Secuenciación adaptativa de preguntas (delegado a Cuestionario)
 * 
 * @example
 * const useCase = new GestionarCuestionario(cuestionarioRepo, usuarioRepo);
 * await useCase.iniciarCuestionario('12.345.678-9');
 * await useCase.ejecutarAccion('cargar_preguntas');
 * const siguientePregunta = await useCase.ejecutarAccion('obtener_siguiente');
 * await useCase.ejecutarAccion('responder', { idPregunta: 1, valor: 'Sí' });
 */
export class GestionarCuestionario {
  private estado: CuestionarioState;
  private cuestionario?: Cuestionario;

  constructor(
    private cuestionarioRepo: CuestionarioRepository,
    private usuarioRepo: UsuarioRepository
  ) {
    this.estado = new EstadoIniciado();
  }

  /**
   * Cambia el estado interno del flujo (State Pattern)
   */
  public cambiarEstado(nuevoEstado: CuestionarioState): void {
    console.log(`[GestionarCuestionario] Cambio de estado: ${this.estado.getNombreEstado()} → ${nuevoEstado.getNombreEstado()}`);
    this.estado = nuevoEstado;
  }

  /**
   * Ejecuta una acción delegando al estado actual
   */
  public async ejecutarAccion(accion: string, datos?: any): Promise<any> {
    try {
      return await this.estado.manejarAccion(this, accion, datos);
    } catch (error) {
      console.error(`[GestionarCuestionario] Error en acción '${accion}':`, error);
      throw error;
    }
  }

  /**
   * Carga un cuestionario existente en el contexto del useCase
   */
  public async cargarCuestionarioExistente(cuestionario: Cuestionario): Promise<void> {
    console.log(`[GestionarCuestionario] Cargando cuestionario existente ID: ${cuestionario.idCuestionario}`);
    this.cuestionario = cuestionario;
    
    // Sincronizar estado interno
    if (cuestionario.estado === EstadoCuestionario.INICIADO) {
      this.cambiarEstado(new EstadoIniciado());
    } else if (cuestionario.estado === EstadoCuestionario.EN_PROGRESO) {
      this.cambiarEstado(new EstadoEnProgreso());
    } else if (cuestionario.estado === EstadoCuestionario.COMPLETADO) {
      this.cambiarEstado(new EstadoCompletado());
    }
  }

  /**
   * Inicia un nuevo cuestionario para un usuario
   */
  public async iniciarCuestionario(rut: string): Promise<Cuestionario> {
    console.log(`[GestionarCuestionario] Iniciando cuestionario para RUT: ${rut}`);
    
    // Verificar que el usuario existe
    const usuario = await this.usuarioRepo.findByRut(rut);
    if (!usuario) {
      throw new Error(`Usuario con RUT ${rut} no encontrado`);
    }

    // Verificar si ya tiene un cuestionario activo (no completado)
    const cuestionarioActivo = await this.cuestionarioRepo.findActivoByUsuario(rut);
    if (cuestionarioActivo && cuestionarioActivo.estado !== EstadoCuestionario.COMPLETADO) {
      console.log(`[GestionarCuestionario] Usuario ya tiene cuestionario activo en estado: ${cuestionarioActivo.estado}`);
      this.cuestionario = cuestionarioActivo;
      
      // Sincronizar el estado interno del useCase con el estado del cuestionario
      if (cuestionarioActivo.estado === EstadoCuestionario.INICIADO) {
        this.cambiarEstado(new EstadoIniciado());
      } else if (cuestionarioActivo.estado === EstadoCuestionario.EN_PROGRESO) {
        this.cambiarEstado(new EstadoEnProgreso());
      }
      
      return cuestionarioActivo;
    }

    // Crear nuevo cuestionario
    this.cuestionario = Cuestionario.create({
      idUsuario: rut,
      estado: EstadoCuestionario.INICIADO
    });

    this.cuestionario = await this.cuestionarioRepo.create(this.cuestionario);
    console.log(`[GestionarCuestionario] Cuestionario creado con ID: ${this.cuestionario.idCuestionario}`);
    
    return this.cuestionario;
  }

  /**
   * Carga las preguntas en el cuestionario (uso interno)
   */
  public async cargarPreguntasInterno(): Promise<void> {
    if (!this.cuestionario) {
      throw new Error('No hay cuestionario iniciado');
    }

    const preguntas = await this.cuestionarioRepo.getAllPreguntas();
    console.log(`[GestionarCuestionario] Cargadas ${preguntas.length} preguntas`);
    
    this.cuestionario.cargarPreguntas(preguntas);
    
    // Configurar estrategia condicional para adaptación
    this.cuestionario.setStrategy(new ConditionalSequenceStrategy());
  }

  /**
   * Responde una pregunta del cuestionario (uso interno)
   */
  public async responderPreguntaInterno(datos: { idPregunta: number; valor: string }): Promise<Respuesta> {
    if (!this.cuestionario) {
      throw new Error('No hay cuestionario iniciado');
    }

    console.log(`[GestionarCuestionario] Respondiendo pregunta ${datos.idPregunta}`);

    const respuesta = Respuesta.create({
      idCuestionario: this.cuestionario.idCuestionario!,
      idPregunta: datos.idPregunta,
      valor: datos.valor
    });

    // Agregar respuesta al cuestionario (valida internamente)
    this.cuestionario.agregarRespuesta(respuesta);

    // Persistir respuesta
    const respuestaGuardada = await this.cuestionarioRepo.saveRespuesta(respuesta);
    
    // Actualizar estado del cuestionario si está completado
    if (this.cuestionario.estaCompleto()) {
      await this.cuestionarioRepo.updateEstado(
        this.cuestionario.idCuestionario!,
        EstadoCuestionario.COMPLETADO
      );
    } else {
      await this.cuestionarioRepo.updateEstado(
        this.cuestionario.idCuestionario!,
        EstadoCuestionario.EN_PROGRESO
      );
    }

    console.log(`[GestionarCuestionario] Progreso: ${this.cuestionario.calcularProgreso()}%`);
    
    return respuestaGuardada;
  }

  /**
   * Obtiene la siguiente pregunta a mostrar (uso interno)
   */
  public obtenerSiguientePreguntaInterno(): Pregunta | null {
    if (!this.cuestionario) {
      throw new Error('No hay cuestionario iniciado');
    }

    const siguiente = this.cuestionario.obtenerSiguientePregunta();
    
    if (siguiente) {
      console.log(`[GestionarCuestionario] Siguiente pregunta: ${siguiente.idPregunta} - ${siguiente.enunciado}`);
    } else {
      console.log('[GestionarCuestionario] No hay más preguntas');
    }
    
    return siguiente;
  }

  /**
   * Edita una respuesta existente (uso interno)
   */
  public async editarRespuestaInterno(datos: { idPregunta: number; nuevoValor: string }): Promise<{ success: boolean; mensaje: string }> {
    if (!this.cuestionario) {
      throw new Error('No hay cuestionario iniciado');
    }

    console.log(`[GestionarCuestionario] Editando respuesta de pregunta ${datos.idPregunta}`);

    // Encontrar respuesta existente
    const respuestaExistente = this.cuestionario.respuestas.find(
      r => r.idPregunta === datos.idPregunta
    );

    if (!respuestaExistente) {
      throw new Error(`No existe respuesta para pregunta ${datos.idPregunta}`);
    }

    // Actualizar valor
    respuestaExistente.actualizarValor(datos.nuevoValor);

    // Persistir cambio
    await this.cuestionarioRepo.saveRespuesta(respuestaExistente);
    
    console.log('[GestionarCuestionario] Respuesta editada exitosamente');
    
    return { success: true, mensaje: 'Respuesta editada exitosamente' };
  }

  /**
   * Obtiene el progreso actual del cuestionario
   */
  public getProgreso(): number {
    return this.cuestionario?.calcularProgreso() || 0;
  }

  /**
   * Obtiene el estado actual del cuestionario
   */
  public getEstadoActual(): string {
    return this.estado.getNombreEstado();
  }

  /**
   * Obtiene el cuestionario actual
   */
  public getCuestionario(): Cuestionario {
    if (!this.cuestionario) {
      throw new Error('No hay cuestionario iniciado');
    }
    return this.cuestionario;
  }

  /**
   * Actualiza el estado del cuestionario en la base de datos
   * Método público para uso de los estados del patrón State
   */
  public async updateEstadoCuestionario(nuevoEstado: EstadoCuestionario): Promise<void> {
    if (!this.cuestionario) {
      throw new Error('No hay cuestionario iniciado');
    }
    await this.cuestionarioRepo.updateEstado(
      this.cuestionario.idCuestionario!,
      nuevoEstado
    );
  }

  /**
   * Valida la coherencia de todas las respuestas
   */
  public async validarCoherencia(): Promise<{ valid: boolean; errores: string[] }> {
    if (!this.cuestionario) {
      throw new Error('No hay cuestionario iniciado');
    }

    const errores: string[] = [];
    const respuestas = this.cuestionario.respuestas;

    // Ejemplo de validación de coherencia:
    // Si P0101 (¿Tienes dependientes?) = "No", no debería haber respuesta en P0102
    const tieneDependientes = respuestas.find(r => r.idPregunta === 101);
    const cantidadDependientes = respuestas.find(r => r.idPregunta === 102);

    if (tieneDependientes?.valor === 'No' && cantidadDependientes) {
      errores.push('Inconsistencia: indicó no tener dependientes pero respondió cantidad');
    }

    // Más validaciones pueden agregarse aquí

    return {
      valid: errores.length === 0,
      errores
    };
  }
}
