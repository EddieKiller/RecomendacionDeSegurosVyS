import { z } from 'zod';

/**
 * Schema de validación para Respuesta
 */
export const RespuestaSchema = z.object({
  idRespuesta: z.number().positive().optional(),
  idCuestionario: z.number().positive(),
  idPregunta: z.number().positive(),
  valor: z.string().min(1, 'La respuesta no puede estar vacía')
});

/**
 * Modelo de dominio: Respuesta
 * Representa la respuesta de un usuario a una pregunta específica
 */
export class Respuesta {
  private _idRespuesta?: number;
  private _idCuestionario: number;
  private _idPregunta: number;
  private _valor: string;
  private _fechaRespuesta: Date;

  private constructor(
    idCuestionario: number,
    idPregunta: number,
    valor: string,
    idRespuesta?: number
  ) {
    this._idCuestionario = idCuestionario;
    this._idPregunta = idPregunta;
    this._valor = valor;
    this._idRespuesta = idRespuesta;
    this._fechaRespuesta = new Date();
  }

  /**
   * Factory method con validación
   */
  static create(data: {
    idCuestionario: number;
    idPregunta: number;
    valor: string;
    idRespuesta?: number;
  }): Respuesta {
    const validated = RespuestaSchema.parse(data);
    
    return new Respuesta(
      validated.idCuestionario,
      validated.idPregunta,
      validated.valor,
      validated.idRespuesta
    );
  }

  /**
   * Actualiza el valor de la respuesta
   */
  public actualizarValor(nuevoValor: string): void {
    if (!nuevoValor || nuevoValor.trim().length === 0) {
      throw new Error('El nuevo valor no puede estar vacío');
    }
    this._valor = nuevoValor;
    this._fechaRespuesta = new Date();
  }

  /**
   * Obtiene el valor como número (para respuestas numéricas)
   */
  public getValorNumerico(): number | null {
    const numero = parseFloat(this._valor);
    return isNaN(numero) ? null : numero;
  }

  /**
   * Obtiene el valor como boolean (para respuestas Sí/No)
   */
  public getValorBoolean(): boolean | null {
    if (this._valor === 'Sí' || this._valor === 'true') return true;
    if (this._valor === 'No' || this._valor === 'false') return false;
    return null;
  }

  /**
   * Obtiene el valor como array (para respuestas múltiples)
   */
  public getValorArray(): string[] | null {
    try {
      const parsed = JSON.parse(this._valor);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si la respuesta es válida en el contexto de otras respuestas
   * Validación de coherencia entre respuestas
   */
  public validarCoherencia(otrasRespuestas: Respuesta[]): { valid: boolean; error?: string } {
    // Ejemplo: Si dice que no tiene dependientes (P0101='No'), no debería responder P0102
    // Esta lógica será expandida según reglas de negocio específicas
    
    // Por ahora, validación básica
    return { valid: true };
  }

  // Getters
  get idRespuesta(): number | undefined { return this._idRespuesta; }
  get idCuestionario(): number { return this._idCuestionario; }
  get idPregunta(): number { return this._idPregunta; }
  get valor(): string { return this._valor; }
  get fechaRespuesta(): Date { return this._fechaRespuesta; }

  public toJSON() {
    return {
      idRespuesta: this._idRespuesta,
      idCuestionario: this._idCuestionario,
      idPregunta: this._idPregunta,
      valor: this._valor,
      fechaRespuesta: this._fechaRespuesta.toISOString()
    };
  }
}
