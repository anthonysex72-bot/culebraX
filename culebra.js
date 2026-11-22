// ==========================================================
// 🐍 CULEBRA X — lógica principal del juego
// Misión: guiar a la serpiente, comer frutas y no chocar.
// Necesita utilitarios.js (mostrarTexto, numeroAleatorio, formatearTiempo).
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
let cantidadAlimentos = 4;

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
// puntos: suma o resta puntos | crecer: segmentos que gana
// quitar: segmentos que pierde | turbo: activa el rayo
// bueno: ayuda al jugador | peso: probabilidad de aparecer (más alto = más común)
let tiposComida = [
    { nombre: "Manzana",  emoji: "🍎", puntos: 1,  crecer: 1, quitar: 0, turbo: false, bueno: true,  peso: 40, mensaje: "🍎 ¡Manzana! +1 punto" },
    { nombre: "Dorada",   emoji: "🍏", puntos: 5,  crecer: 3, quitar: 0, turbo: false, bueno: true,  peso: 10, mensaje: "🍏 ¡Manzana dorada! +5 puntos y creces 3" },
    { nombre: "Baya",     emoji: "🫐", puntos: 10, crecer: 0, quitar: 0, turbo: false, bueno: true,  peso: 8,  mensaje: "🫐 ¡Baya especial! +10 puntos" },
    { nombre: "Rayo",     emoji: "⚡", puntos: 2,  crecer: 0, quitar: 0, turbo: true,  bueno: true,  peso: 12, mensaje: "⚡ ¡Rayo! +2 puntos y velocidad extra" },
    { nombre: "Podrida",  emoji: "☠️", puntos: -3, crecer: 0, quitar: 2, turbo: false, bueno: false, peso: 15, mensaje: "☠️ ¡Fruta podrida! -3 puntos y pierdes 2 segmentos" },
    { nombre: "Hongo",    emoji: "🍄", puntos: 0,  crecer: 0, quitar: 4, turbo: false, bueno: false, peso: 15, mensaje: "🍄 ¡Hongo venenoso! pierdes 4 segmentos" }
];

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
let puntosHuevo = 150;              // descubrir el huevo de Pascua

let claveRanking = "culebraX_ranking";
let claveNombre = "culebraX_nombre";

// ==========================================================
// 🥚 NUEVO: HUEVO DE PASCUA Y DIMENSIÓN SECRETA
// ==========================================================

let huevoEncontrado = false;        // true si ya entró a la dimensión secreta en esta partida
let secuenciaPortal = [];           // lados de portal usados, en orden
let secuenciaPar = -1;              // pareja de portales a la que pertenece la secuencia
let tiempoSecuenciaMs = 0;          // tiempo que le queda a la secuencia
let ventanaSecuenciaMs = 35000;     // la secuencia completa debe hacerse en 35 s
let ladosHuevo = [0, 1, 0];         // entrar por A, luego por B, luego otra vez por A
let tamanoMinimoHuevo = 8;          // segmentos mínimos para que el secreto funcione
let grieta = null;                  // entrada secreta {x, y, vidaMs}

let dimensionActiva = false;
let dimensionFase = "";             // "creador" (presentación) o "ayuda" (la cuenta regresiva)
let dimensionRestanteMs = 0;
let duracionDimensionMs = 20000;    // 20 segundos de poder
let dimensionTicks = 0;
let caracteresCreador = 0;
let creadorEspera = 0;
let tiempoPresaMs = 0;
let maximoPresas = 6;
let devorados = 0;

let textoCreador = "¡Gracias por disfrutar de mi juego! Sé que el desafío se vuelve cada vez más difícil, así que quiero darte una pequeña ayuda. ¡Aprovecha este momento y demuestra de qué eres capaz!";

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

// 🐍 DIBUJAR SERPIENTE: recorremos el arreglo con un ciclo for.
function dibujarCulebra() {
    // ✨ shadowBlur crea el resplandor de neón alrededor de cada cuadro.
    contexto.shadowColor = "#00f0ff";
    contexto.shadowBlur = 12;
    // ☣️ Si está envenenada, el resplandor también cambia de color.
    if (envenenado) {
        contexto.shadowColor = colorVeneno(false);
    }
    // 🌌 En la dimensión secreta brilla en blanco.
    if (dimensionActiva) {
        contexto.shadowColor = "#ffffff";
    }

    for (let i = 0; i < culebra.length; i++) {
        let color = "#00f0ff";      // cuerpo cian
        if (i === 0) {
            color = "#eaffff";      // la cabeza (posición 0) es más clara
        }
        // ☣️ Envenenada: color tóxico. 💚 Recién curada: destello verde claro.
        if (envenenado) {
            color = colorVeneno(i === 0);
        } else if (curacionTicks > 0 && animacionArana % 2 === 0) {
            color = "#b9ffd0";
        }
        // 🌌 Dimensión secreta: la serpiente se vuelve arcoíris.
        if (dimensionActiva) {
            color = "hsl(" + ((animacionEventos * 12 + i * 18) % 360) + ", 100%, " + (i === 0 ? "85%" : "60%") + ")";
        }
        // Dejamos 1 píxel de margen para que se vea la separación entre cuadros.
        dibujar(culebra[i].x + 1, culebra[i].y + 1, tamanoCelda - 2, tamanoCelda - 2, color);
    }

    contexto.shadowBlur = 0;        // apagamos el brillo para no afectar otros dibujos
}

// 🍎 DIBUJAR ALIMENTOS: cada fruta se pinta con su emoji.
function dibujarAlimentos() {
    contexto.font = "20px serif";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";

    for (let i = 0; i < alimentos.length; i++) {
        // Sumamos la mitad de la celda para centrar el emoji dentro de su cuadro.
        contexto.fillText(
            alimentos[i].tipo.emoji,
            alimentos[i].x + tamanoCelda / 2,
            alimentos[i].y + tamanoCelda / 2 + 1
        );
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
        dibujarFondoDimension(); // 🌌 nuevo: el tablero cambia de mundo
    }
    dibujarAlimentos();
    dibujarPortales();          // 🌀 nuevo: van por debajo de la culebra
    dibujarGrieta();            // 🌌 nuevo
    dibujarObstaculos();        // 🧱 nuevo
    dibujarCulebra();
    dibujarEnemigos();
    dibujarPeligros();          // 🪲 nuevo
    dibujarArana();
    dibujarParticulas();
    dibujarVeneno();
    dibujarHud();               // 📊 nuevo: nivel y objetivo
    if (dimensionActiva) {
        dibujarDimension();     // 🌌 nuevo: cuenta regresiva, aura y creador
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
    if (jugando && velocidadX === 0) {
        proximaX = -tamanoCelda;
        proximaY = 0;
    }
}

function moverDerecha() {
    if (jugando && velocidadX === 0) {
        proximaX = tamanoCelda;
        proximaY = 0;
    }
}

function moverArriba() {
    if (jugando && velocidadY === 0) {
        proximaX = 0;
        proximaY = -tamanoCelda;
    }
}

function moverAbajo() {
    if (jugando && velocidadY === 0) {
        proximaX = 0;
        proximaY = tamanoCelda;
    }
}

// ⌨️ TECLADO: "keydown" se dispara cada vez que el jugador pulsa una tecla.
document.addEventListener("keydown", function (evento) {
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
// M = música sí/no | T = ver el TOP 10 | N = cambiar de nombre (solo sin partida en curso)
document.addEventListener("keydown", function (evento) {
    if (evento.ctrlKey || evento.metaKey || evento.altKey || typeof evento.key !== "string") {
        return;
    }
    let tecla = evento.key.toLowerCase();
    if (tecla === "m") {
        alternarMusica();
    } else if (tecla === "t") {
        alternarRanking();
    } else if (tecla === "n") {
        if (!jugando) {
            pedirNombre(true);
        }
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
    if (obstaculoEn(x, y) || portalEn(x, y) || peligroEn(x, y) || grietaEn(x, y)) {
        return true;
    }
    return false;
}

// 🔎 ¿HAY BUENOS?: comprobamos que siempre exista al menos una fruta beneficiosa,
// así el jugador nunca queda obligado a comer algo malo.
function hayAlimentoBueno() {
    for (let i = 0; i < alimentos.length; i++) {
        if (alimentos[i].tipo.bueno) {
            return true;
        }
    }
    return false;
}

// 🎰 ELEGIR TIPO: sorteo con "pesos". Mientras más peso, más probable.
// Sumamos todos los pesos, sacamos un número al azar y lo vamos restando
// hasta caer en el alimento ganador.
function elegirTipo(soloBuenos) {
    let total = 0;
    for (let i = 0; i < tiposComida.length; i++) {
        if (!soloBuenos || tiposComida[i].bueno) {
            total = total + tiposComida[i].peso;
        }
    }

    let sorteo = numeroAleatorio(total);

    for (let j = 0; j < tiposComida.length; j++) {
        if (!soloBuenos || tiposComida[j].bueno) {
            if (sorteo < tiposComida[j].peso) {
                return tiposComida[j];
            }
            sorteo = sorteo - tiposComida[j].peso;
        }
    }
}

// 🌱 CREAR ALIMENTO: elige un tipo y una celda libre al azar.
function crearAlimento() {
    // Si no queda ninguna fruta buena, esta será buena obligatoriamente.
    let tipo = elegirTipo(!hayAlimentoBueno());

    let x = numeroAleatorio(columnas) * tamanoCelda;
    let y = numeroAleatorio(filas) * tamanoCelda;

    // Mientras la celda esté ocupada, probamos con otra.
    while (posicionOcupada(x, y)) {
        x = numeroAleatorio(columnas) * tamanoCelda;
        y = numeroAleatorio(filas) * tamanoCelda;
    }

    return { x: x, y: y, tipo: tipo };
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
        if (velocidadActual !== velocidadTurbo) {
            cambiarVelocidad(velocidadTurbo);
        }
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
            alimentos.push(crearAlimento());   // aparece una nueva en otro lugar
            aplicarEfecto(tipoComido);
            registrarFrutaVeneno(tipoComido);  // 🧪 si estamos envenenados, cuenta para la cura
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
        morderCulebra();
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
                morderCulebra();
            }
        }
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
// 🔧 NUEVO: AYUDANTES GENERALES
// ==========================================================

// 🔎 ¿HAY UN SEGMENTO DE LA CULEBRA (cabeza incluida) EN ESA CELDA?
function celdaEnCulebra(x, y) {
    for (let i = 0; i < culebra.length; i++) {
        if (culebra[i].x === x && culebra[i].y === y) {
            return true;
        }
    }
    return false;
}

// 🔎 ¿HAY UNA FRUTA EN ESA CELDA?
function alimentoEn(x, y) {
    for (let i = 0; i < alimentos.length; i++) {
        if (alimentos[i].x === x && alimentos[i].y === y) {
            return true;
        }
    }
    return false;
}

// 🔎 ¿HAY UN OBSTÁCULO (en cualquier estado) EN ESA CELDA?
function obstaculoEn(x, y) {
    for (let i = 0; i < obstaculos.length; i++) {
        if (obstaculos[i].x === x && obstaculos[i].y === y) {
            return true;
        }
    }
    return false;
}

// 🔎 ¿HAY UN ENEMIGO VARIADO EN ESA CELDA?
function peligroEn(x, y) {
    for (let i = 0; i < peligros.length; i++) {
        if (peligros[i].x === x && peligros[i].y === y) {
            return true;
        }
    }
    return false;
}

// 🔎 ¿HAY UN PORTAL EN ESA CELDA?
function portalEn(x, y) {
    for (let i = 0; i < portales.length; i++) {
        if (portales[i].x === x && portales[i].y === y) {
            return true;
        }
    }
    return false;
}

// 🔎 ¿ESTÁ LA GRIETA SECRETA EN ESA CELDA?
function grietaEn(x, y) {
    return grieta !== null && grieta.x === x && grieta.y === y;
}

// 🔎 ¿HAY ALGÚN OBSTÁCULO EN ESA CELDA O EN LAS 8 QUE LA RODEAN?
// Sirve para que los obstáculos nunca queden pegados y formen un muro.
function obstaculoCercano(x, y) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (obstaculoEn(x + dx * tamanoCelda, y + dy * tamanoCelda)) {
                return true;
            }
        }
    }
    return false;
}

// 🔎 ¿HAY ALGÚN PORTAL EN ESA CELDA O EN LAS 8 QUE LA RODEAN?
function portalCercano(x, y) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (portalEn(x + dx * tamanoCelda, y + dy * tamanoCelda)) {
                return true;
            }
        }
    }
    return false;
}

