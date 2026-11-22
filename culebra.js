// ==========================================================
// 🐍 CULEBRA X — lógica principal del juego
// Misión: guiar a la serpiente, comer frutas y no chocar.
// Necesita utilitarios.js (antes) y culebra_eventos.js (antes): este archivo se carga el ÚLTIMO
// porque al final arranca el juego.
// ==========================================================


// ==========================================================
// 🌍 VARIABLES GLOBALES (los "datos" que el juego recuerda)
// ==========================================================

// 🎨 LIENZO: el canvas es nuestra pantalla de dibujo; el contexto es el pincel.
let canvas = document.getElementById("areaJuego");
let contexto = canvas.getContext("2d");

// 📐 TABLERO: 20 columnas x 20 filas, cada celda mide 25 píxeles (20 x 25 = 500).
let tamanoCelda = 25;
let columnas = 20;
let filas = 20;

// 🏆 MARCADORES
let puntos = 0;
let tiempo = 0;            // segundos transcurridos

// 🚦 SEMÁFORO DEL JUEGO
let jugando = false;        // true = la partida está corriendo
let juegoTerminado = false; // true = la serpiente murió (Game Over)

// ⏲️ RELOJES: guardamos el "número de ticket" que devuelve setInterval.
// Con ese número podemos apagar el reloj con clearInterval.
// null significa "no hay reloj encendido".
let intervaloJuego = null;
let intervaloTiempo = null;

// 🏃 VELOCIDAD: milisegundos entre cada paso. Menos milisegundos = más rápido.
let velocidadBase = 150;
let velocidadInicial = 150; // 🆕 la velocidad con la que empieza cada partida (la base sube de nivel)
let velocidadTurbo = 80;
let velocidadActual = velocidadBase;
let turboRestante = 0;      // pasos que le quedan al efecto del rayo

// 🐍 SERPIENTE: arreglo de objetos {x, y}. La posición 0 es la CABEZA.
let culebra = [];

// 🧭 DIRECCIÓN: velocidadX/Y es hacia dónde se movió en el último paso.
// proximaX/Y es la dirección que el jugador pidió para el SIGUIENTE paso.
let velocidadX = tamanoCelda;
let velocidadY = 0;
let proximaX = tamanoCelda;
let proximaY = 0;

// 🦎 COLA: guardamos dónde estaba la cola antes de moverse, para poder crecer.
let colaX;
let colaY;
let segmentosPorCrecer = 0; // cuántos segmentos nos faltan por añadir

// 🍽️ ALIMENTOS: arreglo con varias frutas a la vez en el tablero.
let alimentos = [];
let cantidadBasicas = 5;         // frutas de 1 punto que SIEMPRE hay en el tablero
let maximoEspeciales = 2;        // frutas especiales a la vez (tienen tiempo limitado)
let tiempoParaEspecialMs = 0;    // cuenta atrás para la próxima fruta especial
let esperaEspecialMin = 5000;
let esperaEspecialMax = 11000;
let avisoFrutaMs = 3000;         // últimos ms: la fruta parpadea antes de desaparecer

// 👾 ENEMIGOS: arreglo de objetos {x, y}. Persiguen a la cabeza para comérsela.
let enemigos = [];
let pasosJuego = 0;       // cuenta los pasos que lleva la partida
let pasosGracia = 30;     // al empezar, los enemigos esperan estos pasos antes de moverse
let ritmoEnemigo = 3;     // el enemigo se mueve 1 vez cada 3 pasos (más lento que la serpiente)
let maximoEnemigos = 3;   // nunca habrá más de 3 enemigos a la vez

// 🕷️ ARAÑA: enemigo especial. Es un objeto {x, y, estado, ...} o null si no hay ninguna.
// Estados: "apareciendo" (sale de la oscuridad, es lenta de ver) y "activa" (se mueve y muerde).
let arana = null;
let tiempoParaAranaMs = 0;     // milisegundos que faltan para que aparezca la próxima
let esperaAranaMin = 15000;    // espera mínima entre arañas (15 s)
let esperaAranaMax = 35000;    // espera máxima entre arañas (35 s)
let ticksAparicion = 8;        // pasos que dura la animación de aparición
let vidaAranaMs = 20000;       // si no muerde, se esfuma tras 20 s
let intervaloAranaMs = 240;    // la araña da 1 paso cada 240 ms (independiente de la culebra)
let animacionArana = 0;        // contador que sube cada paso: mueve las patas y hace parpadear

// ☣️ VENENO
let envenenado = false;        // true mientras la culebra está envenenada
let venenoRestanteMs = 0;      // tiempo que queda para curarse
let duracionVenenoMs = 15000;  // 15 segundos para curarse
let frutasPendientes = 0;      // frutas que aún faltan para curarse
let frutasParaCurar = 3;       // frutas necesarias
let penalizacionPuntos = 5;    // castigo si no te curas a tiempo: puntos...
let penalizacionSegmentos = 3; // ...y segmentos perdidos
let flashMordida = 0;          // pasos que dura el destello rojo de la mordida
let curacionTicks = 0;         // pasos que dura la animación de curación

// 💨 PARTÍCULAS: arreglo de puntitos de humo/chispas, cada uno es un objeto.
let particulas = [];

// 📖 CATÁLOGO DE ALIMENTOS: cada objeto describe un tipo de comida.
// categoria: "basica" (siempre hay varias, +1 punto, crecen poco) | "especial" (con tiempo limitado)
// vidaMin/vidaMax: milisegundos que se queda en el tablero (solo especiales; cada una sortea el suyo)
// puntos | crecer | quitar | turbo (rayo) | depredador (modo depredador) | bueno | peso (probabilidad)
let tiposComida = [
    { nombre: "Manzana",  emoji: "🍎", categoria: "basica",   puntos: 1,  crecer: 1, quitar: 0, turbo: false, depredador: false, bueno: true,  peso: 30, vidaMin: 0,     vidaMax: 0,     mensaje: "🍎 ¡Manzana! +1 punto" },
    { nombre: "Cereza",   emoji: "🍒", categoria: "basica",   puntos: 1,  crecer: 1, quitar: 0, turbo: false, depredador: false, bueno: true,  peso: 25, vidaMin: 0,     vidaMax: 0,     mensaje: "🍒 ¡Cereza! +1 punto" },
    { nombre: "Naranja",  emoji: "🍊", categoria: "basica",   puntos: 1,  crecer: 1, quitar: 0, turbo: false, depredador: false, bueno: true,  peso: 25, vidaMin: 0,     vidaMax: 0,     mensaje: "🍊 ¡Naranja! +1 punto" },
    { nombre: "Uva",      emoji: "🍇", categoria: "basica",   puntos: 1,  crecer: 1, quitar: 0, turbo: false, depredador: false, bueno: true,  peso: 20, vidaMin: 0,     vidaMax: 0,     mensaje: "🍇 ¡Uvas! +1 punto" },
    { nombre: "Dorada",   emoji: "🍏", categoria: "especial", puntos: 5,  crecer: 3, quitar: 0, turbo: false, depredador: false, bueno: true,  peso: 10, vidaMin: 8000,  vidaMax: 13000, mensaje: "🍏 ¡Manzana dorada! +5 puntos y creces 3" },
    { nombre: "Baya",     emoji: "🫐", categoria: "especial", puntos: 10, crecer: 0, quitar: 0, turbo: false, depredador: false, bueno: true,  peso: 8,  vidaMin: 7000,  vidaMax: 11000, mensaje: "🫐 ¡Baya especial! +10 puntos" },
    { nombre: "Rayo",     emoji: "⚡", categoria: "especial", puntos: 2,  crecer: 0, quitar: 0, turbo: true,  depredador: false, bueno: true,  peso: 12, vidaMin: 7000,  vidaMax: 11000, mensaje: "⚡ ¡Rayo! +2 puntos y velocidad extra" },
    { nombre: "Depredadora", emoji: "🌶️", categoria: "especial", puntos: 3, crecer: 0, quitar: 0, turbo: false, depredador: true, bueno: true, peso: 8, vidaMin: 7000, vidaMax: 10000, mensaje: "🌶️ ¡MODO DEPREDADOR! Devora a los enemigos" },
    { nombre: "Podrida",  emoji: "☠️", categoria: "especial", puntos: -3, crecer: 0, quitar: 2, turbo: false, depredador: false, bueno: false, peso: 15, vidaMin: 14000, vidaMax: 22000, mensaje: "☠️ ¡Fruta podrida! -3 puntos y pierdes 2 segmentos" },
    { nombre: "Hongo",    emoji: "🍄", categoria: "especial", puntos: 0,  crecer: 0, quitar: 4, turbo: false, depredador: false, bueno: false, peso: 15, vidaMin: 14000, vidaMax: 22000, mensaje: "🍄 ¡Hongo venenoso! pierdes 4 segmentos" }
];

// 🌶️ MODO DEPREDADOR (fruta especial): los enemigos huyen y se pueden devorar.
let depredadorMs = 0;                 // tiempo que le queda al modo
let duracionDepredadorMs = 12000;
let puntosDevorarArana = 35;
let puntosDevorarCaracol = 15;

// 🐌 RALENTIZACIÓN por baba o caracol
let lentoMs = 0;                      // tiempo que le queda al efecto
let duracionLentoMs = 3000;
let factorLento = 1.8;                // 1.8 = un 80 % más lento

// 🐌 CARACOLES Y BABA
let caracoles = [];                   // {x, y, estado, avisoMs, vidaMs, relojMs, dirX, dirY}
let babas = [];                       // {x, y, vidaMs}: rastro que dejan los caracoles
let tiempoParaCaracolMs = 0;
let esperaCaracolMin = 12000;
let esperaCaracolMax = 24000;
let maximoBabas = 45;
let vidaBabaMs = 7000;
let tipoCaracol = { nombre: "Caracol", emoji: "🐌", color: "#b6ff5a", intervaloMs: 650, vidaMs: 26000, avisoMs: 1800, nivelMin: 1,
                    aviso: "🐌 Se oye algo viscoso arrastrándose..." };

// 📝 DIÁLOGO DE NOMBRE y control de la partida
let partidaEnCurso = false;           // true desde que se confirma el nombre hasta Game Over / victoria / reinicio
let dialogoAbierto = false;
let accionAlConfirmarNombre = null;
let reinicioArmadoHasta = 0;          // la tecla R necesita pulsarse dos veces durante una partida

// 🎨 PALETAS: cada "mundo" cambia los colores del canvas y de la página (variables CSS).
const PALETAS = [
    { nombre: "Neón Cian",       fondo: "#02060d", fondoCanvas: "#01090f", primario: "#00f0ff", cabeza: "#eaffff", acento: "#ff7a1a", texto: "#d8fbff", apagado: "#6fa9b3", hud: "#9fe9ff" },
    { nombre: "Azul Eléctrico",  fondo: "#02040f", fondoCanvas: "#01040e", primario: "#4d9dff", cabeza: "#e8f2ff", acento: "#ffb347", texto: "#dbe9ff", apagado: "#7390b3", hud: "#a9ccff" },
    { nombre: "Menta Láser",     fondo: "#020d09", fondoCanvas: "#010a07", primario: "#3dffb0", cabeza: "#e6fff5", acento: "#ff6b9d", texto: "#d9ffef", apagado: "#6fb39c", hud: "#9affd5" },
    { nombre: "Violeta Cósmico", fondo: "#07020f", fondoCanvas: "#060109", primario: "#b66dff", cabeza: "#f4e9ff", acento: "#ffd23f", texto: "#ecdcff", apagado: "#9578b3", hud: "#d3b0ff" },
    { nombre: "Fucsia Arcade",   fondo: "#0e020d", fondoCanvas: "#0a010a", primario: "#ff4fd8", cabeza: "#ffe8f9", acento: "#2bf0ff", texto: "#ffdcf5", apagado: "#b3739f", hud: "#ffa3ea" },
    { nombre: "Hielo Polar",     fondo: "#03080f", fondoCanvas: "#02060c", primario: "#9fd8ff", cabeza: "#f5fbff", acento: "#ff8fa3", texto: "#e3f4ff", apagado: "#7f9db3", hud: "#cdeaff" }
];
let indicePaleta = 0;
let paleta = PALETAS[0];
let segundosCambioPaleta = 45;        // además de cada nivel, el mundo cambia cada 45 s

// ==========================================================
// 🌑 NUEVO: ENEMIGOS VARIADOS, OBSTÁCULOS Y PORTALES (variables)
// Todo se mueve con el mismo ciclo del juego, sin relojes propios.
// ==========================================================

// 🪲 ENEMIGOS VARIADOS: arreglo de objetos {x, y, tipo, estado, ...}.
// Estados: "aviso" (todavía no hace daño) y "activo" (se mueve y puede golpear).
let peligros = [];

// 🧱 OBSTÁCULOS: arreglo de objetos {x, y, tipo, estado, ...}.
let obstaculos = [];

// 🌀 PORTALES: SIEMPRE nacen en parejas conectadas. Cada portal guarda a su pareja en "par".
let portales = [];
let contadorPares = 0;           // numera cada pareja de portales

// ⏳ CONTADORES DE APARICIÓN (milisegundos de juego). Cada categoría tiene el suyo.
let tiempoParaPeligroMs = 0;
let tiempoParaObstaculoMs = 0;
let tiempoParaPortalMs = 0;
let enfriamientoEventosMs = 0;   // pausa obligatoria entre dos apariciones de cualquier tipo
let pausaEntreEventosMs = 2500;

// 🎲 ESPERAS ENTRE APARICIONES (se acortan al subir de nivel)
let esperaPeligroMin = 9000;
let esperaPeligroMax = 20000;
let esperaObstaculoMin = 7000;
let esperaObstaculoMax = 16000;
let esperaPortalMin = 14000;
let esperaPortalMax = 30000;

// 📏 LÍMITES
let maximoObstaculos = 6;
let maximoRocas = 2;             // las rocas son permanentes: solo puede haber 2
let maximoPortales = 2;          // máximo de PAREJAS de portales

// 🛡️ PROTECCIÓN DE PORTALES: tras teletransportarse, los portales se ignoran unos pasos.
let proteccionPortalPasos = 0;
let pasosProteccionPortal = 8;
let flashPortal = 0;

