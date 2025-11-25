"""
Locust.io - Pruebas de carga para Sistema de Recomendación de Seguros
Valida RNF: p95 ≤ 3s bajo carga concurrente

Ejecución:
  - UI Web: locust -f locustfile.py --host=http://localhost:3000
  - Headless: locust -f locustfile.py --host=http://localhost:3000 --users 50 --spawn-rate 10 --run-time 2m --headless
"""

from locust import HttpUser, task, between, events
import random
import json

class SegurosUser(HttpUser):
    """Simula un usuario completando el flujo de cuestionario + recomendaciones"""
    
    wait_time = between(1, 3)  # Espera entre 1-3 segundos entre tareas
    
    def on_start(self):
        """Se ejecuta al iniciar cada usuario virtual"""
        # Generar RUT aleatorio para simular usuarios únicos
        self.rut = f"1{random.randint(1000000, 9999999)}-{random.randint(0, 9)}"
        self.id_cuestionario = None
        self.total_preguntas = 0
        self.preguntas_ids = []  # IDs reales de las preguntas de la BD
        self.preguntas_info = {}  # Dict: {id: {tipo, opciones}}
        
        # Inicializar cuestionario
        self.iniciar_cuestionario()
    
    def generar_respuesta_valida(self, pregunta_id):
        """Genera una respuesta válida según el tipo de pregunta"""
        info = self.preguntas_info.get(pregunta_id, {})
        tipo = info.get('tipo', 'texto')
        opciones = info.get('opciones', [])
        
        # MULTISELECCION: debe ser JSON string de array
        if tipo == 'multiseleccion':
            if opciones and len(opciones) > 0:
                # Seleccionar 1-3 opciones al azar
                num_selecciones = random.randint(1, min(3, len(opciones)))
                seleccionadas = random.sample(opciones, num_selecciones)
                return json.dumps(seleccionadas)  # Convertir a JSON string
            else:
                return json.dumps(['Opción 1'])
        
        # SELECCION_SIMPLE: debe ser una de las opciones
        if tipo == 'seleccion_simple':
            if opciones and len(opciones) > 0:
                return random.choice(opciones)
            else:
                return 'Opción 1'
        
        # NUMERICO: debe ser un número válido
        if tipo == 'numerico':
            return str(random.randint(18, 80))
        
        # BOOLEAN: debe ser exactamente 'Sí' o 'No'
        if tipo == 'boolean':
            return random.choice(['Sí', 'No'])
        
        # TEXTO o TEXTO_LARGO: cualquier string no vacío
        if tipo == 'texto' or tipo == 'texto_largo':
            return random.choice(['Excelente', 'Bueno', 'Regular', 'Necesito asesoría'])
        
        # Fallback por si acaso
        return 'Respuesta válida'
    
    def iniciar_cuestionario(self):
        """Crear nuevo cuestionario y cargar preguntas"""
        with self.client.post(
            "/api/test/cuestionario",
            json={"rut": self.rut},
            catch_response=True,
            name="POST /api/test/cuestionario [Iniciar]"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.id_cuestionario = data.get("idCuestionario")
                self.total_preguntas = data.get("totalPreguntas", 0)
                self.preguntas_ids = data.get("preguntasIds", [])
                
                # Almacenar info de preguntas para generar respuestas válidas
                preguntas = data.get("preguntas", [])
                for p in preguntas:
                    self.preguntas_info[p['id']] = {
                        'tipo': p.get('tipo', 'texto'),
                        'opciones': p.get('opciones', [])
                    }
                
                response.success()
            else:
                response.failure(f"Failed to initialize: {response.status_code}")
    
    @task(5)
    def responder_pregunta(self):
        """Simula responder una pregunta aleatoria (50% del tráfico)"""
        if not self.id_cuestionario or self.total_preguntas == 0 or not self.preguntas_ids:
            return
        
        # Seleccionar pregunta aleatoria de los IDs reales
        id_pregunta = random.choice(self.preguntas_ids)
        
        # Generar respuesta válida según el tipo de pregunta
        valor = self.generar_respuesta_valida(id_pregunta)
        
        with self.client.post(
            "/api/test/respuesta",
            json={
                "idCuestionario": self.id_cuestionario,
                "idPregunta": id_pregunta,
                "valor": valor,
                "rut": self.rut
            },
            catch_response=True,
            name="POST /api/test/respuesta [Responder]"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to save answer: {response.status_code}")
    
    @task(2)
    def generar_recomendaciones(self):
        """Simula generar recomendaciones (20% del tráfico)"""
        if not self.id_cuestionario:
            return
        
        with self.client.post(
            "/api/test/recomendaciones",
            json={
                "idCuestionario": self.id_cuestionario,
                "rut": self.rut
            },
            catch_response=True,
            name="POST /api/test/recomendaciones [Generar]"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                total_recs = data.get("totalRecomendaciones", 0)
                if total_recs > 0:
                    response.success()
                else:
                    response.failure("No recommendations generated")
            else:
                response.failure(f"Failed to generate: {response.status_code}")
    
    @task(3)
    def flujo_completo(self):
        """Simula flujo completo: responder múltiples preguntas → generar recomendaciones (30% tráfico)"""
        if not self.id_cuestionario or self.total_preguntas == 0 or not self.preguntas_ids:
            return
        
        # Responder entre 5-10 preguntas
        num_respuestas = random.randint(5, min(10, len(self.preguntas_ids)))
        
        for i in range(num_respuestas):
            id_pregunta = random.choice(self.preguntas_ids)
            valor = self.generar_respuesta_valida(id_pregunta)
            
            self.client.post(
                "/api/test/respuesta",
                json={
                    "idCuestionario": self.id_cuestionario,
                    "idPregunta": id_pregunta,
                    "valor": valor,
                    "rut": self.rut
                },
                name="POST /api/test/respuesta [Flujo Completo]"
            )
        
        # Generar recomendaciones al final
        self.client.post(
            "/api/test/recomendaciones",
            json={
                "idCuestionario": self.id_cuestionario,
                "rut": self.rut
            },
            name="POST /api/test/recomendaciones [Flujo Completo]"
        )


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Se ejecuta al iniciar las pruebas"""
    print("🚀 Iniciando pruebas de carga con Locust.io")
    print(f"   Target: {environment.host}")
    print(f"   RNF objetivo: p95 ≤ 3000ms")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Se ejecuta al finalizar las pruebas - valida RNF"""
    print("\n📊 Resultados de pruebas de carga:")
    
    stats = environment.stats
    total_stats = stats.total
    
    print(f"   Total requests: {total_stats.num_requests}")
    print(f"   Failures: {total_stats.num_failures}")
    print(f"   Median response time: {total_stats.median_response_time}ms")
    print(f"   Average response time: {total_stats.avg_response_time:.2f}ms")
    print(f"   95th percentile: {total_stats.get_response_time_percentile(0.95)}ms")
    print(f"   99th percentile: {total_stats.get_response_time_percentile(0.99)}ms")
    
    # Validar RNF: p95 ≤ 3000ms
    p95 = total_stats.get_response_time_percentile(0.95)
    if p95 and p95 <= 3000:
        print(f"\n✅ RNF CUMPLIDO: p95 = {p95}ms ≤ 3000ms")
    else:
        print(f"\n❌ RNF NO CUMPLIDO: p95 = {p95}ms > 3000ms")
