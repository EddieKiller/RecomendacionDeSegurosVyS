import { z } from 'zod';
import { EstadoCuestionario } from '../types/enums';
import { Pregunta } from './Pregunta';
import { Respuesta } from './Respuesta';

/**
 * Schema de validación para Cuestionario
 */
export const CuestionarioSchema = z.object({
  idCuestionario: z.number().positive().optional(),
  idUsuario: z.string().min(1),
  fecha: z.date(),
  estado: z.nativeEnum(EstadoCuestionario)
});

/**
 * Interfaz para estrategia de secuenciación de preguntas
 * Patrón Strategy para generar el orden de preguntas adaptativo
 */
export interface PreguntaSequenceStrategy {
  obtenerSiguientePregunta(
    preguntas: Pregunta[],
    respuestas: Respuesta[]
  ): Pregunta | null;
}

/**
 * Estrategia lineal: preguntas sin dependencias
 */
export class LinearSequenceStrategy implements PreguntaSequenceStrategy {
  obtenerSiguientePregunta(preguntas: Pregunta[], respuestas: Respuesta[]): Pregunta | null {
    const respondidas = new Set(respuestas.map(r => r.idPregunta));
    
    // Encontrar primera pregunta sin dependencias y no respondida
    return preguntas.find(p => 
      p.dependencias.length === 0 && !respondidas.has(p.idPregunta)
    ) || null;
  }
}

/**
 * Estrategia condicional: preguntas con dependencias
 */
export class ConditionalSequenceStrategy implements PreguntaSequenceStrategy {
  obtenerSiguientePregunta(preguntas: Pregunta[], respuestas: Respuesta[]): Pregunta | null {
    const respondidas = new Set(respuestas.map(r => r.idPregunta));
    const respuestasMap = new Map(respuestas.map(r => [r.idPregunta, r.valor]));
    
    // Encontrar siguiente pregunta cuyas dependencias estén satisfechas
    return preguntas
      .filter(p => !respondidas.has(p.idPregunta))
      .find(p => p.debeMostrarse(respuestasMap)) || null;
  }
}

/**
 * Modelo de dominio: Cuestionario
 * Gestiona el conjunto de preguntas y respuestas con lógica adaptativa
 * Implementa patrón Strategy para secuenciación de preguntas
 */
export class Cuestionario {
  private _idCuestionario?: number;
  private _idUsuario: string;
  private _fecha: Date;
  private _estado: EstadoCuestionario;
  private _preguntas: Pregunta[];
  private _respuestas: Respuesta[];
  private _strategy: PreguntaSequenceStrategy;

  private constructor(
    idUsuario: string,
    fecha: Date,
    estado: EstadoCuestionario,
    idCuestionario?: number
  ) {
    this._idUsuario = idUsuario;
    this._fecha = fecha;
    this._estado = estado;
    this._idCuestionario = idCuestionario;
    this._preguntas = [];
    this._respuestas = [];
    // Por defecto, estrategia condicional
    this._strategy = new ConditionalSequenceStrategy();
  }

  /**
   * Factory method con validación
   */
  static create(data: {
    idUsuario: string;
    fecha?: Date;
    estado?: EstadoCuestionario;
    idCuestionario?: number;
  }): Cuestionario {
    const validated = CuestionarioSchema.parse({
      ...data,
      fecha: data.fecha || new Date(),
      estado: data.estado || EstadoCuestionario.INICIADO
    });
    
    return new Cuestionario(
      validated.idUsuario,
      validated.fecha,
      validated.estado,
      validated.idCuestionario
    );
  }

  /**
   * Cambia la estrategia de secuenciación (Strategy Pattern)
   */
  public setStrategy(strategy: PreguntaSequenceStrategy): void {
    this._strategy = strategy;
  }

  /**
   * Carga las preguntas del cuestionario
   */
  public cargarPreguntas(preguntas: Pregunta[]): void {
    this._preguntas = preguntas.sort((a, b) => {
      // Ordenar por bloque y luego por orden
      if (a.bloque === b.bloque) {
        return a.orden - b.orden;
      }
      return a.bloque.localeCompare(b.bloque);
    });
  }

  /**
   * Agrega una respuesta al cuestionario
   */
  public agregarRespuesta(respuesta: Respuesta): void {
    // Validar que la pregunta existe
    const pregunta = this._preguntas.find(p => p.idPregunta === respuesta.idPregunta);
    if (!pregunta) {
      throw new Error(`Pregunta ${respuesta.idPregunta} no encontrada en el cuestionario`);
    }

    // Validar que la respuesta es válida para la pregunta
    const validacion = pregunta.validarRespuesta(respuesta.valor);
    if (!validacion.valid) {
      throw new Error(validacion.error);
    }

    // Si ya existe una respuesta para esta pregunta, actualizarla
    const indiceExistente = this._respuestas.findIndex(
      r => r.idPregunta === respuesta.idPregunta
    );

    if (indiceExistente >= 0) {
      this._respuestas[indiceExistente] = respuesta;
    } else {
      this._respuestas.push(respuesta);
    }

    // Actualizar estado si es necesario
    if (this._estado === EstadoCuestionario.INICIADO) {
      this._estado = EstadoCuestionario.EN_PROGRESO;
    }
  }

  /**
   * Obtiene la siguiente pregunta a mostrar usando la estrategia configurada
   */
  public obtenerSiguientePregunta(): Pregunta | null {
    return this._strategy.obtenerSiguientePregunta(this._preguntas, this._respuestas);
  }

  /**
   * Calcula el progreso del cuestionario (0-100%)
   */
  public calcularProgreso(): number {
    if (this._preguntas.length === 0) return 0;
    
    const respuestasMap = new Map(this._respuestas.map(r => [r.idPregunta, r.valor]));
    
    // Contar preguntas aplicables (que deben mostrarse según dependencias)
    const preguntasAplicables = this._preguntas.filter(p => 
      p.debeMostrarse(respuestasMap) || p.dependencias.length === 0
    );
    
    if (preguntasAplicables.length === 0) return 0;
    
    const respondidas = preguntasAplicables.filter(p => 
      this._respuestas.some(r => r.idPregunta === p.idPregunta)
    );
    
    return Math.round((respondidas.length / preguntasAplicables.length) * 100);
  }

  /**
   * Verifica si el cuestionario está completo
   */
  public estaCompleto(): boolean {
    return this.calcularProgreso() === 100;
  }

  /**
   * Marca el cuestionario como completado
   */
  public completar(): void {
    if (!this.estaCompleto()) {
      throw new Error('El cuestionario no está completo');
    }
    this._estado = EstadoCuestionario.COMPLETADO;
  }

  /**
   * Obtiene todas las respuestas como un mapa clave-valor
   */
  public getRespuestasMap(): Map<number, string> {
    return new Map(this._respuestas.map(r => [r.idPregunta, r.valor]));
  }

  // Getters
  get idCuestionario(): number | undefined { return this._idCuestionario; }
  get idUsuario(): string { return this._idUsuario; }
  get fecha(): Date { return this._fecha; }
  get estado(): EstadoCuestionario { return this._estado; }
  get preguntas(): Pregunta[] { return this._preguntas; }
  get respuestas(): Respuesta[] { return this._respuestas; }

  public toJSON() {
    return {
      idCuestionario: this._idCuestionario,
      idUsuario: this._idUsuario,
      fecha: this._fecha.toISOString(),
      estado: this._estado,
      progreso: this.calcularProgreso(),
      totalPreguntas: this._preguntas.length,
      totalRespuestas: this._respuestas.length
    };
  }
}