// 🎞️ Contador de animación de los elementos nuevos (sube una vez por paso).
let animacionEventos = 0;

// 📖 CATÁLOGO DE ENEMIGOS VARIADOS.
// movimiento: "azar" | "errante" | "acechar" | "perseguir"
// intervaloMs: cada cuánto da un paso (menos = más veloz) | vidaMs: cuánto se queda
// avisoMs: advertencia antes de volverse peligroso
// efecto: "segmentos", "veneno" o "puntos" | nivelMin: nivel mínimo para aparecer
let tiposPeligro = [
    { nombre: "Escarabajo", emoji: "🪲", color: "#7cff4d", movimiento: "azar",      intervaloMs: 520, vidaMs: 16000, avisoMs: 1800,
      efecto: "segmentos", segmentos: 2, puntos: 0, atraviesa: false, nivelMin: 0, peso: 30,
      aviso: "🪲 Se oye algo arrastrándose...",
      mensaje: "🪲 ¡Un escarabajo te mordió! Pierdes 2 segmentos" },
    { nombre: "Escorpión",  emoji: "🦂", color: "#ff7a1a", movimiento: "acechar",   intervaloMs: 280, vidaMs: 11000, avisoMs: 2000,
      efecto: "veneno", segmentos: 2, puntos: 0, atraviesa: false, nivelMin: 1, peso: 20,
      aviso: "🦂 Algo acecha entre las sombras...",
      mensaje: "🦂 ¡Picadura! El veneno corre por tu cuerpo" },
    { nombre: "Murciélago", emoji: "🦇", color: "#b44cff", movimiento: "errante",   intervaloMs: 110, vidaMs: 6500,  avisoMs: 2200,
      efecto: "segmentos", segmentos: 3, puntos: 0, atraviesa: false, nivelMin: 2, peso: 18,
      aviso: "🦇 Aleteos en la oscuridad...",
      mensaje: "🦇 ¡Un murciélago te atacó! Pierdes 3 segmentos" },
    { nombre: "Fantasma",   emoji: "👻", color: "#8ff3ff", movimiento: "perseguir", intervaloMs: 420, vidaMs: 10000, avisoMs: 2200,
      efecto: "puntos", segmentos: 1, puntos: 4, atraviesa: true, nivelMin: 3, peso: 14,
      aviso: "👻 Un frío helado recorre el tablero...",
      mensaje: "👻 ¡Un fantasma te atravesó! -4 puntos y pierdes 1 segmento" },
    { nombre: "Avispa",     emoji: "🐝", color: "#ffe14d", movimiento: "errante",   intervaloMs: 90,  vidaMs: 5000,  avisoMs: 2000,
      efecto: "segmentos", segmentos: 2, puntos: 0, atraviesa: false, nivelMin: 4, peso: 8,
      aviso: "🐝 Un zumbido muy rápido se acerca...",
      mensaje: "🐝 ¡Una avispa te picó! Pierdes 2 segmentos" },
    { nombre: "Calavera",   emoji: "💀", color: "#e8e8f0", movimiento: "acechar",   intervaloMs: 330, vidaMs: 12000, avisoMs: 2400,
      efecto: "puntos", segmentos: 2, puntos: 8, atraviesa: false, nivelMin: 5, peso: 6,
      aviso: "💀 Algo muy antiguo despierta...",
      mensaje: "💀 ¡La calavera te maldijo! -8 puntos y pierdes 2 segmentos" }
];

// 📖 CATÁLOGO DE OBSTÁCULOS.
// forma: cómo se dibuja | fatal: true = Game Over al chocar | permanente: nunca desaparece
let tiposObstaculo = [
    { nombre: "Roca",    forma: "roca",    color: "#8a93a6", fatal: true,  permanente: true,  vidaMin: 0,     vidaMax: 0,     avisoMs: 2500,
      puntos: 0, segmentos: 0, nivelMin: 0, peso: 30,
      aviso: "🪨 El suelo tiembla...",
      mensaje: "🪨 ¡Chocaste contra una roca!" },
    { nombre: "Pinchos", forma: "pinchos", color: "#ff3b5c", fatal: false, permanente: false, vidaMin: 12000, vidaMax: 20000, avisoMs: 2000,
      puntos: 2, segmentos: 3, nivelMin: 0, peso: 45,
      aviso: "⚠️ Algo punzante brota del suelo...",
      mensaje: "⚠️ ¡Pinchos! -2 puntos y pierdes 3 segmentos" },
    { nombre: "Cristal", forma: "cristal", color: "#ffd23f", fatal: true,  permanente: false, vidaMin: 9000,  vidaMax: 15000, avisoMs: 2500,
      puntos: 0, segmentos: 0, nivelMin: 2, peso: 25,
      aviso: "💎 Un cristal se está formando...",
      mensaje: "💎 ¡Chocaste contra un cristal!" }
];

// 🎨 COLORES DE PORTAL (ninguno es cian para no confundirlos con la culebra)
let coloresPortal = ["#c77dff", "#4dffb8", "#ff5ec4", "#ffb703"];

// ==========================================================
// 🏁 NUEVO: META, NIVELES, PUNTUACIÓN Y CLASIFICACIÓN
// ==========================================================

let puntosVictoria = 1000;          // al llegar aquí el jugador GANA
let juegoGanado = false;            // se pone en true UNA sola vez
let resultadoGuardado = false;      // evita guardar dos veces la misma partida
let ultimoRegistroId = "";          // para resaltar tu resultado en la tabla
let nombreJugador = "";
let mostrandoRanking = false;
let victoriaTicks = 0;              // fotogramas de la celebración
let resumenFinal = null;            // textos de la pantalla final

let nivelActual = 0;                // nivel más alto alcanzado en esta partida
let nombresNivel = ["Novato", "Explorador", "Cazador", "Veterano", "Experto", "Maestro", "Leyenda", "Mítico"];
let umbralesNivel = [0, 40, 100, 180, 290, 430, 600, 800]; // puntos necesarios para cada nivel

// 🎁 BONOS DE PUNTOS (para que llegar a 1000 sea posible y divertido)
let ultimoBonoTiempo = 0;
let segundosParaBono = 15;          // cada 15 s sobrevividos...
let puntosBonoSupervivencia = 10;   // ...suma 10 puntos
let puntosEsquivar = 8;             // enemigo variado que se esfuma sin golpearte
let puntosObstaculo = 4;            // obstáculo temporal que termina sin golpearte
let puntosPortal = 2;               // cada uso de portal
let puntosCura = 15;                // curarse del veneno a tiempo
let puntosDevorar = 25;             // cada enemigo devorado en la dimensión secreta

let claveRanking = "culebraX_ranking";
let claveNombre = "culebraX_nombre";
let claveSecretos = "culebraX_secretos";

// ==========================================================
// 🥚 NUEVO: HUEVO DE PASCUA Y DIMENSIÓN SECRETA
// ==========================================================

let huevoEncontrado = false;        // true si ya encontró la sala del creador en esta partida
let secuenciaPortal = [];           // últimos usos de portal (se compara con una huella, no con un texto)
let secuenciaPar = -1;              // pareja de portales a la que pertenece la secuencia
let tiempoSecuenciaMs = 0;          // tiempo que le queda a la secuencia
let ventanaSecuenciaMs = 35000;     // tiempo máximo entre usos consecutivos
let largoClaveSala = 3;
let huellaSala = 2025651612;
let tamanoMinimoSala = 8;           // segmentos mínimos para que funcione
let grieta = null;                  // entrada {x, y, vidaMs}

let dimensionActiva = false;        // true mientras se ve la sala del creador
let dimensionFase = "";             // "creador"
let dimensionTicks = 0;
let caracteresCreador = 0;
let creadorEspera = 0;
let saltarCreador = false;          // el jugador puede continuar moviendo la serpiente
let salaGuardada = null;            // copia del tablero mientras dura la sala
let devorados = 0;                  // enemigos devorados con el modo depredador

let partesCorreo = ["anthonysex72", "gmail.com"];
let textoCreador = "¡Gracias por encontrarme! Si te gustó el juego, déjame tu comentario en mi correo:";

// 📧 El correo se arma al usarlo (así no queda como texto suelto en el código).
function correoCreador() {
    return partesCorreo.join("@");
}

// 👨‍💻 SPRITE DEL CREADOR: cada letra es un color. "." es transparente.
let spriteCreador = [
    "....HHHHHH....",
    "...HHHHHHHH...",
    "..HHHHHHHHHH..",
    "..HHSSSSSSHH..",
    "..HSSSSSSSSH..",
    "..SSESSSSESS..",
    "..SSESSSSESS..",
    "..SKSSSSSSKS..",
    "...SSMSSMSS...",
    "....SSMMSS....",
    ".....SSSS.....",
    "..CCCCCCCCCC..",
    ".SCCCCWWCCCCS.",
    ".SCCCCWWCCCCS.",
    "..CCCCCCCCCC..",
    "..PPPPPPPPPP..",
    "..PPPP..PPPP..",
    "..PPPP..PPPP..",
    "..BBBB..BBBB..",
    ".BBBBB..BBBBB."
];
let paletaCreador = { H: "#4a2c17", S: "#f6c9a0", E: "#1b1b2f", K: "#f29b8a", M: "#b23a48", C: "#00c2d1", W: "#ffffff", P: "#2b3a67", B: "#1a1a1a" };

// ==========================================================
// 🎵 NUEVO: MÚSICA Y SONIDOS (Web Audio, sin archivos ni librerías)
// La música NO usa relojes propios: se programa dentro del ciclo del juego.
// ==========================================================

let audio = null;               // AudioContext (se crea al pulsar INICIAR)
let audioMaestro = null;        // volumen general
let audioRuido = null;          // ruido blanco para platillos y golpes
let musicaActiva = true;        // la tecla M la silencia
let volumenMusica = 0.22;
let ambienteMusica = "";        // calma | tension | suspenso | veneno | dimension
let pasoMusica = 0;
let proximoPasoMusica = 0;

let bajoCalma   = [45, 0, 0, 45, 0, 0, 52, 0, 48, 0, 0, 50, 0, 0, 52, 0];
let bajoTension = [45, 0, 45, 46, 45, 0, 45, 44, 45, 0, 45, 46, 45, 0, 50, 49];
let bajoDim     = [36, 0, 48, 0, 43, 0, 48, 0, 41, 0, 53, 0, 43, 0, 48, 0];
let melodiaDim  = [72, 0, 76, 0, 79, 0, 76, 72, 74, 0, 77, 0, 81, 0, 77, 74,
                   76, 0, 79, 0, 84, 0, 79, 76, 72, 76, 79, 0, 84, 0, 79, 0];
let notasPlink  = [69, 72, 74, 76, 79, 81];


// ==========================================================
// 🖌️ DIBUJO
// ==========================================================

// 🖌️ DIBUJAR: función reutilizable que pinta un rectángulo de un color.
function dibujar(x, y, ancho, alto, color) {
    contexto.fillStyle = color;
    contexto.fillRect(x, y, ancho, alto);
}

// 🧽 LIMPIAR: borra todo el canvas antes de pintar el siguiente fotograma.
function limpiarCanvas() {
    contexto.clearRect(0, 0, canvas.width, canvas.height);
}

// 🐍 DIBUJAR SERPIENTE: recorremos el arreglo con un ciclo for. Los colores salen de la paleta del mundo.
function dibujarCulebra() {
    // ✨ shadowBlur crea el resplandor de neón alrededor de cada cuadro.
    contexto.shadowColor = paleta.primario;
    contexto.shadowBlur = 12;
    if (lentoMs > 0) {
        contexto.shadowColor = "#b6ff5a";   // 🐌 pegajosa
    }
    if (envenenado) {
        contexto.shadowColor = colorVeneno(false);
    }
    if (depredadorMs > 0) {
        contexto.shadowColor = "#ff3b3b";   // 🌶️ depredador
    }
    if (dimensionActiva) {
        contexto.shadowColor = "#ffffff";
    }

    for (let i = 0; i < culebra.length; i++) {
        let color = paleta.primario;      // cuerpo
        if (i === 0) {
            color = paleta.cabeza;        // la cabeza (posición 0) es más clara
        }
        if (envenenado) {
            color = colorVeneno(i === 0);
        } else if (curacionTicks > 0 && animacionArana % 2 === 0) {
            color = "#b9ffd0";
        }
        // 🌶️ Depredador: tonos de fuego (parpadea en los últimos segundos).
        if (depredadorMs > 0 && !(depredadorMs < 3000 && animacionEventos % 2 === 0)) {
            color = "hsl(" + ((animacionEventos * 14 + i * 10) % 55) + ", 100%, " + (i === 0 ? "82%" : "55%") + ")";
        }
        // 🌌 Sala del creador: la serpiente se vuelve arcoíris.
        if (dimensionActiva) {
            color = "hsl(" + ((animacionEventos * 12 + i * 18) % 360) + ", 100%, " + (i === 0 ? "85%" : "60%") + ")";
        }
        dibujar(culebra[i].x + 1, culebra[i].y + 1, tamanoCelda - 2, tamanoCelda - 2, color);
    }

    contexto.shadowBlur = 0;
}

// 🍎 DIBUJAR ALIMENTOS: cada fruta se pinta con su emoji. Las que tienen tiempo limitado llevan
// un anillo que se vacía y parpadean cuando están por desaparecer.
function dibujarAlimentos() {
    contexto.font = "20px serif";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";

    for (let i = 0; i < alimentos.length; i++) {
        let fruta = alimentos[i];
        if (fruta.temporal && fruta.vidaMs < avisoFrutaMs && animacionEventos % 4 < 2) {
            continue; // parpadeo de aviso
        }
        let cx = fruta.x + tamanoCelda / 2;
        let cy = fruta.y + tamanoCelda / 2;

        if (fruta.temporal) {
            let fraccion = Math.max(0, fruta.vidaMs / fruta.vidaTotalMs);
            contexto.lineWidth = 2;
            contexto.globalAlpha = 0.85;
            contexto.strokeStyle = fraccion < 0.3 ? "#ff3b5c" : paleta.primario;
            contexto.beginPath();
            contexto.arc(cx, cy, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraccion);
            contexto.stroke();
            contexto.globalAlpha = 1;
        }
        contexto.fillText(fruta.tipo.emoji, cx, cy + 1);
    }
}

