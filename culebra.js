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

// ----------------------------------------------------------
// 🎲 DIRECTOR DE EVENTOS: decide CUÁNDO y QUÉ aparece, para que nada llegue de golpe.
// ----------------------------------------------------------
let eventoRestanteMs = 0;   // milisegundos que faltan para el próximo evento
let ultimoEvento = "";      // "criatura", "obstaculo" o "portal" (para no repetir tanto)
let nivelAnunciado = 1;     // el último nivel que ya avisamos al jugador

// 🐛 CRIATURAS: enemigos temporales de distintos tipos. Cada tipo tiene su propio
// aspecto, velocidad, forma de moverse, tiempo de vida y castigo.
// intervaloMs: milisegundos por paso (menos = más veloz). La culebra da 1 paso cada 150 ms.
// modo: "aleatorio" (camina sin rumbo), "errante" (zigzag nervioso),
//       "mixto" (a veces se acerca) o "cazador" (te persigue).
// nivelMin: el nivel de dificultad desde el que puede aparecer.
let criaturas = [];
let ticksAparicionCriatura = 6;  // pasos que dura su aparición (inofensiva mientras aparece)
let ultimaCriatura = "";         // evita que salga el mismo tipo dos veces seguidas
let tiposCriatura = [
    { nombre: "Gusano",     emoji: "🐛", color: "#9dff00", intervaloMs: 460, vidaMs: 22000, modo: "aleatorio", animacion: "ondula",
      quitar: 2, penaliza: 2, mortal: false, nivelMin: 1, peso: 40,
      mensaje: "🐛 ¡Un gusano ácido te mordió! -2 puntos y pierdes 2 segmentos", mensajeMuerte: "" },
    { nombre: "Murciélago", emoji: "🦇", color: "#ff2bd6", intervaloMs: 100, vidaMs: 9000,  modo: "errante",   animacion: "aletea",
      quitar: 2, penaliza: 2, mortal: false, nivelMin: 2, peso: 30,
      mensaje: "🦇 ¡Un murciélago te arañó! -2 puntos y pierdes 2 segmentos", mensajeMuerte: "" },
    { nombre: "Escorpión",  emoji: "🦂", color: "#ff7a1a", intervaloMs: 250, vidaMs: 16000, modo: "mixto",     animacion: "oscila",
      quitar: 3, penaliza: 3, mortal: false, nivelMin: 2, peso: 30,
      mensaje: "🦂 ¡Un escorpión te picó! -3 puntos y pierdes 3 segmentos", mensajeMuerte: "" },
    { nombre: "Espectro",   emoji: "👻", color: "#8ad8ff", intervaloMs: 200, vidaMs: 10000, modo: "cazador",   animacion: "flota",
      quitar: 0, penaliza: 0, mortal: true, nivelMin: 3, peso: 20,
      mensaje: "", mensajeMuerte: "👻 ¡Un espectro te atrapó!" }
];

// 🧱 OBSTÁCULOS: bloques peligrosos. Primero avisan (parpadean sin hacer daño) y luego se vuelven sólidos.
let obstaculos = [];
let avisoObstaculoMs = 1500;     // tiempo de aviso antes de ser sólido
let maximoCristales = 3;         // los cristales son permanentes, así que hay un tope
let tiposObstaculo = [
    { nombre: "Barrera", color: "#ffd000", permanente: false, vidaMs: 14000, mortal: false,
      quitar: 3, penaliza: 2, nivelMin: 1, peso: 65,
      mensaje: "⚡ ¡Barrera de plasma! -2 puntos y pierdes 3 segmentos", mensajeMuerte: "" },
    { nombre: "Cristal", color: "#ff2b4d", permanente: true, vidaMs: 0, mortal: true,
      quitar: 0, penaliza: 0, nivelMin: 2, peso: 35,
      mensaje: "", mensajeMuerte: "💎 ¡Chocaste contra un cristal!" }
];

// 🌀 PORTAL: un par conectado (a <-> b). Entras por uno y sales por el otro.
let portal = null;               // null = no hay portal. Si hay: {a, b, estado, progreso, vidaMs}
let proteccionPortal = 0;        // pasos en los que los portales NO funcionan tras teletransportarse
let ticksPortal = 6;             // pasos que tarda en abrirse
let vidaPortalMs = 26000;        // duración del portal

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
    dibujarAlimentos();
    dibujarPortales();    // 🌀 debajo de la serpiente
    dibujarObstaculos();  // 🧱
    dibujarCulebra();
    dibujarEnemigos();
    dibujarCriaturas();   // 🐛🦇🦂👻
    dibujarArana();
    dibujarParticulas();
    dibujarVeneno();
    dibujarNivel();
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
    // 🧱🐛🌀 Obstáculos, criaturas y portales también ocupan celdas.
    if (hayObstaculoEn(x, y) || criaturaEn(x, y) || esCeldaPortal(x, y)) {
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

        // Solo avanza si no hay otro enemigo en esa celda.
        if (!enemigoEn(nuevoX, nuevoY) && !hayObstaculoEn(nuevoX, nuevoY)) {
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
    if (hayObstaculoEn(x, y) || criaturaEn(x, y) || esCeldaPortal(x, y)) {
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
    }

    arana = null;
    tiempoParaAranaMs = sortearEsperaArana();
}

// 🎨 COLOR DEL VENENO: va de verde tóxico (recién mordida) a rojo (se acaba el tiempo).
// El tono (hue) del color es 120 al inicio y baja hasta 0. Los últimos 5 s parpadea
// alternando con el color normal de la culebra.
function colorVeneno(esCabeza) {
    let fraccion = venenoRestanteMs / duracionVenenoMs;
    if (fraccion < 0) {
        fraccion = 0;
    }
    if (fraccion > 1) {
        fraccion = 1;
    }
    let tono = Math.floor(120 * fraccion);

    if (venenoRestanteMs <= 5000 && animacionArana % 2 === 0) {
        if (esCabeza) {
            return "#eaffff";
        }
        return "#00f0ff";
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
        perderSegmentos(penalizacionSegmentos); // siempre queda al menos la cabeza

        flashMordida = 4;
        crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 16, "#ff2b2b");
        mostrarTexto("mensaje", "☠️ ¡El veneno te debilitó! -" + penalizacionPuntos + " puntos y pierdes " + penalizacionSegmentos + " segmentos");
    }
}

