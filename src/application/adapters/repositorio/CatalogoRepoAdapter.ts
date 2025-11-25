import { Seguro } from '../../../domain/model/Seguro';
import { CatalogoRepository } from '../../../domain/port/repositorio/CatalogoRepository';
import { TipoSeguro } from '../../../domain/types/enums';

/**
 * Adapter para el repositorio de Catálogo de Seguros
 * Delega a la implementación de infraestructura
 */
export class CatalogoRepoAdapter implements CatalogoRepository {
  
  constructor(private implementation: CatalogoRepository) {
    console.log('[CatalogoRepoAdapter] Inicializado');
  }

  async getAllSeguros(): Promise<Seguro[]> {
    console.log('[CatalogoRepoAdapter] Cargando catálogo completo de seguros');
    return await this.implementation.getAllSeguros();
  }

  async findById(idSeguro: number): Promise<Seguro | null> {
    console.log(`[CatalogoRepoAdapter] Buscando seguro: ${idSeguro}`);
    return await this.implementation.findById(idSeguro);
  }

  async findByTipo(tipo: TipoSeguro): Promise<Seguro[]> {
    console.log(`[CatalogoRepoAdapter] Buscando seguros de tipo: ${tipo}`);
    return await this.implementation.findByTipo(tipo);
  }

  async findByAseguradora(idAseguradora: number): Promise<Seguro[]> {
    console.log(`[CatalogoRepoAdapter] Buscando seguros de aseguradora: ${idAseguradora}`);
    return await this.implementation.findByAseguradora(idAseguradora);
  }

  async findByRangoPrima(min: number, max: number): Promise<Seguro[]> {
    console.log(`[CatalogoRepoAdapter] Buscando seguros en rango: $${min} - $${max}`);
    return await this.implementation.findByRangoPrima(min, max);
  }

  async getAseguradora(idAseguradora: number): Promise<{ id: number; nombre: string; rutEmpresa: string; } | null> {
    console.log(`[CatalogoRepoAdapter] Buscando aseguradora: ${idAseguradora}`);
    return await this.implementation.getAseguradora(idAseguradora);
  }

  async getAllAseguradoras(): Promise<Array<{ id: number; nombre: string; rutEmpresa: string; }>> {
    console.log('[CatalogoRepoAdapter] Cargando todas las aseguradoras');
    return await this.implementation.getAllAseguradoras();
  }
}
