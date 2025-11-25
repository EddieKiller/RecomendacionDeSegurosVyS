import { Seguro } from '../../model/Seguro';
import { TipoSeguro } from '../../types/enums';

/**
 * Port: Repositorio de Catálogo de Seguros
 * Define el contrato para operaciones de consulta del catálogo
 */
export interface CatalogoRepository {
  /**
   * Obtiene todos los seguros disponibles
   * @returns Array de todos los seguros
   */
  getAllSeguros(): Promise<Seguro[]>;

  /**
   * Busca un seguro por su ID
   * @param idSeguro - ID del seguro
   */
  findById(idSeguro: number): Promise<Seguro | null>;

  /**
   * Obtiene seguros filtrados por tipo
   * @param tipo - Tipo de seguro (Vida/Salud)
   */
  findByTipo(tipo: TipoSeguro): Promise<Seguro[]>;

  /**
   * Busca seguros por aseguradora
   * @param idAseguradora - ID de la aseguradora
   */
  findByAseguradora(idAseguradora: number): Promise<Seguro[]>;

  /**
   * Busca seguros dentro de un rango de prima
   * @param min - Prima mínima
   * @param max - Prima máxima
   */
  findByRangoPrima(min: number, max: number): Promise<Seguro[]>;

  /**
   * Obtiene información de una aseguradora
   * @param idAseguradora - ID de la aseguradora
   */
  getAseguradora(idAseguradora: number): Promise<{
    id: number;
    nombre: string;
    rutEmpresa: string;
  } | null>;

  /**
   * Obtiene todas las aseguradoras disponibles
   */
  getAllAseguradoras(): Promise<Array<{
    id: number;
    nombre: string;
    rutEmpresa: string;
  }>>;
}