// 👾 DIBUJAR ENEMIGOS: con un brillo naranja para que se noten el peligro.
function dibujarEnemigos() {
    contexto.font = "22px serif";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.shadowColor = "#ff7a1a";
    contexto.shadowBlur = 14;

    for (let i = 0; i < enemigos.length; i++) {
        contexto.fillText("👾", enemigos[i].x + tamanoCelda / 2, enemigos[i].y + tamanoCelda / 2 + 1);
    }

    contexto.shadowBlur = 0;
}

// 🎬 DIBUJAR JUEGO: un fotograma completo (limpiar y pintar todo).
function dibujarJuego() {
    limpiarCanvas();
    if (dimensionActiva) {
        dibujarFondoDimension();
    }
    dibujarBabas();             // 🐌 el rastro va por debajo de todo
    dibujarAlimentos();
    dibujarPortales();
    dibujarGrieta();
    dibujarObstaculos();
    dibujarCulebra();
    dibujarEnemigos();
    dibujarPeligros();
    dibujarCaracoles();         // 🐌 nuevo
    dibujarArana();
    dibujarParticulas();
    dibujarVeneno();
    dibujarHud();
    dibujarEstadosTemporales(); // 🌶️ depredador y 🐌 ralentización
    if (dimensionActiva) {
        dibujarDimension();
    }
}


// ==========================================================
// 🎮 CONTROLES DE MOVIMIENTO (teclado, botones y deslizamiento usan estas funciones)
// ==========================================================

// 🚫 REGLA ANTI-REVERSA: comparamos con velocidadX/Y (el último paso real).
// Si vamos a la derecha (velocidadX > 0), girar a la izquierda sería chocar con
// nuestro propio cuello. Por eso solo permitimos girar en el eje contrario.
// Guardamos el giro en proximaX/Y y se aplica en el siguiente paso del juego.
// Así, aunque el jugador pulse dos teclas muy rápido, nunca se da la vuelta.

function moverIzquierda() {
    if (dimensionActiva) {
        saltarCreador = true;   // en la sala del creador, mover la serpiente permite continuar
        return;
    }
    if (jugando && velocidadX === 0) {
        proximaX = -tamanoCelda;
        proximaY = 0;
    }
}

function moverDerecha() {
    if (dimensionActiva) {
        saltarCreador = true;   // en la sala del creador, mover la serpiente permite continuar
        return;
    }
    if (jugando && velocidadX === 0) {
        proximaX = tamanoCelda;
        proximaY = 0;
    }
}

function moverArriba() {
    if (dimensionActiva) {
        saltarCreador = true;   // en la sala del creador, mover la serpiente permite continuar
        return;
    }
    if (jugando && velocidadY === 0) {
        proximaX = 0;
        proximaY = -tamanoCelda;
    }
}

function moverAbajo() {
    if (dimensionActiva) {
        saltarCreador = true;   // en la sala del creador, mover la serpiente permite continuar
        return;
    }
    if (jugando && velocidadY === 0) {
        proximaX = 0;
        proximaY = tamanoCelda;
    }
}

// ⌨️ TECLADO: "keydown" se dispara cada vez que el jugador pulsa una tecla.
document.addEventListener("keydown", function (evento) {
    if (dialogoAbierto) {
        return; // mientras se escribe el nombre, las flechas no mueven la serpiente
    }
    if (evento.key === "ArrowLeft") {
        moverIzquierda();
    } else if (evento.key === "ArrowRight") {
        moverDerecha();
    } else if (evento.key === "ArrowUp") {
        moverArriba();
    } else if (evento.key === "ArrowDown") {
        moverAbajo();
    } else {
        return; // otras teclas: no hacemos nada
    }
    // Evitamos que la página se desplace con las flechas.
    evento.preventDefault();
});

// ⌨️ TECLAS EXTRA (un solo listener, se registra una única vez al cargar el archivo):
// ENTER o I = iniciar/continuar | ESPACIO o P = pausar/continuar | ESC = pausar
// R = reiniciar (durante una partida hay que pulsarla dos veces) | M = música | T = TOP 10 | N = cambiar nombre
document.addEventListener("keydown", function (evento) {
    if (dialogoAbierto || evento.repeat) {
        return; // con el diálogo abierto las teclas son para escribir el nombre
    }
    if (evento.ctrlKey || evento.metaKey || evento.altKey || typeof evento.key !== "string") {
        return;
    }
    let tecla = evento.key.toLowerCase();
    if (tecla === "m") {
        alternarMusica();
    } else if (tecla === "t") {
        alternarRanking();
    } else if (tecla === "n") {
        if (!jugando && !partidaEnCurso) {
            abrirDialogoNombre(null);
        }
    } else if (tecla === "enter" || tecla === "i") {
        iniciarJuego();
    } else if (tecla === " " || tecla === "spacebar" || tecla === "p") {
        alternarPausa();
    } else if (tecla === "escape") {
        pausarJuego();
    } else if (tecla === "r") {
        reiniciarConTecla();
    } else {
        return;
    }
    // Espacio y Enter no deben pulsar de nuevo el botón que tenga el foco.
    if (tecla === " " || tecla === "spacebar" || tecla === "enter") {
        evento.preventDefault();
    }
    if (document.activeElement && document.activeElement.tagName === "BUTTON") {
        document.activeElement.blur();
    }
});

// 👆 DESLIZAR EL DEDO: guardamos dónde empezó el toque y comparamos con dónde terminó.
let toqueInicioX = 0;
let toqueInicioY = 0;

canvas.addEventListener("touchstart", function (evento) {
    toqueInicioX = evento.touches[0].clientX;
    toqueInicioY = evento.touches[0].clientY;
    evento.preventDefault();
}, { passive: false });

// Al mover el dedo evitamos que la pantalla del celular se desplace.
canvas.addEventListener("touchmove", function (evento) {
    evento.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", function (evento) {
    let difX = evento.changedTouches[0].clientX - toqueInicioX;
    let difY = evento.changedTouches[0].clientY - toqueInicioY;

    // Si el dedo casi no se movió, fue un toque y no un deslizamiento.
    if (Math.abs(difX) < 20 && Math.abs(difY) < 20) {
        return;
    }

    // ¿El deslizamiento fue más horizontal o más vertical?
    if (Math.abs(difX) > Math.abs(difY)) {
        if (difX > 0) {
            moverDerecha();
        } else {
            moverIzquierda();
        }
    } else {
        if (difY > 0) {
            moverAbajo();
        } else {
            moverArriba();
        }
    }
}, { passive: false });


// ==========================================================
// 🍽️ SISTEMA DE ALIMENTOS
// ==========================================================

// 🔎 ¿OCUPADA?: devuelve true si en esa celda ya hay serpiente o comida.
function posicionOcupada(x, y) {
    for (let i = 0; i < culebra.length; i++) {
        if (culebra[i].x === x && culebra[i].y === y) {
            return true;
        }
    }
    for (let j = 0; j < alimentos.length; j++) {
        if (alimentos[j].x === x && alimentos[j].y === y) {
            return true;
        }
    }
    for (let k = 0; k < enemigos.length; k++) {
        if (enemigos[k].x === x && enemigos[k].y === y) {
            return true;
        }
    }
    // 🕷️ La araña también ocupa su celda.
    if (arana !== null && arana.x === x && arana.y === y) {
        return true;
    }
    // 🧱🌀🪲🌌 Obstáculos, portales, enemigos variados y la grieta secreta también ocupan su celda.
    if (obstaculoEn(x, y) || portalEn(x, y) || peligroEn(x, y) || grietaEn(x, y) || caracolEn(x, y)) {
        return true;
    }
    return false;
}

// 🎰 ELEGIR TIPO: sorteo con "pesos" dentro de una categoría ("basica" o "especial").
// La depredadora no sale si ya hay una en el tablero o el modo está activo.
function tipoComidaPermitido(tipo) {
    if (tipo.depredador) {
        if (depredadorMs > 0) {
            return false;
        }
        for (let i = 0; i < alimentos.length; i++) {
            if (alimentos[i].tipo.depredador) {
                return false;
            }
        }
    }
    return true;
}

function elegirTipo(categoria) {
    let total = 0;
    for (let i = 0; i < tiposComida.length; i++) {
        if (tiposComida[i].categoria === categoria && tipoComidaPermitido(tiposComida[i])) {
            total = total + tiposComida[i].peso;
        }
    }
    if (total === 0) {
        return null;
    }

    let sorteo = numeroAleatorio(total);
    for (let j = 0; j < tiposComida.length; j++) {
        if (tiposComida[j].categoria === categoria && tipoComidaPermitido(tiposComida[j])) {
            if (sorteo < tiposComida[j].peso) {
                return tiposComida[j];
            }
            sorteo = sorteo - tiposComida[j].peso;
        }
    }
    return null;
}

// 🌱 CREAR ALIMENTO: elige un tipo de la categoría y una celda libre (máximo 300 intentos:
// si el tablero está muy lleno devuelve null en vez de quedarse atascado).
// Las frutas especiales sortean cuánto tiempo se quedan en el tablero.
function crearAlimento(categoria) {
    if (categoria === undefined) {
        categoria = "basica";
    }
    let tipo = elegirTipo(categoria);
    if (tipo === null) {
        return null;
    }

    for (let intento = 0; intento < 300; intento++) {
        let x = numeroAleatorio(columnas) * tamanoCelda;
        let y = numeroAleatorio(filas) * tamanoCelda;
        if (posicionOcupada(x, y)) {
            continue;
        }
        if (categoria === "especial" && distanciaACabeza(x, y) < 3) {
            continue; // las especiales no nacen pegadas a la cabeza
        }
        let temporal = tipo.vidaMax > 0;
        let vida = 0;
        if (temporal) {
            vida = tipo.vidaMin + numeroAleatorio(tipo.vidaMax - tipo.vidaMin);
        }
        return { x: x, y: y, tipo: tipo, temporal: temporal, vidaMs: vida, vidaTotalMs: vida };
    }
    return null;
}

// 🔢 ¿CUÁNTAS FRUTAS DE UNA CATEGORÍA HAY?
function contarAlimentos(categoria) {
    let total = 0;
    for (let i = 0; i < alimentos.length; i++) {
        if (alimentos[i].tipo.categoria === categoria) {
            total = total + 1;
        }
    }
    return total;
}

// 🍎 REPONER BÁSICAS: siempre hay "cantidadBasicas" frutas de 1 punto.
function reponerBasicas() {
    let intentos = 0;
    while (contarAlimentos("basica") < cantidadBasicas && intentos < cantidadBasicas) {
        intentos = intentos + 1;
        let fruta = crearAlimento("basica");
        if (fruta === null) {
            break;
        }
        alimentos.push(fruta);
    }
}

// ⏳ GESTIONAR ALIMENTOS (una vez por paso): descuenta el tiempo de las frutas con límite,
// retira las que se acabaron y crea frutas especiales cada cierto tiempo.
function gestionarAlimentos() {
    for (let i = alimentos.length - 1; i >= 0; i--) {
        let fruta = alimentos[i];
        if (!fruta.temporal) {
            continue;
        }
        fruta.vidaMs = fruta.vidaMs - velocidadActual;
        if (fruta.vidaMs <= 0) {
            crearParticulas(fruta.x + tamanoCelda / 2, fruta.y + tamanoCelda / 2, 8, "#9aa7b3");
            alimentos.splice(i, 1);
        }
    }

    tiempoParaEspecialMs = tiempoParaEspecialMs - velocidadActual;
    if (tiempoParaEspecialMs <= 0) {
        if (contarAlimentos("especial") < maximoEspeciales) {
            let especial = crearAlimento("especial");
            if (especial !== null) {
                alimentos.push(especial);
                crearParticulas(especial.x + tamanoCelda / 2, especial.y + tamanoCelda / 2, 6, "#ffffff");
            }
        }
        tiempoParaEspecialMs = sortearEspera(esperaEspecialMin, esperaEspecialMax);
    }

    reponerBasicas();
}

// ✂️ PERDER SEGMENTOS: quitamos piezas de la cola, pero siempre queda la cabeza.
function perderSegmentos(cantidad) {
    for (let i = 0; i < cantidad; i++) {
        if (culebra.length > 1) {
            culebra.pop(); // pop() elimina el último elemento (la cola)
        }
    }
}

// 🧪 APLICAR EFECTO: cada fruta cambia el juego según su descripción.
function aplicarEfecto(tipo) {
    puntos = puntos + tipo.puntos;
    if (puntos < 0) {
        puntos = 0; // nunca mostramos puntos negativos
    }
    mostrarTexto("puntos", puntos);

    segmentosPorCrecer = segmentosPorCrecer + tipo.crecer;

    if (tipo.quitar > 0) {
        perderSegmentos(tipo.quitar);
    }

    if (tipo.turbo) {
        turboRestante = 40; // el rayo dura 40 pasos
        actualizarVelocidad();
    }

    if (tipo.depredador) {
        activarDepredador();
    }

    mostrarTexto("mensaje", tipo.mensaje);
    sonidoFruta(tipo); // 🎵 nuevo
}

// 🍴 COMPROBAR COMIDA: ¿la cabeza está en la misma celda que alguna fruta?
function comprobarComida() {
    for (let i = 0; i < alimentos.length; i++) {
        if (culebra[0].x === alimentos[i].x && culebra[0].y === alimentos[i].y) {
            let tipoComido = alimentos[i].tipo;
            alimentos.splice(i, 1);            // retiramos la fruta comida
            aplicarEfecto(tipoComido);
            registrarFrutaVeneno(tipoComido);  // 🧪 si estamos envenenados, cuenta para la cura
            reponerBasicas();                  // si era básica, aparece otra enseguida
            break;                             // solo se come una fruta por paso
        }
    }
}


// ==========================================================
// 👾 ENEMIGOS
// ==========================================================

