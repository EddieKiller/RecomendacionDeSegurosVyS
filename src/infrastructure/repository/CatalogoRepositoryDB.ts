import { Seguro } from '../../domain/model/Seguro';
import { CatalogoRepository } from '../../domain/port/repositorio/CatalogoRepository';
import { TipoSeguro } from '../../domain/types/enums';
import { MySQLAdapter } from '../../application/adapters/database/MySQLAdapter';

export class CatalogoRepositoryDB implements CatalogoRepository {
  private db: MySQLAdapter;

  constructor() {
    this.db = MySQLAdapter.getInstance();
  }

  async getAllSeguros(): Promise<Seguro[]> {
    const sql = 'SELECT * FROM SEGURO';
    const rows = await this.db.query<any>(sql);

    return rows.map(row => Seguro.create({
      idSeguro: row.id_seguro,
      nombre: row.nombre,
      tipo: row.tipo as TipoSeguro,
      cobertura: row.cobertura,
      prima: parseFloat(row.prima),
      idAseguradora: row.id_aseguradora
    }));
  }

  async findById(idSeguro: number): Promise<Seguro | null> {
    const sql = 'SELECT * FROM SEGURO WHERE id_seguro = ?';
    const row = await this.db.queryOne<any>(sql, [idSeguro]);

    if (!row) return null;

    return Seguro.create({
      idSeguro: row.id_seguro,
      nombre: row.nombre,
      tipo: row.tipo as TipoSeguro,
      cobertura: row.cobertura,
      prima: parseFloat(row.prima),
      idAseguradora: row.id_aseguradora
    });
  }

  async findByTipo(tipo: TipoSeguro): Promise<Seguro[]> {
    const sql = 'SELECT * FROM SEGURO WHERE tipo = ?';
    const rows = await this.db.query<any>(sql, [tipo]);

    return rows.map(row => Seguro.create({
      idSeguro: row.id_seguro,
      nombre: row.nombre,
      tipo: row.tipo as TipoSeguro,
      cobertura: row.cobertura,
      prima: parseFloat(row.prima),
      idAseguradora: row.id_aseguradora
    }));
  }

  async findByAseguradora(idAseguradora: number): Promise<Seguro[]> {
    const sql = 'SELECT * FROM SEGURO WHERE id_aseguradora = ?';
    const rows = await this.db.query<any>(sql, [idAseguradora]);

    return rows.map(row => Seguro.create({
      idSeguro: row.id_seguro,
      nombre: row.nombre,
      tipo: row.tipo as TipoSeguro,
      cobertura: row.cobertura,
      prima: parseFloat(row.prima),
      idAseguradora: row.id_aseguradora
    }));
  }

  async findByRangoPrima(min: number, max: number): Promise<Seguro[]> {
    const sql = 'SELECT * FROM SEGURO WHERE prima BETWEEN ? AND ?';
    const rows = await this.db.query<any>(sql, [min, max]);

    return rows.map(row => Seguro.create({
      idSeguro: row.id_seguro,
      nombre: row.nombre,
      tipo: row.tipo as TipoSeguro,
      cobertura: row.cobertura,
      prima: parseFloat(row.prima),
      idAseguradora: row.id_aseguradora
    }));
  }

  async getAseguradora(idAseguradora: number): Promise<{ id: number; nombre: string; rutEmpresa: string; } | null> {
    const sql = 'SELECT * FROM ASEGURADORA WHERE id_aseguradora = ?';
    const row = await this.db.queryOne<any>(sql, [idAseguradora]);

    if (!row) return null;

    return {
      id: row.id_aseguradora,
      nombre: row.nombre,
      rutEmpresa: row.rut_empresa
    };
  }

  async getAllAseguradoras(): Promise<Array<{ id: number; nombre: string; rutEmpresa: string; }>> {
    const sql = 'SELECT * FROM ASEGURADORA';
    const rows = await this.db.query<any>(sql);

    return rows.map(row => ({
      id: row.id_aseguradora,
      nombre: row.nombre,
      rutEmpresa: row.rut_empresa
    }));
  }
}
