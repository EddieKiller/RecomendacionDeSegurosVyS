import { z } from 'zod';
import { TipoSeguro } from '../types/enums';
import { PerfilRiesgo } from './PerfilRiesgo';

/**
 * Schema de validación para Seguro
 */
export const SeguroSchema = z.object({
  idSeguro: z.number().positive(),
  nombre: z.string().min(3),
  tipo: z.nativeEnum(TipoSeguro),
  cobertura: z.string().min(10),
  prima: z.number().positive(),
  idAseguradora: z.number().positive()
});

/**
 * Interfaz para validadores de elegibilidad
 */
export interface ElegibilidadValidator {
  validar(perfil: PerfilRiesgo): { elegible: boolean; razon?: string };
}

/**
 * Validador de edad para seguros de vida
 */
export class EdadVidaValidator implements ElegibilidadValidator {
  constructor(private edadMinima: number = 18, private edadMaxima: number = 70) {}
  
  validar(perfil: PerfilRiesgo): { elegible: boolean; razon?: string } {
    if (perfil.edad < this.edadMinima) {
      return { elegible: false, razon: `Edad mínima requerida: ${this.edadMinima} años` };
    }
    if (perfil.edad > this.edadMaxima) {
      return { elegible: false, razon: `Edad máxima permitida: ${this.edadMaxima} años` };
    }
    return { elegible: true };
  }
}

/**
 * Validador de preexistencias para seguros de salud
 */
export class PreexistenciasValidator implements ElegibilidadValidator {
  validar(perfil: PerfilRiesgo): { elegible: boolean; razon?: string } {
    // Si tiene muchos factores de riesgo, puede no ser elegible o tener prima aumentada
    if (perfil.factoresRiesgo.length > 3) {
      return { 
        elegible: true, // Elegible pero con restricciones
        razon: 'Cobertura sujeta a evaluación médica por preexistencias'
      };
    }
    return { elegible: true };
  }
}

/**
 * Abstract Factory: Interfaz para familias de seguros
 */
export interface SeguroFactory {
  crearSeguro(data: any): Seguro;
  getValidadores(): ElegibilidadValidator[];
}

/**
 * Factory concreta para Seguros de Vida
 */
export class SeguroVidaFactory implements SeguroFactory {
  crearSeguro(data: any): Seguro {
    const seguro = Seguro.create(data);
    // Configuración específica para seguros de vida
    seguro.agregarValidador(new EdadVidaValidator(18, 70));
    return seguro;
  }
  
  getValidadores(): ElegibilidadValidator[] {
    return [new EdadVidaValidator()];
  }
}

/**
 * Factory concreta para Seguros de Salud
 */
export class SeguroSaludFactory implements SeguroFactory {
  crearSeguro(data: any): Seguro {
    const seguro = Seguro.create(data);
    // Configuración específica para seguros de salud
    seguro.agregarValidador(new PreexistenciasValidator());
    return seguro;
  }
  
  getValidadores(): ElegibilidadValidator[] {
    return [new PreexistenciasValidator()];
  }
}

/**
 * Modelo de dominio: Seguro
 * Representa un producto de seguro con sus características y reglas
 * Implementa Abstract Factory para familias Vida/Salud
 */
export class Seguro {
  private _idSeguro: number;
  private _nombre: string;
  private _tipo: TipoSeguro;
  private _cobertura: string;
  private _prima: number;
  private _idAseguradora: number;
  private _validadores: ElegibilidadValidator[];

  private constructor(
    idSeguro: number,
    nombre: string,
    tipo: TipoSeguro,
    cobertura: string,
    prima: number,
    idAseguradora: number
  ) {
    this._idSeguro = idSeguro;
    this._nombre = nombre;
    this._tipo = tipo;
    this._cobertura = cobertura;
    this._prima = prima;
    this._idAseguradora = idAseguradora;
    this._validadores = [];
  }