// 💚 CURAR: se elimina el veneno y lanzamos la animación de recuperación.
function curarVeneno() {
    envenenado = false;
    venenoRestanteMs = 0;
    frutasPendientes = 0;
    curacionTicks = 12;
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 24, "#39ff14");
    mostrarTexto("mensaje", "💚 ¡Veneno eliminado! Estás curado");
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

    gestionarVeneno();

    // 1) No hay araña: contamos el tiempo para la próxima (solo si no estamos envenenados).
    if (arana === null) {
        if (!envenenado) {
            tiempoParaAranaMs = tiempoParaAranaMs - velocidadActual;
            if (tiempoParaAranaMs <= 0 && amenazasActivas() < maximoAmenazas()) {
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
// 🎲 DIRECTOR, 🐛 CRIATURAS, 🧱 OBSTÁCULOS Y 🌀 PORTALES
// ==========================================================

// ----------------------------------------------------------
// 📈 DIFICULTAD Y LÍMITES
// ----------------------------------------------------------

// 📈 NIVEL DE DIFICULTAD: sube con los puntos y con el tiempo (máximo 6).
// Un nivel más alto desbloquea enemigos nuevos y hace que todo aparezca más seguido.
function nivelDificultad() {
    let nivel = 1 + Math.floor(puntos / 12) + Math.floor(tiempo / 40);
    if (nivel > 6) {
        nivel = 6;
    }
    return nivel;
}

// ⚠️ AMENAZAS ACTIVAS: criaturas + araña que hay ahora mismo en el tablero.
function amenazasActivas() {
    let total = criaturas.length;
    if (arana !== null) {
        total = total + 1;
    }
    return total;
}

// ⚠️ MÁXIMO DE AMENAZAS: 1 al inicio, hasta 3 en los niveles altos.
function maximoAmenazas() {
    let maximo = 1 + Math.floor(nivelDificultad() / 2);
    if (maximo > 3) {
        maximo = 3;
    }
    return maximo;
}

// 🧱 MÁXIMO DE OBSTÁCULOS: de 2 a 5 según el nivel.
function maximoObstaculos() {
    let maximo = 2 + Math.floor(nivelDificultad() / 2);
    if (maximo > 5) {
        maximo = 5;
    }
    return maximo;
}

// 🧹 REINICIAR EVENTOS: deja criaturas, obstáculos y portal como al empezar.
// El primer evento tarda entre 8 y 12 segundos en llegar.
function reiniciarEventos() {
    criaturas = [];
    obstaculos = [];
    portal = null;
    proteccionPortal = 0;
    eventoRestanteMs = 8000 + numeroAleatorio(4000);
    ultimoEvento = "";
    ultimaCriatura = "";
    nivelAnunciado = 1;
}

// ----------------------------------------------------------
// 🔧 AYUDANTES
// ----------------------------------------------------------

// 🎰 ELEGIR POR PESO: de una lista de tipos, elige uno al azar (más peso = más probable).
function elegirPorPeso(lista) {
    if (lista.length === 0) {
        return null;
    }
    let total = 0;
    for (let i = 0; i < lista.length; i++) {
        total = total + lista[i].peso;
    }
    let sorteo = numeroAleatorio(total);
    for (let j = 0; j < lista.length; j++) {
        if (sorteo < lista[j].peso) {
            return lista[j];
        }
        sorteo = sorteo - lista[j].peso;
    }
    return lista[0];
}

// 🗺️ ¿ESTÁ DENTRO DEL TABLERO?
function enTablero(x, y) {
    return x >= 0 && x < canvas.width && y >= 0 && y < canvas.height;
}

// 🔎 ¿HAY UN OBSTÁCULO (en cualquier estado) EN ESA CELDA?
function hayObstaculoEn(x, y) {
    for (let i = 0; i < obstaculos.length; i++) {
        if (obstaculos[i].x === x && obstaculos[i].y === y) {
            return true;
        }
    }
    return false;
}

// 🔎 ¿HAY UNA CRIATURA EN ESA CELDA?
function criaturaEn(x, y) {
    for (let i = 0; i < criaturas.length; i++) {
        if (criaturas[i].x === x && criaturas[i].y === y) {
            return true;
        }
    }
    return false;
}

// 🔎 ¿ESA CELDA ES UNO DE LOS DOS EXTREMOS DEL PORTAL?
function esCeldaPortal(x, y) {
    if (portal === null) {
        return false;
    }
    return (portal.a.x === x && portal.a.y === y) || (portal.b.x === x && portal.b.y === y);
}

// 🔎 ¿ALGÚN SEGMENTO DE LA SERPIENTE (cabeza incluida) ESTÁ EN ESA CELDA?
function culebraEnCelda(x, y) {
    for (let i = 0; i < culebra.length; i++) {
        if (culebra[i].x === x && culebra[i].y === y) {
            return true;
        }
    }
    return false;
}

// 🔎 ¿LA CELDA ESTÁ EN LÍNEA RECTA DELANTE DE LA CABEZA?
// Sirve para no crear cosas justo en el camino y que nada aparezca "de la nada" frente a ti.
// Revisa la dirección actual y también la que el jugador ya pidió (proximaX/Y).
function celdaEnCaminoDeCabeza(x, y, alcance) {
    for (let i = 1; i <= alcance; i++) {
        if (x === culebra[0].x + velocidadX * i && y === culebra[0].y + velocidadY * i) {
            return true;
        }
        if (x === culebra[0].x + proximaX * i && y === culebra[0].y + proximaY * i) {
            return true;
        }
    }
    return false;
}

// 💥 APLICAR DAÑO: castigo "leve" (no mata): resta puntos y segmentos y muestra un destello.
function aplicarDano(penaliza, quitar, mensaje) {
    puntos = puntos - penaliza;
    if (puntos < 0) {
        puntos = 0;
    }
    mostrarTexto("puntos", puntos);
    perderSegmentos(quitar); // siempre queda al menos la cabeza
    flashMordida = 3;
    mostrarTexto("mensaje", mensaje);
}

// ----------------------------------------------------------
// 🎲 DIRECTOR DE EVENTOS
// ----------------------------------------------------------

// 🎲 ELEGIR EVENTO: sortea qué ocurrirá. Solo entran en el sorteo los eventos permitidos:
//  - Sin exceso de amenazas ni de obstáculos.
//  - Un solo portal a la vez.
//  - Nada dañino mientras la serpiente está envenenada (para no ahogar al jugador).
// El último evento que salió pierde 2/3 de su probabilidad, para que no se repita tanto.
function elegirEvento() {
    let pCriatura = 0;
    let pObstaculo = 0;
    let pPortal = 0;

    if (!envenenado && amenazasActivas() < maximoAmenazas()) {
        pCriatura = 50;
    }
    if (!envenenado && obstaculos.length < maximoObstaculos()) {
        pObstaculo = 30;
    }
    if (portal === null) {
        pPortal = 20;
    }

    if (ultimoEvento === "criatura") {
        pCriatura = Math.floor(pCriatura / 3);
    } else if (ultimoEvento === "obstaculo") {
        pObstaculo = Math.floor(pObstaculo / 3);
    } else if (ultimoEvento === "portal") {
        pPortal = Math.floor(pPortal / 3);
    }

    let total = pCriatura + pObstaculo + pPortal;
    if (total === 0) {
        return "";
    }

    let sorteo = numeroAleatorio(total);
    if (sorteo < pCriatura) {
        return "criatura";
    }
    sorteo = sorteo - pCriatura;
    if (sorteo < pObstaculo) {
        return "obstaculo";
    }
    return "portal";
}

// ⏲️ SORTEAR ESPERA ENTRE EVENTOS: de 9 a 15 s al inicio. Cada nivel resta 1,2 s
// (mínimo 4,5 s). Siempre cambia: nunca sabes cuándo llegará lo próximo.
function sortearEsperaEvento() {
    let espera = 9000 + numeroAleatorio(6000) - (nivelDificultad() - 1) * 1200;
    if (espera < 4500) {
        espera = 4500;
    }
    return espera;
}

// 🎬 GESTIONAR DIRECTOR: cuenta el tiempo y, al llegar a cero, lanza UN evento.
// Solo hay un evento a la vez por cada cuenta regresiva: nunca aparecen todos juntos.
function gestionarDirector() {
    // 🔥 Avisamos cuando sube el nivel.
    let nivel = nivelDificultad();
    if (nivel > nivelAnunciado) {
        nivelAnunciado = nivel;
        mostrarTexto("mensaje", "🔥 ¡Nivel " + nivel + "! El peligro aumenta");
    }

    eventoRestanteMs = eventoRestanteMs - velocidadActual;
    if (eventoRestanteMs > 0) {
        return;
    }

    let evento = elegirEvento();
    let exito = false;

    if (evento === "criatura") {
        exito = crearCriatura();
    } else if (evento === "obstaculo") {
        exito = crearObstaculo();
    } else if (evento === "portal") {
        exito = crearPortal();
    }

    if (exito) {
        ultimoEvento = evento;
        eventoRestanteMs = sortearEsperaEvento();
    } else {
        eventoRestanteMs = 2500; // no se pudo: reintentamos en 2,5 s
    }
}

// 🔁 GESTIONAR EVENTOS: se llama UNA vez por paso desde cicloJuego.
// Devuelve un texto si la serpiente murió, o null si sigue viva.
function gestionarEventos() {
    if (proteccionPortal > 0) {
        proteccionPortal = proteccionPortal - 1;
    }

    let muerte = gestionarObstaculos();
    if (muerte !== null) {
        return muerte;
    }

    gestionarPortal();

    muerte = gestionarCriaturas();
    if (muerte !== null) {
        return muerte;
    }

    gestionarDirector();
    return null;
}

// ----------------------------------------------------------
// 🐛 CRIATURAS
// ----------------------------------------------------------

// 🎰 ELEGIR TIPO DE CRIATURA: entre las desbloqueadas por el nivel, sin repetir la última.
function elegirTipoCriatura() {
    let candidatos = [];
    for (let i = 0; i < tiposCriatura.length; i++) {
        if (tiposCriatura[i].nivelMin <= nivelDificultad()) {
            candidatos.push(tiposCriatura[i]);
        }
    }
    // Si hay más de un candidato, quitamos el último tipo que salió.
    if (candidatos.length > 1) {
        let filtrados = [];
        for (let j = 0; j < candidatos.length; j++) {
            if (candidatos[j].nombre !== ultimaCriatura) {
                filtrados.push(candidatos[j]);
            }
        }
        candidatos = filtrados;
    }
    return elegirPorPeso(candidatos);
}

// 🌑 CREAR CRIATURA: elige tipo y una celda libre, lejos de la cabeza y fuera de su camino.
// Devuelve true si logró crearla.
function crearCriatura() {
    let tipo = elegirTipoCriatura();
    if (tipo === null) {
        return false;
    }

    // Los cazadores aparecen todavía más lejos, para darte tiempo de reaccionar.
    let distanciaMinima = 6;
    if (tipo.modo === "cazador") {
        distanciaMinima = 9;
    }

    let intentos = 0;
    while (intentos < 60) {
        let x = numeroAleatorio(columnas) * tamanoCelda;
        let y = numeroAleatorio(filas) * tamanoCelda;

        if (!posicionOcupada(x, y) && distanciaACabeza(x, y) >= distanciaMinima && !celdaEnCaminoDeCabeza(x, y, 6)) {
            criaturas.push({
                tipo: tipo,
                x: x,
                y: y,
                estado: "apareciendo", // mientras aparece es inofensiva
                progreso: 0,
                dirX: 0,
                dirY: 0,
                relojMs: 0,
                vidaMs: tipo.vidaMs
            });
            ultimaCriatura = tipo.nombre;
            crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 12, "#4b1d6b");
            crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 6, tipo.color);
            mostrarTexto("mensaje", tipo.emoji + " ¡Un " + tipo.nombre.toLowerCase() + " entra al tablero!");
            return true;
        }
        intentos = intentos + 1;
    }
    return false;
}

// ⏱️ INTERVALO DE LA CRIATURA: su ritmo base, un 4% más rápido por cada nivel.
function intervaloCriatura(criatura) {
    let factor = 1 - (nivelDificultad() - 1) * 0.04;
    return Math.floor(criatura.tipo.intervaloMs * factor);
}

// 🔎 ¿CELDA LIBRE PARA UNA CRIATURA?: no sale del tablero ni pisa el cuerpo, frutas,
// enemigos, obstáculos, portales, la araña ni otras criaturas. La cabeza SÍ es válida.
function celdaLibreParaCriatura(x, y) {
    if (!enTablero(x, y)) {
        return false;
    }
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
    if (enemigoEn(x, y) || hayObstaculoEn(x, y) || criaturaEn(x, y) || esCeldaPortal(x, y)) {
        return false;
    }
    if (arana !== null && arana.x === x && arana.y === y) {
        return false;
    }
    return true;
}

// 🚶 MOVER CRIATURA: cada "modo" decide qué tan seguido se acerca a la cabeza:
//   aleatorio 0% | errante 10% | mixto 45% | cazador 85%.
// El resto del tiempo sigue recto (50%) o elige una dirección al azar.
function moverCriatura(criatura) {
    let opciones = [
        { x: tamanoCelda, y: 0 },
        { x: -tamanoCelda, y: 0 },
        { x: 0, y: tamanoCelda },
        { x: 0, y: -tamanoCelda }
    ];

    let modo = criatura.tipo.modo;
    let probabilidadAcercarse = 0;
    if (modo === "errante") {
        probabilidadAcercarse = 10;
    } else if (modo === "mixto") {
        probabilidadAcercarse = 45;
    } else if (modo === "cazador") {
        probabilidadAcercarse = 85;
    }

    let elegida;
    if (numeroAleatorio(100) < probabilidadAcercarse) {
        // Acercarse: avanza por el eje donde está más lejos de la cabeza.
        let difX = culebra[0].x - criatura.x;
        let difY = culebra[0].y - criatura.y;
        if (Math.abs(difX) > Math.abs(difY)) {
            elegida = { x: difX > 0 ? tamanoCelda : -tamanoCelda, y: 0 };
        } else {
            elegida = { x: 0, y: difY > 0 ? tamanoCelda : -tamanoCelda };
        }
    } else if (modo !== "errante" && numeroAleatorio(100) < 50 && (criatura.dirX !== 0 || criatura.dirY !== 0)) {
        elegida = { x: criatura.dirX, y: criatura.dirY }; // seguir recto
    } else {
        elegida = opciones[numeroAleatorio(4)];           // dirección al azar
    }

    // Si está bloqueada, probamos las 4 direcciones desde una al azar.
    let nuevoX = criatura.x + elegida.x;
    let nuevoY = criatura.y + elegida.y;
    let inicio = numeroAleatorio(4);
    let intentos = 0;
    while (!celdaLibreParaCriatura(nuevoX, nuevoY) && intentos < 4) {
        elegida = opciones[(inicio + intentos) % 4];
        nuevoX = criatura.x + elegida.x;
        nuevoY = criatura.y + elegida.y;
        intentos = intentos + 1;
    }

    if (celdaLibreParaCriatura(nuevoX, nuevoY)) {
        criatura.x = nuevoX;
        criatura.y = nuevoY;
        criatura.dirX = elegida.x;
        criatura.dirY = elegida.y;
    }
}

// 🔎 ¿LA CRIATURA TOCA LA CABEZA? (solo cuenta si ya terminó de aparecer)
function criaturaTocaCabeza(criatura) {
    return criatura.estado === "activa" && criatura.x === culebra[0].x && criatura.y === culebra[0].y;
}

// 🦷 GOLPE DE CRIATURA: la criatura desaparece tras golpear (así no te daña varias veces).
// Devuelve un texto si el golpe fue mortal, o null si solo te hirió.
function golpearCriatura(indice) {
    let criatura = criaturas[indice];
    let tipo = criatura.tipo;

    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 14, tipo.color);
    criaturas.splice(indice, 1);

    if (tipo.mortal) {
        return tipo.mensajeMuerte;
    }
    aplicarDano(tipo.penaliza, tipo.quitar, tipo.mensaje);
    return null;
}

