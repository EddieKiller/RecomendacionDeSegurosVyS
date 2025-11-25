import { PerfilRiesgo } from '../../domain/model/PerfilRiesgo';
import { Cuestionario } from '../../domain/model/Cuestionario';
import { Usuario } from '../../domain/model/Usuario';
import { NivelRiesgo } from '../../domain/types/enums';
import { RiskContext, RiskScore } from '../../domain/types/interfaces';

/**
 * Patrón Chain of Responsibility: Evaluador base abstracto
 */
abstract class RiskEvaluator {
  protected nextEvaluator?: RiskEvaluator;

  /**
   * Establece el siguiente evaluador en la cadena
   */
  public setNext(evaluator: RiskEvaluator): RiskEvaluator {
    this.nextEvaluator = evaluator;
    return evaluator;
  }

  /**
   * Evalúa el riesgo y pasa al siguiente evaluador
   */
  public abstract evaluar(contexto: RiskContext, perfil: PerfilRiesgo): void;

  /**
   * Invoca al siguiente evaluador en la cadena
   */
  protected invocarSiguiente(contexto: RiskContext, perfil: PerfilRiesgo): void {
    if (this.nextEvaluator) {
      this.nextEvaluator.evaluar(contexto, perfil);
    }
  }
}

/**
 * Evaluador 1: Riesgo por Edad
 */
class EdadEvaluator extends RiskEvaluator {
  evaluar(contexto: RiskContext, perfil: PerfilRiesgo): void {
    console.log('[EdadEvaluator] Evaluando riesgo por edad...');
    
    let puntos = 0;
    let justificacion = '';

    if (contexto.edad < 25) {
      puntos = 10;
      justificacion = 'Edad joven con bajo riesgo actuarial';
      perfil.agregarFactorProteccion('Edad menor a 25 años');
    } else if (contexto.edad < 40) {
      puntos = 20;
      justificacion = 'Edad adulta joven con riesgo moderado bajo';
    } else if (contexto.edad < 60) {
      puntos = 40;
      justificacion = 'Edad adulta con riesgo moderado';
    } else {
      puntos = 60;
      justificacion = 'Edad adulta mayor con mayor riesgo';
      perfil.agregarFactorRiesgo('Edad mayor a 60 años');
    }

    perfil.agregarScore({
      categoria: 'Edad',
      puntos,
      peso: 0.25, // 25% del total
      justificacion
    });

    this.invocarSiguiente(contexto, perfil);
  }
}

/**
 * Evaluador 2: Riesgo por Salud (Enfermedades crónicas, hospitalizaciones)
 */
class SaludEvaluator extends RiskEvaluator {
  evaluar(contexto: RiskContext, perfil: PerfilRiesgo): void {
    console.log('[SaludEvaluator] Evaluando riesgo por salud...');
    
    let puntos = 0;
    let justificacion = '';

    const enfermedades = contexto.enfermedadesCronicas || [];
    
    if (enfermedades.length === 0) {
      puntos = 10;
      justificacion = 'Sin enfermedades crónicas diagnosticadas';
      perfil.agregarFactorProteccion('Sin enfermedades crónicas');
    } else if (enfermedades.length === 1) {
      puntos = 40;
      justificacion = `Una enfermedad crónica: ${enfermedades[0]}`;
      perfil.agregarFactorRiesgo(`Enfermedad crónica: ${enfermedades[0]}`);
    } else {
      puntos = 70;
      justificacion = `Múltiples enfermedades crónicas (${enfermedades.length})`;
      enfermedades.forEach(enf => perfil.agregarFactorRiesgo(`Enfermedad: ${enf}`));
    }

    perfil.agregarScore({
      categoria: 'Salud',
      puntos,
      peso: 0.35, // 35% del total
      justificacion
    });

    this.invocarSiguiente(contexto, perfil);
  }
}

/**
 * Evaluador 3: Riesgo por Estilo de Vida (Tabaco, alcohol, ejercicio)
 */
