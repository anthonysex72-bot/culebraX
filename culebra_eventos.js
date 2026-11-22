// ==========================================================
// 🌑 CULEBRA X — eventos del tablero (archivo 2 de 2)
// Aquí viven: ayudantes de celdas, niveles, enemigos variados, obstáculos, portales,
// la sala secreta del creador, caracoles con baba y todos los dibujos de esos elementos.
// Solo contiene FUNCIONES: las variables compartidas están declaradas en culebra.js.
// Orden de carga en index.html: utilitarios.js -> culebra_eventos.js -> culebra.js
// ==========================================================


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
        cambiarPaleta(false); // 🎨 cada nivel trae un mundo nuevo
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
    actualizarVelocidad();
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

// 😋 DEVORAR ENEMIGO VARIADO (solo con el modo depredador): ¡puntos y crecimiento!
function devorarPeligro(p) {
    crearParticulas(p.x + tamanoCelda / 2, p.y + tamanoCelda / 2, 12, p.tipo.color);
    ganarPuntos(puntosDevorar);
    devorados = devorados + 1;
    segmentosPorCrecer = segmentosPorCrecer + 1;
    mostrarTexto("mensaje", "😋 ¡Devoraste " + p.tipo.emoji + "! +" + puntosDevorar + " puntos");
    sonido("devorar");
}

// 🧭 CONTACTO: la culebra y un enemigo variado se tocan. Normalmente duele; con el modo depredador se devora.
function contactoPeligro(p) {
    if (depredadorMs > 0) {
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

// 🌀 REGISTRAR USO DE PORTAL: guarda los últimos usos y los compara con la huella de la sala del creador.
// (La clave no está escrita en el código; aun así, cualquier código del navegador puede inspeccionarse.)
function registrarUsoPortal(p) {
    if (huevoEncontrado || grieta !== null) {
        return;
    }

    // Si cambia de pareja o se acabó el tiempo, la secuencia se reinicia.
    if (secuenciaPortal.length > 0 && (secuenciaPar !== p.parId || tiempoSecuenciaMs <= 0)) {
        secuenciaPortal = [];
    }
    if (secuenciaPortal.length === 0) {
        secuenciaPar = p.parId;
    }
    secuenciaPortal.push(p.lado);
    tiempoSecuenciaMs = ventanaSecuenciaMs;
    if (secuenciaPortal.length > largoClaveSala) {
        secuenciaPortal.shift();
    }

    if (secuenciaPortal.length === largoClaveSala && huellaTexto("p" + secuenciaPortal.join("") + "x") === huellaSala) {
        secuenciaPortal = [];
        if (culebra.length >= tamanoMinimoSala) {
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

// 🌌 ENTRAR A LA SALA DEL CREADOR: se guarda una copia del tablero, todo queda congelado y aparece el creador.
// No hay premio: solo el mensaje de agradecimiento y su correo.
function entrarDimension() {
    grieta = null;
    secuenciaPortal = [];
    dimensionActiva = true;
    dimensionFase = "creador";
    dimensionTicks = 0;
    caracteresCreador = 0;
    creadorEspera = 0;
    saltarCreador = false;
    huevoEncontrado = true;     // 🥚 queda registrado para el ranking
    guardarSecreto("sala");

    // Copia del tablero: al salir, todo vuelve exactamente como estaba.
    salaGuardada = {
        peligros: peligros, obstaculos: obstaculos, portales: portales, enemigos: enemigos,
        arana: arana, alimentos: alimentos, caracoles: caracoles, babas: babas,
        envenenado: envenenado, venenoRestanteMs: venenoRestanteMs, frutasPendientes: frutasPendientes
    };
    peligros = [];
    obstaculos = [];
    portales = [];
    enemigos = [];
    arana = null;
    alimentos = [];
    caracoles = [];
    babas = [];
    envenenado = false;

    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 30, "#ff5ec4");
    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 30, "#8ff3ff");
    mostrarTexto("mensaje", "🥚 ¡Encontraste el secreto! Escríbeme a " + correoCreador());
    sonido("grieta");
}

// 👨‍💻 GESTIONAR CREADOR: durante la presentación todo está congelado.
// El creador aparece y escribe su mensaje letra por letra. Después se puede continuar moviendo la
// serpiente (o se cierra solo pasados unos segundos).
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
            if (creadorEspera >= 100 || (saltarCreador && creadorEspera >= 30)) {
                salirDimension();
            }
        }
    }
}