// 🔁 GESTIONAR CRIATURAS: aparición, tiempo de vida, movimiento y contacto.
// Recorremos al revés para poder borrar con splice sin saltarnos ninguna.
function gestionarCriaturas() {
    for (let i = criaturas.length - 1; i >= 0; i--) {
        let criatura = criaturas[i];

        // 1) La serpiente caminó directamente hacia la criatura.
        if (criaturaTocaCabeza(criatura)) {
            let muerte = golpearCriatura(i);
            if (muerte !== null) {
                return muerte;
            }
            continue;
        }

        // 2) Aparición: no se mueve ni hace daño todavía.
        if (criatura.estado === "apareciendo") {
            criatura.progreso = criatura.progreso + 1;
            if (criatura.progreso >= ticksAparicionCriatura) {
                criatura.estado = "activa";
            }
            continue;
        }

        // 3) Tiempo de permanencia: cuando se acaba, se esfuma entre humo.
        criatura.vidaMs = criatura.vidaMs - velocidadActual;
        if (criatura.vidaMs <= 0) {
            crearParticulas(criatura.x + tamanoCelda / 2, criatura.y + tamanoCelda / 2, 10, "#4b1d6b");
            criaturas.splice(i, 1);
            continue;
        }

        // 4) Movimiento: acumulamos milisegundos y damos pasos cuando toca.
        // Las muy veloces pueden dar hasta 2 pasos por ciclo; revisamos contacto en cada uno.
        criatura.relojMs = criatura.relojMs + velocidadActual;
        let intervalo = intervaloCriatura(criatura);
        let pasos = 0;
        while (criatura.relojMs >= intervalo && pasos < 2) {
            criatura.relojMs = criatura.relojMs - intervalo;
            moverCriatura(criatura);
            pasos = pasos + 1;

            if (criaturaTocaCabeza(criatura)) {
                let muerte2 = golpearCriatura(i);
                if (muerte2 !== null) {
                    return muerte2;
                }
                break;
            }
        }
    }
    return null;
}

