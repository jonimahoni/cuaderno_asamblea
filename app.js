const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZ0_WRuym0zVc4_P0FVMyC-PV_IG_qPZH9Zr93rPW6Je8odm6kgqYEMZN3B-1C9Z_6/exec";

function createRunner(successFn, failureFn) {
  return new Proxy({}, {
    get(_, prop) {
      if (typeof prop === "symbol" || prop === "then") return undefined;

      // Cada with*Handler devuelve un runner NUEVO (sin estado compartido)
      if (prop === "withSuccessHandler") return fn => createRunner(fn, failureFn);
      if (prop === "withFailureHandler") return fn => createRunner(successFn, fn);

      // Cualquier otra propiedad = función del backend
      return (...args) => {
        fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita preflight CORS
          body: JSON.stringify({ function: prop, arguments: args })
        })
          .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
          })
          .then(res => {
            if (res && res.ok) {
              if (successFn) successFn(res.result);
            } else {
              throw new Error((res && res.error) || "Error desconocido en el servidor");
            }
          })
          .catch(err => {
            if (failureFn) failureFn(err);
            else console.error("google.script.run error:", err);
          });
      };
    }
  });
}

window.google = { script: { run: createRunner() } };