// 📏 DISTANCIA A LA CABEZA: cuántas celdas hay entre un punto y la cabeza
// (contando pasos horizontales + verticales).
function distanciaACabeza(x, y) {
    let celdasX = Math.abs(x - culebra[0].x) / tamanoCelda;
    let celdasY = Math.abs(y - culebra[0].y) / tamanoCelda;
    return celdasX + celdasY;
}

// 🌑 CREAR ENEMIGO: aparece en una celda libre y LEJOS de la cabeza (mínimo 8 celdas),
// para que nunca nazca encima del jugador.
function crearEnemigo() {
    let x = numeroAleatorio(columnas) * tamanoCelda;
    let y = numeroAleatorio(filas) * tamanoCelda;

    while (posicionOcupada(x, y) || distanciaACabeza(x, y) < 8) {
        x = numeroAleatorio(columnas) * tamanoCelda;
        y = numeroAleatorio(filas) * tamanoCelda;
    }

    return { x: x, y: y };
}

// 📈 ACTUALIZAR ENEMIGOS: mientras más puntos, más enemigos.
// 1 enemigo al empezar y 1 más cada 15 puntos, hasta el máximo.
function actualizarEnemigos() {
    let deseados = 1 + Math.floor(puntos / 15);
    if (deseados > maximoEnemigos) {
        deseados = maximoEnemigos;
    }
    while (enemigos.length < deseados) {
        enemigos.push(crearEnemigo());
    }
}

// 🔎 ¿HAY OTRO ENEMIGO AHÍ?: evita que dos enemigos se apilen en la misma celda.
function enemigoEn(x, y) {
    for (let i = 0; i < enemigos.length; i++) {
        if (enemigos[i].x === x && enemigos[i].y === y) {
            return true;
        }
    }
    return false;
}

// 😱 ¿ENEMIGO EN LA CABEZA?: la serpiente caminó directo hacia un enemigo.
function enemigoEnCabeza() {
    return enemigoEn(culebra[0].x, culebra[0].y);
}

// 🏹 MOVER ENEMIGOS: cada enemigo da un paso hacia la cabeza.
// Devuelve true si un enemigo alcanzó la cabeza (Game Over).
function moverEnemigos() {
    pasosJuego = pasosJuego + 1;

    // Al inicio hay un periodo de gracia, y luego se mueven solo cada "ritmoEnemigo" pasos.
    // El símbolo % da el resto de una división: sirve para actuar "cada N pasos".
    if (pasosJuego < pasosGracia || pasosJuego % ritmoEnemigo !== 0) {
        return false;
    }

    for (let i = 0; i < enemigos.length; i++) {
        let enemigo = enemigos[i];

        // Cuánto le falta al enemigo para llegar a la cabeza en cada eje.
        let difX = culebra[0].x - enemigo.x;
        let difY = culebra[0].y - enemigo.y;

        let nuevoX = enemigo.x;
        let nuevoY = enemigo.y;

        // Se mueve en el eje donde está MÁS lejos. Si la diferencia es positiva
        // avanza (+), y si es negativa retrocede (-).
        if (Math.abs(difX) > Math.abs(difY)) {
            if (difX > 0) {
                nuevoX = nuevoX + tamanoCelda;
            } else {
                nuevoX = nuevoX - tamanoCelda;
            }
        } else {
            if (difY > 0) {
                nuevoY = nuevoY + tamanoCelda;
            } else {
                nuevoY = nuevoY - tamanoCelda;
            }
        }

        // Solo avanza si no hay otro enemigo en esa celda (ni un obstáculo 🧱).
        if (!enemigoEn(nuevoX, nuevoY) && !obstaculoEn(nuevoX, nuevoY)) {
            enemigo.x = nuevoX;
            enemigo.y = nuevoY;
        }

        // ¿El enemigo llegó a algún segmento de la serpiente?
        for (let j = 0; j < culebra.length; j++) {
            if (enemigo.x === culebra[j].x && enemigo.y === culebra[j].y) {
                // j = 0 es la cabeza: ¡te comió!
                if (j === 0) {
                    return true;
                }
                // Si mordió el cuerpo, se lleva ese segmento y todo lo que sigue hasta la cola.
                // splice(j) elimina desde la posición j hasta el final del arreglo.
                let perdidos = culebra.length - j;
                culebra.splice(j);
                // El enemigo se va "satisfecho" y reaparece lejos.
                enemigos[i] = crearEnemigo();
                mostrarTexto("mensaje", "👾 ¡Un enemigo mordió tu cola! Pierdes " + perdidos + " segmentos");
                break;
            }
        }
    }

    return false;
}


// ==========================================================
// 🕷️ ARAÑA, ☣️ VENENO Y ✨ EFECTOS
// ==========================================================

// 🎲 SORTEAR ESPERA: cuántos milisegundos faltan para la próxima araña.
// El resultado es distinto cada vez, así nunca sabes cuándo llegará.
function sortearEsperaArana() {
    return esperaAranaMin + numeroAleatorio(esperaAranaMax - esperaAranaMin);
}

// 🧹 REINICIAR ARAÑA: deja todo el sistema de la araña como al empezar.
function reiniciarArana() {
    arana = null;
    tiempoParaAranaMs = sortearEsperaArana();
    animacionArana = 0;
    envenenado = false;
    venenoRestanteMs = 0;
    frutasPendientes = 0;
    flashMordida = 0;
    curacionTicks = 0;
    particulas = [];
}

// 💨 CREAR PARTÍCULAS: lanza "cantidad" puntitos desde (x, y) en direcciones al azar.
// Se usan para el humo de la araña, la mordida y la curación.
function crearParticulas(x, y, cantidad, color) {
    for (let i = 0; i < cantidad; i++) {
        if (particulas.length >= 150) {
            return; // tope de seguridad: nunca habrá demasiadas
        }
        let vida = 8 + numeroAleatorio(5);
        particulas.push({
            x: x,
            y: y,
            vx: (numeroAleatorio(21) - 10) * 0.7, // velocidad horizontal (de -7 a 7)
            vy: (numeroAleatorio(21) - 10) * 0.7, // velocidad vertical
            vida: vida,
            vidaMax: vida,
            color: color,
            tam: 2 + numeroAleatorio(4)
        });
    }
}

// 💨 ACTUALIZAR PARTÍCULAS: las mueve y elimina las que ya "murieron".
// Recorremos al revés para poder borrar con splice sin saltarnos ninguna.
function actualizarParticulas() {
    for (let i = particulas.length - 1; i >= 0; i--) {
        particulas[i].x = particulas[i].x + particulas[i].vx;
        particulas[i].y = particulas[i].y + particulas[i].vy;
        particulas[i].vida = particulas[i].vida - 1;
        if (particulas[i].vida <= 0) {
            particulas.splice(i, 1);
        }
    }
}

// 💨 DIBUJAR PARTÍCULAS: se vuelven transparentes a medida que se acaban.
function dibujarParticulas() {
    for (let i = 0; i < particulas.length; i++) {
        let p = particulas[i];
        contexto.globalAlpha = p.vida / p.vidaMax;
        contexto.fillStyle = p.color;
        contexto.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
    }
    contexto.globalAlpha = 1;
}

// 🌑 CREAR ARAÑA: elige una celda libre, a 5 celdas o más de la cabeza,
// y lanza el humo de aparición.
function crearArana() {
    let x = numeroAleatorio(columnas) * tamanoCelda;
    let y = numeroAleatorio(filas) * tamanoCelda;

    // Mientras la celda esté ocupada o muy cerca de la cabeza, probamos otra.
    while (posicionOcupada(x, y) || distanciaACabeza(x, y) < 5) {
        x = numeroAleatorio(columnas) * tamanoCelda;
        y = numeroAleatorio(filas) * tamanoCelda;
    }

    // Humo oscuro y morado en el centro de la celda.
    crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 14, "#4b1d6b");
    crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 8, "#8a8aa8");
    mostrarTexto("mensaje", "🕷️ Algo se mueve en la oscuridad...");

    return {
        x: x,
        y: y,
        estado: "apareciendo",
        progreso: 0,          // pasos de la animación de aparición
        dirX: 0,              // última dirección en la que caminó
        dirY: 0,
        relojMs: 0,           // acumula milisegundos para saber cuándo da su siguiente paso
        vidaMs: vidaAranaMs   // tiempo que le queda en el tablero
    };
}

// 💨 DESAPARECER ARAÑA: se esfuma entre humo y programamos la próxima.
function desaparecerArana() {
    crearParticulas(arana.x + tamanoCelda / 2, arana.y + tamanoCelda / 2, 12, "#4b1d6b");
    arana = null;
    tiempoParaAranaMs = sortearEsperaArana();
}

// 🔎 ¿CELDA LIBRE PARA LA ARAÑA?: no puede salirse del canvas ni pisar el cuerpo de
// la culebra, las frutas o los enemigos 👾. La CABEZA sí es válida: ahí muerde.
function celdaLibreParaArana(x, y) {
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return false;
    }
    // Empezamos en i = 1 para dejar la cabeza (posición 0) como destino permitido.
    for (let i = 1; i < culebra.length; i++) {
        if (culebra[i].x === x && culebra[i].y === y) {
            return false;
        }
    }
    for (let j = 0; j < alimentos.length; j++) {
        if (alimentos[j].x === x && alimentos[j].y === y) {
            return false;
        }
    }
    if (enemigoEn(x, y)) {
        return false;
    }
    // 🧱🪲 Tampoco pisa obstáculos ni enemigos variados.
    if (obstaculoEn(x, y) || peligroEn(x, y)) {
        return false;
    }
    return true;
}

// 🚶 MOVER ARAÑA: da un paso en la cuadrícula con comportamiento impredecible.
//  - 30% de las veces se acerca a la cabeza (pero solo un eje: no es perseguidora directa).
//  - 35% sigue recto (así camina "con intención").
//  - El resto elige una dirección al azar.
function moverArana() {
    // Las 4 direcciones posibles: derecha, izquierda, abajo, arriba.
    let opciones = [
        { x: tamanoCelda, y: 0 },
        { x: -tamanoCelda, y: 0 },
        { x: 0, y: tamanoCelda },
        { x: 0, y: -tamanoCelda }
    ];

    let elegida;
    let sorteo = numeroAleatorio(100);

    if (sorteo < 30) {
        // Acercarse: miramos cuánto le falta a la cabeza y elegimos un eje al azar.
        let difX = culebra[0].x - arana.x;
        let difY = culebra[0].y - arana.y;
        let usarX = numeroAleatorio(2) === 0;
        if (difX === 0) {
            usarX = false;
        }
        if (difY === 0) {
            usarX = true;
        }
        if (usarX) {
            elegida = { x: difX > 0 ? tamanoCelda : -tamanoCelda, y: 0 };
        } else {
            elegida = { x: 0, y: difY > 0 ? tamanoCelda : -tamanoCelda };
        }
    } else if (sorteo < 65 && (arana.dirX !== 0 || arana.dirY !== 0)) {
        elegida = { x: arana.dirX, y: arana.dirY }; // seguir recto
    } else {
        elegida = opciones[numeroAleatorio(4)];     // dirección al azar
    }

    // Si la dirección elegida está bloqueada, probamos las 4 empezando por una al azar.
    let nuevoX = arana.x + elegida.x;
    let nuevoY = arana.y + elegida.y;
    let inicio = numeroAleatorio(4);
    let intentos = 0;
    while (!celdaLibreParaArana(nuevoX, nuevoY) && intentos < 4) {
        elegida = opciones[(inicio + intentos) % 4];
        nuevoX = arana.x + elegida.x;
        nuevoY = arana.y + elegida.y;
        intentos = intentos + 1;
    }

    // Solo se mueve si encontró una celda válida; si no, se queda quieta este paso.
    if (celdaLibreParaArana(nuevoX, nuevoY)) {
        arana.x = nuevoX;
        arana.y = nuevoY;
        arana.dirX = elegida.x;
        arana.dirY = elegida.y;
    }
}

// 🔎 ¿LA ARAÑA TOCA LA CABEZA?
function aranaTocaCabeza() {
    return arana !== null && arana.x === culebra[0].x && arana.y === culebra[0].y;
}

// 🦷 MORDER: envenena a la culebra. La araña desaparece tras morder, así que una
// misma mordida NUNCA puede activar el veneno dos veces.
function morderCulebra() {
    let centroX = culebra[0].x + tamanoCelda / 2;
    let centroY = culebra[0].y + tamanoCelda / 2;

    // Si por alguna razón ya estábamos envenenados, solo retiramos a la araña.
    if (!envenenado) {
        envenenado = true;
        venenoRestanteMs = duracionVenenoMs;
        frutasPendientes = frutasParaCurar;
        flashMordida = 4;
        crearParticulas(centroX, centroY, 18, "#ff2bd6");
        crearParticulas(centroX, centroY, 12, "#9dff00");
        mostrarTexto("mensaje", "🕷️ ¡Mordida! Come " + frutasParaCurar + " frutas en " + (duracionVenenoMs / 1000) + " s");
        sonido("mordida"); // 🎵 nuevo
    }

    arana = null;
    tiempoParaAranaMs = sortearEsperaArana();
}

// 🎨 COLOR DEL VENENO: va de verde tóxico (recién mordida) a rojo (se acaba el tiempo).
// El tono (hue) del color es 120 al inicio y baja hasta 0. En los últimos 5 s parpadea
// alternando con el color normal de la culebra, y en los últimos 2.5 s parpadea el DOBLE de rápido.
function colorVeneno(esCabeza) {
    let fraccion = venenoRestanteMs / duracionVenenoMs;
    if (fraccion < 0) {
        fraccion = 0;
    }
    if (fraccion > 1) {
        fraccion = 1;
    }
    let tono = Math.floor(120 * fraccion);

    if (venenoRestanteMs <= 5000) {
        let alterna;
        if (venenoRestanteMs <= 2500) {
            alterna = animacionArana % 2 === 0;                 // parpadeo rápido
        } else {
            alterna = Math.floor(animacionArana / 2) % 2 === 0; // parpadeo más lento
        }
        if (alterna) {
            if (esCabeza) {
                return "#eaffff";
            }
            return "#00f0ff";
        }
    }
    if (esCabeza) {
        return "hsl(" + tono + ", 100%, 80%)";
    }
    return "hsl(" + tono + ", 100%, 50%)";
}

