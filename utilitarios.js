// ==========================================================
// 🧰 UTILITARIOS: la "caja de herramientas" de CULEBRA X
// Aquí guardamos funciones pequeñas que se pueden usar en
// cualquier parte del juego. Este archivo debe cargarse ANTES
// que culebra.js (así lo tienes en tu index.html).
// ==========================================================

// 📺 MOSTRAR TEXTO: busca un elemento del HTML por su id y cambia su texto.
// Ejemplo: mostrarTexto("puntos", 10) escribe 10 en <span id="puntos">.
// Usamos textContent porque solo queremos texto, no código HTML.
function mostrarTexto(id, texto) {
    document.getElementById(id).textContent = texto;
}

// 🎲 NÚMERO ALEATORIO: devuelve un número entero entre 0 y (maximo - 1).
// Math.random() da un decimal entre 0 y 1, lo multiplicamos por el máximo
// y Math.floor() quita los decimales.
// Ejemplo: numeroAleatorio(20) puede devolver 0, 1, 2 ... hasta 19.
function numeroAleatorio(maximo) {
    return Math.floor(Math.random() * maximo);
}

// ⏱️ FORMATEAR TIEMPO: convierte segundos en el formato "mm:ss".
// Ejemplo: 75 segundos -> "01:15".
function formatearTiempo(totalSegundos) {
    // Cada 60 segundos hacemos 1 minuto (Math.floor descarta los decimales).
    let minutos = Math.floor(totalSegundos / 60);
    // El resto de dividir entre 60 son los segundos sobrantes.
    let segundos = totalSegundos % 60;

    // Si el número tiene un solo dígito le agregamos un 0 delante ("5" -> "05").
    if (minutos < 10) {
        minutos = "0" + minutos;
    }
    if (segundos < 10) {
        segundos = "0" + segundos;
    }

    return minutos + ":" + segundos;
}