// 😋 DEVORAR 👾 (solo con el modo depredador): quita el enemigo de la cabeza y da puntos.
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

// 😨 MOVER ENEMIGOS ASUSTADOS: con el modo depredador los 👾 huyen de la culebra (y si los alcanza, los devora).
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

// 🚪 SALIR DE LA SALA: se restaura el tablero tal como estaba y la partida sigue.
function salirDimension() {
    if (salaGuardada !== null) {
        peligros = salaGuardada.peligros;
        obstaculos = salaGuardada.obstaculos;
        portales = salaGuardada.portales;
        enemigos = salaGuardada.enemigos;
        arana = salaGuardada.arana;
        alimentos = salaGuardada.alimentos;
        caracoles = salaGuardada.caracoles;
        babas = salaGuardada.babas;
        envenenado = salaGuardada.envenenado;
        venenoRestanteMs = salaGuardada.venenoRestanteMs;
        frutasPendientes = salaGuardada.frutasPendientes;
        salaGuardada = null;
    }
    dimensionActiva = false;
    dimensionFase = "";
    saltarCreador = false;
    proteccionPortalPasos = pasosProteccionPortal; // evita volver a entrar a un portal por accidente
    enfriamientoEventosMs = pausaEntreEventosMs;
    ultimoBonoTiempo = tiempo;

    crearParticulas(culebra[0].x + tamanoCelda / 2, culebra[0].y + tamanoCelda / 2, 20, "#8ff3ff");
    mostrarTexto("mensaje", "👨‍💻 ¡Gracias por jugar CULEBRA X! Sigue la partida");
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

    // 🐌 caracoles, baba y efectos temporales también se limpian (Game Over, victoria y reinicio)
    caracoles = [];
    babas = [];
    lentoMs = 0;
    depredadorMs = 0;
    tiempoParaCaracolMs = 14000 + numeroAleatorio(6000);

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

    // 🌌 En la sala del creador todo está congelado.
    if (dimensionActiva) {
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
    if (tiempoParaCaracolMs > 0) {
        tiempoParaCaracolMs = tiempoParaCaracolMs - velocidadActual;
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
    gestionarCaracoles();

    // Solo puede aparecer algo nuevo si pasó la pausa entre eventos.
    // Revisamos las 3 categorías empezando por una al azar: nunca sale siempre lo mismo primero.
    if (enfriamientoEventosMs <= 0) {
        let primera = numeroAleatorio(3);
        let creado = false;
        for (let k = 0; k < 3; k++) {
            if (intentarCrearEvento((primera + k) % 3)) {
                creado = true;
                break; // máximo un evento nuevo por paso
            }
        }
        if (!creado) {
            intentarCrearCaracol();
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

        // 📧 Cuando termina de hablar muestra el correo (y cómo continuar).
        if (caracteresCreador >= textoCreador.length) {
            contexto.fillStyle = "#0b5d8a";
            contexto.font = "bold 16px sans-serif";
            contexto.fillText(correoCreador(), 154, 212);
            if (creadorEspera >= 30) {
                contexto.fillStyle = "#6b6b80";
                contexto.font = "12px sans-serif";
                contexto.fillText("Mueve la serpiente para continuar", 154, 255);
            }
        }
    }
}

// 🌌 DIBUJAR SALA DEL CREADOR: aura arcoíris alrededor de la cabeza y el creador hablando.
function dibujarDimension() {
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

    if (dimensionFase === "creador") {
        dibujarCreador();
    }
}

// 📊 DIBUJAR HUD: nivel actual, progreso hacia la meta y estado de la música (todo sobre el canvas).
function dibujarHud() {
    contexto.globalAlpha = 0.85;
    contexto.font = "bold 12px monospace";
    contexto.textBaseline = "middle";
    contexto.fillStyle = paleta.hud;
    contexto.textAlign = "left";
    contexto.fillText("NV " + (nivelActual + 1) + " " + nombresNivel[nivelActual] + "  ★ " + puntos + "/" + puntosVictoria, 8, canvas.height - 10);
    contexto.textAlign = "right";
    contexto.fillText(musicaActiva ? "🔊 M" : "🔇 M", canvas.width - 8, canvas.height - 10);
    contexto.globalAlpha = 1;
}


// ==========================================================
// 🐌 NUEVO: CARACOLES, BABA Y EFECTOS EN PANTALLA
// El caracol es lento, pero deja un rastro de baba que ralentiza a la serpiente.
// Debilidad: con el modo depredador se puede devorar. Se acaba solo pasado un tiempo.
// ==========================================================

// 🔎 ¿HAY UN CARACOL / BABA EN ESA CELDA?
function caracolEn(x, y) {
    for (let i = 0; i < caracoles.length; i++) {
        if (caracoles[i].x === x && caracoles[i].y === y) {
            return true;
        }
    }
    return false;
}

function babaEn(x, y) {
    for (let i = 0; i < babas.length; i++) {
        if (babas[i].x === x && babas[i].y === y) {
            return true;
        }
    }
    return false;
}

// 📈 CUÁNTOS CARACOLES A LA VEZ: 1, y 2 desde el nivel 5.
function maximoCaracolesActual() {
    return nivelActual >= 4 ? 2 : 1;
}

// 🐌 CREAR CARACOL: celda libre, lejos de la cabeza y fuera de su línea de avance. null si no hay sitio.
function crearCaracol() {
    for (let intento = 0; intento < 200; intento++) {
        let x = numeroAleatorio(columnas) * tamanoCelda;
        let y = numeroAleatorio(filas) * tamanoCelda;
        if (!posicionOcupada(x, y) && distanciaACabeza(x, y) >= 6 && !enLineaDeAvance(x, y) && !babaEn(x, y)) {
            let direcciones = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            let d = direcciones[numeroAleatorio(4)];
            crearParticulas(x + tamanoCelda / 2, y + tamanoCelda / 2, 8, tipoCaracol.color);
            mostrarTexto("mensaje", tipoCaracol.aviso);
            sonido("aviso");
            return { x: x, y: y, estado: "aviso", avisoMs: tipoCaracol.avisoMs, vidaMs: tipoCaracol.vidaMs,
                     relojMs: 0, dirX: d[0], dirY: d[1] };
        }
    }
    return null;
}

// 🎬 INTENTAR CREAR CARACOL: respeta el nivel mínimo, el máximo simultáneo y la espera entre apariciones.
function intentarCrearCaracol() {
    if (tiempoParaCaracolMs > 0 || nivelActual < tipoCaracol.nivelMin) {
        return false;
    }
    if (caracoles.length >= maximoCaracolesActual()) {
        tiempoParaCaracolMs = 4000 + numeroAleatorio(3000);
        return false;
    }
    let nuevo = crearCaracol();
    if (nuevo === null) {
        tiempoParaCaracolMs = 3000 + numeroAleatorio(3000);
        return false;
    }
    caracoles.push(nuevo);
    tiempoParaCaracolMs = sortearEspera(esperaCaracolMin, esperaCaracolMax);
    marcarEvento();
    return true;
}

// ✅ ¿PUEDE EL CARACOL PISAR ESA CELDA? La cabeza sí (ahí hay contacto); el cuerpo, obstáculos y demás no.
function celdaLibreParaCaracol(x, y) {
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return false;
    }
    if (celdaEnCulebra(x, y) && !(x === culebra[0].x && y === culebra[0].y)) {
        return false;
    }
    if (obstaculoEn(x, y) || portalEn(x, y) || grietaEn(x, y) || peligroEn(x, y) || enemigoEn(x, y) || alimentoEn(x, y) || caracolEn(x, y)) {
        return false;
    }
    if (arana !== null && arana.x === x && arana.y === y) {
        return false;
    }
    return true;
}

// 💧 DEJAR BABA: el caracol marca la celda que abandona. Si ya había baba, se renueva.
function dejarBaba(x, y) {
    for (let i = 0; i < babas.length; i++) {
        if (babas[i].x === x && babas[i].y === y) {
            babas[i].vidaMs = vidaBabaMs;
            return;
        }
    }
    babas.push({ x: x, y: y, vidaMs: vidaBabaMs });
    if (babas.length > maximoBabas) {
        babas.shift(); // la más antigua desaparece primero
    }
}

// 🐌 MOVER CARACOL: avanza una celda (casi siempre recto, a veces gira) y deja baba atrás.
function moverCaracol(c) {
    let direcciones = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let intentos = [];
    if (numeroAleatorio(10) >= 3) {
        intentos.push([c.dirX, c.dirY]);
    }
    let inicio = numeroAleatorio(4);
    for (let k = 0; k < 4; k++) {
        intentos.push(direcciones[(inicio + k) % 4]);
    }
    for (let j = 0; j < intentos.length; j++) {
        let nx = c.x + intentos[j][0] * tamanoCelda;
        let ny = c.y + intentos[j][1] * tamanoCelda;
        if (celdaLibreParaCaracol(nx, ny)) {
            dejarBaba(c.x, c.y);
            c.x = nx;
            c.y = ny;
            c.dirX = intentos[j][0];
            c.dirY = intentos[j][1];
            return;
        }
    }
}

// 🐌 RALENTIZAR: la serpiente va más lenta durante "ms" (nunca se acumula por encima del máximo).
function aplicarLentitud(ms) {
    let eraNormal = lentoMs <= 0;
    if (ms > lentoMs) {
        lentoMs = ms;
    }
    if (eraNormal) {
        mostrarTexto("mensaje", "🐌 ¡Baba pegajosa! Vas más lento");
        sonido("aviso");
    }
    actualizarVelocidad();
}

// 😋 DEVORAR CARACOL (modo depredador)
function devorarCaracol(c) {
    crearParticulas(c.x + tamanoCelda / 2, c.y + tamanoCelda / 2, 12, tipoCaracol.color);
    ganarPuntos(puntosDevorarCaracol);
    devorados = devorados + 1;
    segmentosPorCrecer = segmentosPorCrecer + 1;
    mostrarTexto("mensaje", "😋 ¡Devoraste un caracol! +" + puntosDevorarCaracol + " puntos");
    sonido("devorar");
}

// 🧭 CONTACTO CON EL CARACOL: devuelve true si el caracol desaparece (fue devorado).
function contactoCaracol(c) {
    if (depredadorMs > 0) {
        devorarCaracol(c);
        return true;
    }
    aplicarLentitud(duracionLentoMs * 1.5);
    crearParticulas(c.x + tamanoCelda / 2, c.y + tamanoCelda / 2, 10, tipoCaracol.color);
    c.relojMs = -900; // el caracol se encoge un momento
    return false;
}

// 🔁 GESTIONAR CARACOLES (una vez por paso, desde el director de eventos).
function gestionarCaracoles() {
    // La baba se desvanece sola.
    for (let b = babas.length - 1; b >= 0; b--) {
        babas[b].vidaMs = babas[b].vidaMs - velocidadActual;
        if (babas[b].vidaMs <= 0) {
            babas.splice(b, 1);
        }
    }

    for (let i = caracoles.length - 1; i >= 0; i--) {
        let c = caracoles[i];

        // Fase de aviso: no se mueve ni molesta. Nunca se activa encima de la cabeza.
        if (c.estado === "aviso") {
            c.avisoMs = c.avisoMs - velocidadActual;
            if (c.avisoMs <= 0 && distanciaACabeza(c.x, c.y) > 1) {
                c.estado = "activo";
                crearParticulas(c.x + tamanoCelda / 2, c.y + tamanoCelda / 2, 8, tipoCaracol.color);
            }
            continue;
        }

        // Se va solo cuando se acaba su tiempo.
        c.vidaMs = c.vidaMs - velocidadActual;
        if (c.vidaMs <= 0) {
            crearParticulas(c.x + tamanoCelda / 2, c.y + tamanoCelda / 2, 10, tipoCaracol.color);
            caracoles.splice(i, 1);
            ganarPuntos(puntosObstaculo); // lo sobreviviste
            continue;
        }

        // ¿La cabeza caminó hacia el caracol?
        if (c.x === culebra[0].x && c.y === culebra[0].y) {
            if (contactoCaracol(c)) {
                caracoles.splice(i, 1);
                continue;
            }
        }

        // Pasos propios (más lento que la serpiente).
        c.relojMs = c.relojMs + velocidadActual;
        let pasos = 0;
        let quitado = false;
        while (c.relojMs >= tipoCaracol.intervaloMs && pasos < 2) {
            c.relojMs = c.relojMs - tipoCaracol.intervaloMs;
            moverCaracol(c);
            pasos = pasos + 1;
            if (c.x === culebra[0].x && c.y === culebra[0].y) {
                if (contactoCaracol(c)) {
                    caracoles.splice(i, 1);
                    quitado = true;
                }
                break;
            }
        }
        if (quitado) {
            continue;
        }
    }

    // ¿La cabeza está sobre baba? Ralentiza (y mientras siga encima, se renueva).
    if (babaEn(culebra[0].x, culebra[0].y)) {
        aplicarLentitud(duracionLentoMs);
    }
}

// 💧 DIBUJAR BABA: charcos verdosos que se vuelven transparentes hasta desaparecer.
function dibujarBabas() {
    for (let i = 0; i < babas.length; i++) {
        let b = babas[i];
        let fr = Math.min(1, b.vidaMs / 2500);
        let cx = b.x + tamanoCelda / 2;
        let cy = b.y + tamanoCelda / 2;
        contexto.globalAlpha = 0.12 + 0.43 * fr;
        contexto.fillStyle = tipoCaracol.color;
        contexto.beginPath();
        contexto.ellipse(cx, cy, 9 + 2 * fr, 8 + 2 * fr, 0, 0, Math.PI * 2);
        contexto.fill();
        contexto.globalAlpha = 0.25 * fr;
        contexto.fillStyle = "#ffffff";
        contexto.beginPath();
        contexto.ellipse(cx - 3, cy - 3, 3, 2, 0, 0, Math.PI * 2);
        contexto.fill();
    }
    contexto.globalAlpha = 1;
}

// 🐌 DIBUJAR CARACOLES: giran hacia donde van; en el aviso parpadean.
function dibujarCaracoles() {
    contexto.font = "22px serif";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.shadowColor = tipoCaracol.color;
    contexto.shadowBlur = 12;
    for (let i = 0; i < caracoles.length; i++) {
        let c = caracoles[i];
        if (c.estado === "aviso") {
            contexto.globalAlpha = animacionEventos % 4 < 2 ? 0.25 : 0.6;
        }
        contexto.save();
        contexto.translate(c.x + tamanoCelda / 2, c.y + tamanoCelda / 2 + 1);
        if (c.dirX > 0) {
            contexto.scale(-1, 1); // el emoji mira a la izquierda: lo volteamos
        }
        contexto.fillText(tipoCaracol.emoji, 0, 0);
        contexto.restore();
        contexto.globalAlpha = 1;
    }
    contexto.shadowBlur = 0;
}

// 🧭 DIBUJAR ESTADOS TEMPORALES: indicadores del modo depredador y de la ralentización.
function dibujarEstadosTemporales() {
    if (dimensionActiva) {
        return;
    }
    if (depredadorMs > 0) {
        dibujarDepredador();
    }
    if (lentoMs > 0) {
        dibujarLentitud();
    }
}

// 🌶️ INDICADOR DEPREDADOR: aura de fuego, barra y cuenta regresiva.
function dibujarDepredador() {
    let cx = culebra[0].x + tamanoCelda / 2;
    let cy = culebra[0].y + tamanoCelda / 2;
    contexto.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
        contexto.globalAlpha = 0.7 - r * 0.2;
        contexto.strokeStyle = "hsl(" + ((animacionEventos * 10 + r * 20) % 50) + ", 100%, 60%)";
        contexto.beginPath();
        contexto.arc(cx, cy, 16 + r * 5 + Math.sin(animacionEventos * 0.5 + r) * 2, 0, Math.PI * 2);
        contexto.stroke();
    }
    contexto.globalAlpha = 1;

    let fraccion = Math.max(0, depredadorMs / duracionDepredadorMs);
    let parpadeo = depredadorMs < 3000 && animacionEventos % 2 === 0;
    contexto.fillStyle = "rgba(2, 6, 13, 0.6)";
    contexto.fillRect(98, 4, 304, 12);
    contexto.fillStyle = parpadeo ? "#ffffff" : "#ff5a2a";
    contexto.fillRect(100, 6, 300 * fraccion, 8);
    contexto.strokeStyle = "#ffb347";
    contexto.lineWidth = 1;
    contexto.strokeRect(98, 4, 304, 12);

    contexto.fillStyle = "#ffffff";
    contexto.font = "bold 13px sans-serif";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.fillText("🌶️ DEPREDADOR · " + Math.ceil(depredadorMs / 1000) + " s", canvas.width / 2, 28);
}

// 🐌 INDICADOR DE LENTITUD: marco verde y etiqueta con los segundos que faltan.
function dibujarLentitud() {
    contexto.globalAlpha = 0.55;
    contexto.strokeStyle = tipoCaracol.color;
    contexto.lineWidth = 4;
    contexto.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    contexto.globalAlpha = 1;

    contexto.fillStyle = "rgba(2, 6, 13, 0.7)";
    contexto.fillRect(canvas.width / 2 - 70, canvas.height - 36, 140, 22);
    contexto.fillStyle = tipoCaracol.color;
    contexto.font = "bold 13px sans-serif";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.fillText("🐌 LENTO · " + Math.ceil(lentoMs / 1000) + " s", canvas.width / 2, canvas.height - 25);
}