// ⏳ GESTIONAR VENENO: descuenta tiempo en cada paso y aplica el castigo si se acaba.
function gestionarVeneno() {
    if (!envenenado) {
        return;
    }

    // En cada paso restamos los milisegundos que dura un paso.
    venenoRestanteMs = venenoRestanteMs - velocidadActual;

    if (venenoRestanteMs <= 0) {
        // ☠️ PENALIZACIÓN (no es Game Over): pierdes puntos y segmentos, y el veneno termina.
        envenenado = false;
        venenoRestanteMs = 0;
        frutasPendientes = 0;

        puntos = puntos - penalizacionPuntos;
        if (puntos < 0) {
            puntos = 0;
        }
        mostrarTexto("puntos", puntos);
        perderSegmentosHastaMinimo(penalizacionSegmentos, 3); // 🆕 nunca baja de 3 segmentos

        flashMordida = 4;
        crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 16, "#ff2b2b");
        mostrarTexto("mensaje", "☠️ ¡El veneno te debilitó! -" + penalizacionPuntos + " puntos y pierdes " + penalizacionSegmentos + " segmentos");
        sonido("golpe");
    }
}

// 💚 CURAR: se elimina el veneno y lanzamos la animación de recuperación.
function curarVeneno() {
    envenenado = false;
    venenoRestanteMs = 0;
    frutasPendientes = 0;
    curacionTicks = 12;
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 24, "#39ff14");
    mostrarTexto("mensaje", "💚 ¡Veneno eliminado! Estás curado (+" + puntosCura + " puntos)");
    ganarPuntos(puntosCura); // 🆕 premio por superar el desafío
    sonido("cura");
}

// 🧪 REGISTRAR FRUTA: se llama cada vez que la culebra come.
// Solo cuentan los alimentos buenos (bueno: true). La fruta podrida y el hongo NO curan.
function registrarFrutaVeneno(tipo) {
    if (!envenenado || !tipo.bueno) {
        return;
    }
    frutasPendientes = frutasPendientes - 1;
    if (frutasPendientes <= 0) {
        curarVeneno();
    } else {
        mostrarTexto("mensaje", "🧪 Veneno: faltan " + frutasPendientes + " frutas");
    }
}

// 🔁 GESTIONAR ARAÑA: se llama UNA vez por paso desde cicloJuego.
// No usa relojes propios: suma los milisegundos de cada paso. Por eso se pausa
// con el juego y se detiene en Game Over sin código extra.
function gestionarArana() {
    animacionArana = animacionArana + 1;
    actualizarParticulas();

    if (flashMordida > 0) {
        flashMordida = flashMordida - 1;
    }
    if (curacionTicks > 0) {
        curacionTicks = curacionTicks - 1;
    }

    // 🌌 En la dimensión secreta no hay araña ni veneno: la culebra está protegida.
    if (dimensionActiva) {
        arana = null;
        envenenado = false;
        venenoRestanteMs = 0;
        frutasPendientes = 0;
        return;
    }

    gestionarVeneno();

    // 1) No hay araña: contamos el tiempo para la próxima (solo si no estamos envenenados).
    if (arana === null) {
        if (!envenenado) {
            tiempoParaAranaMs = tiempoParaAranaMs - velocidadActual;
            if (tiempoParaAranaMs <= 0) {
                arana = crearArana();
            }
        }
        return;
    }

    // 2) La culebra caminó sobre la araña: mordida.
    if (aranaTocaCabeza()) {
        contactoArana();
        return;
    }

    if (arana.estado === "apareciendo") {
        // 3) Sale de la oscuridad: todavía no se mueve.
        arana.progreso = arana.progreso + 1;
        if (arana.progreso === Math.floor(ticksAparicion / 2)) {
            crearParticulas(arana.x + tamanoCelda / 2, arana.y + tamanoCelda / 2, 8, "#4b1d6b");
        }
        if (arana.progreso >= ticksAparicion) {
            arana.estado = "activa";
        }
    } else {
        // 4) Activa: puede esfumarse, o dar un paso cuando se acumulan sus milisegundos.
        arana.vidaMs = arana.vidaMs - velocidadActual;
        if (arana.vidaMs <= 0) {
            desaparecerArana();
            return;
        }

        arana.relojMs = arana.relojMs + velocidadActual;
        if (arana.relojMs >= intervaloAranaMs) {
            arana.relojMs = arana.relojMs - intervaloAranaMs;
            moverArana();
            // La araña caminó hacia la cabeza: mordida.
            if (aranaTocaCabeza()) {
                contactoArana();
            }
        }
    }
}

// 🕷️ CONTACTO CON LA ARAÑA: normalmente muerde; con el modo depredador la devoras.
function contactoArana() {
    if (depredadorMs > 0) {
        ganarPuntos(puntosDevorarArana);
        devorados = devorados + 1;
        segmentosPorCrecer = segmentosPorCrecer + 1;
        mostrarTexto("mensaje", "😋 ¡Devoraste a la araña! +" + puntosDevorarArana + " puntos");
        sonido("devorar");
        desaparecerArana();
    } else {
        morderCulebra();
    }
}

// 🕷️ DIBUJAR ARAÑA: cuerpo, 8 patas animadas, ojos y aura, todo con formas simples.
function dibujarArana() {
    if (arana === null) {
        return;
    }

    let centroX = arana.x + tamanoCelda / 2;
    let centroY = arana.y + tamanoCelda / 2;
    let distancia = distanciaACabeza(arana.x, arana.y);
    let cerca = distancia <= 3;       // ojos rojos, patas más rápidas
    let porMorder = distancia <= 1;   // colmillos y temblor: ¡va a morder!

    let escala = 1;
    let transparencia = 1;

    // 🌑 Aparición: una mancha oscura se encoge mientras la araña crece y se hace visible.
    if (arana.estado === "apareciendo") {
        let avance = arana.progreso / ticksAparicion;
        escala = 0.3 + 0.7 * avance;
        transparencia = avance;
        contexto.globalAlpha = 0.6 * (1 - avance);
        contexto.fillStyle = "#000000";
        contexto.beginPath();
        contexto.arc(centroX, centroY, 30 * (1 - avance) + 12, 0, Math.PI * 2);
        contexto.fill();
        contexto.globalAlpha = 1;
    }

    // Temblor justo antes de morder.
    let temblor = 0;
    if (porMorder) {
        temblor = (numeroAleatorio(3) - 1) * 1.5;
    }

    // save/restore: guardamos el estado del pincel para mover y escalar solo a la araña.
    contexto.save();
    contexto.translate(centroX + temblor, centroY);
    contexto.scale(escala, escala);
    contexto.globalAlpha = transparencia;

    // 🌫️ Aura oscura (roja cuando está cerca).
    contexto.fillStyle = cerca ? "rgba(70, 0, 15, 0.6)" : "rgba(15, 0, 30, 0.6)";
    contexto.beginPath();
    contexto.arc(0, 0, 18, 0, Math.PI * 2);
    contexto.fill();

    // 🦵 Patas: 4 por lado, cada una con rodilla. Oscilan con una onda seno.
    let colorNeon = cerca ? "#ff4d6d" : "#b44cff";
    let ritmoPatas = cerca ? 1.7 : 1.1;
    contexto.strokeStyle = colorNeon;
    contexto.shadowColor = colorNeon;
    contexto.shadowBlur = 10;
    contexto.lineWidth = 2;
    contexto.lineCap = "round";

    for (let lado = -1; lado <= 1; lado = lado + 2) {
        for (let i = 0; i < 4; i++) {
            let oscila = Math.sin(animacionArana * ritmoPatas + i * 1.6 + (lado === 1 ? 0 : 3)) * 2.5;
            contexto.beginPath();
            contexto.moveTo(lado * 3, (i - 1.5) * 2);                   // cadera
            contexto.lineTo(lado * 9, (i - 1.5) * 3 - 6);               // rodilla
            contexto.lineTo(lado * 13, (i - 1.5) * 6 + oscila);         // pie
            contexto.stroke();
        }
    }

    // 🕸️ Cuerpo: abdomen y cabeza.
    contexto.fillStyle = "#14002a";
    contexto.lineWidth = 1.5;
    contexto.beginPath();
    contexto.arc(0, 3, 6.5, 0, Math.PI * 2);
    contexto.fill();
    contexto.stroke();
    contexto.beginPath();
    contexto.arc(0, -5, 4.2, 0, Math.PI * 2);
    contexto.fill();
    contexto.stroke();

    // 👀 Ojos brillantes: magenta normal, naranja cerca, rojos y grandes si va a morder.
    let colorOjos = "#ff2bd6";
    if (cerca) {
        colorOjos = "#ff7a1a";
    }
    if (porMorder) {
        colorOjos = "#ff0033";
    }
    let radioOjos = 1.4;
    if (cerca) {
        radioOjos = 1.6 + (animacionArana % 2) * 0.5; // pulsan
    }
    contexto.fillStyle = colorOjos;
    contexto.shadowColor = colorOjos;
    contexto.shadowBlur = 8;
    contexto.beginPath();
    contexto.arc(-2, -6, radioOjos, 0, Math.PI * 2);
    contexto.fill();
    contexto.beginPath();
    contexto.arc(2, -6, radioOjos, 0, Math.PI * 2);
    contexto.fill();

    // 🦷 Colmillos: solo aparecen en la animación previa a la mordida.
    if (porMorder) {
        contexto.fillStyle = "#ffffff";
        contexto.beginPath();
        contexto.moveTo(-2.8, -2);
        contexto.lineTo(-1.8, 3);
        contexto.lineTo(-0.8, -2);
        contexto.fill();
        contexto.beginPath();
        contexto.moveTo(0.8, -2);
        contexto.lineTo(1.8, 3);
        contexto.lineTo(2.8, -2);
        contexto.fill();
    }

    contexto.restore(); // volvemos al pincel normal (alpha, brillo, etc.)
}

// ☣️ DIBUJAR VENENO: destello de mordida, borde de alerta, cuenta regresiva y curación.
// Todo se dibuja sobre el canvas, así no hace falta cambiar el HTML.
function dibujarVeneno() {
    // 🩸 Destello rojo al ser mordido (o al fallar la cura).
    if (flashMordida > 0) {
        contexto.fillStyle = "rgba(255, 0, 60, " + (flashMordida * 0.08) + ")";
        contexto.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (envenenado) {
        let color = colorVeneno(false);
        let segundos = Math.ceil(venenoRestanteMs / 1000);
        let urgente = venenoRestanteMs <= 5000;

        // Borde de alerta: en los últimos 5 s parpadea.
        if (!(urgente && animacionArana % 2 === 0)) {
            contexto.strokeStyle = color;
            contexto.lineWidth = 4;
            contexto.shadowColor = color;
            contexto.shadowBlur = 18;
            contexto.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
            contexto.shadowBlur = 0;
        }

        // Cartel con el tiempo y las frutas pendientes.
        contexto.fillStyle = "rgba(2, 6, 13, 0.75)";
        contexto.fillRect(canvas.width / 2 - 120, 8, 240, 30);
        contexto.strokeStyle = color;
        contexto.lineWidth = 1;
        contexto.strokeRect(canvas.width / 2 - 120, 8, 240, 30);

        contexto.fillStyle = color;
        contexto.font = "bold 16px sans-serif";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText("🧪 " + segundos + " s   ·   faltan " + frutasPendientes + " frutas", canvas.width / 2, 23);
    }

    // 💚 Animación de curación: un anillo verde que se expande desde la cabeza.
    if (curacionTicks > 0) {
        let avance = 12 - curacionTicks;
        contexto.globalAlpha = curacionTicks / 12;
        contexto.strokeStyle = "#39ff14";
        contexto.lineWidth = 3;
        contexto.shadowColor = "#39ff14";
        contexto.shadowBlur = 14;
        contexto.beginPath();
        contexto.arc(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 12 + avance * 6, 0, Math.PI * 2);
        contexto.stroke();

        contexto.fillStyle = "#39ff14";
        contexto.font = "bold 18px sans-serif";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText("💚 ¡CURADO!", canvas.width / 2, 23);

        contexto.globalAlpha = 1;
        contexto.shadowBlur = 0;
    }
}


// ==========================================================
// 🎵 NUEVO: MÚSICA Y SONIDOS (Web Audio API: ya viene en el navegador)
// ==========================================================

// 🔊 INICIAR AUDIO: crea el motor de sonido. Debe llamarse tras un clic o tecla del jugador
// (los navegadores no dejan sonar nada antes).
function iniciarAudio() {
    if (audio === null) {
        try {
            let Contexto = window.AudioContext || window.webkitAudioContext;
            if (!Contexto) {
                return;
            }
            audio = new Contexto();
            audioMaestro = audio.createGain();
            audioMaestro.gain.value = musicaActiva ? volumenMusica : 0;
            audioMaestro.connect(audio.destination);

            // 1 segundo de ruido blanco: sirve para platillos, golpes y explosiones.
            audioRuido = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
            let datos = audioRuido.getChannelData(0);
            for (let i = 0; i < datos.length; i++) {
                datos[i] = Math.random() * 2 - 1;
            }
        } catch (error) {
            audio = null;
            return;
        }
    }
    if (audio.state === "suspended") {
        audio.resume();
    }
    proximoPasoMusica = audio.currentTime + 0.1;
}

// 🎹 NOTA: toca una nota (midi 69 = La 440 Hz) con un pequeño "ataque" y caída suave.
function nota(onda, midi, inicio, duracion, volumen) {
    if (audio === null) {
        return;
    }
    let oscilador = audio.createOscillator();
    let ganancia = audio.createGain();
    oscilador.type = onda;
    oscilador.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    ganancia.gain.setValueAtTime(0.0001, inicio);
    ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.01);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    oscilador.connect(ganancia);
    ganancia.connect(audioMaestro);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracion + 0.05);
}