// 🔎 ¿HAY UN ENEMIGO (👾, 🕷️ o variado) A MENOS DE "radio" CELDAS DE ESE PUNTO?
function amenazaCerca(x, y, radio) {
    for (let i = 0; i < enemigos.length; i++) {
        if ((Math.abs(enemigos[i].x - x) + Math.abs(enemigos[i].y - y)) / tamanoCelda < radio) {
            return true;
        }
    }
    for (let j = 0; j < peligros.length; j++) {
        if ((Math.abs(peligros[j].x - x) + Math.abs(peligros[j].y - y)) / tamanoCelda < radio) {
            return true;
        }
    }
    if (arana !== null && (Math.abs(arana.x - x) + Math.abs(arana.y - y)) / tamanoCelda < radio) {
        return true;
    }
    return false;
}

// 🔎 ¿LA CELDA ESTÁ EN LA LÍNEA DE AVANCE DE LA CULEBRA (las 5 celdas de enfrente)?
// Así nada aparece justo delante de la cabeza, donde sería imposible reaccionar.
function enLineaDeAvance(x, y) {
    for (let k = 1; k <= 5; k++) {
        if (culebra[0].x + velocidadX * k === x && culebra[0].y + velocidadY * k === y) {
            return true;
        }
    }
    return false;
}

// ✂️ PERDER SEGMENTOS CON MÍNIMO: quita piezas de la cola, pero nunca baja de "minimo".
// Lo usan los daños nuevos (veneno, enemigos variados, pinchos) para que la culebra nunca quede demasiado corta.
function perderSegmentosHastaMinimo(cantidad, minimo) {
    for (let i = 0; i < cantidad; i++) {
        if (culebra.length > minimo) {
            culebra.pop();
        }
    }
}

// ⭐ GANAR PUNTOS: suma puntos y actualiza el marcador. Después de ganar ya no suma nada.
function ganarPuntos(cantidad) {
    if (juegoGanado) {
        return;
    }
    puntos = puntos + cantidad;
    mostrarTexto("puntos", puntos);
}

// 📈 NIVEL DE DIFICULTAD: se calcula con los puntos (0 a 7).
function nivelDificultad() {
    let nivel = 0;
    for (let i = 0; i < umbralesNivel.length; i++) {
        if (puntos >= umbralesNivel[i]) {
            nivel = i;
        }
    }
    return nivel;
}

// ⏳ FACTOR DE ESPERA: 1 al empezar y baja hasta 0.58 en el nivel máximo.
// Multiplica las esperas, así los eventos van siendo más frecuentes.
function factorEspera() {
    return 1 - nivelDificultad() * 0.06;
}

// 🎲 SORTEAR ESPERA: milisegundos al azar entre un mínimo y un máximo, ajustados al nivel.
function sortearEspera(minimo, maximo) {
    return Math.floor((minimo + numeroAleatorio(maximo - minimo)) * factorEspera());
}

// 🎲 MARCAR EVENTO: tras crear algo nuevo, esperamos un rato antes de crear otra cosa.
function marcarEvento() {
    enfriamientoEventosMs = pausaEntreEventosMs + numeroAleatorio(2000);
}

// 🔢 TOPES QUE CRECEN CON EL NIVEL
function maximoPeligros() {
    let maximo = 1 + Math.floor(nivelDificultad() / 3);
    if (maximo > 3) {
        maximo = 3;
    }
    return maximo;
}

function maximoObstaculosActual() {
    let maximo = 2 + Math.floor(nivelDificultad() / 2);
    if (maximo > maximoObstaculos) {
        maximo = maximoObstaculos;
    }
    return maximo;
}

function maximoParesActual() {
    if (nivelDificultad() >= 5) {
        return maximoPortales;
    }
    return 1;
}

function contarPermanentes() {
    let cuenta = 0;
    for (let i = 0; i < obstaculos.length; i++) {
        if (obstaculos[i].permanente) {
            cuenta = cuenta + 1;
        }
    }
    return cuenta;
}

// ⬆️ ACTUALIZAR NIVEL: si los puntos alcanzan un nuevo rango, sube de nivel (una sola vez por nivel).
// Cada nivel da un bono, acelera un poquito la culebra y vuelve más listos a los enemigos.
function actualizarNivel() {
    let subio = false;
    while (nivelActual < nivelDificultad()) {
        nivelActual = nivelActual + 1;
        ganarPuntos(20 + nivelActual * 5);
        subio = true;
    }
    if (subio) {
        ajustarDificultadPorNivel();
        mostrarTexto("mensaje", "⬆️ ¡Nivel " + (nivelActual + 1) + ": " + nombresNivel[nivelActual] + "! Todo se vuelve más difícil...");
        crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 20, "#ffd23f");
        sonido("nivel");
    }
}

// 🎚️ AJUSTAR DIFICULTAD: velocidad de la culebra (de 150 a 122 ms como máximo) y ritmo de los 👾.
function ajustarDificultadPorNivel() {
    velocidadBase = velocidadInicial - Math.min(nivelActual, 7) * 4;
    if (nivelActual >= 5) {
        ritmoEnemigo = 2;
    } else {
        ritmoEnemigo = 3;
    }
    // Si hay turbo activo, la velocidad se actualiza sola cuando termine.
    if (turboRestante === 0 && velocidadActual !== velocidadBase) {
        cambiarVelocidad(velocidadBase);
    }
}


// ==========================================================
// 🪲 NUEVO: ENEMIGOS VARIADOS
// ==========================================================

// ✅ ¿PUEDE SALIR ESTE TIPO AHORA?: respeta el nivel, no repite un tipo que ya está
// en el tablero y no manda un escorpión si ya hay veneno o araña.
function tipoPeligroPermitido(tipo, nivel) {
    if (nivel < tipo.nivelMin) {
        return false;
    }
    if (tipo.efecto === "veneno" && (envenenado || arana !== null)) {
        return false;
    }
    for (let i = 0; i < peligros.length; i++) {
        if (peligros[i].tipo === tipo) {
            return false;
        }
    }
    return true;
}

// 🎰 ELEGIR TIPO DE ENEMIGO: sorteo con pesos, igual que con las frutas.
function elegirTipoPeligro() {
    let nivel = nivelDificultad();
    let total = 0;
    for (let i = 0; i < tiposPeligro.length; i++) {
        if (tipoPeligroPermitido(tiposPeligro[i], nivel)) {
            total = total + tiposPeligro[i].peso;
        }
    }
    if (total === 0) {
        return null;
    }

    let sorteo = numeroAleatorio(total);
    for (let j = 0; j < tiposPeligro.length; j++) {
        if (tipoPeligroPermitido(tiposPeligro[j], nivel)) {
            if (sorteo < tiposPeligro[j].peso) {
                return tiposPeligro[j];
            }
            sorteo = sorteo - tiposPeligro[j].peso;
        }
    }
    return null;
}

// ✅ ¿CELDA VÁLIDA PARA UN ENEMIGO?: libre, lejos de la cabeza (6 celdas o más)
// y fuera de la línea de avance.
function celdaValidaParaPeligro(x, y) {
    if (posicionOcupada(x, y)) {
        return false;
    }
    if (distanciaACabeza(x, y) < 6) {
        return false;
    }
    if (enLineaDeAvance(x, y)) {
        return false;
    }
    return true;
}

// 🌑 CREAR ENEMIGO VARIADO: devuelve el objeto, o null si no se pudo crear uno justo.
function crearPeligro() {
    let tipo = elegirTipoPeligro();
    if (tipo === null) {
        return null;
    }

    for (let intento = 0; intento < 200; intento++) {
        let x = numeroAleatorio(columnas) * tamanoCelda;
        let y = numeroAleatorio(filas) * tamanoCelda;

        if (celdaValidaParaPeligro(x, y)) {
            crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 10, tipo.color);
            mostrarTexto("mensaje", tipo.aviso);
            sonido("aviso");
            return {
                x: x,
                y: y,
                tipo: tipo,
                estado: "aviso",       // primero solo avisa: todavía no hace daño
                avisoMs: tipo.avisoMs,
                vidaMs: tipo.vidaMs,   // cuánto se queda cuando se activa
                relojMs: 0,            // acumula milisegundos para dar su siguiente paso
                dirX: 0,
                dirY: 0
            };
        }
    }
    return null;
}

// 🍬 CREAR PRESA SECRETA: en la dimensión secreta aparecen ya activos, listos para ser devorados.
function crearPresaSecreta() {
    let tipo = tiposPeligro[numeroAleatorio(tiposPeligro.length)];
    for (let intento = 0; intento < 200; intento++) {
        let x = numeroAleatorio(columnas) * tamanoCelda;
        let y = numeroAleatorio(filas) * tamanoCelda;
        if (!posicionOcupada(x, y) && distanciaACabeza(x, y) >= 4) {
            crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 8, tipo.color);
            return { x: x, y: y, tipo: tipo, estado: "activo", avisoMs: 0, vidaMs: 14000, relojMs: 0, dirX: 0, dirY: 0 };
        }
    }
    return null;
}

// 🔎 ¿EL ENEMIGO VARIADO TOCA LA CABEZA?
function peligroTocaCabeza(p) {
    return p.x === culebra[0].x && p.y === culebra[0].y;
}

// ☣️ ENVENENAR (variante para enemigos variados): empieza el veneno igual que la mordida de la araña.
function envenenarCulebra() {
    envenenado = true;
    venenoRestanteMs = duracionVenenoMs;
    frutasPendientes = frutasParaCurar;
    flashMordida = 4;
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 18, "#ff2bd6");
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 12, "#9dff00");
    mostrarTexto("mensaje", "🦂 ¡Picadura! Come " + frutasParaCurar + " frutas en " + (duracionVenenoMs / 1000) + " s");
}