// 🖼️ DIBUJAR CRIATURAS: emoji con aura de neón del color de su tipo y una animación propia:
//  ondula (gusano), aletea (murciélago), oscila (escorpión), flota (espectro).
// Cuando les queda poco tiempo parpadean: avisan que se van a ir.
function dibujarCriaturas() {
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";

    for (let i = 0; i < criaturas.length; i++) {
        let c = criaturas[i];
        let tipo = c.tipo;
        let centroX = c.x + tamanoCelda / 2;
        let centroY = c.y + tamanoCelda / 2;
        let transparencia = 1;

        if (c.estado === "apareciendo") {
            // Mancha oscura que se encoge mientras la criatura se hace visible.
            let avance = c.progreso / ticksAparicionCriatura;
            transparencia = avance;
            contexto.globalAlpha = 0.6 * (1 - avance);
            contexto.fillStyle = "#000000";
            contexto.beginPath();
            contexto.arc(centroX, centroY, 26 * (1 - avance) + 10, 0, Math.PI * 2);
            contexto.fill();
        } else if (c.vidaMs < 2500 && animacionArana % 2 === 0) {
            transparencia = 0.35; // parpadea: está por irse
        }

        // Animaciones propias de cada tipo.
        let desplazaX = 0;
        let desplazaY = 0;
        let tamanoLetra = 22;
        if (tipo.animacion === "ondula") {
            desplazaX = Math.sin(animacionArana * 1.3) * 2;
        } else if (tipo.animacion === "aletea") {
            tamanoLetra = 19 + (animacionArana % 2) * 5;
            desplazaY = numeroAleatorio(3) - 1;
        } else if (tipo.animacion === "oscila") {
            desplazaY = Math.sin(animacionArana) * 1.5;
        } else if (tipo.animacion === "flota") {
            desplazaY = Math.sin(animacionArana * 0.7) * 2;
            transparencia = transparencia * (0.65 + 0.3 * Math.sin(animacionArana * 0.9));
        }

        // Aura de color.
        contexto.globalAlpha = transparencia * 0.22;
        contexto.fillStyle = tipo.color;
        contexto.beginPath();
        contexto.arc(centroX, centroY, 13, 0, Math.PI * 2);
        contexto.fill();

        // El emoji, con resplandor.
        contexto.globalAlpha = transparencia;
        contexto.shadowColor = tipo.color;
        contexto.shadowBlur = 12;
        contexto.font = tamanoLetra + "px serif";
        contexto.fillStyle = "#ffffff";
        contexto.fillText(tipo.emoji, centroX + desplazaX, centroY + desplazaY + 1);
        contexto.shadowBlur = 0;
    }
    contexto.globalAlpha = 1;
}

