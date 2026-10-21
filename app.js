const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymxQJNYduvGnesZ4SGu6gZrgo95FxYIztDigOytIO8yxgyyoUuFGSf7elTjWj7ofYN/exec';

const estadoDiv = document.getElementById('estado-conexion');
const form = document.getElementById('mi-form');
const listaDiv = document.getElementById('lista-datos');

// Monitorear estado de conexión en tiempo real
function actualizarEstadoRed() {
    if (navigator.onLine) {
        estadoDiv.textContent = "Conectado a Internet (Online)";
        estadoDiv.className = "mb-4 p-2 text-center text-sm rounded font-semibold bg-green-100 text-green-700";
        sincronizarPendientes();
    } else {
        estadoDiv.textContent = "Modo Sin Conexión (Offline)";
        estadoDiv.className = "mb-4 p-2 text-center text-sm rounded font-semibold bg-amber-100 text-amber-700";
    }
}

window.addEventListener('online', actualizarEstadoRed);
window.addEventListener('offline', actualizarEstadoRed);
actualizarEstadoRed();

// Cargar datos al iniciar
async function cargarDatos() {
    if (navigator.onLine) {
        try {
            const respuesta = await fetch(`${APPS_SCRIPT_URL}?action=obtenerDatos`);
            const datos = await respuesta.json();
            localStorage.setItem('cache_datos', JSON.stringify(datos));
            renderizar(datos);
        } catch (e) {
            console.error("Error al traer de la red, usando caché local", e);
            cargarDatosLocales();
        }
    } else {
        cargarDatosLocales();
    }
}

function cargarDatosLocales() {
    const datos = JSON.parse(localStorage.getItem('cache_datos') || '[]');
    renderizar(datos);
}

function renderizar(datos) {
    listaDiv.innerHTML = datos.map(d => `<div class="p-2 bg-gray-50 border rounded">${d.campo1 || d.campoResumen}</div>`).join('');
}

// Manejar envío de formularios
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const valor = document.getElementById('campo1').value;
    const nuevoRegistro = { campo1: valor, campo2: "Demo" };

    if (navigator.onLine) {
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'guardarRegistro', data: nuevoRegistro })
            });
            alert("Guardado directamente en Google Sheets");
            form.reset();
            cargarDatos();
        } catch (err) {
            guardarEnColaOffline(nuevoRegistro);
        }
    } else {
        guardarEnColaOffline(nuevoRegistro);
    }
});

function guardarEnColaOffline(item) {
    let cola = JSON.parse(localStorage.getItem('cola_pendientes') || '[]');
    cola.push(item);
    localStorage.setItem('cola_pendientes', JSON.stringify(cola));
    alert("Sin conexión: Guardado en cola local. Se sincronizará al reconectar.");
    form.reset();
    
    // Simular pintado local temporal
    let local = JSON.parse(localStorage.getItem('cache_datos') || '[]');
    local.push(item);
    renderizar(local);
}

// Sincronización automática de registros pendientes
async function sincronizarPendientes() {
    let cola = JSON.parse(localStorage.getItem('cola_pendientes') || '[]');
    if (cola.length === 0) return;

    try {
        const respuesta = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'sincronizarCola', data: cola })
        });
        const resultado = await respuesta.json();
        
        if (resultado.status === 'success') {
            localStorage.removeItem('cola_pendientes');
            console.log("¡Cola sincronizada con éxito con Google Sheets!");
            cargarDatos();
        }
    } catch (e) {
        console.error("Fallo la sincronización automática", e);
    }
}

// Carga inicial
cargarDatos();