// 🎢 NOTA DESLIZADA: la altura sube o baja durante la nota (efectos tipo "boing" o "whoosh").
function notaDeslizada(onda, midiInicial, midiFinal, inicio, duracion, volumen) {
    if (audio === null) {
        return;
    }
    let oscilador = audio.createOscillator();
    let ganancia = audio.createGain();
    oscilador.type = onda;
    oscilador.frequency.setValueAtTime(440 * Math.pow(2, (midiInicial - 69) / 12), inicio);
    oscilador.frequency.exponentialRampToValueAtTime(440 * Math.pow(2, (midiFinal - 69) / 12), inicio + duracion);
    ganancia.gain.setValueAtTime(0.0001, inicio);
    ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.01);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    oscilador.connect(ganancia);
    ganancia.connect(audioMaestro);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracion + 0.05);
}

// 🥁 RUIDO: ráfaga de ruido filtrado (platillos, golpes, chasquidos).
function ruido(inicio, duracion, volumen, frecuenciaFiltro) {
    if (audio === null || audioRuido === null) {
        return;
    }
    let fuente = audio.createBufferSource();
    let filtro = audio.createBiquadFilter();
    let ganancia = audio.createGain();
    fuente.buffer = audioRuido;
    filtro.type = "highpass";
    filtro.frequency.value = frecuenciaFiltro;
    ganancia.gain.setValueAtTime(volumen, inicio);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    fuente.connect(filtro);
    filtro.connect(ganancia);
    ganancia.connect(audioMaestro);
    fuente.start(inicio, Math.random() * 0.5);
    fuente.stop(inicio + duracion + 0.02);
}

// 🥁 BOMBO: un "bum" grave que cae de agudo a grave.
function bombo(inicio, volumen) {
    if (audio === null) {
        return;
    }
    let oscilador = audio.createOscillator();
    let ganancia = audio.createGain();
    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(150, inicio);
    oscilador.frequency.exponentialRampToValueAtTime(45, inicio + 0.12);
    ganancia.gain.setValueAtTime(volumen, inicio);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.16);
    oscilador.connect(ganancia);
    ganancia.connect(audioMaestro);
    oscilador.start(inicio);
    oscilador.stop(inicio + 0.2);
}

// 🎭 ELEGIR AMBIENTE: la música cambia según lo que pasa en la partida.
//  calma → todo tranquilo | tension → hay enemigos o nivel alto | suspenso → algo MUY cerca
//  veneno → cuenta regresiva (acelera) | dimension → fiesta del huevo de Pascua
function elegirAmbiente() {
    if (dimensionActiva || depredadorMs > 0) {
        return "dimension";
    }
    if (envenenado) {
        return "veneno";
    }
    if (amenazaCerca(culebra[0].x, culebra[0].y, 4)) {
        return "suspenso";
    }
    if (peligros.length > 0 || arana !== null || nivelDificultad() >= 3) {
        return "tension";
    }
    return "calma";
}

// 🎚️ BPM (pulsos por minuto): sube con el nivel, con el turbo y con el veneno que se acaba.
function bpmAmbiente(ambiente) {
    let nivel = nivelDificultad();
    let bpm = 96 + nivel * 2;
    if (ambiente === "tension") {
        bpm = 108 + nivel * 2;
    } else if (ambiente === "suspenso") {
        bpm = 122 + nivel * 2;
    } else if (ambiente === "veneno") {
        let fraccion = venenoRestanteMs / duracionVenenoMs;
        if (fraccion < 0) {
            fraccion = 0;
        }
        if (fraccion > 1) {
            fraccion = 1;
        }
        bpm = 140 + Math.floor(35 * (1 - fraccion));
    } else if (ambiente === "dimension") {
        bpm = 138;
    }
    if (turboRestante > 0) {
        bpm = bpm + 10;
    }
    return bpm;
}

// 🎼 PROGRAMAR UN PASO DE MÚSICA (una semicorchea). "paso" cuenta desde el inicio;
// 16 pasos = 1 compás. Cada ambiente tiene su propio bajo, ritmo y melodía.
function programarPasoMusica(ambiente, paso, t, d) {
    let p = paso % 16;
    let compas = Math.floor(paso / 16) % 4;

    if (ambiente === "calma") {
        // 🕵️ Bajo saltarín tipo "espía divertido" y plinks al azar.
        if (bajoCalma[p] > 0) {
            nota("triangle", bajoCalma[p], t, d * 1.8, 0.5);
        }
        if (p === 0 || p === 8) {
            bombo(t, 0.45);
        }
        if (p % 2 === 1) {
            ruido(t, 0.03, 0.05, 7000);
        }
        if (compas >= 1 && p % 4 === 2 && numeroAleatorio(100) < 50) {
            nota("square", notasPlink[numeroAleatorio(notasPlink.length)], t, d * 0.8, 0.07);
        }
    } else if (ambiente === "tension") {
        // 😬 Bajo nervioso con semitonos que rozan y golpes secos.
        if (bajoTension[p] > 0) {
            nota("sawtooth", bajoTension[p], t, d * 0.9, 0.17);
        }
        if (p % 4 === 0) {
            bombo(t, 0.6);
        }
        if (p === 4 || p === 12) {
            ruido(t, 0.08, 0.12, 2000);
        }
        if (p % 2 === 0) {
            ruido(t, 0.02, 0.05, 8000);
        }
        if (p === 10 && numeroAleatorio(100) < 50) {
            nota("square", 69, t, d * 1.2, 0.09);
            nota("square", 70, t, d * 1.2, 0.09);
        }
    } else if (ambiente === "suspenso") {
        // 💓 Latidos, zumbido grave, cuerdas temblorosas y acordes disonantes sorpresa.
        if (p === 0 || p === 2 || p === 8 || p === 10) {
            bombo(t, p % 8 === 0 ? 0.8 : 0.5);
        }
        if (p === 0) {
            nota("triangle", compas % 2 === 0 ? 33 : 39, t, d * 14, 0.45);
        }
        if (compas % 2 === 1) {
            nota("square", p % 2 === 0 ? 81 : 82, t, d * 0.9, 0.03);
        }
        if (p % 4 === 2) {
            ruido(t, 0.02, 0.05, 9000);
        }
        if (p === 12 && numeroAleatorio(100) < 35) {
            nota("sawtooth", 57, t, d * 3, 0.1);
            nota("sawtooth", 63, t, d * 3, 0.1);
        }
    } else if (ambiente === "veneno") {
        // 🚨 Alarma: tritono que se acelera mientras se acaba el tiempo.
        if (p % 2 === 0) {
            nota("sawtooth", p % 4 === 0 ? 45 : 57, t, d * 1.5, 0.16);
            nota("square", Math.floor(p / 2) % 2 === 0 ? 76 : 70, t, d * 0.9, 0.07);
        }
        if (p % 4 === 0) {
            bombo(t, 0.7);
        }
        ruido(t, 0.02, 0.04, 8000);
        if (venenoRestanteMs <= 5000 && p % 4 === 1) {
            nota("sine", 93, t, d * 0.6, 0.06);
        }
    } else {
        // 🌈 Dimensión secreta: chiptune alegre en Do mayor, con "boings" cómicos.
        if (bajoDim[p] > 0) {
            nota("square", bajoDim[p], t, d * 0.8, 0.14);
        }
        let melodia = melodiaDim[paso % 32];
        if (melodia > 0) {
            nota("square", melodia, t, d * 0.9, 0.09);
        }
        if (p % 4 === 0) {
            bombo(t, 0.5);
        }
        if (p === 4 || p === 12) {
            ruido(t, 0.07, 0.1, 2500);
        }
        if (p % 4 === 2) {
            ruido(t, 0.02, 0.05, 8000);
        }
        if (numeroAleatorio(100) < 3) {
            notaDeslizada("triangle", 60, 84, t, 0.18, 0.1);
        }
    }
}

// 🎶 MÚSICA PASO: se llama desde cicloJuego. Programa por adelantado (0.35 s) las notas que
// faltan, usando el reloj del audio (muy preciso). No usa setInterval: si el juego se pausa, la música se detiene.
function musicaPaso() {
    if (audio === null || !musicaActiva) {
        return;
    }
    let ahora = audio.currentTime;
    if (proximoPasoMusica < ahora) {
        proximoPasoMusica = ahora + 0.05; // si nos atrasamos, no tocamos todo de golpe
    }

    let ambiente = elegirAmbiente();
    if (ambiente !== ambienteMusica) {
        ambienteMusica = ambiente;
        if (ambiente === "suspenso") {
            nota("sawtooth", 38, ahora, 0.4, 0.2); // golpe grave: "¡algo se acerca!"
        }
    }

    let duracionPaso = 60 / bpmAmbiente(ambiente) / 4;
    while (proximoPasoMusica < ahora + 0.35) {
        programarPasoMusica(ambiente, pasoMusica, proximoPasoMusica, duracionPaso);
        proximoPasoMusica = proximoPasoMusica + duracionPaso;
        pasoMusica = pasoMusica + 1;
    }
}

// 🔔 SONIDO: efectos cortos que suenan en el momento en que pasa algo.
function sonido(nombre) {
    if (audio === null || !musicaActiva) {
        return;
    }
    let t = audio.currentTime;
    let i;

    if (nombre === "fruta") {
        nota("square", 72, t, 0.07, 0.12);
        nota("square", 79, t + 0.06, 0.1, 0.12);
    } else if (nombre === "dorada") {
        let arpegio = [72, 76, 79, 84];
        for (i = 0; i < arpegio.length; i++) {
            nota("square", arpegio[i], t + i * 0.06, 0.1, 0.12);
        }
    } else if (nombre === "baya") {
        nota("triangle", 79, t, 0.1, 0.2);
        nota("triangle", 83, t + 0.08, 0.1, 0.2);
        nota("triangle", 88, t + 0.16, 0.2, 0.2);
    } else if (nombre === "rayo") {
        notaDeslizada("sawtooth", 60, 96, t, 0.3, 0.15);
    } else if (nombre === "mala") {
        notaDeslizada("sawtooth", 62, 38, t, 0.35, 0.18);
    } else if (nombre === "golpe") {
        bombo(t, 0.8);
        ruido(t, 0.15, 0.25, 1500);
    } else if (nombre === "mordida") {
        ruido(t, 0.12, 0.22, 3000);
        nota("square", 82, t, 0.1, 0.12);
        nota("square", 88, t + 0.09, 0.15, 0.12);
    } else if (nombre === "aviso") {
        nota("triangle", 40, t, 0.18, 0.3);
        nota("triangle", 40, t + 0.2, 0.18, 0.3);
    } else if (nombre === "portal") {
        notaDeslizada("sine", 96, 48, t, 0.25, 0.25);
        notaDeslizada("sine", 48, 100, t + 0.2, 0.3, 0.25);
        nota("triangle", 91, t + 0.3, 0.2, 0.1);
    } else if (nombre === "grieta") {
        let magia = [72, 76, 79, 84, 88, 91];
        for (i = 0; i < magia.length; i++) {
            nota("sine", magia[i], t + i * 0.08, 0.35, 0.18);
        }
    } else if (nombre === "nivel") {
        let fanfarria = [72, 76, 79, 84];
        for (i = 0; i < fanfarria.length; i++) {
            nota("square", fanfarria[i], t + i * 0.09, 0.14, 0.12);
        }
    } else if (nombre === "cura") {
        let cura = [67, 71, 74, 79];
        for (i = 0; i < cura.length; i++) {
            nota("sine", cura[i], t + i * 0.07, 0.25, 0.2);
        }
    } else if (nombre === "devorar") {
        notaDeslizada("square", 80, 50, t, 0.12, 0.14);
        notaDeslizada("square", 75, 45, t + 0.08, 0.12, 0.14);
    } else if (nombre === "hablar") {
        nota("square", 76 + numeroAleatorio(12), t, 0.05, 0.05);
    } else if (nombre === "fin") {
        notaDeslizada("sawtooth", 84, 36, t, 0.7, 0.14);
    } else if (nombre === "gameover") {
        let tristes = [64, 62, 60];
        for (i = 0; i < tristes.length; i++) {
            nota("triangle", tristes[i], t + i * 0.32, 0.3, 0.3);
        }
        notaDeslizada("triangle", 57, 40, t + 0.98, 0.8, 0.3);
    } else if (nombre === "victoria") {
        let melodia = [[72, 0, 0.12], [72, 0.14, 0.12], [72, 0.28, 0.12], [76, 0.42, 0.2], [79, 0.66, 0.2],
                       [76, 0.9, 0.12], [79, 1.04, 0.12], [84, 1.2, 0.7]];
        for (i = 0; i < melodia.length; i++) {
            nota("square", melodia[i][0], t + melodia[i][1], melodia[i][2], 0.14);
            nota("triangle", melodia[i][0] - 12, t + melodia[i][1], melodia[i][2], 0.2);
        }
    }
}

// 🍎 SONIDO DE FRUTA: según la fruta que se comió.
function sonidoFruta(tipo) {
    if (!tipo.bueno) {
        sonido("mala");
    } else if (tipo.depredador) {
        sonido("nivel");
    } else if (tipo.turbo) {
        sonido("rayo");
    } else if (tipo.nombre === "Dorada") {
        sonido("dorada");
    } else if (tipo.nombre === "Baya") {
        sonido("baya");
    } else {
        sonido("fruta");
    }
}

// 🔇 ALTERNAR MÚSICA (tecla M): silencia o reactiva todo el sonido.
function alternarMusica() {
    musicaActiva = !musicaActiva;
    iniciarAudio();
    if (audioMaestro !== null) {
        audioMaestro.gain.setTargetAtTime(musicaActiva ? volumenMusica : 0, audio.currentTime, 0.05);
    }
    if (!jugando && !juegoTerminado) {
        dibujarJuego();
    }
}


// ==========================================================
// 🏆 NUEVO: PUNTUACIÓN FINAL, CLASIFICACIÓN TOP 10 Y VICTORIA
// ==========================================================

// 📖 LEER RANKING: devuelve la lista guardada en el navegador (o una lista vacía si no hay).
function leerRanking() {
    try {
        let texto = localStorage.getItem(claveRanking);
        if (texto !== null) {
            let lista = JSON.parse(texto);
            if (Array.isArray(lista)) {
                return lista;
            }
        }
    } catch (error) {
        // localStorage bloqueado o datos dañados: empezamos con una lista vacía.
    }
    return [];
}

