/**
 * Enumeraciones globales del dominio
 * Representa todos los tipos y estados posibles en el sistema
 */

export enum NivelRiesgo {
  MUY_BAJO = 'Muy Bajo',
  BAJO = 'Bajo',
  MEDIO = 'Medio',
  ALTO = 'Alto',
  MUY_ALTO = 'Muy Alto'
}

export enum TipoPregunta {
  TEXTO = 'texto',
  TEXTO_LARGO = 'texto_largo',
  NUMERICO = 'numerico',
  BOOLEAN = 'boolean',
  SELECCION_SIMPLE = 'seleccion_simple',
  MULTISELECCION = 'multiseleccion'
}

export enum TipoSeguro {
  VIDA = 'Vida',
  SALUD = 'Salud'
}

export enum EstadoCivil {
  SOLTERO = 'Soltero',
  CASADO = 'Casado',
  DIVORCIADO = 'Divorciado',
  VIUDO = 'Viudo',
  UNION_CIVIL = 'Unión Civil'
}

export enum Genero {
  MASCULINO = 'Masculino',
  FEMENINO = 'Femenino',
  OTRO = 'Otro'
}

export enum EstadoCuestionario {
  INICIADO = 'iniciado',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
  ABANDONADO = 'abandonado'
}

export enum Ocupacion {
  DEPENDIENTE = 'Dependiente',
  INDEPENDIENTE = 'Independiente',
  EMPRESARIO = 'Empresario/a',
  ESTUDIANTE = 'Estudiante',
  DESEMPLEADO = 'Desempleado/a',
  JUBILADO = 'Jubilado/a',
  OTRO = 'Otro'
}

export enum SectorLaboral {
  SALUD = 'Salud',
  CONSTRUCCION = 'Construcción',
  EDUCACION = 'Educación',
  TECNOLOGIA = 'Tecnología',
  COMERCIO = 'Comercio',
  SERVICIOS = 'Servicios',
  OTRO = 'Otro'
}
