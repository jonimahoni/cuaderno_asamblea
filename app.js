// =========================================================================
// PUENTE GITHUB PAGES -> GOOGLE APPS SCRIPT (google.script.run emulado)
// =========================================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZ0_WRuym0zVc4_P0FVMyC-PV_IG_qPZH9Zr93rPW6Je8odm6kgqYEMZN3B-1C9Z_6/exec";

window.google = {
  script: {
    run: {
      withSuccessHandler: function(successFn) {
        this.successFn = successFn;
        return this;
      },
      withFailureHandler: function(failureFn) {
        this.failureFn = failureFn;
        return this;
      },
      // Intercepta cualquier llamada a funciones del backend (.gs)
      // y las redirige mediante POST a tu Web App de Google Apps Script
      __call: function(fnName, args) {
        fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8" // <-- Vital para evitar bloqueos CORS
          },
          body: JSON.stringify({ function: fnName, arguments: args })
        })
        .then(response => response.text())
        .then(text => {
          try {
            const data = JSON.parse(text);
            if (this.successFn) this.successFn(data);
          } catch (err) {
            if (this.failureFn) this.failureFn(text);
          }
        })
        .catch(err => {
          if (this.failureFn) this.failureFn(err);
        });
      }
    }
  }
};

// Automatiza el enrutamiento dinámico de funciones Apps Script desde el frontend
const handler = {
  get: function(target, prop) {
    return function(...args) {
      target.__call(prop, args);
    };
  }
};
window.google.script.run = new Proxy(window.google.script.run, handler);