class EstiloVidaEvaluator extends RiskEvaluator {
  evaluar(contexto: RiskContext, perfil: PerfilRiesgo): void {
    console.log('[EstiloVidaEvaluator] Evaluando riesgo por estilo de vida...');
    
    let puntos = 0;
    let justificacion = '';

    // Evaluar tabaquismo
    if (contexto.fumador) {
      puntos += 30;
      justificacion = 'Fumador activo';
      perfil.agregarFactorRiesgo('Fumador');
    } else {
      perfil.agregarFactorProteccion('No fumador');
    }

    // Evaluar IMC
    if (contexto.imc > 30) {
      puntos += 20;
      justificacion += (justificacion ? ' | ' : '') + 'Obesidad (IMC > 30)';
      perfil.agregarFactorRiesgo('Obesidad');
    } else if (contexto.imc >= 25 && contexto.imc <= 30) {
      puntos += 10;
      justificacion += (justificacion ? ' | ' : '') + 'Sobrepeso';
    } else {
      perfil.agregarFactorProteccion('Peso saludable');
    }

    // Si no hay factores de riesgo
    if (puntos === 0) {
      puntos = 10;
      justificacion = 'Estilo de vida saludable';
    }

    perfil.agregarScore({
      categoria: 'Estilo de Vida',
      puntos,
      peso: 0.20, // 20% del total
      justificacion
    });

    this.invocarSiguiente(contexto, perfil);
  }
}

/**
 * Evaluador 4: Riesgo por Ocupación
 */
class OcupacionEvaluator extends RiskEvaluator {
  evaluar(contexto: RiskContext, perfil: PerfilRiesgo): void {
    console.log('[OcupacionEvaluator] Evaluando riesgo por ocupación...');
    
    let puntos = 0;
    let justificacion = '';

    const ocupacion = contexto.ocupacion || '';
    const riesgosLaborales = contexto.riesgosLaborales || false;

    if (riesgosLaborales) {
      puntos = 50;
      justificacion = 'Trabajo con riesgos físicos importantes';
      perfil.agregarFactorRiesgo('Ocupación de alto riesgo');
    } else if (ocupacion === 'Construcción') {
      puntos = 40;
      justificacion = 'Sector construcción';
      perfil.agregarFactorRiesgo('Sector de riesgo');
    } else if (ocupacion === 'Tecnología' || ocupacion === 'Educación') {
      puntos = 10;
      justificacion = 'Ocupación de bajo riesgo';
      perfil.agregarFactorProteccion('Ocupación segura');
    } else {
      puntos = 20;
      justificacion = 'Ocupación de riesgo estándar';
    }

    perfil.agregarScore({
      categoria: 'Ocupación',
      puntos,
      peso: 0.20, // 20% del total
      justificacion
    });

    this.invocarSiguiente(contexto, perfil);
  }
}

/**
 * CU-3: Evaluar Perfil de Riesgo
 * Implementa RF-003: evaluación de perfil considerando múltiples variables
 * 
 * Patrón implementado:
 * - Chain of Responsibility: Cadena de evaluadores de riesgo
 *   (Edad → Salud → Estilo de Vida → Ocupación)
 * 
 * @example
 * const useCase = new EvaluarPerfilRiesgo();
 * const perfil = await useCase.evaluar(usuario, cuestionario);
 * console.log(perfil.nivelRiesgo); // 'Medio', 'Alto', etc.
 */
export class EvaluarPerfilRiesgo {
  private cadenaEvaluadores: RiskEvaluator;

  constructor() {
    // Construir la cadena de responsabilidad
    const edadEval = new EdadEvaluator();
    const saludEval = new SaludEvaluator();
    const estiloVidaEval = new EstiloVidaEvaluator();
    const ocupacionEval = new OcupacionEvaluator();

    // Encadenar evaluadores
    edadEval
      .setNext(saludEval)
      .setNext(estiloVidaEval)
      .setNext(ocupacionEval);

    this.cadenaEvaluadores = edadEval;
    
    console.log('[EvaluarPerfilRiesgo] Cadena de evaluadores configurada');
  }

