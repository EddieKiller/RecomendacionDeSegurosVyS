import { Cuestionario } from '../../domain/model/Cuestionario';
import { Pregunta } from '../../domain/model/Pregunta';
import { Respuesta } from '../../domain/model/Respuesta';
import { CuestionarioRepository } from '../../domain/port/repositorio/CuestionarioRepository';
import { EstadoCuestionario, TipoPregunta } from '../../domain/types/enums';
import { MySQLAdapter } from '../../application/adapters/database/MySQLAdapter';
import { unstable_cache } from 'next/cache';

export class CuestionarioRepositoryDB implements CuestionarioRepository {
  private db: MySQLAdapter;

  constructor() {
    this.db = MySQLAdapter.getInstance();
  }

  async create(cuestionario: Cuestionario): Promise<Cuestionario> {
    const sql = 'INSERT INTO CUESTIONARIO (id_usuario, fecha) VALUES (?, ?)';
    const id = await this.db.insert(sql, [cuestionario.idUsuario, cuestionario.fecha]);
    
    // Crear nuevo objeto con el ID asignado
    const nuevoCuestionario = Cuestionario.create({
      idCuestionario: id,
      idUsuario: cuestionario.idUsuario,
      fecha: cuestionario.fecha,
      estado: cuestionario.estado
    });
    
    return nuevoCuestionario;
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

    // Cargar respuestas sin validación (las preguntas aún no están cargadas)
    const respuestas = await this.getRespuestas(idCuestionario);
    cuest.cargarRespuestasSinValidacion(respuestas);

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
    // Cache de preguntas por 1 hora
    const getCachedPreguntas = unstable_cache(
      async () => {
        const sql = `
          SELECT * FROM PREGUNTA 
          ORDER BY 
            CASE bloque 
              WHEN 'Bloque0' THEN 0 
              WHEN 'B' THEN 1 
              WHEN 'C' THEN 2 
              WHEN 'D' THEN 3 
              WHEN 'E' THEN 4 
              WHEN 'F' THEN 5 
              WHEN 'G' THEN 6 
              WHEN 'H' THEN 7 
              ELSE 99 
            END, 
            orden
        `;
        return await this.db.query<any>(sql);
      },
      ['preguntas-all'],
      { revalidate: 3600, tags: ['preguntas'] }
    );
    
    const rows = await getCachedPreguntas();

    const preguntas = rows.map(row => {
      let opciones = null;
      if (row.opciones) {
        try {
          // Si ya es un objeto/array, usarlo directamente
          // Si es string, parsearlo
          opciones = typeof row.opciones === 'string' ? JSON.parse(row.opciones) : row.opciones;
        } catch (error) {
          console.error(`[CuestionarioRepositoryDB] Error parsing opciones para pregunta ${row.id_pregunta}`);
          console.error('Tipo de dato:', typeof row.opciones);
          console.error('Contenido:', row.opciones);
          throw error;
        }
      }

      return Pregunta.create({
        idPregunta: row.id_pregunta,
        enunciado: row.enunciado,
        opciones,
        tipo: row.tipo as TipoPregunta,
        bloque: row.bloque,
        orden: row.orden
      });
    });

    // Cargar dependencias para cada pregunta
    await this.cargarDependenciasPreguntas(preguntas);

    return preguntas;
  }

  private async cargarDependenciasPreguntas(preguntas: Pregunta[]): Promise<void> {
    const sql = `
      SELECT id_pregunta_dependiente, id_pregunta_padre, operador, valor_esperado 
      FROM DEPENDENCIA_PREGUNTA
    `;
    const dependencias = await this.db.query<any>(sql);

    // Mapear dependencias a las preguntas correspondientes
    dependencias.forEach(dep => {
      const pregunta = preguntas.find(p => p.idPregunta === dep.id_pregunta_dependiente);
      if (pregunta) {
        pregunta.agregarDependencia({
          idPreguntaPadre: dep.id_pregunta_padre,
          operador: dep.operador || 'equals',
          valorEsperado: dep.valor_esperado
        });
      }
    });
  }

  async getPreguntasByBloque(bloque: string): Promise<Pregunta[]> {
    const sql = 'SELECT * FROM PREGUNTA WHERE bloque = ? ORDER BY orden';
    const rows = await this.db.query<any>(sql, [bloque]);

    return rows.map(row => {
      let opciones = null;
      if (row.opciones) {
        try {
          // Si ya es un objeto/array, usarlo directamente
          // Si es string, parsearlo
          opciones = typeof row.opciones === 'string' ? JSON.parse(row.opciones) : row.opciones;
        } catch (error) {
          console.error(`[CuestionarioRepositoryDB] Error parsing opciones para pregunta ${row.id_pregunta}`);
          throw error;
        }
      }

      return Pregunta.create({
        idPregunta: row.id_pregunta,
        enunciado: row.enunciado,
        opciones,
        tipo: row.tipo as TipoPregunta,
        bloque: row.bloque,
        orden: row.orden
      });
    });
  }

  async saveRespuesta(respuesta: Respuesta): Promise<Respuesta> {
    if (respuesta.idRespuesta) {
      const sql = 'UPDATE RESPUESTA SET valor = ? WHERE id_respuesta = ?';
      await this.db.execute(sql, [respuesta.valor, respuesta.idRespuesta]);
      return respuesta;
    } else {
      const sql = 'INSERT INTO RESPUESTA (id_cuestionario, id_pregunta, valor) VALUES (?, ?, ?)';
      const id = await this.db.insert(sql, [
        respuesta.idCuestionario,
        respuesta.idPregunta,
        respuesta.valor
      ]);
      
      return Respuesta.create({
        idRespuesta: id,
        idCuestionario: respuesta.idCuestionario,
        idPregunta: respuesta.idPregunta,
        valor: respuesta.valor
      });
    }
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