// 🦷 GOLPEAR: aplica el efecto del enemigo sobre la culebra. Nunca es Game Over
// y nunca deja la culebra con menos de 3 segmentos.
function golpearConPeligro(p) {
    let tipo = p.tipo;
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 14, tipo.color);
    flashMordida = 4;
    sonido("mordida");

    if (tipo.efecto === "veneno") {
        if (!envenenado) {
            envenenarCulebra();
        } else {
            // Si ya estabas envenenado, la picadura te quita segmentos en vez de reiniciar el veneno.
            perderSegmentosHastaMinimo(tipo.segmentos, 3);
            mostrarTexto("mensaje", "🦂 ¡Otra picadura! Pierdes " + tipo.segmentos + " segmentos");
        }
        return;
    }

    perderSegmentosHastaMinimo(tipo.segmentos, 3);
    puntos = puntos - tipo.puntos;
    if (puntos < 0) {
        puntos = 0; // nunca mostramos puntos negativos
    }
    mostrarTexto("puntos", puntos);
    mostrarTexto("mensaje", tipo.mensaje);
}

// 😋 DEVORAR ENEMIGO VARIADO (solo en la dimensión secreta): ¡puntos y crecimiento!
function devorarPeligro(p) {
    crearParticulas(p.x + tamanoCelda / 2, p.y + tamanoCelda / 2, 12, p.tipo.color);
    ganarPuntos(puntosDevorar);
    devorados = devorados + 1;
    segmentosPorCrecer = segmentosPorCrecer + 1;
    mostrarTexto("mensaje", "😋 ¡Devoraste " + p.tipo.emoji + "! +" + puntosDevorar + " puntos");
    sonido("devorar");
}

// 🧭 CONTACTO: la culebra y un enemigo variado se tocan. Normalmente duele; en la dimensión secreta se devora.
function contactoPeligro(p) {
    if (dimensionActiva) {
        devorarPeligro(p);
    } else {
        golpearConPeligro(p);
    }
}

// 🔎 ¿CELDA LIBRE PARA UN ENEMIGO VARIADO?: dentro del canvas, sin pisar 👾, 🕷️, otros
// enemigos variados, obstáculos ni el cuerpo de la culebra (el 👻 atraviesa obstáculos y cuerpo).
// La CABEZA sí es válida: ahí golpea.
function celdaLibreParaPeligro(p, x, y) {
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return false;
    }
    if (enemigoEn(x, y)) {
        return false;
    }
    if (arana !== null && arana.x === x && arana.y === y) {
        return false;
    }
    for (let i = 0; i < peligros.length; i++) {
        if (peligros[i] !== p && peligros[i].x === x && peligros[i].y === y) {
            return false;
        }
    }
    if (!p.tipo.atraviesa) {
        if (obstaculoEn(x, y)) {
            return false;
        }
        // Empezamos en j = 1 para dejar la cabeza (posición 0) como destino permitido.
        for (let j = 1; j < culebra.length; j++) {
            if (culebra[j].x === x && culebra[j].y === y) {
                return false;
            }
        }
    }
    return true;
}

// 🧭 PASO HACIA LA CABEZA: devuelve un paso {x, y} que acerca (un solo eje).
// Si ejeMayor es true usa el eje donde está más lejos; si no, elige un eje al azar.
function pasoHaciaCabeza(x, y, ejeMayor) {
    let difX = culebra[0].x - x;
    let difY = culebra[0].y - y;
    let usarX;

    if (ejeMayor) {
        usarX = Math.abs(difX) > Math.abs(difY);
    } else {
        usarX = numeroAleatorio(2) === 0;
    }
    if (difX === 0) {
        usarX = false;
    }
    if (difY === 0) {
        usarX = true;
    }

    if (usarX) {
        return { x: difX > 0 ? tamanoCelda : -tamanoCelda, y: 0 };
    }
    return { x: 0, y: difY > 0 ? tamanoCelda : -tamanoCelda };
}

// 🚶 MOVER ENEMIGO VARIADO: da un paso según su forma de moverse.
//  - "azar": camina sin rumbo (a veces sigue recto).
//  - "errante": vuela de forma errática, con algo de tendencia a acercarse.
//  - "acechar": se acerca por un eje al azar, con desvíos.
//  - "perseguir": va directo a la cabeza.
// Con cada nivel, los enemigos se vuelven más astutos: tienden más a acercarse.
function moverPeligro(p) {
    let opciones = [
        { x: tamanoCelda, y: 0 },
        { x: -tamanoCelda, y: 0 },
        { x: 0, y: tamanoCelda },
        { x: 0, y: -tamanoCelda }
    ];

    let modo = p.tipo.movimiento;
    let extra = nivelDificultad() * 3;
    let sorteo = numeroAleatorio(100);
    let elegida;

    if (modo === "perseguir") {
        elegida = pasoHaciaCabeza(p.x, p.y, true);
    } else if (modo === "acechar") {
        if (sorteo < 65 + extra) {
            elegida = pasoHaciaCabeza(p.x, p.y, false);
        } else {
            elegida = opciones[numeroAleatorio(4)];
        }
    } else if (modo === "errante") {
        if (sorteo < 30 + extra) {
            elegida = pasoHaciaCabeza(p.x, p.y, false);
        } else {
            elegida = opciones[numeroAleatorio(4)];
        }
    } else {
        if (sorteo < extra * 2) {
            elegida = pasoHaciaCabeza(p.x, p.y, false);
        } else if (sorteo < 40 + extra * 2 && (p.dirX !== 0 || p.dirY !== 0)) {
            elegida = { x: p.dirX, y: p.dirY }; // seguir recto
        } else {
            elegida = opciones[numeroAleatorio(4)];
        }
    }

    // Si la dirección elegida está bloqueada, probamos las 4 empezando por una al azar.
    let nuevoX = p.x + elegida.x;
    let nuevoY = p.y + elegida.y;
    let inicio = numeroAleatorio(4);
    let intentos = 0;
    while (!celdaLibreParaPeligro(p, nuevoX, nuevoY) && intentos < 4) {
        elegida = opciones[(inicio + intentos) % 4];
        nuevoX = p.x + elegida.x;
        nuevoY = p.y + elegida.y;
        intentos = intentos + 1;
    }

    // Solo se mueve si encontró una celda válida; si no, se queda quieto este paso.
    if (celdaLibreParaPeligro(p, nuevoX, nuevoY)) {
        p.x = nuevoX;
        p.y = nuevoY;
        p.dirX = elegida.x;
        p.dirY = elegida.y;
    }
}

// ⏱️ INTERVALO ACTUAL: los enemigos se vuelven más veloces con cada nivel (hasta un 28% más, nunca menos de 70 ms).
function intervaloPeligro(p) {
    let intervalo = Math.floor(p.tipo.intervaloMs * (1 - nivelDificultad() * 0.04));
    if (intervalo < 70) {
        intervalo = 70;
    }
    return intervalo;
}

// 💨 COMPROBAR CONTACTO: si la culebra caminó sobre un enemigo activo, lo golpea (o lo devora) y se va.
function comprobarContactoPeligros() {
    for (let i = peligros.length - 1; i >= 0; i--) {
        if (peligros[i].estado === "activo" && peligroTocaCabeza(peligros[i])) {
            contactoPeligro(peligros[i]);
            peligros.splice(i, 1);
        }
    }
}

// 🔁 GESTIONAR ENEMIGOS VARIADOS: se llama UNA vez por paso desde gestionarEventos.
// Usa milisegundos de juego (como la araña), así que se pausan con el juego.
function gestionarPeligros() {
    // 1) La culebra pudo haber caminado sobre uno.
    comprobarContactoPeligros();

    // Recorremos al revés para poder borrar con splice sin saltarnos ninguno.
    for (let i = peligros.length - 1; i >= 0; i--) {
        let p = peligros[i];

        // 2) Fase de aviso: no se mueve ni hace daño.
        if (p.estado === "aviso") {
            p.avisoMs = p.avisoMs - velocidadActual;
            if (p.avisoMs <= 0) {
                // Si la cabeza está encima o pegada, esperamos un paso más: nunca nace sobre ti.
                if (distanciaACabeza(p.x, p.y) > 1) {
                    p.estado = "activo";
                    crearParticulas(p.x + tamanoCelda / 2, p.y + tamanoCelda / 2, 8, p.tipo.color);
                }
            }
            continue;
        }

        // 3) Activo: se esfuma cuando se acaba su tiempo de permanencia.
        p.vidaMs = p.vidaMs - velocidadActual;
        if (p.vidaMs <= 0) {
            crearParticulas(p.x + tamanoCelda / 2, p.y + tamanoCelda / 2, 10, p.tipo.color);
            peligros.splice(i, 1);
            if (!dimensionActiva) {
                ganarPuntos(puntosEsquivar); // ¡lo esquivaste!
                mostrarTexto("mensaje", p.tipo.emoji + " ¡Lo esquivaste! +" + puntosEsquivar + " puntos");
            }
            continue;
        }

        // 4) Da los pasos que le toquen según su velocidad (los veloces pueden dar 2 en un paso del juego).
        p.relojMs = p.relojMs + velocidadActual;
        let intervalo = intervaloPeligro(p);
        let pasos = 0;
        while (p.relojMs >= intervalo && pasos < 3) {
            p.relojMs = p.relojMs - intervalo;
            moverPeligro(p);
            pasos = pasos + 1;
            if (peligroTocaCabeza(p)) {
                contactoPeligro(p);
                peligros.splice(i, 1);
                break;
            }
        }
    }
}


// ==========================================================
// 🧱 NUEVO: OBSTÁCULOS
// ==========================================================

// ✅ ¿PUEDE SALIR ESTE TIPO DE OBSTÁCULO AHORA?: respeta el nivel y el tope de rocas.
function tipoObstaculoPermitido(tipo, nivel) {
    if (nivel < tipo.nivelMin) {
        return false;
    }
    if (tipo.permanente && contarPermanentes() >= maximoRocas) {
        return false;
    }
    return true;
}

// 🎰 ELEGIR TIPO DE OBSTÁCULO: sorteo con pesos.
function elegirTipoObstaculo() {
    let nivel = nivelDificultad();
    let total = 0;
    for (let i = 0; i < tiposObstaculo.length; i++) {
        if (tipoObstaculoPermitido(tiposObstaculo[i], nivel)) {
            total = total + tiposObstaculo[i].peso;
        }
    }
    if (total === 0) {
        return null;
    }

    let sorteo = numeroAleatorio(total);
    for (let j = 0; j < tiposObstaculo.length; j++) {
        if (tipoObstaculoPermitido(tiposObstaculo[j], nivel)) {
            if (sorteo < tiposObstaculo[j].peso) {
                return tiposObstaculo[j];
            }
            sorteo = sorteo - tiposObstaculo[j].peso;
        }
    }
    return null;
}