  /**
   * Evalúa el perfil de riesgo de un usuario basado en su cuestionario
   */
  public async evaluar(usuario: Usuario, cuestionario: Cuestionario): Promise<PerfilRiesgo> {
    console.log(`[EvaluarPerfilRiesgo] Iniciando evaluación para ${usuario.rut}`);

    if (!cuestionario.estaCompleto()) {
      throw new Error('El cuestionario debe estar completo para evaluar el perfil');
    }

    // Construir contexto de evaluación desde respuestas
    const respuestasMap = cuestionario.getRespuestasMap();
    const contexto = this.construirContexto(usuario, respuestasMap);

    // Crear perfil inicial
    const perfil = PerfilRiesgo.create({
      idCuestionario: cuestionario.idCuestionario!,
      edad: contexto.edad,
      ingresos: contexto.ingresos || 0,
      dependientes: contexto.dependientes || 0,
      nivelRiesgo: NivelRiesgo.MEDIO // Temporal, se actualizará
    });

    // Calcular IMC
    if (contexto.peso && contexto.altura) {
      perfil.calcularIMC(contexto.peso, contexto.altura);
      contexto.imc = perfil.imc;
    }

    // Ejecutar cadena de evaluadores
    console.log('[EvaluarPerfilRiesgo] Ejecutando cadena de evaluadores...');
    this.cadenaEvaluadores.evaluar(contexto, perfil);

    // Calcular nivel de riesgo final
    const nivelCalculado = this.calcularNivelRiesgo(perfil.calcularPuntajeTotal());
    perfil.nivelRiesgo = nivelCalculado;

    console.log(`[EvaluarPerfilRiesgo] Evaluación completada. Nivel: ${nivelCalculado}`);
    console.log(`[EvaluarPerfilRiesgo] Puntaje total: ${perfil.calcularPuntajeTotal()}`);

    return perfil;
  }

  /**
   * Construye el contexto de evaluación desde las respuestas del cuestionario
   */
  private construirContexto(usuario: Usuario, respuestas: Map<number, string>): RiskContext {
    const contexto: RiskContext = {
      edad: usuario.calcularEdad(),
      imc: 0,
      ocupacion: '',
      fumador: false,
      enfermedadesCronicas: [],
      dependientes: 0
    };

    // P0101: ¿Tienes dependientes?
    const tieneDependientes = respuestas.get(101);
    if (tieneDependientes === 'Sí') {
      // P0102: ¿Cuántos?
      const cantidad = respuestas.get(102);
      contexto.dependientes = this.parseCantidadDependientes(cantidad);
    }

    // P0201: Ocupación
    contexto.ocupacion = respuestas.get(201) || '';

    // P0203: ¿Trabajo con riesgos?
    contexto.riesgosLaborales = respuestas.get(203) === 'Sí';

    // P0301: ¿Fumas?
    contexto.fumador = respuestas.get(301) === 'Sí';

    // P0401: ¿Enfermedades crónicas?
    if (respuestas.get(401) === 'Sí') {
      // P0402: Lista de enfermedades
      const enfermedades = respuestas.get(402);
      if (enfermedades) {
        try {
          contexto.enfermedadesCronicas = JSON.parse(enfermedades);
        } catch {
          contexto.enfermedadesCronicas = [enfermedades];
        }
      }
    }

    // P0601: Peso
    contexto.peso = parseFloat(respuestas.get(601) || '0');

    // P0602: Altura
    contexto.altura = parseFloat(respuestas.get(602) || '0');

    return contexto;
  }

  /**
   * Parsea la cantidad de dependientes desde la respuesta
   */
  private parseCantidadDependientes(respuesta?: string): number {
    if (!respuesta) return 0;
    
    if (respuesta.includes('Más de 3')) return 4;
    
    const numero = parseInt(respuesta);
    return isNaN(numero) ? 0 : numero;
  }

  /**
   * Calcula el nivel de riesgo basado en el puntaje total ponderado
   */
  private calcularNivelRiesgo(puntaje: number): NivelRiesgo {
    if (puntaje < 20) return NivelRiesgo.MUY_BAJO;
    if (puntaje < 35) return NivelRiesgo.BAJO;
    if (puntaje < 50) return NivelRiesgo.MEDIO;
    if (puntaje < 65) return NivelRiesgo.ALTO;
    return NivelRiesgo.MUY_ALTO;
  }
}
