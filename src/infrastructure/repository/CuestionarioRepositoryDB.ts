import { Cuestionario } from '../../domain/model/Cuestionario';
import { Pregunta } from '../../domain/model/Pregunta';
import { Respuesta } from '../../domain/model/Respuesta';
import { CuestionarioRepository } from '../../domain/port/repositorio/CuestionarioRepository';
import { EstadoCuestionario, TipoPregunta } from '../../domain/types/enums';
import { MySQLAdapter } from '../../application/adapters/database/MySQLAdapter';

export class CuestionarioRepositoryDB implements CuestionarioRepository {
  private db: MySQLAdapter;

  constructor() {
    this.db = MySQLAdapter.getInstance();
  }

  async create(cuestionario: Cuestionario): Promise<Cuestionario> {
    const sql = 'INSERT INTO CUESTIONARIO (id_usuario, fecha) VALUES (?, ?)';
    const id = await this.db.insert(sql, [cuestionario.idUsuario, cuestionario.fecha]);
    
    return Cuestionario.create({
      ...cuestionario,
      idCuestionario: id
    } as any);
  }

  async findById(idCuestionario: number): Promise<Cuestionario | null> {
    const sql = 'SELECT * FROM CUESTIONARIO WHERE id_cuestionario = ?';
    const row = await this.db.queryOne<any>(sql, [idCuestionario]);
    
    if (!row) return null;

    const cuest = Cuestionario.create({
      idCuestionario: row.id_cuestionario,
      idUsuario: row.id_usuario,
      fecha: new Date(row.fecha),
      estado: EstadoCuestionario.EN_PROGRESO
    });

    const respuestas = await this.getRespuestas(idCuestionario);
    respuestas.forEach(r => cuest.agregarRespuesta(r));

    return cuest;
  }

  async findActivoByUsuario(rut: string): Promise<Cuestionario | null> {
    const sql = `
      SELECT * FROM CUESTIONARIO 
      WHERE id_usuario = ? 
      ORDER BY fecha DESC LIMIT 1
    `;
    const row = await this.db.queryOne<any>(sql, [rut]);
    
    return row ? this.findById(row.id_cuestionario) : null;
  }

  async getAllPreguntas(): Promise<Pregunta[]> {
    const sql = 'SELECT * FROM PREGUNTA ORDER BY bloque, orden';
    const rows = await this.db.query<any>(sql);

    return rows.map(row => Pregunta.create({
      idPregunta: row.id_pregunta,
      enunciado: row.enunciado,
      opciones: row.opciones ? JSON.parse(row.opciones) : null,
      tipo: row.tipo as TipoPregunta,
      bloque: row.bloque,
      orden: row.orden
    }));
  }

  async getPreguntasByBloque(bloque: string): Promise<Pregunta[]> {
    const sql = 'SELECT * FROM PREGUNTA WHERE bloque = ? ORDER BY orden';
    const rows = await this.db.query<any>(sql, [bloque]);

    return rows.map(row => Pregunta.create({
      idPregunta: row.id_pregunta,
      enunciado: row.enunciado,
      opciones: row.opciones ? JSON.parse(row.opciones) : null,
      tipo: row.tipo as TipoPregunta,
      bloque: row.bloque,
      orden: row.orden
    }));
  }

  async saveRespuesta(respuesta: Respuesta): Promise<Respuesta> {
    if (respuesta.idRespuesta) {
      const sql = 'UPDATE RESPUESTA SET valor = ? WHERE id_respuesta = ?';
      await this.db.execute(sql, [respuesta.valor, respuesta.idRespuesta]);
    } else {
      const sql = 'INSERT INTO RESPUESTA (id_cuestionario, id_pregunta, valor) VALUES (?, ?, ?)';
      const id = await this.db.insert(sql, [
        respuesta.idCuestionario,
        respuesta.idPregunta,
        respuesta.valor
      ]);
      
      return Respuesta.create({
        ...respuesta,
        idRespuesta: id
      } as any);
    }
    
    return respuesta;
  }

  async getRespuestas(idCuestionario: number): Promise<Respuesta[]> {
    const sql = 'SELECT * FROM RESPUESTA WHERE id_cuestionario = ?';
    const rows = await this.db.query<any>(sql, [idCuestionario]);

    return rows.map(row => Respuesta.create({
      idRespuesta: row.id_respuesta,
      idCuestionario: row.id_cuestionario,
      idPregunta: row.id_pregunta,
      valor: row.valor
    }));
  }

  async updateEstado(idCuestionario: number, estado: string): Promise<void> {
    // Estado se maneja a nivel de aplicación, no se persiste en esta versión
    console.log(`[CuestionarioRepositoryDB] Estado actualizado: ${estado}`);
  }

  async getHistorial(rut: string): Promise<Cuestionario[]> {
    const sql = 'SELECT * FROM CUESTIONARIO WHERE id_usuario = ? ORDER BY fecha DESC';
    const rows = await this.db.query<any>(sql, [rut]);

    const cuestionarios: Cuestionario[] = [];
    for (const row of rows) {
      const cuest = await this.findById(row.id_cuestionario);
      if (cuest) cuestionarios.push(cuest);
    }

    return cuestionarios;
  }
}