// ✅ ¿CELDA VÁLIDA PARA UN OBSTÁCULO?: libre, a 4 celdas o más de la cabeza, fuera de la
// línea de avance, sin otros obstáculos ni portales pegados (así NUNCA se forma un muro).
function celdaValidaParaObstaculo(x, y) {
    if (posicionOcupada(x, y)) {
        return false;
    }
    if (distanciaACabeza(x, y) < 4) {
        return false;
    }
    if (enLineaDeAvance(x, y)) {
        return false;
    }
    if (obstaculoCercano(x, y) || portalCercano(x, y)) {
        return false;
    }
    return true;
}

// 🧱 CREAR OBSTÁCULO: devuelve el objeto, o null si no se pudo crear uno justo.
function crearObstaculo() {
    let tipo = elegirTipoObstaculo();
    if (tipo === null) {
        return null;
    }

    for (let intento = 0; intento < 200; intento++) {
        let x = numeroAleatorio(columnas) * tamanoCelda;
        let y = numeroAleatorio(filas) * tamanoCelda;

        if (celdaValidaParaObstaculo(x, y)) {
            let vida = 0; // 0 = permanente
            if (!tipo.permanente) {
                vida = tipo.vidaMin + numeroAleatorio(tipo.vidaMax - tipo.vidaMin);
            }
            crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 8, tipo.color);
            mostrarTexto("mensaje", tipo.aviso);
            sonido("aviso");
            return {
                x: x,
                y: y,
                tipo: tipo,
                estado: "aviso",       // primero solo avisa: todavía no es peligroso
                avisoMs: tipo.avisoMs,
                vidaMs: vida,
                permanente: tipo.permanente
            };
        }
    }
    return null;
}

// 🔁 GESTIONAR OBSTÁCULOS: activa los que terminaron su aviso y retira los que se acabaron.
function gestionarObstaculos() {
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        let o = obstaculos[i];

        if (o.estado === "aviso") {
            o.avisoMs = o.avisoMs - velocidadActual;
            if (o.avisoMs <= 0) {
                // No se activa si hay un segmento de la culebra encima o la cabeza está muy cerca.
                // Así nunca atrapa al jugador por sorpresa.
                if (!celdaEnCulebra(o.x, o.y) && distanciaACabeza(o.x, o.y) > 2) {
                    o.estado = "activo";
                    crearParticulas(o.x + tamanoCelda / 2, o.y + tamanoCelda / 2, 10, o.tipo.color);
                }
            }
            continue;
        }

        // Los temporales se retiran cuando se acaba su tiempo.
        if (!o.permanente) {
            o.vidaMs = o.vidaMs - velocidadActual;
            if (o.vidaMs <= 0) {
                crearParticulas(o.x + tamanoCelda / 2, o.y + tamanoCelda / 2, 10, o.tipo.color);
                obstaculos.splice(i, 1);
                ganarPuntos(puntosObstaculo); // sobreviviste al obstáculo
            }
        }
    }
}

// 💥 COMPROBAR OBSTÁCULOS: ¿la cabeza chocó con uno activo?
// Devuelve un texto (motivo del Game Over) si fue mortal, o "" si no pasó nada grave.
// Los pinchos no matan: quitan puntos y segmentos (nunca bajas de 3), y desaparecen.
function comprobarObstaculos() {
    for (let i = 0; i < obstaculos.length; i++) {
        let o = obstaculos[i];
        if (o.estado === "activo" && culebra[0].x === o.x && culebra[0].y === o.y) {
            if (o.tipo.fatal) {
                return o.tipo.mensaje;
            }

            crearParticulas(o.x + tamanoCelda / 2, o.y + tamanoCelda / 2, 14, o.tipo.color);
            flashMordida = 4;
            perderSegmentosHastaMinimo(o.tipo.segmentos, 3);
            puntos = puntos - o.tipo.puntos;
            if (puntos < 0) {
                puntos = 0; // nunca mostramos puntos negativos
            }
            mostrarTexto("puntos", puntos);
            mostrarTexto("mensaje", o.tipo.mensaje);
            sonido("golpe");
            obstaculos.splice(i, 1);
            return "";
        }
    }
    return "";
}


// ==========================================================
// 🌀 NUEVO: PORTALES CONECTADOS EN PAREJAS
// ==========================================================

// ✅ ¿CELDA VÁLIDA PARA UN PORTAL?: libre, lejos de las paredes (2 celdas), a 4 celdas o más
// de la cabeza, fuera de la línea de avance y sin obstáculos ni portales pegados.
function celdaValidaParaPortal(x, y) {
    if (x < 2 * tamanoCelda || x > (columnas - 3) * tamanoCelda || y < 2 * tamanoCelda || y > (filas - 3) * tamanoCelda) {
        return false;
    }
    if (posicionOcupada(x, y)) {
        return false;
    }
    if (distanciaACabeza(x, y) < 4) {
        return false;
    }
    if (enLineaDeAvance(x, y)) {
        return false;
    }
    if (obstaculoCercano(x, y) || portalCercano(x, y)) {
        return false;
    }
    return true;
}

// 🌀 CREAR PAREJA DE PORTALES: dos portales del mismo color, conectados entre sí.
// Entrar por uno te saca por el otro. Devuelve [a, b] o null si no se pudo.
function crearParPortales() {
    for (let intento = 0; intento < 200; intento++) {
        let ax = (2 + numeroAleatorio(columnas - 4)) * tamanoCelda;
        let ay = (2 + numeroAleatorio(filas - 4)) * tamanoCelda;
        if (!celdaValidaParaPortal(ax, ay)) {
            continue;
        }

        for (let k = 0; k < 60; k++) {
            let bx = (2 + numeroAleatorio(columnas - 4)) * tamanoCelda;
            let by = (2 + numeroAleatorio(filas - 4)) * tamanoCelda;
            if (!celdaValidaParaPortal(bx, by)) {
                continue;
            }
            // Deben estar bien separados (6 celdas o más) para que el salto se note.
            if ((Math.abs(bx - ax) + Math.abs(by - ay)) / tamanoCelda < 6) {
                continue;
            }

            contadorPares = contadorPares + 1;
            let color = coloresPortal[numeroAleatorio(coloresPortal.length)];
            let vida = 32000 + numeroAleatorio(10000);

            let a = { x: ax, y: ay, color: color, estado: "abriendo", aperturaMs: 1800, avisoMs: 1800,
                      enfriamientoMs: 0, vidaMs: vida, parId: contadorPares, lado: 0, par: null, cerrado: false };
            let b = { x: bx, y: by, color: color, estado: "abriendo", aperturaMs: 1800, avisoMs: 1800,
                      enfriamientoMs: 0, vidaMs: vida, parId: contadorPares, lado: 1, par: null, cerrado: false };
            a.par = b;
            b.par = a;

            crearParticulas(ax + tamanoCelda / 2, ay + tamanoCelda / 2, 12, color);
            crearParticulas(bx + tamanoCelda / 2, by + tamanoCelda / 2, 12, color);
            mostrarTexto("mensaje", "🌀 Se abren dos portales... ¿adónde llevarán?");
            sonido("aviso");
            return [a, b];
        }
    }
    return null;
}

// ✅ ¿SALIDA SEGURA?: la culebra puede aparecer ahí sin peligro (sin cuerpo, fruta, enemigo,
// obstáculo ni amenaza cerca, y con la celda de enfrente libre).
function salidaPortalSegura(x, y) {
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return false;
    }
    if (celdaEnCulebra(x, y) || alimentoEn(x, y) || enemigoEn(x, y) || obstaculoEn(x, y) || peligroEn(x, y)) {
        return false;
    }
    if (arana !== null && arana.x === x && arana.y === y) {
        return false;
    }
    if (amenazaCerca(x, y, 2)) {
        return false;
    }
    let delanteX = x + velocidadX;
    let delanteY = y + velocidadY;
    if (delanteX < 0 || delanteX >= canvas.width || delanteY < 0 || delanteY >= canvas.height) {
        return false;
    }
    if (celdaEnCulebra(delanteX, delanteY) || obstaculoEn(delanteX, delanteY) || enemigoEn(delanteX, delanteY) || peligroEn(delanteX, delanteY)) {
        return false;
    }
    return true;
}

// 🔍 BUSCAR SALIDA: primero la celda del portal de destino; si no es segura, las celdas de alrededor.
function buscarSalidaPortal(par) {
    for (let radio = 0; radio <= 2; radio++) {
        for (let dx = -radio; dx <= radio; dx++) {
            for (let dy = -radio; dy <= radio; dy++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== radio) {
                    continue;
                }
                let x = par.x + dx * tamanoCelda;
                let y = par.y + dy * tamanoCelda;
                if (salidaPortalSegura(x, y)) {
                    return { x: x, y: y };
                }
            }
        }
    }
    return null;
}

// 🥚 REGISTRAR USO DE PORTAL: anota el orden de entradas para el huevo de Pascua.
// Hay que entrar por A, luego por B y luego otra vez por A (de la MISMA pareja), en 35 s
// y con la culebra grande. Un uso suelto nunca lo activa.
function registrarUsoPortal(p) {
    if (huevoEncontrado || grieta !== null) {
        return;
    }

    // Si cambia de pareja o se acabó el tiempo, la secuencia se reinicia.
    if (secuenciaPortal.length > 0 && (secuenciaPar !== p.parId || tiempoSecuenciaMs <= 0)) {
        secuenciaPortal = [];
    }

    // ¿Este lado es el que toca en la secuencia?
    if (p.lado === ladosHuevo[secuenciaPortal.length]) {
        if (secuenciaPortal.length === 0) {
            secuenciaPar = p.parId;
            tiempoSecuenciaMs = ventanaSecuenciaMs;
        }
        secuenciaPortal.push(p.lado);
    } else if (p.lado === ladosHuevo[0]) {
        // Se equivocó, pero este uso puede ser el comienzo de una secuencia nueva.
        secuenciaPortal = [p.lado];
        secuenciaPar = p.parId;
        tiempoSecuenciaMs = ventanaSecuenciaMs;
    } else {
        secuenciaPortal = [];
    }

    // ¿Completó la secuencia?
    if (secuenciaPortal.length === ladosHuevo.length) {
        secuenciaPortal = [];
        if (culebra.length >= tamanoMinimoHuevo) {
            abrirGrieta();
        } else {
            mostrarTexto("mensaje", "🌀 Los portales vibran extrañamente... pero tu serpiente aún es demasiado corta");
        }
    }
}

// 🚀 TELETRANSPORTAR: la cabeza sale por el portal conectado (o por una celda segura junto a él).
function teletransportar(p) {
    let par = p.par;
    let salida = buscarSalidaPortal(par);

    // Si no hay salida segura, los portales "parpadean" y no transportan.
    if (salida === null) {
        p.estado = "enfriando";
        p.enfriamientoMs = 1500;
        mostrarTexto("mensaje", "🌀 Los portales parpadean... están inestables");
        return;
    }

    // Efecto en el punto de entrada y en el de salida.
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 20, p.color);
    culebra[0].x = salida.x;
    culebra[0].y = salida.y;
    crearParticulas(salida.x + tamanoCelda / 2, salida.y + tamanoCelda / 2, 20, p.color);
    crearParticulas(salida.x + tamanoCelda / 2, salida.y + tamanoCelda / 2, 10, "#ffffff");

    flashPortal = 5;
    proteccionPortalPasos = pasosProteccionPortal; // 🛡️ durante unos pasos ningún portal activa
    p.estado = "enfriando";                        // y la pareja descansa unos segundos
    p.enfriamientoMs = 3000;
    par.estado = "enfriando";
    par.enfriamientoMs = 3000;

    ganarPuntos(puntosPortal);
    mostrarTexto("mensaje", "🌀 ¡Portal! Fuiste transportado");
    sonido("portal");
    registrarUsoPortal(p);
}

