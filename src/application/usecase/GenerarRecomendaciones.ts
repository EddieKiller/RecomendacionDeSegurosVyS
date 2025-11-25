import { Seguro } from '../../domain/model/Seguro';
import { PerfilRiesgo } from '../../domain/model/PerfilRiesgo';
import { TipoSeguro } from '../../domain/types/enums';
import { RecomendacionResult } from '../../domain/types/interfaces';
import { CatalogoRepository } from '../../domain/port/repositorio/CatalogoRepository';

/**
 * Patrón Builder: Constructor de recomendaciones paso a paso
 */
class RecomendacionBuilder {
  private seguro?: Seguro;
  private perfil?: PerfilRiesgo;
  private relevancia: number = 0;
  private justificaciones: string[] = [];
  private prioridad: number = 0;

  /**
   * Establece el seguro a recomendar
   */
  public setSeguro(seguro: Seguro): RecomendacionBuilder {
    this.seguro = seguro;
    return this;
  }

  /**
   * Establece el perfil de riesgo
   */
  public setPerfilRiesgo(perfil: PerfilRiesgo): RecomendacionBuilder {
    this.perfil = perfil;
    return this;
  }

  /**
   * Calcula la relevancia del seguro para el perfil
   */
  public calculateRelevancia(): RecomendacionBuilder {
    if (!this.seguro || !this.perfil) {
      throw new Error('Seguro y perfil deben estar establecidos');
    }

    this.relevancia = this.seguro.calcularRelevancia(this.perfil);
    console.log(`[RecomendacionBuilder] Relevancia calculada: ${this.relevancia} para ${this.seguro.nombre}`);
    
    return this;
  }

  /**
   * Genera las justificaciones de por qué este seguro es recomendado
   */
  public generateJustificacion(): RecomendacionBuilder {
    if (!this.seguro || !this.perfil) {
      throw new Error('Seguro y perfil deben estar establecidos');
    }

    this.justificaciones = [];

    // Justificación por tipo de seguro y perfil
    if (this.seguro.tipo === TipoSeguro.VIDA) {
      if (this.perfil.dependientes > 0) {
        this.justificaciones.push(
          `Protección fundamental para tu familia (${this.perfil.dependientes} dependientes)`
        );
      }
      
      if (this.perfil.edad > 40) {
        this.justificaciones.push(
          'Edad óptima para asegurar protección a largo plazo'
        );
      }
    }

    if (this.seguro.tipo === TipoSeguro.SALUD) {
      if (this.perfil.factoresRiesgo.length > 0) {
        this.justificaciones.push(
          `Cobertura importante considerando factores de riesgo identificados (${this.perfil.factoresRiesgo.length})`
        );
      }
      
      if (this.perfil.imc > 25) {
        this.justificaciones.push(
          'Recomendable para prevención de enfermedades relacionadas con peso'
        );
      }
    }

    // Justificación por elegibilidad
    const elegibilidad = this.seguro.esElegible(this.perfil);
    if (elegibilidad.elegible) {
      this.justificaciones.push('Cumples con todos los requisitos de elegibilidad');
    } else {
      elegibilidad.razones.forEach(razon => {
        this.justificaciones.push(`⚠️ ${razon}`);
      });
    }

    // Justificación por prima
    const primaAjustada = this.seguro.calcularPrimaAjustada(this.perfil);
    const porcentajeAjuste = ((primaAjustada - this.seguro.prima) / this.seguro.prima) * 100;
    
    if (porcentajeAjuste === 0) {
      this.justificaciones.push('Prima base sin ajustes adicionales');
    } else {
      this.justificaciones.push(
        `Prima ajustada según tu perfil: $${primaAjustada.toLocaleString('es-CL')} (${porcentajeAjuste > 0 ? '+' : ''}${porcentajeAjuste.toFixed(0)}%)`
      );
    }

    // Justificación por nivel de riesgo
    if (this.perfil.esAltoRiesgo() && this.seguro.tipo === TipoSeguro.SALUD) {
      this.justificaciones.push(
        'Altamente recomendado por tu perfil de riesgo elevado'
      );
    }

    console.log(`[RecomendacionBuilder] Generadas ${this.justificaciones.length} justificaciones`);
    
    return this;
  }