// ----------------------------------------------------------
// 🧱 OBSTÁCULOS
// ----------------------------------------------------------

// 🔢 CONTAR CRISTALES: cuántos obstáculos permanentes hay.
function contarCristales() {
    let total = 0;
    for (let i = 0; i < obstaculos.length; i++) {
        if (obstaculos[i].tipo.permanente) {
            total = total + 1;
        }
    }
    return total;
}

// 🧭 ¿EL OBSTÁCULO PARTIRÍA EL TABLERO?: esta es la garantía de que NUNCA se bloquea el camino.
// Imaginamos el obstáculo ya puesto y "inundamos" el tablero desde la cabeza, de celda en celda.
// Si alguna celda libre queda sin alcanzar, el obstáculo encerraría una zona: lo rechazamos.
function obstaculoParticionaTablero(nuevoX, nuevoY) {
    // 1) Mapa de celdas bloqueadas (arreglo de arreglos: filas x columnas).
    let bloqueada = [];
    for (let f = 0; f < filas; f++) {
        let fila = [];
        for (let c = 0; c < columnas; c++) {
            fila.push(false);
        }
        bloqueada.push(fila);
    }
    for (let i = 0; i < obstaculos.length; i++) {
        bloqueada[Math.floor(obstaculos[i].y / tamanoCelda)][Math.floor(obstaculos[i].x / tamanoCelda)] = true;
    }
    bloqueada[Math.floor(nuevoY / tamanoCelda)][Math.floor(nuevoX / tamanoCelda)] = true;

    // 2) Contamos cuántas celdas libres hay en total.
    let libres = 0;
    for (let f2 = 0; f2 < filas; f2++) {
        for (let c2 = 0; c2 < columnas; c2++) {
            if (!bloqueada[f2][c2]) {
                libres = libres + 1;
            }
        }
    }

    // 3) Inundación desde la cabeza usando una pila (arreglo) de celdas por visitar.
    let visitada = [];
    for (let f3 = 0; f3 < filas; f3++) {
        let fila2 = [];
        for (let c3 = 0; c3 < columnas; c3++) {
            fila2.push(false);
        }
        visitada.push(fila2);
    }
    let filaCabeza = Math.floor(culebra[0].y / tamanoCelda);
    let colCabeza = Math.floor(culebra[0].x / tamanoCelda);
    let pila = [{ f: filaCabeza, c: colCabeza }];
    visitada[filaCabeza][colCabeza] = true;
    let alcanzadas = 0;
    let vecinos = [{ f: 1, c: 0 }, { f: -1, c: 0 }, { f: 0, c: 1 }, { f: 0, c: -1 }];

    while (pila.length > 0) {
        let actual = pila.pop();
        alcanzadas = alcanzadas + 1;
        for (let v = 0; v < 4; v++) {
            let nf = actual.f + vecinos[v].f;
            let nc = actual.c + vecinos[v].c;
            if (nf >= 0 && nf < filas && nc >= 0 && nc < columnas && !bloqueada[nf][nc] && !visitada[nf][nc]) {
                visitada[nf][nc] = true;
                pila.push({ f: nf, c: nc });
            }
        }
    }

    // Si alcanzamos menos celdas que las libres, el tablero quedaría partido.
    return alcanzadas < libres;
}

// 🧱 CREAR OBSTÁCULO: elige un tipo permitido y una celda segura. Nace en "aviso".
// Devuelve true si logró crearlo.
function crearObstaculo() {
    // Tipos desbloqueados por el nivel (los cristales tienen tope).
    let candidatos = [];
    for (let i = 0; i < tiposObstaculo.length; i++) {
        let tipoCandidato = tiposObstaculo[i];
        if (tipoCandidato.nivelMin <= nivelDificultad()) {
            if (!tipoCandidato.permanente || contarCristales() < maximoCristales) {
                candidatos.push(tipoCandidato);
            }
        }
    }
    let tipo = elegirPorPeso(candidatos);
    if (tipo === null) {
        return false;
    }

    let intentos = 0;
    while (intentos < 40) {
        let x = numeroAleatorio(columnas) * tamanoCelda;
        let y = numeroAleatorio(filas) * tamanoCelda;

        // Celda libre, lejos de la cabeza, fuera de su camino y sin partir el tablero.
        if (!posicionOcupada(x, y) && distanciaACabeza(x, y) >= 5 && !celdaEnCaminoDeCabeza(x, y, 6) && !obstaculoParticionaTablero(x, y)) {
            obstaculos.push({ x: x, y: y, tipo: tipo, estado: "aviso", avisoMs: avisoObstaculoMs, vidaMs: tipo.vidaMs });
            mostrarTexto("mensaje", "⚠️ ¡Algo se está formando en el tablero!");
            return true;
        }
        intentos = intentos + 1;
    }
    return false;
}