// 🚪 COMPROBAR PORTALES: ¿la cabeza entró a un portal activo? Se llama una vez por paso.
function comprobarPortales() {
    // 🛡️ Protección: tras un teletransporte esperamos unos pasos antes de activar otro.
    if (proteccionPortalPasos > 0) {
        proteccionPortalPasos = proteccionPortalPasos - 1;
        return;
    }

    for (let i = 0; i < portales.length; i++) {
        let p = portales[i];
        if (p.estado === "activo" && culebra[0].x === p.x && culebra[0].y === p.y) {
            teletransportar(p);
            return; // solo un portal por paso
        }
    }
}

// 🔁 GESTIONAR PORTALES: abre, enfría y cierra las parejas según el tiempo de juego.
function gestionarPortales() {
    for (let i = 0; i < portales.length; i++) {
        let p = portales[i];

        p.vidaMs = p.vidaMs - velocidadActual;
        if (p.vidaMs <= 0) {
            p.cerrado = true;
            p.par.cerrado = true; // la pareja se cierra junta
        }

        if (p.estado === "abriendo") {
            p.avisoMs = p.avisoMs - velocidadActual;
            if (p.avisoMs <= 0) {
                p.estado = "activo";
            }
        } else if (p.estado === "enfriando") {
            p.enfriamientoMs = p.enfriamientoMs - velocidadActual;
            if (p.enfriamientoMs <= 0) {
                p.estado = "activo";
            }
        }
    }

    // Retiramos los cerrados (al revés para no saltarnos ninguno).
    for (let j = portales.length - 1; j >= 0; j--) {
        if (portales[j].cerrado) {
            crearParticulas(portales[j].x + tamanoCelda / 2, portales[j].y + tamanoCelda / 2, 12, portales[j].color);
            portales.splice(j, 1);
        }
    }
}


// ==========================================================
// 🥚 NUEVO: HUEVO DE PASCUA, GRIETA Y DIMENSIÓN SECRETA
// ==========================================================

// 🌌 ABRIR GRIETA: aparece la entrada secreta en una celda segura, cerca pero no encima.
function abrirGrieta() {
    for (let intento = 0; intento < 200; intento++) {
        let x = (2 + numeroAleatorio(columnas - 4)) * tamanoCelda;
        let y = (2 + numeroAleatorio(filas - 4)) * tamanoCelda;
        let distancia = distanciaACabeza(x, y);
        if (!posicionOcupada(x, y) && distancia >= 4 && distancia <= 12 && !enLineaDeAvance(x, y) && !obstaculoCercano(x, y) && !portalCercano(x, y)) {
            grieta = { x: x, y: y, vidaMs: 16000 };
            crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 20, "#ff5ec4");
            crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 20, "#8ff3ff");
            mostrarTexto("mensaje", "🌌 ¡Se abrió una grieta secreta! Entra antes de que se cierre");
            sonido("grieta");
            return;
        }
    }
    // Si no hubo sitio, la dimensión se abre directamente.
    entrarDimension();
}

// ⏳ GESTIONAR GRIETA: se cierra sola si el jugador no entra a tiempo (y puede intentarlo otra vez).
function gestionarGrieta() {
    if (grieta === null) {
        return;
    }
    grieta.vidaMs = grieta.vidaMs - velocidadActual;
    if (grieta.vidaMs <= 0) {
        crearParticulas(grieta.x + tamanoCelda / 2, grieta.y + tamanoCelda / 2, 14, "#ff5ec4");
        grieta = null;
        mostrarTexto("mensaje", "🌌 La grieta se cerró... pero el secreto sigue ahí");
    }
}

// 🚪 COMPROBAR GRIETA: ¿la cabeza entró a la grieta?
function comprobarGrieta() {
    if (grieta !== null && culebra[0].x === grieta.x && culebra[0].y === grieta.y) {
        entrarDimension();
    }
}

// 🌌 ENTRAR A LA DIMENSIÓN SECRETA: limpia el tablero de peligros, da el premio y empieza la presentación.
function entrarDimension() {
    grieta = null;
    secuenciaPortal = [];
    dimensionActiva = true;
    dimensionFase = "creador";
    dimensionTicks = 0;
    caracteresCreador = 0;
    creadorEspera = 0;
    dimensionRestanteMs = duracionDimensionMs;
    tiempoPresaMs = 600;
    devorados = 0;
    huevoEncontrado = true;     // 🥚 queda registrado para el ranking

    // Sin veneno, sin araña, sin obstáculos ni portales.
    envenenado = false;
    venenoRestanteMs = 0;
    frutasPendientes = 0;
    arana = null;
    peligros = [];
    obstaculos = [];
    portales = [];

    // Aseguramos que haya algunos 👾 para devorar.
    while (enemigos.length < 2) {
        enemigos.push(crearEnemigo());
    }

    ganarPuntos(puntosHuevo);
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 30, "#ff5ec4");
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 30, "#8ff3ff");
    mostrarTexto("mensaje", "🥚 ¡HUEVO DE PASCUA! +" + puntosHuevo + " puntos. Has entrado a la dimensión secreta");
    sonido("grieta");
}

// 👨‍💻 GESTIONAR CREADOR: durante la presentación todo está congelado.
// El creador aparece, escribe su mensaje letra por letra y después empieza la cuenta regresiva.
function gestionarCreador() {
    dimensionTicks = dimensionTicks + 1;
    animacionEventos = animacionEventos + 1;
    actualizarParticulas();

    if (dimensionTicks > 20) {
        if (caracteresCreador < textoCreador.length) {
            caracteresCreador = caracteresCreador + 5;
            if (dimensionTicks % 2 === 0) {
                sonido("hablar");
            }
        } else {
            creadorEspera = creadorEspera + 1;
            if (creadorEspera >= 14) {
                dimensionFase = "ayuda";
                mostrarTexto("mensaje", "🌌 ¡20 segundos de invencibilidad! Devora a todos los enemigos");
                sonido("nivel");
            }
        }
    }
}

// 😋 DEVORAR 👾 (solo en la dimensión secreta): quita el enemigo de la cabeza y da puntos.
function devorarEnemigo() {
    for (let i = enemigos.length - 1; i >= 0; i--) {
        if (enemigos[i].x === culebra[0].x && enemigos[i].y === culebra[0].y) {
            crearParticulas(enemigos[i].x + tamanoCelda / 2, enemigos[i].y + tamanoCelda / 2, 12, "#ff7a1a");
            enemigos.splice(i, 1);
            ganarPuntos(puntosDevorar);
            devorados = devorados + 1;
            segmentosPorCrecer = segmentosPorCrecer + 1;
            mostrarTexto("mensaje", "😋 ¡Devoraste un 👾! +" + puntosDevorar + " puntos");
            sonido("devorar");
        }
    }
}

// 😨 MOVER ENEMIGOS ASUSTADOS: en la dimensión secreta los 👾 huyen de la culebra (y si los alcanza, los devora).
function moverEnemigosAsustados() {
    pasosJuego = pasosJuego + 1;
    if (pasosJuego % 2 !== 0) {
        return;
    }
    for (let i = 0; i < enemigos.length; i++) {
        let enemigo = enemigos[i];
        let difX = enemigo.x - culebra[0].x;
        let difY = enemigo.y - culebra[0].y;
        let nuevoX = enemigo.x;
        let nuevoY = enemigo.y;

        // Se aleja por el eje donde está más cerca de la culebra.
        if (Math.abs(difX) <= Math.abs(difY)) {
            nuevoX = nuevoX + (difX >= 0 ? tamanoCelda : -tamanoCelda);
        } else {
            nuevoY = nuevoY + (difY >= 0 ? tamanoCelda : -tamanoCelda);
        }
        // Si se topa con la pared, prueba por el otro eje.
        if (nuevoX < 0 || nuevoX >= canvas.width || nuevoY < 0 || nuevoY >= canvas.height) {
            nuevoX = enemigo.x;
            nuevoY = enemigo.y;
            if (numeroAleatorio(2) === 0) {
                nuevoX = nuevoX + (difX >= 0 ? -tamanoCelda : tamanoCelda);
            } else {
                nuevoY = nuevoY + (difY >= 0 ? -tamanoCelda : tamanoCelda);
            }
        }
        if (nuevoX >= 0 && nuevoX < canvas.width && nuevoY >= 0 && nuevoY < canvas.height && !enemigoEn(nuevoX, nuevoY)) {
            enemigo.x = nuevoX;
            enemigo.y = nuevoY;
        }
    }
    devorarEnemigo();
}

// ⏳ GESTIONAR DIMENSIÓN (fase "ayuda"): cuenta regresiva y aparición de presas.
function gestionarDimensionAyuda() {
    dimensionRestanteMs = dimensionRestanteMs - velocidadActual;
    if (dimensionRestanteMs <= 0) {
        salirDimension();
        return;
    }

    tiempoPresaMs = tiempoPresaMs - velocidadActual;
    if (tiempoPresaMs <= 0) {
        tiempoPresaMs = 1100 + numeroAleatorio(800);
        if (peligros.length < maximoPresas) {
            let presa = crearPresaSecreta();
            if (presa !== null) {
                peligros.push(presa);
            }
        }
    }

    gestionarPeligros(); // los mueve y devora los que toquen la cabeza
}

// 📍 ¿HAY ESPACIO DELANTE?: "cantidad" celdas libres de pared y de cuerpo en esa dirección.
function frenteLibre(dx, dy, cantidad) {
    for (let k = 1; k <= cantidad; k++) {
        let x = culebra[0].x + dx * k;
        let y = culebra[0].y + dy * k;
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
            return false;
        }
        if (celdaEnCulebra(x, y)) {
            return false;
        }
    }
    return true;
}

// ✅ ¿DESTINO SEGURO PARA LA CABEZA?: lejos de paredes (2 celdas), sin nada encima ni cerca y con la celda de enfrente libre.
function destinoSeguro(x, y) {
    if (x < 2 * tamanoCelda || x > (columnas - 3) * tamanoCelda || y < 2 * tamanoCelda || y > (filas - 3) * tamanoCelda) {
        return false;
    }
    if (celdaEnCulebra(x, y) || alimentoEn(x, y) || enemigoEn(x, y) || obstaculoEn(x, y) || peligroEn(x, y) || portalEn(x, y) || grietaEn(x, y)) {
        return false;
    }
    if (arana !== null && arana.x === x && arana.y === y) {
        return false;
    }
    if (amenazaCerca(x, y, 3) || obstaculoCercano(x, y)) {
        return false;
    }
    let delanteX = x + velocidadX;
    let delanteY = y + velocidadY;
    if (celdaEnCulebra(delanteX, delanteY) || obstaculoEn(delanteX, delanteY) || enemigoEn(delanteX, delanteY) || peligroEn(delanteX, delanteY)) {
        return false;
    }
    return true;
}