// 💾 GUARDAR RANKING: devuelve true si se pudo guardar.
function guardarRanking(lista) {
    try {
        localStorage.setItem(claveRanking, JSON.stringify(lista));
        return true;
    } catch (error) {
        return false;
    }
}

// ⚖️ COMPARAR RESULTADOS (criterio de orden): 1º más puntos, 2º los que ganaron,
// 3º serpiente más larga y 4º el más antiguo (así el orden siempre es el mismo).
function compararRegistros(a, b) {
    if (b.puntos !== a.puntos) {
        return b.puntos - a.puntos;
    }
    if (a.gano !== b.gano) {
        return a.gano ? -1 : 1;
    }
    if (b.tamano !== a.tamano) {
        return b.tamano - a.tamano;
    }
    return a.fecha - b.fecha;
}

// 📝 NOMBRE GUARDADO: lee el último nombre usado ("" si no hay o el almacenamiento está bloqueado).
function nombreGuardado() {
    try {
        return localStorage.getItem(claveNombre) || "";
    } catch (error) {
        return "";
    }
}

// 📝 ABRIR DIÁLOGO DE NOMBRE: ventana propia sobre el tablero (no usa prompt ni alert).
// alConfirmar: función que se ejecuta cuando el jugador confirma (puede ser null).
// El botón CANCELAR solo aparece si ya existe un nombre (la primera vez hay que identificarse).
function abrirDialogoNombre(alConfirmar) {
    let caja = document.getElementById("dialogoNombre");
    let campo = document.getElementById("campoNombre");
    let guardado = nombreGuardado();
    let previo = nombreJugador !== "" ? nombreJugador : guardado;

    accionAlConfirmarNombre = alConfirmar;
    dialogoAbierto = true;
    campo.value = previo;
    document.getElementById("errorNombre").textContent = "";
    document.getElementById("textoDialogo").textContent = previo !== ""
        ? "Confirma tu nombre o escribe otro para el ranking"
        : "Escribe tu nombre para el ranking";
    document.getElementById("btnCancelarNombre").hidden = previo === "";
    caja.hidden = false;
    campo.focus();
    campo.select();
}

// 📝 CERRAR DIÁLOGO
function cerrarDialogoNombre() {
    document.getElementById("dialogoNombre").hidden = true;
    dialogoAbierto = false;
    accionAlConfirmarNombre = null;
    if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
    }
}

// ✅ CONFIRMAR NOMBRE: valida (no vacío), lo guarda y continúa con lo que estaba pendiente.
function confirmarNombre() {
    let campo = document.getElementById("campoNombre");
    let nombre = campo.value.replace(/\s+/g, " ").trim();
    if (nombre === "") {
        document.getElementById("errorNombre").textContent = "Escribe un nombre para continuar";
        campo.focus();
        return;
    }
    nombreJugador = nombre.substring(0, 12);
    try {
        localStorage.setItem(claveNombre, nombreJugador);
    } catch (error) {
        // Sin localStorage el nombre solo vale para esta sesión.
    }
    let siguiente = accionAlConfirmarNombre;
    cerrarDialogoNombre();
    if (siguiente !== null && siguiente !== undefined) {
        siguiente();
    }
}

// ❌ CANCELAR NOMBRE: solo si el botón está disponible.
function cancelarNombre() {
    if (document.getElementById("btnCancelarNombre").hidden) {
        return;
    }
    cerrarDialogoNombre();
    if (!partidaEnCurso) {
        mostrarTexto("mensaje", "Presiona INICIAR para jugar");
    }
}

// 🥚 GUARDAR SECRETO: recuerda (en este navegador) qué secretos descubrió el jugador.
function guardarSecreto(clave) {
    try {
        let lista = JSON.parse(localStorage.getItem(claveSecretos) || "[]");
        if (!Array.isArray(lista)) {
            lista = [];
        }
        if (lista.indexOf(clave) === -1) {
            lista.push(clave);
            localStorage.setItem(claveSecretos, JSON.stringify(lista));
        }
    } catch (error) {
        // sin almacenamiento: el secreto solo cuenta en esta partida
    }
}

// 🎨 APLICAR PALETA: cambia las variables CSS (página) y la paleta que usa el canvas.
function aplicarPaleta(p) {
    paleta = p;
    let raiz = document.documentElement.style;
    raiz.setProperty("--fondo", p.fondo);
    raiz.setProperty("--fondo-canvas", p.fondoCanvas);
    raiz.setProperty("--cian", p.primario);
    raiz.setProperty("--naranja", p.acento);
    raiz.setProperty("--texto", p.texto);
    raiz.setProperty("--texto-apagado", p.apagado);
}

// 🎨 CAMBIAR PALETA: elige un mundo al azar distinto del actual.
function cambiarPaleta(avisar) {
    let nuevo = indicePaleta;
    while (nuevo === indicePaleta) {
        nuevo = numeroAleatorio(PALETAS.length);
    }
    indicePaleta = nuevo;
    aplicarPaleta(PALETAS[nuevo]);
    if (avisar) {
        mostrarTexto("mensaje", "🎨 Nuevo mundo: " + paleta.nombre);
    }
}

// 🧾 REGISTRAR RESULTADO: guarda la partida en el ranking UNA sola vez.
function registrarResultado(gano) {
    if (resultadoGuardado) {
        return;
    }
    resultadoGuardado = true;

    let registro = {
        id: Date.now() + "-" + numeroAleatorio(100000),
        nombre: nombreJugador !== "" ? nombreJugador : "Jugador",
        puntos: puntos,
        tamano: culebra.length,
        nivel: nivelActual + 1,
        huevo: huevoEncontrado,
        gano: gano,
        fecha: Date.now()
    };
    ultimoRegistroId = registro.id;

    let lista = leerRanking();
    lista.push(registro);
    lista.sort(compararRegistros);
    if (lista.length > 100) {
        lista.length = 100; // guardamos como máximo los 100 mejores
    }
    guardarRanking(lista);
}

// 📋 DIBUJAR RANKING: la tabla TOP 10 sobre el canvas, con estética neón.
function dibujarRanking(yInicio) {
    let lista = leerRanking();
    lista.sort(compararRegistros);

    contexto.textBaseline = "middle";
    contexto.font = "bold 12px monospace";
    contexto.fillStyle = "#00f0ff";
    contexto.textAlign = "left";
    contexto.fillText("#", 22, yInicio);
    contexto.fillText("JUGADOR", 46, yInicio);
    contexto.textAlign = "right";
    contexto.fillText("PUNTOS", 262, yInicio);
    contexto.fillText("TAM", 312, yInicio);
    contexto.fillText("NV", 352, yInicio);
    contexto.textAlign = "left";
    contexto.fillText("HUEVO", 380, yInicio);

    contexto.strokeStyle = "rgba(0, 240, 255, 0.4)";
    contexto.lineWidth = 1;
    contexto.beginPath();
    contexto.moveTo(16, yInicio + 11);
    contexto.lineTo(canvas.width - 16, yInicio + 11);
    contexto.stroke();

    if (lista.length === 0) {
        contexto.textAlign = "center";
        contexto.fillStyle = "#8aa0b3";
        contexto.font = "14px sans-serif";
        contexto.fillText("Aún no hay récords. ¡Sé el primero!", canvas.width / 2, yInicio + 60);
        return;
    }

    contexto.font = "13px monospace";
    for (let i = 0; i < lista.length && i < 10; i++) {
        let r = lista[i];
        let y = yInicio + 26 + i * 24;

        // Resaltamos tu resultado más reciente.
        if (r.id === ultimoRegistroId) {
            contexto.fillStyle = "rgba(0, 240, 255, 0.18)";
            contexto.fillRect(14, y - 11, canvas.width - 28, 22);
        }

        // Los ganadores van en dorado.
        contexto.fillStyle = r.gano ? "#ffd23f" : "#e6f7ff";
        contexto.textAlign = "left";
        contexto.fillText(String(i + 1), 22, y);
        contexto.fillText((r.gano ? "🏆 " : "") + r.nombre, 46, y);
        contexto.textAlign = "right";
        contexto.fillText(String(r.puntos), 262, y);
        contexto.fillText(String(r.tamano), 312, y);
        contexto.fillText(String(r.nivel), 352, y);
        contexto.textAlign = "left";
        if (r.huevo) {
            contexto.fillStyle = "#ff5ec4";
            contexto.fillText("🥚 ¡Sí!", 380, y);
        } else {
            contexto.fillStyle = "#5c6b7a";
            contexto.fillText("—", 380, y);
        }
    }
}

// 🖼️ DIBUJAR PANTALLA FINAL: título, resumen y TOP 10. También sirve para ver el ranking con la tecla T.
function dibujarPantallaFinal(titulo, color, lineas) {
    contexto.globalAlpha = 1;
    contexto.shadowBlur = 0;
    contexto.fillStyle = "rgba(2, 6, 13, 0.96)";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.strokeStyle = color;
    contexto.lineWidth = 2;
    contexto.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.font = "bold 30px sans-serif";
    contexto.fillStyle = color;
    contexto.shadowColor = color;
    contexto.shadowBlur = 14;
    contexto.fillText(titulo, canvas.width / 2, 36);
    contexto.shadowBlur = 0;

    contexto.font = "13px sans-serif";
    contexto.fillStyle = "#d8f6ff";
    for (let i = 0; i < lineas.length; i++) {
        contexto.fillText(lineas[i], canvas.width / 2, 66 + i * 18);
    }

    dibujarRanking(66 + lineas.length * 18 + 22);

    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.font = "12px sans-serif";
    contexto.fillStyle = "#8aa0b3";
    contexto.fillText("INICIAR: jugar de nuevo  ·  T: ranking  ·  M: música  ·  N: cambiar nombre", canvas.width / 2, canvas.height - 18);
}

// 📜 LÍNEAS DE RESUMEN de la partida que acaba de terminar.
function lineasResumen(gano) {
    return [
        (nombreJugador !== "" ? nombreJugador : "Jugador") + " · " + puntos + " puntos · serpiente de " + culebra.length + " segmentos",
        "Nivel " + (nivelActual + 1) + ": " + nombresNivel[nivelActual] + (gano ? " · ¡META CUMPLIDA!" : ""),
        huevoEncontrado ? "🥚 Huevo de Pascua: ¡DESCUBIERTO!" : "🥚 Huevo de Pascua: no descubierto"
    ];
}

// 🏆 ALTERNAR RANKING (tecla T): muestra u oculta el TOP 10 cuando no hay partida en curso.
function alternarRanking() {
    if (jugando || juegoTerminado) {
        return; // al terminar una partida el ranking ya se muestra en la pantalla final
    }
    mostrandoRanking = !mostrandoRanking;
    dibujarJuego();
    if (mostrandoRanking) {
        dibujarPantallaFinal("🏆 TOP 10", "#ffd23f", ["Mejores resultados guardados en este dispositivo", "Meta del juego: " + puntosVictoria + " puntos"]);
    }
}

// 🎉 COMPROBAR VICTORIA: ¿llegamos a la meta? Devuelve true si el juego terminó.
function comprobarVictoria() {
    if (puntos >= puntosVictoria && !juegoGanado) {
        dibujarJuego();
        ganarJuego();
        return true;
    }
    return false;
}

// 🏆 GANAR JUEGO: se ejecuta UNA sola vez. Detiene todo, guarda el resultado y celebra.
function ganarJuego() {
    juegoGanado = true;
    detenerIntervalos();
    jugando = false;
    juegoTerminado = true;
    partidaEnCurso = false;
    dimensionActiva = false;
    salaGuardada = null;
    reiniciarEventos();

    registrarResultado(true);
    resumenFinal = { titulo: "🏆 ¡VICTORIA! 🏆", color: "#ffd23f", lineas: lineasResumen(true) };
    mostrarTexto("mensaje", "🏆 ¡VICTORIA! Llegaste a " + puntos + " puntos en " + formatearTiempo(tiempo));
    sonido("victoria");

    // La celebración usa el mismo "slot" de reloj del juego y se apaga sola al terminar.
    victoriaTicks = 0;
    particulas = [];
    intervaloJuego = setInterval(animarVictoria, 55);
}

// 🎆 ANIMAR VICTORIA: fuegos artificiales sobre la pantalla final. Dura unos 7 segundos.
function animarVictoria() {
    victoriaTicks = victoriaTicks + 1;
    actualizarParticulas();

    if (victoriaTicks % 6 === 1) {
        let colores = ["#ffd23f", "#ff5ec4", "#00f0ff", "#7cff4d", "#ff7a1a"];
        crearParticulas(40 + numeroAleatorio(420), 60 + numeroAleatorio(380), 18, colores[numeroAleatorio(colores.length)]);
    }

    dibujarPantallaFinal(resumenFinal.titulo, resumenFinal.color, resumenFinal.lineas);
    dibujarParticulas();

    if (victoriaTicks >= 140) {
        detenerIntervalos(); // no queda ningún reloj encendido
    }
}


// ==========================================================
// 🚀 MOVIMIENTO Y REGLAS
// ==========================================================

// 🚀 ACTUALIZAR POSICIÓN: el cuerpo sigue a la cabeza.
function actualizarPosicion() {
    // Recordamos dónde estaba la cola, por si hay que crecer.
    colaX = culebra[culebra.length - 1].x;
    colaY = culebra[culebra.length - 1].y;

    // 1. Cada segmento ocupa el lugar del anterior (de la cola hacia la cabeza).
    for (let i = culebra.length - 1; i > 0; i--) {
        culebra[i].x = culebra[i - 1].x;
        culebra[i].y = culebra[i - 1].y;
    }

    // 2. La cabeza avanza un paso en la dirección actual.
    culebra[0].x = culebra[0].x + velocidadX;
    culebra[0].y = culebra[0].y + velocidadY;

    // 3. Si debemos crecer, agregamos un segmento en el lugar donde estaba la cola.
    if (segmentosPorCrecer > 0) {
        culebra.push({ x: colaX, y: colaY });
        segmentosPorCrecer = segmentosPorCrecer - 1;
    }
}

