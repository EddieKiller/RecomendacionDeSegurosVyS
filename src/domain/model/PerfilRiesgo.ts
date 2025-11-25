import { z } from 'zod';
import { NivelRiesgo } from '../types/enums';
import { RiskScore } from '../types/interfaces';

/**
 * Schema de validación para PerfilRiesgo
 */
export const PerfilRiesgoSchema = z.object({
  idPerfil: z.number().positive().optional(),
  idCuestionario: z.number().positive(),
  edad: z.number().min(0).max(120),
  ingresos: z.number().min(0),
  dependientes: z.number().min(0),
  nivelRiesgo: z.nativeEnum(NivelRiesgo)
});

/**
 * Modelo de dominio: PerfilRiesgo
 * Representa la evaluación de riesgo de un usuario basada en el cuestionario
 */
export class PerfilRiesgo {
  private _idPerfil?: number;
  private _idCuestionario: number;
  private _edad: number;
  private _ingresos: number;
  private _dependientes: number;
  private _nivelRiesgo: NivelRiesgo;
  private _imc: number;
  private _scores: RiskScore[];
  private _factoresRiesgo: string[];
  private _factoresProteccion: string[];

  private constructor(
    idCuestionario: number,
    edad: number,
    ingresos: number,
    dependientes: number,
    nivelRiesgo: NivelRiesgo,
    idPerfil?: number
  ) {
    this._idCuestionario = idCuestionario;
    this._edad = edad;
    this._ingresos = ingresos;
    this._dependientes = dependientes;
    this._nivelRiesgo = nivelRiesgo;
    this._idPerfil = idPerfil;
    this._imc = 0;
    this._scores = [];
    this._factoresRiesgo = [];
    this._factoresProteccion = [];
  }

  /**
   * Factory method con validación
   */
  static create(data: {
    idCuestionario: number;
    edad: number;
    ingresos: number;
    dependientes: number;
    nivelRiesgo: NivelRiesgo;
    idPerfil?: number;
  }): PerfilRiesgo {
    const validated = PerfilRiesgoSchema.parse(data);
    
    return new PerfilRiesgo(
      validated.idCuestionario,
      validated.edad,
      validated.ingresos,
      validated.dependientes,
      validated.nivelRiesgo,
      validated.idPerfil
    );
  }

  /**
   * Calcula y establece el IMC del usuario
   * @param peso - Peso en kg
   * @param altura - Altura en cm
   */
  public calcularIMC(peso: number, altura: number): void {
    if (peso <= 0 || altura <= 0) {
      throw new Error('Peso y altura deben ser positivos');
    }
    
    // Convertir altura de cm a metros
    const alturaMetros = altura / 100;
    this._imc = parseFloat((peso / (alturaMetros * alturaMetros)).toFixed(2));
  }

  /**
   * Obtiene la categoría de IMC
   */
  public getCategoriaIMC(): string {
    if (this._imc === 0) return 'No calculado';
    if (this._imc < 18.5) return 'Bajo peso';
    if (this._imc < 25) return 'Peso normal';
    if (this._imc < 30) return 'Sobrepeso';
    if (this._imc < 35) return 'Obesidad Grado I';
    if (this._imc < 40) return 'Obesidad Grado II';
    return 'Obesidad Grado III';
  }

  /**
   * Agrega un score de riesgo por categoría
   */
  public agregarScore(score: RiskScore): void {
    this._scores.push(score);
  }

  /**
   * Calcula el puntaje total ponderado de riesgo
   */
  public calcularPuntajeTotal(): number {
    if (this._scores.length === 0) return 0;
    
    return this._scores.reduce((total, score) => {
      return total + (score.puntos * score.peso);
    }, 0);
  }

  /**
   * Agrega un factor de riesgo identificado
   */
  public agregarFactorRiesgo(factor: string): void {
    if (!this._factoresRiesgo.includes(factor)) {
      this._factoresRiesgo.push(factor);
    }
  }

  /**
   * Agrega un factor de protección identificado
   */
  public agregarFactorProteccion(factor: string): void {
    if (!this._factoresProteccion.includes(factor)) {
      this._factoresProteccion.push(factor);
    }
  }

  /**
   * Determina si es un perfil de alto riesgo
   */
  public esAltoRiesgo(): boolean {
    return this._nivelRiesgo === NivelRiesgo.ALTO || 
           this._nivelRiesgo === NivelRiesgo.MUY_ALTO;
  }

  /**
   * Obtiene recomendaciones generales basadas en el perfil
   */
  public getRecomendacionesGenerales(): string[] {
    const recomendaciones: string[] = [];
    
    if (this._edad > 50) {
      recomendaciones.push('Recomendable seguro de vida con cobertura extendida');
    }
    
    if (this._dependientes > 0) {
      recomendaciones.push('Considerar protección familiar');
    }
    
    if (this._imc > 30) {
      recomendaciones.push('Evaluar seguro de salud con cobertura para enfermedades crónicas');
    }
    
    if (this.esAltoRiesgo()) {
      recomendaciones.push('Priorizar coberturas de salud integrales');
    }
    
    return recomendaciones;
  }

  /**
   * Obtiene un resumen del perfil de riesgo
   */
  public getResumen(): string {
    const partes = [
      `Nivel de riesgo: ${this._nivelRiesgo}`,
      `Edad: ${this._edad} años`,
      `Dependientes: ${this._dependientes}`,
      `IMC: ${this._imc > 0 ? `${this._imc} (${this.getCategoriaIMC()})` : 'No calculado'}`
    ];
    
    return partes.join(' | ');
  }

  // Getters
  get idPerfil(): number | undefined { return this._idPerfil; }
  get idCuestionario(): number { return this._idCuestionario; }
  get edad(): number { return this._edad; }
  get ingresos(): number { return this._ingresos; }
  get dependientes(): number { return this._dependientes; }
  get nivelRiesgo(): NivelRiesgo { return this._nivelRiesgo; }
  get imc(): number { return this._imc; }
  get scores(): RiskScore[] { return this._scores; }
  get factoresRiesgo(): string[] { return this._factoresRiesgo; }
  get factoresProteccion(): string[] { return this._factoresProteccion; }

  // Setter para actualizar nivel de riesgo después de evaluación
  set nivelRiesgo(nivel: NivelRiesgo) {
    this._nivelRiesgo = nivel;
  }

  public toJSON() {
    return {
      idPerfil: this._idPerfil,
      idCuestionario: this._idCuestionario,
      edad: this._edad,
      ingresos: this._ingresos,
      dependientes: this._dependientes,
      nivelRiesgo: this._nivelRiesgo,
      imc: this._imc,
      categoriaIMC: this.getCategoriaIMC(),
      puntajeTotal: this.calcularPuntajeTotal(),
      factoresRiesgo: this._factoresRiesgo,
      factoresProteccion: this._factoresProteccion,
      resumen: this.getResumen()
    };
  }
}
