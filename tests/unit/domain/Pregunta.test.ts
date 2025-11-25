import { describe, it, expect } from 'vitest';
import { Pregunta } from '@/src/domain/model/Pregunta';
import { TipoPregunta } from '@/src/domain/types/enums';

describe('Pregunta - Domain Model', () => {
  
  describe('create()', () => {
    it('debe crear una pregunta válida con todos los campos', () => {
      const pregunta = Pregunta.create({
        idPregunta: 1,
        enunciado: '¿Cuál es tu edad?',
        opciones: null,
        tipo: TipoPregunta.NUMERICO,
        bloque: 'A',
        orden: 1
      });

      expect(pregunta.idPregunta).toBe(1);
      expect(pregunta.enunciado).toBe('¿Cuál es tu edad?');
      expect(pregunta.tipo).toBe(TipoPregunta.NUMERICO);
      expect(pregunta.bloque).toBe('A');
      expect(pregunta.orden).toBe(1);
    });

    it('debe lanzar error si el enunciado es muy corto', () => {
      expect(() => {
        Pregunta.create({
          idPregunta: 1,
          enunciado: 'Age',
          opciones: null,
          tipo: TipoPregunta.TEXTO,
          bloque: 'A',
          orden: 1
        });
      }).toThrow();
    });

    it('debe crear pregunta con opciones para SELECCION_SIMPLE', () => {
      const pregunta = Pregunta.create({
        idPregunta: 2,
        enunciado: '¿Fumas?',
        opciones: ['Sí', 'No'],
        tipo: TipoPregunta.SELECCION_SIMPLE,
        bloque: 'B',
        orden: 1
      });

      expect(pregunta.opciones).toEqual(['Sí', 'No']);
    });
  });

  describe('validarRespuesta()', () => {
    
    it('debe validar respuesta TEXTO correctamente', () => {
      const pregunta = Pregunta.create({
        idPregunta: 1,
        enunciado: '¿Cuál es tu nombre?',
        opciones: null,
        tipo: TipoPregunta.TEXTO,
        bloque: 'A',
        orden: 1
      });

      expect(pregunta.validarRespuesta('Juan Pérez').valid).toBe(true);
      expect(pregunta.validarRespuesta('').valid).toBe(false);
      expect(pregunta.validarRespuesta('   ').valid).toBe(false);
    });

    it('debe validar respuesta NUMERICO correctamente', () => {
      const pregunta = Pregunta.create({
        idPregunta: 1,
        enunciado: '¿Cuál es tu edad?',
        opciones: null,
        tipo: TipoPregunta.NUMERICO,
        bloque: 'A',
        orden: 1
      });

      expect(pregunta.validarRespuesta('25').valid).toBe(true);
      expect(pregunta.validarRespuesta('30.5').valid).toBe(true);
      expect(pregunta.validarRespuesta('abc').valid).toBe(false);
      expect(pregunta.validarRespuesta('').valid).toBe(false);
    });

    it('debe validar respuesta BOOLEAN correctamente', () => {
      const pregunta = Pregunta.create({
        idPregunta: 1,
        enunciado: '¿Tienes dependientes?',
        opciones: null,
        tipo: TipoPregunta.BOOLEAN,
        bloque: 'B',
        orden: 1
      });

      expect(pregunta.validarRespuesta('Sí').valid).toBe(true);
      expect(pregunta.validarRespuesta('No').valid).toBe(true);
      expect(pregunta.validarRespuesta('true').valid).toBe(true);
      expect(pregunta.validarRespuesta('false').valid).toBe(true);
      expect(pregunta.validarRespuesta('Maybe').valid).toBe(false);
    });

    it('debe validar respuesta SELECCION_SIMPLE correctamente', () => {
      const pregunta = Pregunta.create({
        idPregunta: 1,
        enunciado: '¿Fumas?',
        opciones: ['Sí', 'No', 'Ocasionalmente'],
        tipo: TipoPregunta.SELECCION_SIMPLE,
        bloque: 'C',
        orden: 1
      });

      expect(pregunta.validarRespuesta('Sí').valid).toBe(true);
      expect(pregunta.validarRespuesta('No').valid).toBe(true);
      expect(pregunta.validarRespuesta('Ocasionalmente').valid).toBe(true);
      expect(pregunta.validarRespuesta('Siempre').valid).toBe(false);
    });

    it('debe validar respuesta MULTISELECCION correctamente', () => {
      const pregunta = Pregunta.create({
        idPregunta: 1,
        enunciado: 'Selecciona tus hobbies',
        opciones: ['Deportes', 'Lectura', 'Música', 'Cine'],
        tipo: TipoPregunta.MULTISELECCION,
        bloque: 'D',
        orden: 1
      });

      expect(pregunta.validarRespuesta('["Deportes", "Lectura"]').valid).toBe(true);
      expect(pregunta.validarRespuesta('["Cine"]').valid).toBe(true);
      expect(pregunta.validarRespuesta('["InvalidOption"]').valid).toBe(false);
      expect(pregunta.validarRespuesta('not-json').valid).toBe(false);
    });
  });

  describe('debeMostrarse()', () => {
    
    it('debe mostrar pregunta sin dependencias', () => {
      const pregunta = Pregunta.create({
        idPregunta: 1,
        enunciado: '¿Cuál es tu edad?',
        opciones: null,
        tipo: TipoPregunta.NUMERICO,
        bloque: 'A',
        orden: 1
      });

      const respuestas = new Map<number, string>();
      expect(pregunta.debeMostrarse(respuestas)).toBe(true);
    });

    it('debe ocultar pregunta dependiente si no se cumple condición (equals)', () => {
      const pregunta = Pregunta.create({
        idPregunta: 102,
        enunciado: '¿Cuántos dependientes?',
        opciones: null,
        tipo: TipoPregunta.NUMERICO,
        bloque: 'B',
        orden: 2
      });

      pregunta.agregarDependencia({
        idPreguntaPadre: 101,
        operador: 'equals',
        valorEsperado: 'Sí'
      });

      const respuestas = new Map<number, string>([[101, 'No']]);
      expect(pregunta.debeMostrarse(respuestas)).toBe(false);
    });

    it('debe mostrar pregunta dependiente si se cumple condición (equals)', () => {
      const pregunta = Pregunta.create({
        idPregunta: 102,
        enunciado: '¿Cuántos dependientes?',
        opciones: null,
        tipo: TipoPregunta.NUMERICO,
        bloque: 'B',
        orden: 2
      });

      pregunta.agregarDependencia({
        idPreguntaPadre: 101,
        operador: 'equals',
        valorEsperado: 'Sí'
      });

      const respuestas = new Map<number, string>([[101, 'Sí']]);
      expect(pregunta.debeMostrarse(respuestas)).toBe(true);
    });

    it('debe evaluar operador not_equals correctamente', () => {
      const pregunta = Pregunta.create({
        idPregunta: 103,
        enunciado: 'Pregunta adicional',
        opciones: null,
        tipo: TipoPregunta.TEXTO,
        bloque: 'C',
        orden: 1
      });

      pregunta.agregarDependencia({
        idPreguntaPadre: 101,
        operador: 'not_equals',
        valorEsperado: 'No'
      });

      const respuestasSi = new Map<number, string>([[101, 'Sí']]);
      expect(pregunta.debeMostrarse(respuestasSi)).toBe(true);

      const respuestasNo = new Map<number, string>([[101, 'No']]);
      expect(pregunta.debeMostrarse(respuestasNo)).toBe(false);
    });

    it('debe ocultar pregunta si padre no está respondida', () => {
      const pregunta = Pregunta.create({
        idPregunta: 102,
        enunciado: '¿Cuántos dependientes?',
        opciones: null,
        tipo: TipoPregunta.NUMERICO,
        bloque: 'B',
        orden: 2
      });

      pregunta.agregarDependencia({
        idPreguntaPadre: 101,
        operador: 'equals',
        valorEsperado: 'Sí'
      });

      const respuestas = new Map<number, string>();
      expect(pregunta.debeMostrarse(respuestas)).toBe(false);
    });
  });

  describe('agregarDependencia()', () => {
    it('debe agregar dependencia correctamente', () => {
      const pregunta = Pregunta.create({
        idPregunta: 102,
        enunciado: 'Pregunta dependiente',
        opciones: null,
        tipo: TipoPregunta.TEXTO,
        bloque: 'B',
        orden: 2
      });

      expect(pregunta.dependencias.length).toBe(0);

      pregunta.agregarDependencia({
        idPreguntaPadre: 101,
        operador: 'equals',
        valorEsperado: 'Sí'
      });

      expect(pregunta.dependencias.length).toBe(1);
      expect(pregunta.dependencias[0].idPreguntaPadre).toBe(101);
    });
  });

  describe('esObligatoria()', () => {
    it('debe considerar obligatorias todas las preguntas excepto TEXTO_LARGO', () => {
      const preguntaTexto = Pregunta.create({
        idPregunta: 1,
        enunciado: '¿Tu nombre?',
        opciones: null,
        tipo: TipoPregunta.TEXTO,
        bloque: 'A',
        orden: 1
      });

      const preguntaTextoLargo = Pregunta.create({
        idPregunta: 2,
        enunciado: 'Comentarios adicionales',
        opciones: null,
        tipo: TipoPregunta.TEXTO_LARGO,
        bloque: 'A',
        orden: 2
      });

      expect(preguntaTexto.esObligatoria()).toBe(true);
      expect(preguntaTextoLargo.esObligatoria()).toBe(false);
    });
  });

  describe('toJSON()', () => {
    it('debe serializar pregunta correctamente', () => {
      const pregunta = Pregunta.create({
        idPregunta: 1,
        enunciado: '¿Fumas?',
        opciones: ['Sí', 'No'],
        tipo: TipoPregunta.SELECCION_SIMPLE,
        bloque: 'B',
        orden: 1
      });

      const json = pregunta.toJSON();

      expect(json).toEqual({
        idPregunta: 1,
        enunciado: '¿Fumas?',
        opciones: ['Sí', 'No'],
        tipo: TipoPregunta.SELECCION_SIMPLE,
        bloque: 'B',
        orden: 1,
        tieneDependencias: false
      });
    });
  });
});
