// Manejar peticiones GET (para leer datos de la hoja)
function doGet(e) {
  const accion = e.parameter.action;
  
  if (accion === 'obtenerDatos') {
    const datos = leerGoogleSheets();
    return ContentService.createTextOutput(JSON.stringify(datos))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Acción no válida"}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Manejar peticiones POST (para guardar o sincronizar datos)
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const accion = postData.action;

    if (accion === 'guardarRegistro') {
      const resultado = insertarEnGoogleSheets(postData.data);
      return ContentService.createTextOutput(JSON.stringify({status: "success", result: resultado}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (accion === 'sincronizarCola') {
      const lista = postData.data; // Array de registros pendientes
      lista.forEach(item => insertarEnGoogleSheets(item));
      
      return ContentService.createTextOutput(JSON.stringify({status: "success", syncedCount: lista.length}))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Funciones auxiliares para conectar con Google Sheets
function leerGoogleSheets() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datos");
  const filas = hoja.getDataRange().getValues();
  const cabeceras = filas.shift();
  
  return filas.map(fila => {
    let obj = {};
    cabeceras.forEach((cabecera, i) => obj[cabecera] = fila[i]);
    return obj;
  });
}

function insertarEnGoogleSheets(data) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datos");
  // Asumiendo que 'data' es un objeto con las propiedades correctas
  hoja.appendRow([data.campo1, data.campo2, new Date()]);
  return "Guardado correctamente";
}
