import { z } from 'zod';
import { Genero, EstadoCivil } from '../types/enums';

/**
 * Schema de validación para Usuario usando Zod
 */
export const UsuarioSchema = z.object({
  rut: z.string().regex(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, 'RUT inválido'),
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  fechaNacimiento: z.date(),
  genero: z.nativeEnum(Genero),
  estadoCivil: z.nativeEnum(EstadoCivil)
});

/**
 * Modelo de dominio: Usuario
 * Representa a un usuario del sistema con sus datos demográficos
 * Validado desde Registro Civil
 */
export class Usuario {
  private _rut: string;
  private _nombre: string;
  private _fechaNacimiento: Date;
  private _genero: Genero;
  private _estadoCivil: EstadoCivil;

  /**
   * Constructor privado para forzar el uso del factory method
   */
  private constructor(
    rut: string,
    nombre: string,
    fechaNacimiento: Date,
    genero: Genero,
    estadoCivil: EstadoCivil
  ) {
    this._rut = rut;
    this._nombre = nombre;
    this._fechaNacimiento = fechaNacimiento;
    this._genero = genero;
    this._estadoCivil = estadoCivil;
  }

  /**
   * Factory method para crear un Usuario con validación
   * @throws {z.ZodError} Si los datos no son válidos
   */
  static create(data: {
    rut: string;
    nombre: string;
    fechaNacimiento: Date;
    genero: Genero;
    estadoCivil: EstadoCivil;
  }): Usuario {
    // Validar con Zod
    const validated = UsuarioSchema.parse(data);
    
    return new Usuario(
      validated.rut,
      validated.nombre,
      validated.fechaNacimiento,
      validated.genero,
      validated.estadoCivil
    );
  }

  /**
   * Calcula la edad del usuario en años
   */
  public calcularEdad(): number {
    const hoy = new Date();
    const edad = hoy.getFullYear() - this._fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - this._fechaNacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < this._fechaNacimiento.getDate())) {
      return edad - 1;
    }
    
    return edad;
  }

  /**
   * Verifica si el usuario es mayor de edad
   */
  public esMayorDeEdad(): boolean {
    return this.calcularEdad() >= 18;
  }

  /**
   * Determina el grupo etario para análisis de riesgo
   */
  public getGrupoEtario(): string {
    const edad = this.calcularEdad();
    
    if (edad < 25) return 'Joven';
    if (edad < 40) return 'Adulto Joven';
    if (edad < 60) return 'Adulto';
    return 'Adulto Mayor';
  }

  // Getters
  get rut(): string { return this._rut; }
  get nombre(): string { return this._nombre; }
  get fechaNacimiento(): Date { return this._fechaNacimiento; }
  get genero(): Genero { return this._genero; }
  get estadoCivil(): EstadoCivil { return this._estadoCivil; }

  /**
   * Convierte el usuario a un objeto plano para serialización
   */
  public toJSON() {
    return {
      rut: this._rut,
      nombre: this._nombre,
      fechaNacimiento: this._fechaNacimiento.toISOString(),
      genero: this._genero,
      estadoCivil: this._estadoCivil,
      edad: this.calcularEdad()
    };
  }
}