// 🔁 GESTIONAR OBSTÁCULOS: aviso -> sólido -> (si es temporal) desaparece.
// Devuelve un texto si la serpiente murió contra uno, o null.
function gestionarObstaculos() {
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        let obstaculo = obstaculos[i];
        let centroX = obstaculo.x + tamanoCelda / 2;
        let centroY = obstaculo.y + tamanoCelda / 2;

        if (obstaculo.estado === "aviso") {
            obstaculo.avisoMs = obstaculo.avisoMs - velocidadActual;
            // Se vuelve sólido solo si la serpiente NO está encima (así no te atrapa de sorpresa).
            if (obstaculo.avisoMs <= 0 && !culebraEnCelda(obstaculo.x, obstaculo.y)) {
                obstaculo.estado = "solido";
                crearParticulas(centroX, centroY, 8, obstaculo.tipo.color);
            }
        } else {
            // Los temporales desaparecen cuando se acaba su tiempo.
            if (!obstaculo.tipo.permanente) {
                obstaculo.vidaMs = obstaculo.vidaMs - velocidadActual;
                if (obstaculo.vidaMs <= 0) {
                    crearParticulas(centroX, centroY, 8, obstaculo.tipo.color);
                    obstaculos.splice(i, 1);
                    continue;
                }
            }
            // ¿La cabeza chocó contra el obstáculo sólido?
            if (culebra[0].x === obstaculo.x && culebra[0].y === obstaculo.y) {
                crearParticulas(centroX, centroY, 14, obstaculo.tipo.color);
                if (obstaculo.tipo.mortal) {
                    return obstaculo.tipo.mensajeMuerte; // como una pared: Game Over
                }
                aplicarDano(obstaculo.tipo.penaliza, obstaculo.tipo.quitar, obstaculo.tipo.mensaje);
                obstaculos.splice(i, 1); // la barrera se rompe: no te daña varias veces
            }
        }
    }
    return null;
}

// 🖼️ DIBUJAR OBSTÁCULOS: son bloques cuadrados, nada de emojis, para distinguirlos de
// enemigos y frutas. Barrera = rayas amarillas de peligro. Cristal = rombo rojo.
function dibujarObstaculos() {
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";

    for (let i = 0; i < obstaculos.length; i++) {
        let o = obstaculos[i];
        let color = o.tipo.color;
        let x = o.x;
        let y = o.y;

        if (o.estado === "aviso") {
            // Aviso: contorno discontinuo parpadeante con un "!" (todavía no hace daño).
            contexto.globalAlpha = (animacionArana % 2 === 0) ? 0.9 : 0.35;
            contexto.strokeStyle = color;
            contexto.lineWidth = 2;
            contexto.setLineDash([4, 3]);
            contexto.strokeRect(x + 2, y + 2, tamanoCelda - 4, tamanoCelda - 4);
            contexto.setLineDash([]);
            contexto.fillStyle = color;
            contexto.font = "bold 14px sans-serif";
            contexto.fillText("!", x + tamanoCelda / 2, y + tamanoCelda / 2 + 1);
            contexto.globalAlpha = 1;
        } else {
            // Los temporales parpadean en sus últimos 3 segundos.
            if (!o.tipo.permanente && o.vidaMs < 3000 && animacionArana % 2 === 0) {
                continue;
            }

            contexto.shadowColor = color;
            contexto.shadowBlur = 10;
            contexto.fillStyle = "#1a0508";
            contexto.fillRect(x + 1, y + 1, tamanoCelda - 2, tamanoCelda - 2);

            if (o.tipo.permanente) {
                // Cristal: rombo exterior y rombo interior.
                contexto.strokeStyle = color;
                contexto.lineWidth = 2;
                contexto.beginPath();
                contexto.moveTo(x + tamanoCelda / 2, y + 2);
                contexto.lineTo(x + tamanoCelda - 2, y + tamanoCelda / 2);
                contexto.lineTo(x + tamanoCelda / 2, y + tamanoCelda - 2);
                contexto.lineTo(x + 2, y + tamanoCelda / 2);
                contexto.closePath();
                contexto.stroke();
                contexto.fillStyle = color;
                contexto.beginPath();
                contexto.moveTo(x + tamanoCelda / 2, y + 8);
                contexto.lineTo(x + tamanoCelda - 8, y + tamanoCelda / 2);
                contexto.lineTo(x + tamanoCelda / 2, y + tamanoCelda - 8);
                contexto.lineTo(x + 8, y + tamanoCelda / 2);
                contexto.closePath();
                contexto.fill();
            } else {
                // Barrera: rayas diagonales. clip() recorta el dibujo al interior del cuadro.
                contexto.save();
                contexto.beginPath();
                contexto.rect(x + 1, y + 1, tamanoCelda - 2, tamanoCelda - 2);
                contexto.clip();
                contexto.strokeStyle = color;
                contexto.lineWidth = 3;
                for (let k = -tamanoCelda; k < tamanoCelda * 2; k = k + 9) {
                    contexto.beginPath();
                    contexto.moveTo(x + k, y + tamanoCelda);
                    contexto.lineTo(x + k + tamanoCelda, y);
                    contexto.stroke();
                }
                contexto.restore();
                contexto.strokeStyle = color;
                contexto.lineWidth = 2;
                contexto.strokeRect(x + 1.5, y + 1.5, tamanoCelda - 3, tamanoCelda - 3);
            }
            contexto.shadowBlur = 0;
        }
    }
}

// ----------------------------------------------------------
// 🌀 PORTALES
// ----------------------------------------------------------

