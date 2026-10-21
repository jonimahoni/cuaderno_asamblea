const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoX7guRze-f2HH-fRReTVGt3vghO3gsQhDIwpcWXQYxwSGjtyduWcXTwxJU7ajUVa7/exec";

function createRunner(successFn, failureFn) {
  return new Proxy({}, {
    get(_, prop) {
      if (typeof prop === "symbol" || prop === "then") return undefined;
      if (prop === "withSuccessHandler") return fn => createRunner(fn, failureFn);
      if (prop === "withFailureHandler") return fn => createRunner(successFn, fn);
      if (prop === "withUserObject") return () => createRunner(successFn, failureFn);

      return (...args) => {
        fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ function: prop, arguments: args })
        })
          .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.text();
          })
          .then(text => {
            let data;
            try { data = JSON.parse(text); }
            catch (e) { throw new Error("Respuesta no válida del servidor: " + text.slice(0, 200)); }
            // Tu backend devuelve el resultado tal cual; los errores van como {exito:false}
            if (successFn) successFn(data);
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
// Registro del service worker (ruta relativa: la web vive en /cuaderno_asamblea/)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(reg => console.log("SW registrado:", reg.scope))
      .catch(err => console.error("Error registrando SW:", err));
  });
}