// 🎲 BUSCAR DESTINO SEGURO: prueba hasta 200 celdas al azar. Devuelve {x, y} o null.
function buscarDestinoSeguro() {
    for (let intento = 0; intento < 200; intento++) {
        let x = (2 + numeroAleatorio(columnas - 4)) * tamanoCelda;
        let y = (2 + numeroAleatorio(filas - 4)) * tamanoCelda;
        if (destinoSeguro(x, y)) {
            return { x: x, y: y };
        }
    }
    return null;
}

// 🛟 COLOCAR CABEZA SEGURA: al volver de la dimensión secreta, la culebra no puede quedar
// mirando a una pared. Primero comprobamos el frente, luego los giros posibles y, como último
// recurso, la teletransportamos a una celda segura.
function colocarCabezaSegura() {
    if (frenteLibre(velocidadX, velocidadY, 3)) {
        return;
    }

    let opciones;
    if (velocidadX !== 0) {
        opciones = [{ x: 0, y: tamanoCelda }, { x: 0, y: -tamanoCelda }];
    } else {
        opciones = [{ x: tamanoCelda, y: 0 }, { x: -tamanoCelda, y: 0 }];
    }
    for (let i = 0; i < opciones.length; i++) {
        if (frenteLibre(opciones[i].x, opciones[i].y, 3)) {
            velocidadX = opciones[i].x;
            velocidadY = opciones[i].y;
            proximaX = opciones[i].x;
            proximaY = opciones[i].y;
            return;
        }
    }

    let destino = buscarDestinoSeguro();
    if (destino !== null) {
        crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 12, "#8ff3ff");
        culebra[0].x = destino.x;
        culebra[0].y = destino.y;
        crearParticulas(destino.x + tamanoCelda / 2, destino.y + tamanoCelda / 2, 12, "#8ff3ff");
    }
}

// 🚪 SALIR DE LA DIMENSIÓN: se acaba la protección, todo vuelve a ser peligroso y la culebra queda a salvo.
function salirDimension() {
    dimensionActiva = false;
    dimensionFase = "";
    dimensionRestanteMs = 0;

    // Limpiamos las presas y reiniciamos los eventos con esperas largas para respirar.
    peligros = [];
    enemigos = [];
    arana = null;
    envenenado = false;
    venenoRestanteMs = 0;
    frutasPendientes = 0;
    reiniciarEventos();
    tiempoParaAranaMs = sortearEsperaArana();
    ultimoBonoTiempo = tiempo;

    colocarCabezaSegura();
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 24, "#8ff3ff");
    mostrarTexto("mensaje", "🌌 La dimensión se cierra... ¡devoraste " + devorados + "! Los enemigos vuelven a ser peligrosos");
    sonido("fin");
}


// ==========================================================
// 🎲 NUEVO: DIRECTOR DE EVENTOS (decide cuándo aparece cada cosa)
// ==========================================================

// 🧹 REINICIAR EVENTOS: deja enemigos variados, obstáculos, portales y grieta como al empezar.
// Las primeras esperas son largas para que el jugador pueda calentar motores.
function reiniciarEventos() {
    peligros = [];
    obstaculos = [];
    portales = [];
    grieta = null;
    secuenciaPortal = [];
    secuenciaPar = -1;
    tiempoSecuenciaMs = 0;
    contadorPares = 0;

    animacionEventos = 0;
    flashPortal = 0;
    proteccionPortalPasos = 0;
    enfriamientoEventosMs = 0;

    tiempoParaPeligroMs = 12000 + numeroAleatorio(6000);
    tiempoParaObstaculoMs = 8000 + numeroAleatorio(5000);
    tiempoParaPortalMs = 15000 + numeroAleatorio(8000);
}

// 🎬 INTENTAR CREAR EVENTO: categoria 0 = enemigo variado, 1 = obstáculo, 2 = portales.
// Devuelve true si creó algo. Si no pudo, reprograma un nuevo intento cercano.
function intentarCrearEvento(categoria) {
    if (categoria === 0) {
        if (tiempoParaPeligroMs > 0) {
            return false;
        }
        // La araña cuenta como enemigo variado para respetar el tope.
        let activos = peligros.length;
        if (arana !== null) {
            activos = activos + 1;
        }
        let nuevo = null;
        if (activos < maximoPeligros()) {
            nuevo = crearPeligro();
        }
        if (nuevo === null) {
            tiempoParaPeligroMs = 3000 + numeroAleatorio(3000);
            return false;
        }
        peligros.push(nuevo);
        tiempoParaPeligroMs = sortearEspera(esperaPeligroMin, esperaPeligroMax);
        marcarEvento();
        return true;
    }

    if (categoria === 1) {
        if (tiempoParaObstaculoMs > 0) {
            return false;
        }
        let nuevoObstaculo = null;
        if (obstaculos.length < maximoObstaculosActual()) {
            nuevoObstaculo = crearObstaculo();
        }
        if (nuevoObstaculo === null) {
            tiempoParaObstaculoMs = 3000 + numeroAleatorio(3000);
            return false;
        }
        obstaculos.push(nuevoObstaculo);
        tiempoParaObstaculoMs = sortearEspera(esperaObstaculoMin, esperaObstaculoMax);
        marcarEvento();
        return true;
    }

    if (tiempoParaPortalMs > 0) {
        return false;
    }
    let nuevoPar = null;
    if (portales.length < 2 * maximoParesActual()) {
        nuevoPar = crearParPortales();
    }
    if (nuevoPar === null) {
        tiempoParaPortalMs = 3000 + numeroAleatorio(3000);
        return false;
    }
    portales.push(nuevoPar[0]);
    portales.push(nuevoPar[1]);
    tiempoParaPortalMs = sortearEspera(esperaPortalMin, esperaPortalMax);
    marcarEvento();
    return true;
}

// 🔁 GESTIONAR EVENTOS: se llama UNA vez por paso desde cicloJuego.
// No usa relojes propios: suma los milisegundos de cada paso. Por eso se pausa con el juego.
function gestionarEventos() {
    animacionEventos = animacionEventos + 1;

    if (flashPortal > 0) {
        flashPortal = flashPortal - 1;
    }

    // 🌌 En la dimensión secreta solo se gestiona la cuenta regresiva y las presas.
    if (dimensionActiva) {
        gestionarDimensionAyuda();
        return;
    }

    if (enfriamientoEventosMs > 0) {
        enfriamientoEventosMs = enfriamientoEventosMs - velocidadActual;
    }

    // Descontamos tiempo de los contadores de aparición.
    if (tiempoParaPeligroMs > 0) {
        tiempoParaPeligroMs = tiempoParaPeligroMs - velocidadActual;
    }
    if (tiempoParaObstaculoMs > 0) {
        tiempoParaObstaculoMs = tiempoParaObstaculoMs - velocidadActual;
    }
    if (tiempoParaPortalMs > 0) {
        tiempoParaPortalMs = tiempoParaPortalMs - velocidadActual;
    }

    // ⏱️ Bono por sobrevivir.
    if (tiempo - ultimoBonoTiempo >= segundosParaBono) {
        ultimoBonoTiempo = tiempo;
        ganarPuntos(puntosBonoSupervivencia);
        mostrarTexto("mensaje", "⏱️ ¡Sigues vivo! +" + puntosBonoSupervivencia + " puntos");
    }

    actualizarNivel();

    // La secuencia secreta de portales tiene tiempo límite.
    if (secuenciaPortal.length > 0) {
        tiempoSecuenciaMs = tiempoSecuenciaMs - velocidadActual;
        if (tiempoSecuenciaMs <= 0) {
            secuenciaPortal = [];
        }
    }

    // Avanzamos lo que ya está en el tablero.
    gestionarObstaculos();
    gestionarPortales();
    gestionarGrieta();
    gestionarPeligros();

    // Solo puede aparecer algo nuevo si pasó la pausa entre eventos.
    // Revisamos las 3 categorías empezando por una al azar: nunca sale siempre lo mismo primero.
    if (enfriamientoEventosMs <= 0) {
        let primera = numeroAleatorio(3);
        for (let k = 0; k < 3; k++) {
            if (intentarCrearEvento((primera + k) % 3)) {
                break; // máximo un evento nuevo por paso
            }
        }
    }
}


// ==========================================================
// 🎨 NUEVO: DIBUJO DE ENEMIGOS, OBSTÁCULOS, PORTALES Y GRIETA
// ==========================================================

// 🪲 DIBUJAR ENEMIGOS VARIADOS: cada tipo tiene su emoji, su color de brillo y su estilo.
// En fase de aviso se ve un anillo punteado con un "!" que pulsa.
function dibujarPeligros() {
    for (let i = 0; i < peligros.length; i++) {
        let p = peligros[i];
        let tipo = p.tipo;
        let centroX = p.x + tamanoCelda / 2;
        let centroY = p.y + tamanoCelda / 2;

        // ⚠️ Fase de aviso.
        if (p.estado === "aviso") {
            let pulso = (animacionEventos % 6) / 6;
            contexto.globalAlpha = 1 - pulso * 0.7;
            contexto.strokeStyle = tipo.color;
            contexto.shadowColor = tipo.color;
            contexto.shadowBlur = 10;
            contexto.lineWidth = 2;
            contexto.setLineDash([4, 4]);
            contexto.beginPath();
            contexto.arc(centroX, centroY, 7 + pulso * 9, 0, Math.PI * 2);
            contexto.stroke();
            contexto.setLineDash([]);

            contexto.fillStyle = tipo.color;
            contexto.font = "bold 14px sans-serif";
            contexto.textAlign = "center";
            contexto.textBaseline = "middle";
            contexto.fillText("!", centroX, centroY + 1);

            contexto.globalAlpha = 1;
            contexto.shadowBlur = 0;
            continue;
        }

        // Parpadea cuando le queda poco tiempo: avisa que se va a esfumar.
        if (p.vidaMs <= 2500 && animacionEventos % 2 === 0) {
            continue;
        }

        let alfa = 1;
        let flotar = 0;
        if (tipo.movimiento === "perseguir") {
            // 👻 El fantasma flota y es semitransparente.
            alfa = 0.65 + Math.sin(animacionEventos * 0.6) * 0.2;
            flotar = Math.sin(animacionEventos * 0.8) * 2;
        }

        // 🦇🐝 Los voladores veloces dejan una estela detrás de ellos.
        if (tipo.movimiento === "errante" && (p.dirX !== 0 || p.dirY !== 0)) {
            contexto.fillStyle = tipo.color;
            for (let k = 1; k <= 2; k++) {
                contexto.globalAlpha = 0.3 / k;
                contexto.beginPath();
                contexto.arc(centroX - p.dirX * 0.4 * k, centroY - p.dirY * 0.4 * k, 6 - k, 0, Math.PI * 2);
                contexto.fill();
            }
        }

        // 🌫️ Aura de su color. Los que acechan usan un rombo; los demás, un círculo.
        contexto.globalAlpha = alfa * 0.3;
        contexto.fillStyle = tipo.color;
        contexto.beginPath();
        if (tipo.movimiento === "acechar") {
            contexto.moveTo(centroX, centroY - 14);
            contexto.lineTo(centroX + 14, centroY);
            contexto.lineTo(centroX, centroY + 14);
            contexto.lineTo(centroX - 14, centroY);
            contexto.closePath();
        } else {
            contexto.arc(centroX, centroY + flotar, 13, 0, Math.PI * 2);
        }
        contexto.fill();

        // 🔤 Emoji con brillo de su color.
        contexto.globalAlpha = alfa;
        contexto.font = "20px serif";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.shadowColor = tipo.color;
        contexto.shadowBlur = 14;
        contexto.fillText(tipo.emoji, centroX, centroY + 1 + flotar);

        contexto.shadowBlur = 0;
        contexto.globalAlpha = 1;
    }
    contexto.setLineDash([]);
}