  /**
   * Calcula la prioridad de la recomendación
   */
  public calculatePrioridad(): RecomendacionBuilder {
    if (!this.seguro || !this.perfil) {
      throw new Error('Seguro y perfil deben estar establecidos');
    }

    // Prioridad base según relevancia
    this.prioridad = Math.floor(this.relevancia / 10);

    // Aumentar prioridad si es de vida y tiene dependientes
    if (this.seguro.tipo === TipoSeguro.VIDA && this.perfil.dependientes > 0) {
      this.prioridad += 2;
    }

    // Aumentar prioridad si es de salud y tiene alto riesgo
    if (this.seguro.tipo === TipoSeguro.SALUD && this.perfil.esAltoRiesgo()) {
      this.prioridad += 3;
    }

    console.log(`[RecomendacionBuilder] Prioridad calculada: ${this.prioridad}`);
    
    return this;
  }

  /**
   * Construye la recomendación final
   */
  public build(): RecomendacionResult {
    if (!this.seguro || !this.perfil) {
      throw new Error('Seguro y perfil deben estar establecidos');
    }

    return {
      seguro: this.seguro,
      relevancia: this.relevancia,
      justificacion: this.justificaciones,
      prioridad: this.prioridad
    };
  }

  /**
   * Resetea el builder para reutilización
   */
  public reset(): RecomendacionBuilder {
    this.seguro = undefined;
    this.perfil = undefined;
    this.relevancia = 0;
    this.justificaciones = [];
    this.prioridad = 0;
    return this;
  }
}

/**
 * CU-4: Generar Recomendaciones
 * Implementa RF-003: ranking por relevancia + justificabilidad
 * 
 * Patrón implementado:
 * - Builder: Construcción paso a paso de recomendaciones con justificación
 * 
 * @example
 * const useCase = new GenerarRecomendaciones(catalogoRepo);
 * const recomendaciones = await useCase.generar(perfil);
 * recomendaciones.forEach(rec => {
 *   console.log(rec.seguro.nombre, rec.justificacion);
 * });
 */
export class GenerarRecomendaciones {
  private builder: RecomendacionBuilder;

  constructor(private catalogoRepo: CatalogoRepository) {
    this.builder = new RecomendacionBuilder();
  }