// 🔎 BUSCAR CELDA PARA PORTAL: celda libre, a 2 celdas o más de los bordes (así siempre hay
// espacio para salir), fuera del camino de la cabeza y lejos del otro extremo.
function buscarCeldaPortal(otra) {
    let intentos = 0;
    while (intentos < 80) {
        let x = (2 + numeroAleatorio(columnas - 4)) * tamanoCelda;
        let y = (2 + numeroAleatorio(filas - 4)) * tamanoCelda;

        let lejosDeLaOtra = true;
        if (otra !== null && Math.abs(x - otra.x) + Math.abs(y - otra.y) < 6 * tamanoCelda) {
            lejosDeLaOtra = false;
        }

        if (!posicionOcupada(x, y) && distanciaACabeza(x, y) >= 4 && lejosDeLaOtra && !celdaEnCaminoDeCabeza(x, y, 3)) {
            return { x: x, y: y };
        }
        intentos = intentos + 1;
    }
    return null;
}

// 🌀 CREAR PORTAL: dos extremos conectados (a y b). Solo puede haber un portal a la vez.
function crearPortal() {
    let a = buscarCeldaPortal(null);
    if (a === null) {
        return false;
    }
    let b = buscarCeldaPortal(a);
    if (b === null) {
        return false;
    }

    portal = { a: a, b: b, estado: "abriendo", progreso: 0, vidaMs: vidaPortalMs };
    crearParticulas(a.x + tamanoCelda / 2, a.y + tamanoCelda / 2, 10, "#4d8bff");
    crearParticulas(b.x + tamanoCelda / 2, b.y + tamanoCelda / 2, 10, "#4d8bff");
    mostrarTexto("mensaje", "🌀 ¡Se abrió un portal doble!");
    return true;
}

// 🛡️ DESTINO SEGURO: ¿puede aparecer la cabeza aquí mirando hacia (dx, dy)?
// Debe estar dentro del tablero y libre de cuerpo, obstáculos, criaturas, enemigos, araña
// y comida; la celda de enfrente también debe estar libre y ninguna amenaza a menos de 3 celdas.
function destinoSeguro(x, y, dx, dy) {
    let delanteX = x + dx;
    let delanteY = y + dy;

    if (!enTablero(x, y) || !enTablero(delanteX, delanteY)) {
        return false;
    }
    if (culebraEnCelda(x, y) || culebraEnCelda(delanteX, delanteY)) {
        return false;
    }
    if (hayObstaculoEn(x, y) || hayObstaculoEn(delanteX, delanteY)) {
        return false;
    }
    if (criaturaEn(x, y) || criaturaEn(delanteX, delanteY) || enemigoEn(x, y) || enemigoEn(delanteX, delanteY)) {
        return false;
    }
    if (arana !== null && ((arana.x === x && arana.y === y) || (arana.x === delanteX && arana.y === delanteY))) {
        return false;
    }
    for (let i = 0; i < alimentos.length; i++) {
        if (alimentos[i].x === x && alimentos[i].y === y) {
            return false;
        }
    }

    // Distancia mínima (3 celdas) a cualquier amenaza.
    let margen = 3 * tamanoCelda;
    for (let j = 0; j < enemigos.length; j++) {
        if (Math.abs(enemigos[j].x - x) + Math.abs(enemigos[j].y - y) < margen) {
            return false;
        }
    }
    for (let k = 0; k < criaturas.length; k++) {
        if (Math.abs(criaturas[k].x - x) + Math.abs(criaturas[k].y - y) < margen) {
            return false;
        }
    }
    if (arana !== null && Math.abs(arana.x - x) + Math.abs(arana.y - y) < margen) {
        return false;
    }
    return true;
}

// 🎲 BUSCAR DESTINO SEGURO: plan B si el otro extremo del portal no es seguro.
// Prueba celdas al azar (que no sean portal) y devuelve la primera segura, o null.
function buscarDestinoSeguro(dx, dy) {
    let intentos = 0;
    while (intentos < 80) {
        let x = numeroAleatorio(columnas) * tamanoCelda;
        let y = numeroAleatorio(filas) * tamanoCelda;
        if (!esCeldaPortal(x, y) && destinoSeguro(x, y, dx, dy)) {
            return { x: x, y: y };
        }
        intentos = intentos + 1;
    }
    return null;
}

// 🚪 COMPROBAR PORTAL: si la cabeza pisa un extremo, la mandamos al otro.
// 🛡️ PROTECCIÓN: tras teletransportarse, durante 6 pasos los portales no funcionan.
// Así la cabeza, que aparece justo encima del portal de salida, no rebota de un lado a otro.
function comprobarPortal() {
    if (portal === null || portal.estado !== "activo" || proteccionPortal > 0) {
        return;
    }

    let origen = null;
    let destino = null;
    if (culebra[0].x === portal.a.x && culebra[0].y === portal.a.y) {
        origen = portal.a;
        destino = portal.b;
    } else if (culebra[0].x === portal.b.x && culebra[0].y === portal.b.y) {
        origen = portal.b;
        destino = portal.a;
    } else {
        return; // la cabeza no está sobre ningún portal
    }

    // Primero intentamos salir por el portal conectado; si no es seguro, buscamos otra celda.
    let nuevo = null;
    if (destinoSeguro(destino.x, destino.y, velocidadX, velocidadY)) {
        nuevo = { x: destino.x, y: destino.y };
    } else {
        nuevo = buscarDestinoSeguro(velocidadX, velocidadY);
    }

    if (nuevo === null) {
        // Ningún destino seguro: el portal se "atasca" un momento y no te manda a un peligro.
        proteccionPortal = 4;
        mostrarTexto("mensaje", "🌀 El portal está inestable...");
        return;
    }

    crearParticulas(origen.x + tamanoCelda / 2, origen.y + tamanoCelda / 2, 14, "#4d8bff");
    crearParticulas(nuevo.x + tamanoCelda / 2, nuevo.y + tamanoCelda / 2, 14, "#d46bff");
    culebra[0].x = nuevo.x;
    culebra[0].y = nuevo.y;
    proteccionPortal = 6;
    mostrarTexto("mensaje", "🌀 ¡Teletransportado!");
}