// 🧱 DIBUJAR OBSTÁCULOS: se dibujan con formas (no con emojis) para distinguirlos de los enemigos.
function dibujarObstaculos() {
    for (let i = 0; i < obstaculos.length; i++) {
        let o = obstaculos[i];
        let tipo = o.tipo;
        let x = o.x;
        let y = o.y;
        let t = tamanoCelda;
        let centroX = x + t / 2;
        let centroY = y + t / 2;

        // ⚠️ Fase de aviso: contorno punteado que parpadea, sin relleno sólido.
        if (o.estado === "aviso") {
            contexto.globalAlpha = 0.3 + (animacionEventos % 4 < 2 ? 0.5 : 0);
            contexto.strokeStyle = tipo.color;
            contexto.lineWidth = 2;
            contexto.setLineDash([5, 3]);
            contexto.strokeRect(x + 2, y + 2, t - 4, t - 4);
            contexto.setLineDash([]);
            contexto.fillStyle = tipo.color;
            contexto.globalAlpha = 0.12;
            contexto.fillRect(x + 2, y + 2, t - 4, t - 4);
            contexto.globalAlpha = 1;
            continue;
        }

        // Los temporales parpadean cuando les queda poco tiempo.
        if (!o.permanente && o.vidaMs <= 2500 && animacionEventos % 2 === 0) {
            continue;
        }

        contexto.shadowColor = tipo.color;
        contexto.shadowBlur = 10;

        if (tipo.forma === "roca") {
            // 🪨 Bloque gris con luz arriba a la izquierda y grietas.
            contexto.fillStyle = "#4a5064";
            contexto.fillRect(x + 2, y + 3, t - 4, t - 5);
            contexto.shadowBlur = 0;
            contexto.fillStyle = "#7b849c";
            contexto.beginPath();
            contexto.moveTo(x + 2, y + 3);
            contexto.lineTo(x + t - 8, y + 3);
            contexto.lineTo(x + 2, y + t - 9);
            contexto.closePath();
            contexto.fill();
            contexto.strokeStyle = "#1c2030";
            contexto.lineWidth = 1.5;
            contexto.beginPath();
            contexto.moveTo(centroX + 2, y + 5);
            contexto.lineTo(centroX - 1, centroY);
            contexto.lineTo(centroX + 4, y + t - 6);
            contexto.stroke();
        } else if (tipo.forma === "pinchos") {
            // 🔺 Base oscura y tres picos rojos que laten.
            let latido = 0;
            if (animacionEventos % 4 < 2) {
                latido = 2;
            }
            contexto.fillStyle = "#5a0f1e";
            contexto.fillRect(x + 2, y + t - 7, t - 4, 5);
            contexto.fillStyle = tipo.color;
            for (let k = 0; k < 3; k++) {
                contexto.beginPath();
                contexto.moveTo(x + 3 + k * 7, y + t - 7);
                contexto.lineTo(x + 6.5 + k * 7, y + 4 - latido);
                contexto.lineTo(x + 10 + k * 7, y + t - 7);
                contexto.closePath();
                contexto.fill();
            }
        } else {
            // 💎 Cristal: rombo ámbar con un centro brillante.
            contexto.fillStyle = tipo.color;
            contexto.beginPath();
            contexto.moveTo(centroX, y + 2);
            contexto.lineTo(x + t - 3, centroY);
            contexto.lineTo(centroX, y + t - 2);
            contexto.lineTo(x + 3, centroY);
            contexto.closePath();
            contexto.fill();
            contexto.shadowBlur = 0;
            contexto.fillStyle = "#fff3b0";
            contexto.beginPath();
            contexto.moveTo(centroX, y + 7);
            contexto.lineTo(x + t - 9, centroY);
            contexto.lineTo(centroX, y + t - 7);
            contexto.lineTo(x + 9, centroY);
            contexto.closePath();
            contexto.fill();
        }

        contexto.shadowBlur = 0;
    }
    contexto.setLineDash([]);
    contexto.globalAlpha = 1;
}

// 🌀 DIBUJAR PORTALES: anillos de energía que giran en sentidos opuestos y una línea tenue
// que une cada pareja. Los dos portales de una pareja comparten color.
function dibujarPortales() {
    // ✨ Destello del teletransporte.
    if (flashPortal > 0) {
        contexto.fillStyle = "rgba(190, 130, 255, " + (flashPortal * 0.06) + ")";
        contexto.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (let i = 0; i < portales.length; i++) {
        let p = portales[i];
        let centroX = p.x + tamanoCelda / 2;
        let centroY = p.y + tamanoCelda / 2;
        let apagado = p.estado === "enfriando";
        let angulo = animacionEventos * 0.35;
        let sentido = p.lado === 0 ? 1 : -1; // cada lado gira al revés: parecen espejos

        // Mientras se abre, los anillos crecen poco a poco.
        let escala = 1;
        if (p.estado === "abriendo") {
            escala = 1 - Math.max(0, p.avisoMs) / p.aperturaMs;
            if (escala < 0.15) {
                escala = 0.15;
            }
        }

        // Si le queda poco tiempo, el portal parpadea antes de cerrarse.
        if (p.vidaMs <= 2500 && animacionEventos % 2 === 0) {
            continue;
        }

        contexto.strokeStyle = p.color;
        contexto.fillStyle = p.color;
        contexto.shadowColor = p.color;

        // 🔗 Vínculo tenue con su pareja (se dibuja una sola vez por pareja).
        if (p.lado === 0 && p.par !== null) {
            contexto.globalAlpha = apagado ? 0.08 : 0.2;
            contexto.shadowBlur = 0;
            contexto.lineWidth = 1;
            contexto.setLineDash([2, 6]);
            contexto.beginPath();
            contexto.moveTo(centroX, centroY);
            contexto.lineTo(p.par.x + tamanoCelda / 2, p.par.y + tamanoCelda / 2);
            contexto.stroke();
            contexto.setLineDash([]);
        }

        // 🌀 3 anillos concéntricos que giran.
        contexto.globalAlpha = apagado ? 0.4 : 1;
        contexto.shadowBlur = apagado ? 6 : 16;
        contexto.lineWidth = 2;
        contexto.lineCap = "round";
        for (let r = 0; r < 3; r++) {
            let radio = (5 + r * 4 + (animacionEventos % 4 < 2 ? 0 : 1)) * escala;
            let giro = angulo * sentido * (r % 2 === 0 ? 1 : -1) + r * 2;
            contexto.beginPath();
            contexto.arc(centroX, centroY, radio, giro, giro + 4.2);
            contexto.stroke();
        }

        // Centro brillante.
        contexto.globalAlpha = apagado ? 0.3 : 0.8;
        contexto.beginPath();
        contexto.arc(centroX, centroY, 3 * escala, 0, Math.PI * 2);
        contexto.fill();

        contexto.globalAlpha = 1;
        contexto.shadowBlur = 0;
    }
    contexto.setLineDash([]);
}

// 🌌 DIBUJAR GRIETA: un remolino arcoíris con chispas. Parpadea cuando está por cerrarse.
function dibujarGrieta() {
    if (grieta === null) {
        return;
    }
    if (grieta.vidaMs <= 3000 && animacionEventos % 2 === 0) {
        return;
    }
    let centroX = grieta.x + tamanoCelda / 2;
    let centroY = grieta.y + tamanoCelda / 2;

    contexto.lineWidth = 2.5;
    contexto.lineCap = "round";
    contexto.shadowBlur = 16;
    for (let r = 0; r < 4; r++) {
        let color = "hsl(" + ((animacionEventos * 15 + r * 70) % 360) + ", 100%, 65%)";
        contexto.strokeStyle = color;
        contexto.shadowColor = color;
        let giro = animacionEventos * 0.4 * (r % 2 === 0 ? 1 : -1) + r;
        contexto.beginPath();
        contexto.arc(centroX, centroY, 4 + r * 3.5, giro, giro + 3.6);
        contexto.stroke();
    }
    // Chispas que giran alrededor.
    contexto.shadowBlur = 0;
    contexto.fillStyle = "#ffffff";
    for (let s = 0; s < 5; s++) {
        let ang = animacionEventos * 0.25 + s * 1.256;
        contexto.fillRect(centroX + Math.cos(ang) * 17 - 1, centroY + Math.sin(ang) * 17 - 1, 3, 3);
    }
}

// 🌌 DIBUJAR FONDO DE LA DIMENSIÓN: degradado violeta, cuadrícula en movimiento y estrellas.
function dibujarFondoDimension() {
    let fondo = contexto.createLinearGradient(0, 0, 0, canvas.height);
    fondo.addColorStop(0, "#12033a");
    fondo.addColorStop(0.5, "#2a0a5e");
    fondo.addColorStop(1, "#05152e");
    contexto.fillStyle = fondo;
    contexto.fillRect(0, 0, canvas.width, canvas.height);

    // Cuadrícula que se desliza.
    contexto.strokeStyle = "rgba(160, 120, 255, 0.18)";
    contexto.lineWidth = 1;
    let desplazamiento = (animacionEventos * 2) % tamanoCelda;
    for (let i = 0; i <= columnas; i++) {
        contexto.beginPath();
        contexto.moveTo(i * tamanoCelda, 0);
        contexto.lineTo(i * tamanoCelda, canvas.height);
        contexto.stroke();
    }
    for (let j = 0; j <= filas; j++) {
        contexto.beginPath();
        contexto.moveTo(0, j * tamanoCelda + desplazamiento);
        contexto.lineTo(canvas.width, j * tamanoCelda + desplazamiento);
        contexto.stroke();
    }

    // Estrellas que caen y titilan.
    for (let s = 0; s < 40; s++) {
        let sx = (s * 97 + 31) % canvas.width;
        let sy = (s * 61 + animacionEventos * (1 + s % 3)) % canvas.height;
        contexto.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(animacionEventos * 0.2 + s));
        contexto.fillStyle = s % 2 === 0 ? "#ffffff" : "#ffd6ff";
        contexto.fillRect(sx, sy, 2, 2);
    }
    contexto.globalAlpha = 1;
}

