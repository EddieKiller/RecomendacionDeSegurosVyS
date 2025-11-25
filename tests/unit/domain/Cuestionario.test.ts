import { describe, it, expect, beforeEach } from 'vitest';
import { Cuestionario } from '@/src/domain/model/Cuestionario';
import { Pregunta } from '@/src/domain/model/Pregunta';
import { Respuesta } from '@/src/domain/model/Respuesta';
import { EstadoCuestionario, TipoPregunta } from '@/src/domain/types/enums';

describe('Cuestionario - Domain Model', () => {
  
  describe('create()', () => {
    it('debe crear cuestionario con estado INICIADO por defecto', () => {
      const cuestionario = Cuestionario.create({
        idUsuario: '12345678-9'
      });

      expect(cuestionario.idUsuario).toBe('12345678-9');
      expect(cuestionario.estado).toBe(EstadoCuestionario.INICIADO);
      expect(cuestionario.preguntas.length).toBe(0);
      expect(cuestionario.respuestas.length).toBe(0);
    });

    it('debe crear cuestionario con ID y estado específico', () => {
      const cuestionario = Cuestionario.create({
        idUsuario: '12345678-9',
        idCuestionario: 1,
        estado: EstadoCuestionario.EN_PROGRESO
      });

      expect(cuestionario.idCuestionario).toBe(1);
      expect(cuestionario.estado).toBe(EstadoCuestionario.EN_PROGRESO);
    });

    it('debe lanzar error si idUsuario está vacío', () => {
      expect(() => {
        Cuestionario.create({
          idUsuario: ''
        });
      }).toThrow();
    });
  });

  describe('cargarPreguntas()', () => {
    it('debe cargar preguntas correctamente', () => {
      const cuestionario = Cuestionario.create({
        idUsuario: '12345678-9'
      });

      const preguntas = [
        Pregunta.create({
          idPregunta: 1,
          enunciado: '¿Cuál es tu edad?',
          opciones: null,
          tipo: TipoPregunta.NUMERICO,
          bloque: 'A',
          orden: 1
        }),
        Pregunta.create({
          idPregunta: 2,
          enunciado: '¿Fumas?',
          opciones: ['Sí', 'No'],
          tipo: TipoPregunta.SELECCION_SIMPLE,
          bloque: 'B',
          orden: 1
        })
      ];

      cuestionario.cargarPreguntas(preguntas);

      expect(cuestionario.preguntas.length).toBe(2);
      expect(cuestionario.preguntas[0].idPregunta).toBe(1);
      expect(cuestionario.preguntas[1].idPregunta).toBe(2);
    });
  });

  describe('agregarRespuesta()', () => {
    let cuestionario: Cuestionario;
    let preguntas: Pregunta[];

    beforeEach(() => {
      cuestionario = Cuestionario.create({
        idUsuario: '12345678-9',
        idCuestionario: 1
      });

      preguntas = [
        Pregunta.create({
          idPregunta: 1,
          enunciado: '¿Cuál es tu edad?',
          opciones: null,
          tipo: TipoPregunta.NUMERICO,
          bloque: 'A',
          orden: 1
        }),
        Pregunta.create({
          idPregunta: 2,
          enunciado: '¿Fumas?',
          opciones: ['Sí', 'No'],
          tipo: TipoPregunta.SELECCION_SIMPLE,
          bloque: 'B',
          orden: 1
        })
      ];

      cuestionario.cargarPreguntas(preguntas);
    });

    it('debe agregar respuesta válida', () => {
      const respuesta = Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: '25'
      });

      cuestionario.agregarRespuesta(respuesta);

      expect(cuestionario.respuestas.length).toBe(1);
      expect(cuestionario.respuestas[0].valor).toBe('25');
    });

    it('debe lanzar error si respuesta es inválida según validación de pregunta', () => {
      const respuesta = Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: 'abc' // No es numérico
      });

      expect(() => {
        cuestionario.agregarRespuesta(respuesta);
      }).toThrow('Debe ser un número válido');
    });

    it('debe lanzar error si pregunta no existe', () => {
      const respuesta = Respuesta.create({
        idCuestionario: 1,
        idPregunta: 999,
        valor: '25'
      });

      expect(() => {
        cuestionario.agregarRespuesta(respuesta);
      }).toThrow('Pregunta 999 no encontrada en el cuestionario');
    });

    it('debe actualizar respuesta existente', () => {
      const respuesta1 = Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: '25'
      });

      cuestionario.agregarRespuesta(respuesta1);
      expect(cuestionario.respuestas.length).toBe(1);
      expect(cuestionario.respuestas[0].valor).toBe('25');

      const respuesta2 = Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: '30'
      });

      cuestionario.agregarRespuesta(respuesta2);
      expect(cuestionario.respuestas.length).toBe(1); // No duplicar
      expect(cuestionario.respuestas[0].valor).toBe('30'); // Actualizado
    });
  });

  describe('estaCompleto()', () => {
    let cuestionario: Cuestionario;

    beforeEach(() => {
      cuestionario = Cuestionario.create({
        idUsuario: '12345678-9',
        idCuestionario: 1
      });
    });

    it('debe retornar false si no hay preguntas cargadas', () => {
      expect(cuestionario.estaCompleto()).toBe(false);
    });

    it('debe retornar false si faltan respuestas obligatorias', () => {
      const preguntas = [
        Pregunta.create({
          idPregunta: 1,
          enunciado: '¿Tu edad?',
          opciones: null,
          tipo: TipoPregunta.NUMERICO,
          bloque: 'A',
          orden: 1
        }),
        Pregunta.create({
          idPregunta: 2,
          enunciado: '¿Fumas?',
          opciones: ['Sí', 'No'],
          tipo: TipoPregunta.SELECCION_SIMPLE,
          bloque: 'B',
          orden: 1
        })
      ];

      cuestionario.cargarPreguntas(preguntas);

      // Solo responder una pregunta
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: '25'
      }));

      expect(cuestionario.estaCompleto()).toBe(false);
    });

    it('debe retornar true si todas las preguntas obligatorias están respondidas', () => {
      const preguntas = [
        Pregunta.create({
          idPregunta: 1,
          enunciado: '¿Tu edad?',
          opciones: null,
          tipo: TipoPregunta.NUMERICO,
          bloque: 'A',
          orden: 1
        }),
        Pregunta.create({
          idPregunta: 2,
          enunciado: 'Comentarios',
          opciones: null,
          tipo: TipoPregunta.TEXTO_LARGO, // Opcional
          bloque: 'B',
          orden: 1
        })
      ];

      cuestionario.cargarPreguntas(preguntas);

      // Responder ambas preguntas (todas son obligatorias por defecto)
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: '25'
      }));
      
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 2,
        valor: 'Sin comentarios'
      }));

      expect(cuestionario.estaCompleto()).toBe(true);
    });

    it('debe considerar solo preguntas visibles según dependencias', () => {
      const pregunta1 = Pregunta.create({
        idPregunta: 101,
        enunciado: '¿Tienes dependientes?',
        opciones: ['Sí', 'No'],
        tipo: TipoPregunta.SELECCION_SIMPLE,
        bloque: 'Bloque0',
        orden: 1
      });

      const pregunta2 = Pregunta.create({
        idPregunta: 102,
        enunciado: '¿Cuántos dependientes?',
        opciones: null,
        tipo: TipoPregunta.NUMERICO,
        bloque: 'Bloque0',
        orden: 2
      });

      pregunta2.agregarDependencia({
        idPreguntaPadre: 101,
        operador: 'equals',
        valorEsperado: 'Sí'
      });

      cuestionario.cargarPreguntas([pregunta1, pregunta2]);

      // Responder "No" a pregunta 101 (pregunta 102 no se muestra)
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 101,
        valor: 'No'
      }));

      // Debería estar completo porque pregunta 102 no es visible
      expect(cuestionario.estaCompleto()).toBe(true);
    });
  });

  describe('cargarRespuestasSinValidacion()', () => {
    it('debe cargar respuestas desde DB sin validar', () => {
      const cuestionario = Cuestionario.create({
        idUsuario: '12345678-9',
        idCuestionario: 1
      });

      const respuestas = [
        Respuesta.create({
          idRespuesta: 1,
          idCuestionario: 1,
          idPregunta: 1,
          valor: '25'
        }),
        Respuesta.create({
          idRespuesta: 2,
          idCuestionario: 1,
          idPregunta: 2,
          valor: 'Sí'
        })
      ];

      cuestionario.cargarRespuestasSinValidacion(respuestas);

      expect(cuestionario.respuestas.length).toBe(2);
      expect(cuestionario.respuestas[0].valor).toBe('25');
    });
  });

  // Note: getPreguntasPendientes() removed - use estaCompleto() instead
});