// 🔁 GESTIONAR PORTAL: apertura, duración, chispas y teletransporte.
function gestionarPortal() {
    if (portal === null) {
        return;
    }

    if (portal.estado === "abriendo") {
        portal.progreso = portal.progreso + 1;
        if (portal.progreso >= ticksPortal) {
            portal.estado = "activo";
        }
        return;
    }

    portal.vidaMs = portal.vidaMs - velocidadActual;
    if (portal.vidaMs <= 0) {
        crearParticulas(portal.a.x + tamanoCelda / 2, portal.a.y + tamanoCelda / 2, 10, "#4d8bff");
        crearParticulas(portal.b.x + tamanoCelda / 2, portal.b.y + tamanoCelda / 2, 10, "#4d8bff");
        portal = null;
        return;
    }

    // Chispas cada 3 pasos para que se note que está vivo.
    if (animacionArana % 3 === 0) {
        crearParticulas(portal.a.x + tamanoCelda / 2, portal.a.y + tamanoCelda / 2, 2, "#d46bff");
        crearParticulas(portal.b.x + tamanoCelda / 2, portal.b.y + tamanoCelda / 2, 2, "#d46bff");
    }

    comprobarPortal();
}

// 🖼️ DIBUJAR PORTALES: anillos de neón que giran en sentidos opuestos, un resplandor
// que pulsa y una línea tenue que une los dos extremos para mostrar que están conectados.
function dibujarPortales() {
    if (portal === null) {
        return;
    }

    let avance = 1;
    if (portal.estado === "abriendo") {
        avance = portal.progreso / ticksPortal;
    }
    // En los últimos 3 s parpadea: está por cerrarse.
    if (portal.estado === "activo" && portal.vidaMs < 3000 && animacionArana % 2 === 0) {
        return;
    }

    let extremos = [portal.a, portal.b];

    // Línea tenue entre los dos extremos.
    if (portal.estado === "activo") {
        contexto.globalAlpha = 0.18;
        contexto.strokeStyle = "#4d8bff";
        contexto.lineWidth = 1;
        contexto.setLineDash([3, 6]);
        contexto.beginPath();
        contexto.moveTo(extremos[0].x + tamanoCelda / 2, extremos[0].y + tamanoCelda / 2);
        contexto.lineTo(extremos[1].x + tamanoCelda / 2, extremos[1].y + tamanoCelda / 2);
        contexto.stroke();
        contexto.setLineDash([]);
        contexto.globalAlpha = 1;
    }

    for (let i = 0; i < 2; i++) {
        let centroX = extremos[i].x + tamanoCelda / 2;
        let centroY = extremos[i].y + tamanoCelda / 2;
        let radio = 11 * avance;
        let giro = animacionArana * 0.7 * (i === 0 ? 1 : -1); // cada extremo gira al revés

        // Resplandor central que late.
        contexto.shadowColor = "#4d8bff";
        contexto.shadowBlur = 16;
        contexto.globalAlpha = 0.25 + 0.15 * Math.sin(animacionArana);
        contexto.fillStyle = "#4d8bff";
        contexto.beginPath();
        contexto.arc(centroX, centroY, radio, 0, Math.PI * 2);
        contexto.fill();
        contexto.globalAlpha = 1;

        // Tres anillos incompletos que giran.
        contexto.lineWidth = 2;
        contexto.lineCap = "round";
        for (let k = 0; k < 3; k++) {
            contexto.strokeStyle = (k === 1) ? "#d46bff" : "#4d8bff";
            let inicio = giro * (k % 2 === 0 ? 1 : -1) + k * 2;
            contexto.beginPath();
            contexto.arc(centroX, centroY, radio * (1 - k * 0.28), inicio, inicio + 3.6);
            contexto.stroke();
        }

        // Punto brillante al centro.
        contexto.fillStyle = "#ffffff";
        contexto.beginPath();
        contexto.arc(centroX, centroY, 2 * avance, 0, Math.PI * 2);
        contexto.fill();
        contexto.shadowBlur = 0;
    }
}

// 🖼️ DIBUJAR NIVEL: pequeño marcador del nivel de peligro en la esquina inferior izquierda.
function dibujarNivel() {
    contexto.font = "bold 12px sans-serif";
    contexto.textAlign = "left";
    contexto.textBaseline = "bottom";
    contexto.fillStyle = "rgba(0, 240, 255, 0.55)";
    contexto.fillText("NIVEL " + nivelDificultad(), 8, canvas.height - 6);
    contexto.textAlign = "center";
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
    // Aplicamos el giro que el jugador pidió.
    velocidadX = proximaX;
    velocidadY = proximaY;

    actualizarPosicion();

    if (hayChoque()) {
        dibujarJuego();
        terminarJuego("☠️ Chocaste.");
        return; // salimos: no hay nada más que hacer en este paso
    }

    // 👾 Si caminamos directo hacia un enemigo, nos come.
    if (enemigoEnCabeza()) {
        dibujarJuego();
        terminarJuego("👾 ¡Un enemigo te comió!");
        return;
    }

    comprobarComida();
    actualizarEnemigos();

    // 👾 Los enemigos avanzan. Si alguno alcanza la cabeza, Game Over.
    if (moverEnemigos()) {
        dibujarJuego();
        terminarJuego("👾 ¡Un enemigo te comió!");
        return;
    }

    // 🎲 Eventos aleatorios: criaturas, obstáculos y portales.
    // Devuelve un texto si algo mató a la serpiente, o null si sigue viva.
    let causaMuerte = gestionarEventos();
    if (causaMuerte !== null) {
        dibujarJuego();
        terminarJuego(causaMuerte);
        return;
    }

    gestionarArana(); // 🕷️ aparición, movimiento, mordida y veneno
    gestionarTurbo();
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

    // Mensaje sobre el canvas.
    contexto.fillStyle = "rgba(2, 6, 13, 0.7)";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.fillStyle = "#ff7a1a";
    contexto.font = "bold 36px sans-serif";
    contexto.textAlign = "center";
    contexto.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    mostrarTexto("mensaje", motivo + " Game Over: " + puntos + " puntos en " + formatearTiempo(tiempo));
}

// 🔄 REINICIAR: devolvemos TODO al estado inicial (la partida queda detenida).
function reiniciarJuego() {
    detenerIntervalos();
    jugando = false;
    juegoTerminado = false;

    puntos = 0;
    tiempo = 0;
    turboRestante = 0;
    velocidadActual = velocidadBase;
    segmentosPorCrecer = 0;

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

    // 🎲 Borramos criaturas, obstáculos y portal ANTES de crear frutas y enemigos.
    reiniciarEventos();

    // Vaciamos los enemigos ANTES de crear frutas, para que los viejos no bloqueen celdas.
    enemigos = [];
    pasosJuego = 0;

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