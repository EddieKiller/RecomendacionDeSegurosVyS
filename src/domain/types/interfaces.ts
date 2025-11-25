/**
 * Interfaces y tipos globales del dominio
 */

import { TipoPregunta } from './enums';

/**
 * Datos demográficos del usuario obtenidos del Registro Civil
 */
export interface DatosRegistroCivil {
  rut: string;
  nombre: string;
  fechaNacimiento: Date;
  genero: string;
  estadoCivil: string;
}

/**
 * Configuración de dependencia entre preguntas
 */
export interface DependenciaPregunta {
  idPreguntaPadre: number;
  valorEsperado: string | string[];
  operador?: 'equals' | 'contains' | 'not_equals';
}

/**
 * Resultado de validación de respuesta
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Contexto para evaluación de riesgo
 */
export interface RiskContext {
  edad: number;
  imc: number;
  ocupacion: string;
  fumador: boolean;
  enfermedadesCronicas: string[];
  dependientes: number;
  [key: string]: any;
}

/**
 * Puntuación de riesgo por categoría
 */
export interface RiskScore {
  categoria: string;
  puntos: number;
  peso: number;
  justificacion: string;
}

/**
 * Resultado de recomendación con justificación
 */
export interface RecomendacionResult {
  seguro: any; // Será tipado con Seguro
  relevancia: number;
  justificacion: string[];
  prioridad: number;
}