  /**
   * Genera recomendaciones personalizadas para un perfil de riesgo
   * @returns Array de recomendaciones ordenadas por relevancia
   */
  public async generar(perfil: PerfilRiesgo): Promise<RecomendacionResult[]> {
    console.log('[GenerarRecomendaciones] Iniciando generación de recomendaciones');
    console.log(`[GenerarRecomendaciones] Perfil: ${perfil.nivelRiesgo}, Edad: ${perfil.edad}, Dependientes: ${perfil.dependientes}`);

    // 1. Obtener catálogo completo de seguros
    const todosLosSeguros = await this.catalogoRepo.getAllSeguros();
    console.log(`[GenerarRecomendaciones] Catálogo cargado: ${todosLosSeguros.length} seguros`);

    // 2. Construir recomendaciones para cada seguro usando Builder
    const recomendaciones: RecomendacionResult[] = [];

    for (const seguro of todosLosSeguros) {
      try {
        const recomendacion = this.builder
          .reset()
          .setSeguro(seguro)
          .setPerfilRiesgo(perfil)
          .calculateRelevancia()
          .generateJustificacion()
          .calculatePrioridad()
          .build();

        recomendaciones.push(recomendacion);
      } catch (error) {
        console.error(`[GenerarRecomendaciones] Error procesando seguro ${seguro.idSeguro}:`, error);
      }
    }

    // 3. Aplicar filtros
    const recomendacionesFiltradas = this.aplicarFiltros(recomendaciones);
    console.log(`[GenerarRecomendaciones] Recomendaciones tras filtros: ${recomendacionesFiltradas.length}`);

    // 4. Ordenar por ranking (relevancia + prioridad)
    const recomendacionesOrdenadas = this.ordenarPorRanking(recomendacionesFiltradas);

    // 5. Tomar top recomendaciones
    const topRecomendaciones = recomendacionesOrdenadas.slice(0, 5);
    
    console.log('[GenerarRecomendaciones] Top 5 recomendaciones generadas:');
    topRecomendaciones.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.seguro.nombre} (Relevancia: ${rec.relevancia}, Prioridad: ${rec.prioridad})`);
    });

    return topRecomendaciones;
  }

  /**
   * Aplica filtros para eliminar recomendaciones no elegibles o de baja relevancia
   */
  private aplicarFiltros(recomendaciones: RecomendacionResult[]): RecomendacionResult[] {
    return recomendaciones.filter(rec => {
      // Filtrar seguros con relevancia muy baja
      if (rec.relevancia < 30) {
        console.log(`[GenerarRecomendaciones] Filtrado por baja relevancia: ${rec.seguro.nombre}`);
        return false;
      }

      // Mantener todas las demás
      return true;
    });
  }

  /**
   * Ordena las recomendaciones por un ranking combinado
   */
  private ordenarPorRanking(recomendaciones: RecomendacionResult[]): RecomendacionResult[] {
    return recomendaciones.sort((a, b) => {
      // Ranking = (Relevancia * 0.7) + (Prioridad * 10 * 0.3)
      const rankingA = (a.relevancia * 0.7) + (a.prioridad * 10 * 0.3);
      const rankingB = (b.relevancia * 0.7) + (b.prioridad * 10 * 0.3);
      
      return rankingB - rankingA; // Orden descendente
    });
  }

  /**
   * Genera recomendaciones por tipo específico de seguro
   */
  public async generarPorTipo(perfil: PerfilRiesgo, tipo: TipoSeguro): Promise<RecomendacionResult[]> {
    console.log(`[GenerarRecomendaciones] Generando recomendaciones solo para tipo: ${tipo}`);
    
    const seguros = await this.catalogoRepo.findByTipo(tipo);
    const recomendaciones: RecomendacionResult[] = [];

    for (const seguro of seguros) {
      const recomendacion = this.builder
        .reset()
        .setSeguro(seguro)
        .setPerfilRiesgo(perfil)
        .calculateRelevancia()
        .generateJustificacion()
        .calculatePrioridad()
        .build();

      recomendaciones.push(recomendacion);
    }

    return this.ordenarPorRanking(recomendaciones);
  }

  /**
   * Compara dos seguros específicos para el perfil
   */
  public async compararSeguros(
    perfil: PerfilRiesgo,
    idSeguro1: number,
    idSeguro2: number
  ): Promise<{
    seguro1: RecomendacionResult;
    seguro2: RecomendacionResult;
    mejorOpcion: number;
    razon: string;
  }> {
    const seguro1 = await this.catalogoRepo.findById(idSeguro1);
    const seguro2 = await this.catalogoRepo.findById(idSeguro2);

    if (!seguro1 || !seguro2) {
      throw new Error('Uno o ambos seguros no encontrados');
    }

    const rec1 = this.builder
      .reset()
      .setSeguro(seguro1)
      .setPerfilRiesgo(perfil)
      .calculateRelevancia()
      .generateJustificacion()
      .calculatePrioridad()
      .build();

    const rec2 = this.builder
      .reset()
      .setSeguro(seguro2)
      .setPerfilRiesgo(perfil)
      .calculateRelevancia()
      .generateJustificacion()
      .calculatePrioridad()
      .build();

    const mejorOpcion = rec1.relevancia >= rec2.relevancia ? idSeguro1 : idSeguro2;
    const razon = rec1.relevancia >= rec2.relevancia
      ? `${seguro1.nombre} tiene mayor relevancia (${rec1.relevancia} vs ${rec2.relevancia})`
      : `${seguro2.nombre} tiene mayor relevancia (${rec2.relevancia} vs ${rec1.relevancia})`;

    return { seguro1: rec1, seguro2: rec2, mejorOpcion, razon };
  }
}
