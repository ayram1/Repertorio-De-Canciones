# Configuración de Google Apps Script (Backend en Google Sheets)

Para que tu aplicación funcione sin un backend tradicional, usaremos Google Sheets como base de datos. Sigue estos pasos al pie de la letra:

## Paso 1: Prepara tu Hoja de Cálculo
1. Abre tu hoja de cálculo "Karaoke": https://docs.google.com/spreadsheets/d/1UNPBOgX5Z1o7Nt3W-AlcqHHBGx7mJNjLlthYKX5lA_8/edit
2. No necesitas nombrar ni crear las hojas manualmente. Nuestro script lo hará por ti (creará "Requests" y "SuspendedTables").

## Paso 2: Agrega el Script
1. En el menú superior de tu hoja de cálculo, haz clic en **Extensiones** > **Apps Script**.
2. Se abrirá una nueva pestaña. Borra todo el código que aparece por defecto en `Código.gs`.
3. Pega el siguiente código:

```javascript
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var requestsSheet = getOrCreateSheet(sheet, "Requests");
  var suspendedSheet = getOrCreateSheet(sheet, "SuspendedTables");

  var requestsData = getSheetData(requestsSheet);
  var suspendedData = getSheetData(suspendedSheet);

  var suspendedTables = suspendedData.map(function(row) { return row.Mesa; });

  // Filter only pending requests
  var pendingRequests = requestsData.filter(function(r) { return r.played !== true && r.played !== "true"; });

  var result = {
    requests: pendingRequests,
    suspendedTables: suspendedTables
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = { success: false };
  try {
    var data = JSON.parse(e.postData.contents);
    var cmd = data.cmd;
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (cmd === 'add_request') {
      var suspendedSheet = getOrCreateSheet(sheet, "SuspendedTables");
      var suspendedData = getSheetData(suspendedSheet);
      // Check if suspended
      for (var i = 0; i < suspendedData.length; i++) {
        if (suspendedData[i].Mesa == data.mesa) {
          return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'suspended' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }

      var requestsSheet = getOrCreateSheet(sheet, "Requests");
      var headers = getHeaders(requestsSheet);
      if (headers.length === 0 || headers[0] !== "id") {
        requestsSheet.appendRow(["id", "timestamp", "mesa", "cancion", "artista", "played"]);
      }
      
      var now = new Date();
      requestsSheet.appendRow([
        generateId(), 
        now.toISOString(), 
        data.mesa, 
        data.cancion, 
        data.artista, 
        false
      ]);
      result = { success: true };
    } 
    else if (cmd === 'mark_played') {
        var requestsSheet = getOrCreateSheet(sheet, "Requests");
        var dataRange = requestsSheet.getDataRange();
        var values = dataRange.getValues();
        var idIndex = values[0].indexOf("id");
        var playedIndex = values[0].indexOf("played");
        
        for (var i = 1; i < values.length; i++) {
            if (values[i][idIndex] === data.id) {
                requestsSheet.getRange(i + 1, playedIndex + 1).setValue(true);
                result = { success: true };
                break;
            }
        }
    }
    else if (cmd === 'toggle_suspend') {
        var suspendedSheet = getOrCreateSheet(sheet, "SuspendedTables");
        var dataRange = suspendedSheet.getDataRange();
        var values = dataRange.getValues();
        
        if(values.length === 0 || values[0][0] !== "Mesa") {
            suspendedSheet.appendRow(["Mesa"]);
            values = suspendedSheet.getDataRange().getValues();
        }
        
        var found = false;
        // Search from bottom up to safely delete rows
        for (var i = values.length - 1; i >= 1; i--) {
            if (values[i][0] == data.mesa) {
                suspendedSheet.deleteRow(i + 1);
                found = true;
            }
        }
        
        if (!found) {
            suspendedSheet.appendRow([data.mesa]);
        }
        result = { success: true, suspended: !found };
    }
  } catch (error) {
    result = { success: false, error: error.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(spreadsheet, name) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  return sheet;
}

function getHeaders(sheet) {
    var maxCols = sheet.getLastColumn();
    if(maxCols === 0) return [];
    var range = sheet.getRange(1, 1, 1, maxCols);
    return range.getValues()[0];
}

function getSheetData(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  
  if (lastRow <= 1) return [];
  
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var data = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  
  var result = [];
  for (var i = 0; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + new Date().getTime().toString(36);
}
```

## Paso 3: Desplegar el Script (Importante)
1. Haz clic en el botón azul **"Implementar"** (Deploy) en la parte superior derecha.
2. Selecciona **"Nueva implementación"** (New deployment).
3. Haz clic en el engranaje ⚙️ junto a "Seleccionar tipo" y elige **"Aplicación web"** (Web app).
4. En Configuración:
   - Descripción: "API Karaoke v1"
   - Ejecutar como: **"Yo"** (tu cuenta de correo).
   - Quién tiene acceso: **"Cualquier persona"** (Anyone). *(Esto es crucial para que GitHub Pages pueda enviar datos sin iniciar sesión)*.
5. Haz clic en **Implementar**.
6. Google te pedirá "Autorizar acceso". Haz clic en "Revisar permisos", elige tu cuenta. Si te aparece "Google no ha verificado esta aplicación", haz clic en "Configuración avanzada" (Advanced) y luego en "Ir a Proyecto sin título (inseguro)". Otorga los permisos.
7. Al final te dará una **"URL de la aplicación web"**. 
8. **COPIA ESA URL.**

## Paso 4: Conectar la URL con la App
Modifica el archivo `src/lib/api.ts` de este proyecto y pega la URL que copiaste en la variable `GOOGLE_SCRIPT_URL`.