  /**
   * Factory method con validación
   */
  static create(data: {
    idSeguro: number;
    nombre: string;
    tipo: TipoSeguro;
    cobertura: string;
    prima: number;
    idAseguradora: number;
  }): Seguro {
    const validated = SeguroSchema.parse(data);
    
    return new Seguro(
      validated.idSeguro,
      validated.nombre,
      validated.tipo,
      validated.cobertura,
      validated.prima,
      validated.idAseguradora
    );
  }

  /**
   * Factory method estático que usa Abstract Factory
   */
  static createFromFactory(tipo: TipoSeguro, data: any): Seguro {
    let factory: SeguroFactory;
    
    switch (tipo) {
      case TipoSeguro.VIDA:
        factory = new SeguroVidaFactory();
        break;
      case TipoSeguro.SALUD:
        factory = new SeguroSaludFactory();
        break;
      default:
        throw new Error(`Tipo de seguro no soportado: ${tipo}`);
    }
    
    return factory.crearSeguro(data);
  }

  /**
   * Agrega un validador de elegibilidad
   */
  public agregarValidador(validador: ElegibilidadValidator): void {
    this._validadores.push(validador);
  }

  /**
   * Verifica si un perfil es elegible para este seguro
   */
  public esElegible(perfil: PerfilRiesgo): { elegible: boolean; razones: string[] } {
    const razones: string[] = [];
    let elegible = true;
    
    for (const validador of this._validadores) {
      const resultado = validador.validar(perfil);
      if (!resultado.elegible) {
        elegible = false;
      }
      if (resultado.razon) {
        razones.push(resultado.razon);
      }
    }
    
    return { elegible, razones };
  }

  /**
   * Calcula la prima ajustada según el perfil de riesgo
   */
  public calcularPrimaAjustada(perfil: PerfilRiesgo): number {
    let ajuste = 1.0;
    
    // Ajuste por edad
    if (perfil.edad > 50) ajuste += 0.2;
    if (perfil.edad > 60) ajuste += 0.3;
    
    // Ajuste por nivel de riesgo
    switch (perfil.nivelRiesgo) {
      case 'Alto':
        ajuste += 0.3;
        break;
      case 'Muy Alto':
        ajuste += 0.5;
        break;
      case 'Medio':
        ajuste += 0.1;
        break;
    }
    
    // Ajuste por IMC (si es de salud)
    if (this._tipo === TipoSeguro.SALUD && perfil.imc > 30) {
      ajuste += 0.15;
    }
    
    return Math.round(this._prima * ajuste);
  }

  /**
   * Calcula la relevancia de este seguro para un perfil específico (0-100)
   */
  public calcularRelevancia(perfil: PerfilRiesgo): number {
    let puntos = 50; // Base
    
    // Aumentar relevancia según tipo y perfil
    if (this._tipo === TipoSeguro.VIDA && perfil.dependientes > 0) {
      puntos += 20;
    }
    
    if (this._tipo === TipoSeguro.SALUD && perfil.factoresRiesgo.length > 0) {
      puntos += 15;
    }
    
    // Reducir relevancia si no es elegible
    const elegibilidad = this.esElegible(perfil);
    if (!elegibilidad.elegible) {
      puntos -= 30;
    }
    
    // Ajustar por edad
    if (this._tipo === TipoSeguro.VIDA && perfil.edad > 40) {
      puntos += 10;
    }
    
    return Math.max(0, Math.min(100, puntos));
  }

  /**
   * Genera una descripción detallada del seguro
   */
  public getDescripcionCompleta(): string {
    return `${this._nombre} (${this._tipo})\nCobertura: ${this._cobertura}\nPrima base: $${this._prima.toLocaleString('es-CL')}`;
  }

  // Getters
  get idSeguro(): number { return this._idSeguro; }
  get nombre(): string { return this._nombre; }
  get tipo(): TipoSeguro { return this._tipo; }
  get cobertura(): string { return this._cobertura; }
  get prima(): number { return this._prima; }
  get idAseguradora(): number { return this._idAseguradora; }

  public toJSON() {
    return {
      idSeguro: this._idSeguro,
      nombre: this._nombre,
      tipo: this._tipo,
      cobertura: this._cobertura,
      prima: this._prima,
      idAseguradora: this._idAseguradora
    };
  }
}