// ☠️ PELIGRO: ¿la cabeza chocó contra una pared o contra su propio cuerpo?
function hayChoque() {
    let cabeza = culebra[0];

    // Pared: la cabeza se salió del canvas.
    if (cabeza.x < 0 || cabeza.x >= canvas.width || cabeza.y < 0 || cabeza.y >= canvas.height) {
        return true;
    }

    // Cuerpo: empezamos en i = 1 para no comparar la cabeza consigo misma.
    for (let i = 1; i < culebra.length; i++) {
        if (cabeza.x === culebra[i].x && cabeza.y === culebra[i].y) {
            return true;
        }
    }

    return false;
}

// ⚡ GESTIONAR TURBO: cuenta los pasos del rayo y vuelve a la velocidad normal.
function gestionarTurbo() {
    if (turboRestante > 0) {
        turboRestante = turboRestante - 1;
        if (turboRestante === 0) {
            actualizarVelocidad();
        }
    }
}

// 🏃 VELOCIDAD OBJETIVO: base (o turbo) y, si hay baba, multiplicada por el factor de lentitud.
function velocidadObjetivo() {
    let ms = turboRestante > 0 ? velocidadTurbo : velocidadBase;
    if (lentoMs > 0) {
        ms = Math.round(ms * factorLento);
    }
    return ms;
}

// 🔄 ACTUALIZAR VELOCIDAD: aplica la velocidad correcta solo si cambió (evita reiniciar el reloj sin necesidad).
function actualizarVelocidad() {
    let objetivo = velocidadObjetivo();
    if (objetivo !== velocidadActual) {
        cambiarVelocidad(objetivo);
    }
}

// 🌶️ ACTIVAR DEPREDADOR: si ya estaba activo solo se reinicia la cuenta (los efectos no se acumulan).
function activarDepredador() {
    depredadorMs = duracionDepredadorMs;
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 24, "#ff3b3b");
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 16, "#ffb347");
}

// ⏳ ESTADOS TEMPORALES (una vez por paso): cuenta atrás del modo depredador y de la ralentización.
function gestionarEstadosTemporales() {
    if (depredadorMs > 0) {
        depredadorMs = depredadorMs - velocidadActual;
        if (depredadorMs <= 0) {
            depredadorMs = 0;
            mostrarTexto("mensaje", "🌶️ Se acabó el modo depredador. ¡Cuidado, los enemigos vuelven a atacar!");
            sonido("fin");
        }
    }
    if (lentoMs > 0) {
        lentoMs = lentoMs - velocidadActual;
        if (lentoMs <= 0) {
            lentoMs = 0;
            actualizarVelocidad();
            mostrarTexto("mensaje", "💨 ¡Ya no estás pegajoso!");
        }
    }
}

// 🔁 CICLO DEL JUEGO: se ejecuta una vez por cada "paso" de la serpiente.
function cicloJuego() {
    // 🌌 Presentación del creador: la culebra y los enemigos se quedan congelados.
    if (dimensionActiva && dimensionFase === "creador") {
        gestionarCreador();
        musicaPaso();
        dibujarJuego();
        return;
    }

    // Aplicamos el giro que el jugador pidió.
    velocidadX = proximaX;
    velocidadY = proximaY;

    actualizarPosicion();

    if (hayChoque()) {
        dibujarJuego();
        terminarJuego("☠️ Chocaste.");
        return; // salimos: no hay nada más que hacer en este paso
    }

    // 👾 Si caminamos directo hacia un enemigo, nos come (en la dimensión secreta lo devoramos).
    if (enemigoEnCabeza()) {
        if (depredadorMs > 0) {
            devorarEnemigo();
        } else {
            dibujarJuego();
            terminarJuego("👾 ¡Un enemigo te comió!");
            return;
        }
    }

    // 🧱 Obstáculos: roca y cristal terminan la partida; los pinchos solo penalizan.
    let choqueObstaculo = comprobarObstaculos();
    if (choqueObstaculo !== "") {
        dibujarJuego();
        terminarJuego(choqueObstaculo);
        return;
    }

    // 🌀 Portales (con protección anti-repetición) y 🌌 grieta secreta.
    comprobarPortales();
    comprobarGrieta();

    comprobarComida();
    gestionarAlimentos(); // ⏳ las frutas especiales caducan y aparecen nuevas

    // 🏆 ¿Llegamos a la meta justo al comer?
    if (comprobarVictoria()) {
        return;
    }

    actualizarEnemigos();

    // 👾 Los enemigos avanzan. Si alguno alcanza la cabeza, Game Over.
    // (Con el modo depredador huyen de la culebra en vez de perseguirla.)
    if (depredadorMs > 0) {
        moverEnemigosAsustados();
    } else if (moverEnemigos()) {
        dibujarJuego();
        terminarJuego("👾 ¡Un enemigo te comió!");
        return;
    }

    gestionarEstadosTemporales(); // cuentas atrás de los efectos (depredador, baba)
    gestionarArana(); // 🕷️ aparición, movimiento, mordida y veneno
    gestionarEventos(); // 🌑 enemigos variados, obstáculos, portales, niveles y dimensión secreta
    gestionarTurbo();

    // 🏆 ¿Alcanzamos la meta por algún bono de este paso?
    if (comprobarVictoria()) {
        return;
    }

    musicaPaso(); // 🎵 la música se adapta a lo que está pasando
    dibujarJuego();
}


// ==========================================================
// ⏱️ RELOJES Y ESTADO DE LA PARTIDA
// ==========================================================

// ⏱️ CRONÓMETRO: suma 1 segundo, actualiza el marcador y, de vez en cuando, cambia el mundo (colores).
function cronometro() {
    tiempo = tiempo + 1;
    mostrarTexto("tiempo", formatearTiempo(tiempo));
    if (tiempo % segundosCambioPaleta === 0 && !dimensionActiva) {
        cambiarPaleta(true);
    }
}

// 🛑 DETENER RELOJES: apagamos los dos relojes y los dejamos en null.
function detenerIntervalos() {
    clearInterval(intervaloJuego);
    clearInterval(intervaloTiempo);
    intervaloJuego = null;
    intervaloTiempo = null;
}

// 🏃 CAMBIAR VELOCIDAD: para cambiar el ritmo hay que apagar el reloj y crear otro.
function cambiarVelocidad(milisegundos) {
    velocidadActual = milisegundos;
    if (jugando) {
        clearInterval(intervaloJuego);
        intervaloJuego = setInterval(cicloJuego, velocidadActual);
    }
}

// ▶️ INICIAR: partida nueva (pide el nombre) o continuar después de una pausa.
function iniciarJuego() {
    // Si ya estamos jugando o hay un diálogo abierto, no hacemos nada. Así evitamos relojes duplicados.
    if (jugando || dialogoAbierto) {
        return;
    }
    // Si venimos de un Game Over o una victoria, preparamos una partida nueva primero.
    if (juegoTerminado) {
        reiniciarJuego();
    }

    // Partida nueva: el jugador escribe o confirma su nombre antes de empezar.
    if (!partidaEnCurso) {
        abrirDialogoNombre(function () {
            partidaEnCurso = true;
            arrancarJuego();
        });
        return;
    }

    // Continuar después de una pausa.
    arrancarJuego();
}

// 🚦 ARRANCAR: enciende los relojes (solo se llama desde iniciarJuego).
function arrancarJuego() {
    iniciarAudio();      // 🔊 el clic o la tecla permiten activar el sonido
    mostrandoRanking = false;

    detenerIntervalos(); // por seguridad, aseguramos que no queden relojes viejos
    jugando = true;
    intervaloJuego = setInterval(cicloJuego, velocidadActual);
    intervaloTiempo = setInterval(cronometro, 1000);
    mostrarTexto("mensaje", "¡A comer! 🐍");
}

// ⏯️ ALTERNAR PAUSA (tecla ESPACIO o P): pausa si se está jugando; si no, inicia o continúa.
function alternarPausa() {
    if (jugando) {
        pausarJuego();
    } else {
        iniciarJuego();
    }
}

// 🔄 REINICIAR (botón): borra la partida y vuelve a pedir el nombre del jugador.
function reiniciarPorJugador() {
    if (dialogoAbierto) {
        return;
    }
    reiniciarJuego();
    iniciarJuego();
}

// 🔄 REINICIAR CON LA TECLA R: durante una partida pide confirmación (pulsarla otra vez en 3 s).
function reiniciarConTecla() {
    let enMarcha = jugando || (partidaEnCurso && !juegoTerminado);
    if (enMarcha && Date.now() > reinicioArmadoHasta) {
        pausarJuego();
        reinicioArmadoHasta = Date.now() + 3000;
        mostrarTexto("mensaje", "⚠️ Pulsa R otra vez para reiniciar la partida");
        return;
    }
    reinicioArmadoHasta = 0;
    reiniciarPorJugador();
}


// ⏸️ PAUSAR: apagamos los relojes sin borrar nada del estado y lo anunciamos sobre el canvas.
function pausarJuego() {
    if (!jugando) {
        return;
    }
    jugando = false;
    detenerIntervalos();
    mostrarTexto("mensaje", "⏸️ Pausa. Pulsa INICIAR o ESPACIO para continuar");
    dibujarPausa();
}

// 🪧 DIBUJAR PAUSA: velo oscuro con el texto PAUSA.
function dibujarPausa() {
    dibujarJuego();
    contexto.fillStyle = "rgba(2, 6, 13, 0.72)";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.shadowColor = paleta.primario;
    contexto.shadowBlur = 16;
    contexto.fillStyle = paleta.primario;
    contexto.font = "bold 44px sans-serif";
    contexto.fillText("PAUSA", canvas.width / 2, canvas.height / 2 - 12);
    contexto.shadowBlur = 0;
    contexto.fillStyle = paleta.texto;
    contexto.font = "16px sans-serif";
    contexto.fillText("ESPACIO o INICIAR para continuar", canvas.width / 2, canvas.height / 2 + 28);
}

// 💀 TERMINAR: la serpiente murió. "motivo" explica qué pasó.
function terminarJuego(motivo) {
    detenerIntervalos();
    jugando = false;
    juegoTerminado = true;
    partidaEnCurso = false;
    salaGuardada = null;
    dimensionActiva = false;   // 🆕 la protección especial termina con la partida
    reiniciarEventos();        // 🆕 limpiamos enemigos variados, obstáculos, portales y contadores

    // Mensaje sobre el canvas.
    contexto.fillStyle = "rgba(2, 6, 13, 0.7)";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.fillStyle = "#ff7a1a";
    contexto.font = "bold 36px sans-serif";
    contexto.textAlign = "center";
    contexto.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    mostrarTexto("mensaje", motivo + " Game Over: " + puntos + " puntos en " + formatearTiempo(tiempo));

    // 🆕 Guardamos el resultado (una sola vez) y mostramos el resumen con el TOP 10.
    registrarResultado(false);
    resumenFinal = { titulo: "GAME OVER", color: "#ff7a1a", lineas: [motivo].concat(lineasResumen(false)) };
    dibujarPantallaFinal(resumenFinal.titulo, resumenFinal.color, resumenFinal.lineas);
    sonido("gameover");
}

// 🔄 REINICIAR: devolvemos TODO al estado inicial (la partida queda detenida).
function reiniciarJuego() {
    detenerIntervalos();
    jugando = false;
    juegoTerminado = false;
    partidaEnCurso = false;
    reinicioArmadoHasta = 0;

    puntos = 0;
    tiempo = 0;
    turboRestante = 0;
    velocidadBase = velocidadInicial; // 🆕 la velocidad base sube con los niveles: aquí vuelve a la inicial
    velocidadActual = velocidadBase;
    segmentosPorCrecer = 0;

    // 🆕 Estado de la meta, los niveles, el huevo de Pascua y la dimensión secreta.
    juegoGanado = false;
    resultadoGuardado = false;
    ultimoRegistroId = "";
    resumenFinal = null;
    mostrandoRanking = false;
    victoriaTicks = 0;
    nivelActual = 0;
    ultimoBonoTiempo = 0;
    ritmoEnemigo = 3;
    huevoEncontrado = false;
    dimensionActiva = false;
    dimensionFase = "";
    saltarCreador = false;
    salaGuardada = null;
    devorados = 0;
    pasoMusica = 0;
    ambienteMusica = "";

    // Serpiente inicial de 3 segmentos mirando hacia la derecha.
    culebra = [
        { x: 250, y: 250 },
        { x: 225, y: 250 },
        { x: 200, y: 250 }
    ];
    velocidadX = tamanoCelda;
    velocidadY = 0;
    proximaX = tamanoCelda;
    proximaY = 0;

    // Vaciamos los enemigos ANTES de crear frutas, para que los viejos no bloqueen celdas.
    enemigos = [];
    pasosJuego = 0;

    // 🌑 Lo mismo con enemigos variados, obstáculos, portales y grieta de la partida anterior.
    reiniciarEventos();

    // Rellenamos el tablero con frutas nuevas.
    alimentos = [];
    tiempoParaEspecialMs = 3000 + numeroAleatorio(3000);
    reponerBasicas();

    // Y aparece el primer enemigo, lejos de la serpiente.
    enemigos.push(crearEnemigo());

    mostrarTexto("puntos", puntos);
    reiniciarArana(); // 🕷️ borramos araña, veneno y partículas
    mostrarTexto("tiempo", formatearTiempo(tiempo));
    mostrarTexto("mensaje", "Presiona INICIAR para jugar");
    cambiarPaleta(false); // 🎨 cada partida empieza en un mundo distinto
    dibujarJuego();
}


// ==========================================================
// 🏁 ARRANQUE: dejamos el tablero listo, pero SIN empezar a moverse.
// ==========================================================
document.getElementById("btnConfirmarNombre").addEventListener("click", confirmarNombre);
document.getElementById("btnCancelarNombre").addEventListener("click", cancelarNombre);
document.getElementById("campoNombre").addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        evento.preventDefault();
        confirmarNombre();
    } else if (evento.key === "Escape") {
        evento.preventDefault();
        cancelarNombre();
    }
});

// ⏸️ PAUSA AUTOMÁTICA: si el jugador cambia de pestaña o de aplicación, la partida se detiene.
document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        pausarJuego();
    }
});
window.addEventListener("blur", function () {
    pausarJuego();
});

reiniciarJuego();