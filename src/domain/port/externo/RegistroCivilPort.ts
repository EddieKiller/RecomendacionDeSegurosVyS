import { DatosRegistroCivil } from '../../types/interfaces';

/**
 * Port: Registro Civil (mockeado desde BD según restricciones)
 * Define el contrato para consultas al Registro Civil
 * 
 * NOTA: Según restricciones del proyecto, no se integra con el Registro Civil real.
 * Los datos se consultan desde una tabla mock en la base de datos.
 */
export interface RegistroCivilPort {
  /**
   * Valida si un RUT existe y tiene formato correcto
   * @param rut - RUT a validar
   * @returns true si el RUT es válido y existe
   */
  validarRut(rut: string): Promise<boolean>;

  /**
   * Obtiene los datos básicos de una persona desde el Registro Civil
   * @param rut - RUT de la persona
   * @returns Datos de la persona o null si no existe
   */
  obtenerDatos(rut: string): Promise<DatosRegistroCivil | null>;

  /**
   * Verifica si una persona es mayor de edad
   * @param rut - RUT de la persona
   * @returns true si es mayor de 18 años
   */
  esMayorDeEdad(rut: string): Promise<boolean>;
}