// 🔤 TEXTO AJUSTADO: escribe un texto largo dividiéndolo en líneas que caben en "anchoMax".
function dibujarTextoAjustado(texto, x, y, anchoMax, altoLinea) {
    let palabras = texto.split(" ");
    let linea = "";
    for (let i = 0; i < palabras.length; i++) {
        let prueba = linea === "" ? palabras[i] : linea + " " + palabras[i];
        if (contexto.measureText(prueba).width > anchoMax && linea !== "") {
            contexto.fillText(linea, x, y);
            linea = palabras[i];
            y = y + altoLinea;
        } else {
            linea = prueba;
        }
    }
    contexto.fillText(linea, x, y);
}

// 👨‍💻 DIBUJAR CREADOR: personaje humano pixelado (estilo 16 bits) que aparece con un efecto de
// escaneo, saluda y "habla" dentro de un globo de texto que se escribe letra por letra.
function dibujarCreador() {
    // Oscurecemos un poco el tablero para que el creador destaque.
    contexto.fillStyle = "rgba(0, 0, 20, 0.45)";
    contexto.fillRect(0, 0, canvas.width, canvas.height);

    let escala = 5;
    let x = 40;
    let y = 150 + Math.sin(animacionEventos * 0.3) * 2;
    let apareciendo = dimensionTicks < 20;
    let filasVisibles = spriteCreador.length;
    if (apareciendo) {
        filasVisibles = Math.floor(spriteCreador.length * dimensionTicks / 20);
    }

    // Halo de luz detrás del personaje.
    contexto.globalAlpha = 0.25 + 0.1 * Math.sin(animacionEventos * 0.4);
    contexto.fillStyle = "#8ff3ff";
    contexto.beginPath();
    contexto.arc(x + 35, y + 50, 62, 0, Math.PI * 2);
    contexto.fill();

    // Sombra en el suelo.
    contexto.globalAlpha = 0.4;
    contexto.fillStyle = "#000000";
    contexto.beginPath();
    contexto.ellipse(x + 35, y + 104, 30, 6, 0, 0, Math.PI * 2);
    contexto.fill();

    // El sprite: cada letra del dibujo es un cuadradito de color.
    contexto.globalAlpha = apareciendo && dimensionTicks % 2 === 0 ? 0.6 : 1;
    for (let fila = 0; fila < filasVisibles; fila++) {
        for (let col = 0; col < 14; col++) {
            let letra = spriteCreador[fila].charAt(col);
            if (letra === ".") {
                continue;
            }
            contexto.fillStyle = paletaCreador[letra];
            contexto.fillRect(x + col * escala, y + fila * escala, escala, escala);
        }
    }

    // Brazo que saluda.
    if (!apareciendo) {
        let saludo = Math.floor(animacionEventos / 3) % 2;
        contexto.fillStyle = paletaCreador.S;
        contexto.fillRect(x + 13 * escala, y + (saludo === 0 ? 9 : 10) * escala, escala, escala * 2);
    }
    contexto.globalAlpha = 1;

    // 💬 Globo de texto.
    if (dimensionTicks > 14) {
        contexto.fillStyle = "#fff8e1";
        contexto.strokeStyle = "#2b2b4a";
        contexto.lineWidth = 3;
        contexto.fillRect(140, 105, 345, 175);
        contexto.strokeRect(140, 105, 345, 175);
        contexto.beginPath();
        contexto.moveTo(140, 190);
        contexto.lineTo(122, 205);
        contexto.lineTo(140, 218);
        contexto.closePath();
        contexto.fill();
        contexto.stroke();
        contexto.fillStyle = "#fff8e1";
        contexto.fillRect(138, 192, 4, 24); // tapa la línea del globo junto a la colita

        contexto.textAlign = "left";
        contexto.textBaseline = "top";
        contexto.fillStyle = "#b23a48";
        contexto.font = "bold 13px sans-serif";
        contexto.fillText("EL CREADOR:", 154, 115);
        contexto.fillStyle = "#1b1b2f";
        contexto.font = "15px sans-serif";
        dibujarTextoAjustado(textoCreador.substring(0, caracteresCreador), 154, 138, 318, 21);
    }
}

// 🌌 DIBUJAR DIMENSIÓN: barra de tiempo, contador, aura de protección y, al inicio, el creador.
function dibujarDimension() {
    let fraccion = 1;
    if (dimensionFase === "ayuda") {
        fraccion = dimensionRestanteMs / duracionDimensionMs;
        if (fraccion < 0) {
            fraccion = 0;
        }
    }

    // 🛡️ Aura arcoíris alrededor de la cabeza.
    let cx = culebra[0].x + tamanoCelda / 2;
    let cy = culebra[0].y + tamanoCelda / 2;
    contexto.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
        contexto.globalAlpha = 0.7 - r * 0.2;
        contexto.strokeStyle = "hsl(" + ((animacionEventos * 14 + r * 90) % 360) + ", 100%, 70%)";
        contexto.beginPath();
        contexto.arc(cx, cy, 16 + r * 5 + Math.sin(animacionEventos * 0.5 + r) * 2, 0, Math.PI * 2);
        contexto.stroke();
    }
    contexto.globalAlpha = 1;

    // ⏳ Barra de tiempo y marcador.
    contexto.fillStyle = "rgba(2, 6, 13, 0.6)";
    contexto.fillRect(58, 4, 384, 12);
    contexto.fillStyle = "hsl(" + ((animacionEventos * 10) % 360) + ", 100%, 60%)";
    contexto.fillRect(60, 6, 380 * fraccion, 8);
    contexto.strokeStyle = "#ffffff";
    contexto.lineWidth = 1;
    contexto.strokeRect(58, 4, 384, 12);

    let segundos = Math.ceil(Math.max(0, dimensionRestanteMs) / 1000);
    contexto.fillStyle = "#ffffff";
    contexto.font = "bold 13px sans-serif";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.fillText("🌌 DIMENSIÓN SECRETA · " + segundos + " s · devorados: " + devorados, canvas.width / 2, 28);

    if (dimensionFase === "ayuda" && dimensionRestanteMs > duracionDimensionMs - 3000 && animacionEventos % 4 < 2) {
        contexto.font = "bold 20px sans-serif";
        contexto.fillStyle = "#ffd23f";
        contexto.fillText("¡DEVORA A TODOS!", canvas.width / 2, 58);
    }

    if (dimensionFase === "creador") {
        dibujarCreador();
    }
}

// 📊 DIBUJAR HUD: nivel actual, progreso hacia la meta y estado de la música (todo sobre el canvas).
function dibujarHud() {
    contexto.globalAlpha = 0.85;
    contexto.font = "bold 12px monospace";
    contexto.textBaseline = "middle";
    contexto.fillStyle = "#9fe9ff";
    contexto.textAlign = "left";
    contexto.fillText("NV " + (nivelActual + 1) + " " + nombresNivel[nivelActual] + "  ★ " + puntos + "/" + puntosVictoria, 8, canvas.height - 10);
    contexto.textAlign = "right";
    contexto.fillText(musicaActiva ? "🔊 M" : "🔇 M", canvas.width - 8, canvas.height - 10);
    contexto.globalAlpha = 1;
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
    if (dimensionActiva) {
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

// 📝 PEDIR NOMBRE: se pregunta una sola vez (y se recuerda). La tecla N permite cambiarlo.
function pedirNombre(forzar) {
    if (nombreJugador !== "" && !forzar) {
        return;
    }
    let guardado = "";
    try {
        guardado = localStorage.getItem(claveNombre) || "";
    } catch (error) {
        guardado = "";
    }
    if (guardado !== "" && !forzar) {
        nombreJugador = guardado;
        return;
    }

    let respuesta = window.prompt("🐍 ¿Cómo te llamas, jugador?", guardado !== "" ? guardado : "Jugador");
    let nombre = respuesta === null ? guardado : respuesta.trim();
    if (nombre === "") {
        nombre = "Jugador";
    }
    nombreJugador = nombre.substring(0, 12);
    try {
        localStorage.setItem(claveNombre, nombreJugador);
    } catch (error) {
        // Sin localStorage el nombre solo vale para esta sesión.
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
    dimensionActiva = false;
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
            cambiarVelocidad(velocidadBase);
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
        if (dimensionActiva) {
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

    // 🏆 ¿Llegamos a la meta justo al comer?
    if (comprobarVictoria()) {
        return;
    }

    actualizarEnemigos();

    // 👾 Los enemigos avanzan. Si alguno alcanza la cabeza, Game Over.
    // (En la dimensión secreta huyen de la culebra en vez de perseguirla.)
    if (dimensionActiva) {
        moverEnemigosAsustados();
    } else if (moverEnemigos()) {
        dibujarJuego();
        terminarJuego("👾 ¡Un enemigo te comió!");
        return;
    }

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

// ⏱️ CRONÓMETRO: suma 1 segundo y actualiza el marcador.
function cronometro() {
    tiempo = tiempo + 1;
    mostrarTexto("tiempo", formatearTiempo(tiempo));
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

// ▶️ INICIAR: comienza o reanuda la partida.
function iniciarJuego() {
    // Si ya estamos jugando, no hacemos nada. Así evitamos relojes duplicados.
    if (jugando) {
        return;
    }
    // Si venimos de un Game Over, preparamos una partida nueva primero.
    if (juegoTerminado) {
        reiniciarJuego();
    }

    pedirNombre(false);  // 📝 solo pregunta la primera vez
    iniciarAudio();      // 🔊 el clic en INICIAR permite activar el sonido
    mostrandoRanking = false;

    detenerIntervalos(); // por seguridad, aseguramos que no queden relojes viejos
    jugando = true;
    intervaloJuego = setInterval(cicloJuego, velocidadActual);
    intervaloTiempo = setInterval(cronometro, 1000);
    mostrarTexto("mensaje", "¡A comer! 🐍");
}

// ⏸️ PAUSAR: apagamos los relojes sin borrar nada del estado.
function pausarJuego() {
    if (!jugando) {
        return;
    }
    jugando = false;
    detenerIntervalos();
    mostrarTexto("mensaje", "⏸️ Pausa. Pulsa INICIAR para continuar");
}

// 💀 TERMINAR: la serpiente murió. "motivo" explica qué pasó.
function terminarJuego(motivo) {
    detenerIntervalos();
    jugando = false;
    juegoTerminado = true;
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
    for (let i = 0; i < cantidadAlimentos; i++) {
        alimentos.push(crearAlimento());
    }

    // Y aparece el primer enemigo, lejos de la serpiente.
    enemigos.push(crearEnemigo());

    mostrarTexto("puntos", puntos);
    reiniciarArana(); // 🕷️ borramos araña, veneno y partículas
    mostrarTexto("tiempo", formatearTiempo(tiempo));
    mostrarTexto("mensaje", "Presiona INICIAR para jugar");
    dibujarJuego();
}


// ==========================================================
// 🏁 ARRANQUE: dejamos el tablero listo, pero SIN empezar a moverse.
// ==========================================================
reiniciarJuego();