import { z } from 'zod';
import { TipoPregunta } from '../types/enums';
import { DependenciaPregunta } from '../types/interfaces';

/**
 * Schema de validación para Pregunta
 */
export const PreguntaSchema = z.object({
  idPregunta: z.number().positive(),
  enunciado: z.string().min(5, 'Enunciado muy corto'),
  opciones: z.array(z.string()).nullable(),
  tipo: z.nativeEnum(TipoPregunta),
  bloque: z.string(),
  orden: z.number().positive()
});

/**
 * Modelo de dominio: Pregunta
 * Representa una pregunta del cuestionario con sus opciones y dependencias
 */
export class Pregunta {
  private _idPregunta: number;
  private _enunciado: string;
  private _opciones: string[] | null;
  private _tipo: TipoPregunta;
  private _bloque: string;
  private _orden: number;
  private _dependencias: DependenciaPregunta[];

  private constructor(
    idPregunta: number,
    enunciado: string,
    opciones: string[] | null,
    tipo: TipoPregunta,
    bloque: string,
    orden: number
  ) {
    this._idPregunta = idPregunta;
    this._enunciado = enunciado;
    this._opciones = opciones;
    this._tipo = tipo;
    this._bloque = bloque;
    this._orden = orden;
    this._dependencias = [];
  }

  /**
   * Factory method con validación
   */
  static create(data: {
    idPregunta: number;
    enunciado: string;
    opciones: string[] | null;
    tipo: TipoPregunta;
    bloque: string;
    orden: number;
  }): Pregunta {
    const validated = PreguntaSchema.parse(data);
    
    return new Pregunta(
      validated.idPregunta,
      validated.enunciado,
      validated.opciones,
      validated.tipo,
      validated.bloque,
      validated.orden
    );
  }

  /**
   * Agrega una dependencia a esta pregunta
   */
  public agregarDependencia(dependencia: DependenciaPregunta): void {
    this._dependencias.push(dependencia);
  }

  /**
   * Verifica si esta pregunta debe mostrarse según las respuestas previas
   * @param respuestasPrevias - Mapa de id_pregunta -> valor_respuesta
   */
  public debeMostrarse(respuestasPrevias: Map<number, string>): boolean {
    // Si no tiene dependencias, siempre se muestra
    if (this._dependencias.length === 0) {
      return true;
    }

    // Evaluar todas las dependencias (AND lógico)
    return this._dependencias.every(dep => {
      const valorPrevio = respuestasPrevias.get(dep.idPreguntaPadre);
      
      if (!valorPrevio) {
        return false; // La pregunta padre no ha sido respondida
      }

      const operador = dep.operador || 'equals';

      switch (operador) {
        case 'equals':
          return valorPrevio === dep.valorEsperado;
        
        case 'contains':
          if (Array.isArray(dep.valorEsperado)) {
            return dep.valorEsperado.includes(valorPrevio);
          }
          return valorPrevio.includes(dep.valorEsperado as string);
        
        case 'not_equals':
          return valorPrevio !== dep.valorEsperado;
        
        default:
          return false;
      }
    });
  }

  /**
   * Valida si una respuesta es válida para esta pregunta
   */
  public validarRespuesta(valor: string): { valid: boolean; error?: string } {
    switch (this._tipo) {
      case TipoPregunta.TEXTO:
      case TipoPregunta.TEXTO_LARGO:
        if (!valor || valor.trim().length === 0) {
          return { valid: false, error: 'La respuesta no puede estar vacía' };
        }
        return { valid: true };

      case TipoPregunta.NUMERICO:
        const numero = parseFloat(valor);
        if (isNaN(numero)) {
          return { valid: false, error: 'Debe ser un número válido' };
        }
        return { valid: true };

      case TipoPregunta.BOOLEAN:
        if (!['Sí', 'No', 'true', 'false'].includes(valor)) {
          return { valid: false, error: 'Debe ser Sí o No' };
        }
        return { valid: true };

      case TipoPregunta.SELECCION_SIMPLE:
        if (!this._opciones || !this._opciones.includes(valor)) {
          return { valid: false, error: 'Opción no válida' };
        }
        return { valid: true };

      case TipoPregunta.MULTISELECCION:
        try {
          const valores = JSON.parse(valor);
          if (!Array.isArray(valores)) {
            return { valid: false, error: 'Debe ser un array de valores' };
          }
          
          const todosValidos = valores.every(v => 
            this._opciones?.includes(v)
          );
          
          if (!todosValidos) {
            return { valid: false, error: 'Una o más opciones no son válidas' };
          }
          
          return { valid: true };
        } catch {
          return { valid: false, error: 'Formato de múltiple selección inválido' };
        }

      default:
        return { valid: false, error: 'Tipo de pregunta no soportado' };
    }
  }

  /**
   * Verifica si esta pregunta requiere respuesta
   */
  public esObligatoria(): boolean {
    // Las preguntas de texto largo pueden ser opcionales
    return this._tipo !== TipoPregunta.TEXTO_LARGO;
  }

  // Getters
  get idPregunta(): number { return this._idPregunta; }
  get enunciado(): string { return this._enunciado; }
  get opciones(): string[] | null { return this._opciones; }
  get tipo(): TipoPregunta { return this._tipo; }
  get bloque(): string { return this._bloque; }
  get orden(): number { return this._orden; }
  get dependencias(): DependenciaPregunta[] { return this._dependencias; }

  public toJSON() {
    return {
      idPregunta: this._idPregunta,
      enunciado: this._enunciado,
      opciones: this._opciones,
      tipo: this._tipo,
      bloque: this._bloque,
      orden: this._orden,
      tieneDependencias: this._dependencias.length > 0
    };
  }
}
