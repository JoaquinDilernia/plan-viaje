// Variables principales
let historialMensajes = [];
let topicosSeleccionados = new Set();
let tipoViajeSeleccionado = "";
let quiereCompararPrecios = false;

// Presupuestos fijos por moneda
const valoresPresupuesto = {
  USD: { max: 50000, step: 250 },
  EUR: { max: 50000, step: 250 },
  ARS: { max: 60000000, step: 300000 },
  BRL: { max: 300000, step: 1500 },
  BTC: { max: 0.5, step: 0.025 },
  ETH: { max: 30, step: 0.14 },
};

function formatearMoneda(valor, moneda) {
  let simbolo = "";
  let locale = "en-US";
  switch (moneda) {
    case "ARS": simbolo = "$"; locale = "es-AR"; break;
    case "USD": simbolo = "US$"; locale = "en-US"; break;
    case "EUR": simbolo = "€"; locale = "de-DE"; break;
    case "BRL": simbolo = "R$"; locale = "pt-BR"; break;
    case "MXN": simbolo = "$"; locale = "es-MX"; break;
    case "BTC": simbolo = "₿"; locale = "en-US"; break;
    case "ETH": simbolo = "Ξ"; locale = "en-US"; break;
    default: simbolo = moneda + " ";
  }
  let valorNumerico = parseFloat(valor) || 0;
  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: moneda === "BTC" || moneda === "ETH" ? 4 : 0,
  });
  return `${simbolo}${formatter.format(valorNumerico)} ${moneda}`;
}

// Presupuesto: sincronización slider y manual
function actualizarSlider() {
  const moneda = document.getElementById("moneda")?.value;
  const slider = document.getElementById("presupuesto");
  if (!slider || !moneda) return;
  const { max, step } = valoresPresupuesto[moneda] || valoresPresupuesto["USD"];
  slider.max = max;
  slider.step = step;
  if (parseFloat(slider.value) > max) slider.value = max;
  const manual = document.getElementById("presupuesto-manual");
  if (manual) {
    manual.value = slider.value;
    manual.setAttribute("data-valor", slider.value);
  }
}

function actualizarPresupuestoDesdeSlider() {
  const slider = document.getElementById("presupuesto");
  const manual = document.getElementById("presupuesto-manual");
  if (slider && manual) {
    manual.value = slider.value;
    manual.setAttribute("data-valor", slider.value);
  }
}

function actualizarPresupuestoDesdeManual() {
  const manualInput = document.getElementById("presupuesto-manual");
  const slider = document.getElementById("presupuesto");
  if (!manualInput || !slider) return;
  let valor = parseFloat(manualInput.value.replace(/\D/g, "")) || 0;
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  if (valor < min) valor = min;
  if (valor > max) valor = max;
  slider.value = valor;
  manualInput.setAttribute("data-valor", valor);
  manualInput.value = valor;
}

// Fechas
function calcularDias() {
  const fechaDesde = document.getElementById("fecha-desde")?.value;
  const fechaHasta = document.getElementById("fecha-hasta")?.value;
  const cantidadDiasInput = document.getElementById("cantidad-dias");
  if (!cantidadDiasInput) return;
  if (fechaDesde && fechaHasta) {
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);
    const diferenciaMs = hasta - desde;
    const dias = diferenciaMs / (1000 * 60 * 60 * 24);
    if (dias >= 0) {
      cantidadDiasInput.value = dias;
    } else {
      alert("La fecha hasta no puede ser menor que la fecha desde.");
      const hastaInput = document.getElementById("fecha-hasta");
      if (hastaInput) hastaInput.value = "";
      cantidadDiasInput.value = "";
    }
  }
}

function completarFechas() {
  const fechaDesde = document.getElementById("fecha-desde")?.value;
  const fechaHasta = document.getElementById("fecha-hasta")?.value;
  const cantidadDias = parseInt(document.getElementById("cantidad-dias")?.value);
  if (!cantidadDias) return;
  if (fechaDesde && !fechaHasta) {
    const desde = new Date(fechaDesde);
    desde.setDate(desde.getDate() + cantidadDias);
    const hastaInput = document.getElementById("fecha-hasta");
    if (hastaInput) hastaInput.value = desde.toISOString().split("T")[0];
  } else if (fechaHasta && !fechaDesde) {
    const hasta = new Date(fechaHasta);
    hasta.setDate(hasta.getDate() - cantidadDias);
    const desdeInput = document.getElementById("fecha-desde");
    if (desdeInput) desdeInput.value = hasta.toISOString().split("T")[0];
  }
}

// Descripción en vivo
function actualizarDescripcionCompleta() {
  const desde = document.getElementById("pais")?.value.trim() || "";
  const destinos = Array.from(document.querySelectorAll(".destino-input"))
    .map((input) => input.value.trim())
    .filter((d) => d !== "");
  const presupuesto = document.getElementById("presupuesto-manual")?.value.trim() || "";
  const moneda = document.getElementById("moneda")?.value || "";
  const fechaDesde = document.getElementById("fecha-desde")?.value || "";
  const fechaHasta = document.getElementById("fecha-hasta")?.value || "";
  const cantidadDias = document.getElementById("cantidad-dias")?.value.trim() || "";
  const adultos = document.getElementById("cantidad-adultos")?.value.trim() || "";
  const ninos = document.getElementById("cantidad-ninos")?.value.trim() || "";
  const kilometros = document.getElementById("km-tramo")?.value?.trim() || "";
  const cotizacion = document.getElementById("cotizacion-presupuesto")?.checked;
  const transportes = Array.from(
    document.querySelectorAll(".transport-btn.active")
  )
    .map((boton) => boton.dataset.transporte)
    .join(", ");
  let descripcion = "Planificación de viaje:\n";
  descripcion += `Origen: ${desde || "No especificado"}\n`;
  descripcion += `Destinos: ${destinos.length > 0 ? destinos.join(", ") : "No especificado"}\n`;
  descripcion += `Presupuesto: ${!cotizacion && presupuesto ? formatearMoneda(presupuesto, moneda) : "No especificado"}\n`;
  descripcion += `Moneda: ${moneda}\n`;
  descripcion += `Fechas: Desde ${fechaDesde || "No especificada"} hasta ${fechaHasta || "No especificada"}\n`;
  descripcion += `Cantidad de días: ${cantidadDias || "No especificada"}\n`;
  descripcion += `Adultos: ${adultos || "No especificado"}\n`;
  descripcion += `Niños: ${ninos || "No especificado"}\n`;
  descripcion += `Transporte preferido: ${transportes || "No especificado"}\n`;
  descripcion += `Paradas cada: ${kilometros ? kilometros + " km" : "No especificado"}\n`;
  descripcion += `Temáticas de interés: ${topicosSeleccionados.size > 0 ? [...topicosSeleccionados].join(", ") : "No especificadas"}\n`;
  if (cotizacion) descripcion += "Solicita cotización de presupuesto.\n";
  if (moneda === "ARS" && cotizacion) descripcion += "Tipo de cambio estimado: 1 USD = 1350 ARS.\n";
  if (quiereCompararPrecios) descripcion += "Solicita comparar precios entre destinos.\n";
  const descElem = document.getElementById("descripcion");
  if (descElem) descElem.value = descripcion.trim();
}

function agregarCampoDestino() {
  const container = document.getElementById("destinos-container");
  if (!container) return;
  const wrapper = document.createElement("div");
  wrapper.className = "destino-extra-wrapper";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "8px";
  wrapper.style.marginTop = "8px";
  const nuevoInput = document.createElement("input");
  nuevoInput.type = "text";
  nuevoInput.name = "destino";
  nuevoInput.className = "destino-input";
  nuevoInput.placeholder = "Otro destino";
  const btnEliminar = document.createElement("button");
  btnEliminar.type = "button";
  btnEliminar.className = "eliminar-destino-btn";
  btnEliminar.title = "Eliminar destino";
  btnEliminar.innerHTML = "🗑️";
  btnEliminar.style.background = "none";
  btnEliminar.style.border = "none";
  btnEliminar.style.cursor = "pointer";
  btnEliminar.style.fontSize = "1.2rem";
  btnEliminar.style.color = "#b71c1c";
  btnEliminar.style.padding = "0 4px";
  btnEliminar.onclick = () => {
    container.removeChild(wrapper);
    actualizarDescripcionCompleta();
  };
  nuevoInput.addEventListener("input", actualizarDescripcionCompleta);
  wrapper.appendChild(nuevoInput);
  wrapper.appendChild(btnEliminar);
  container.appendChild(wrapper);
}

function seleccionarOpcion(opcion) {
  document.querySelectorAll(".option-btn").forEach((boton) => {
    const match = boton.getAttribute("onclick")?.match(/'(.+?)'/);
    const valor = match ? match[1] : null;
    if (valor === opcion) {
      boton.classList.add("active");
    } else {
      boton.classList.remove("active");
    }
  });
  const paisInput = document.getElementById("pais");
  const paisLabel = document.querySelector("label[for='pais']");
  const destinosContainer = document.getElementById("destinos-container");
  if (destinosContainer) destinosContainer.innerHTML = "";
  tipoViajeSeleccionado = "";
  quiereCompararPrecios = false;
  if (opcion === "pais") {
    tipoViajeSeleccionado = "Quiero viajar dentro de mi país.";
    if (document.getElementById("presupuesto")) document.getElementById("presupuesto").value = 800;
    if (paisInput) paisInput.required = true;
    if (paisLabel) paisLabel.innerHTML = "¿Desde dónde viajás? (obligatorio)";
  } else if (opcion === "cerca") {
    tipoViajeSeleccionado = "Quiero viajar de a tramos";
    if (document.getElementById("presupuesto")) document.getElementById("presupuesto").value = 1700;
    if (paisInput) paisInput.required = true;
    if (paisLabel) paisLabel.innerHTML = "¿Desde dónde viajás? (obligatorio)";
  } else if (opcion === "mundo") {
    tipoViajeSeleccionado = "Quiero conocer otros países del mundo.";
    if (document.getElementById("presupuesto")) document.getElementById("presupuesto").value = 2000;
    if (paisInput) paisInput.required = false;
    if (paisLabel) paisLabel.innerHTML = "¿Desde dónde viajás? (opcional)";
  } else if (opcion === "sorprendeme") {
    tipoViajeSeleccionado = "¡Sorprendeme con una aventura inesperada!";
    if (document.getElementById("presupuesto")) document.getElementById("presupuesto").value = 4000;
    if (paisInput) paisInput.required = false;
    if (paisLabel) paisLabel.innerHTML = "¿Desde dónde viajás? (opcional)";
  } else if (opcion === "comparar") {
    quiereCompararPrecios = true;
    if (document.getElementById("presupuesto")) document.getElementById("presupuesto").value = 3000;
    if (paisInput) paisInput.required = true;
    if (paisLabel) paisLabel.innerHTML = "¿Desde dónde viajás? (obligatorio)";
  }
  actualizarPresupuestoDesdeSlider();
  actualizarDescripcionCompleta();
}

function esMensajeRelacionadoAViaje(texto) {
  const palabrasClave = [
    "viaje", "viajar", "turismo", "destino", "vacaciones", "playa", "montaña", "ciudad", "conocer", "ruta",
    "itinerario", "hotel", "avión", "auto", "tren", "bici", "senderismo", "esquiar", "navegar", "tour",
    "crucero", "excursión", "visitar", "pueblo", "costa", "aventura", "quiero ir", "quiero",
  ];
  const textoMinuscula = texto.toLowerCase();
  return palabrasClave.some((palabra) => textoMinuscula.includes(palabra));
}

function detectarDestinoDesdeRespuesta(textoRespuesta) {
  const destinosComunes = [
    "paris", "roma", "bariloche", "madrid", "tokio", "londres", "nueva york", "machu picchu", "playa",
    "montaña", "senderismo", "venecia", "dubai", "berlín", "milán", "mendoza", "cordoba", "brasil",
    "toscana", "santorini", "miami", "atenas", "andorra", "chamonix", "whistler", "esquiar", "costa rica",
  ];
  const texto = textoRespuesta.toLowerCase();
  return destinosComunes.find((destino) => texto.includes(destino)) || "viaje";
}

async function buscarImagen(destinoBuscado) {
  try {
    const response = await fetch("/api/imagen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destino: destinoBuscado }),
    });
    const data = await response.json();
    return data.imagen;
  } catch (error) {
    console.error("Error buscando imagen:", error);
    return "https://upload.wikimedia.org/wikipedia/commons/4/4f/Travel_icon_generic.jpg";
  }
}

function formatearConversacion(texto) {
  texto = texto.replaceAll("###", "<br><br>");
  texto = texto.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const partes = texto.split(/\n+/g).filter(Boolean);
  return partes
    .map((parte) =>
      parte.match(/^\d+\./)
        ? `<li>${parte.substring(3).trim()}</li>`
        : `<p>${parte.trim()}</p>`,
    )
    .join("");
}

function agregarMensajeAlHistorial(role, contenido) {
  const resultado = document.getElementById("resultado");
  if (!resultado) return;
  const contenedor = document.createElement("div");
  contenedor.classList.add("mensaje", role === "user" ? "usuario" : "ia");
  contenedor.innerHTML = formatearConversacion(contenido);
  resultado.appendChild(contenedor);
  resultado.scrollTop = resultado.scrollHeight;
}

document.addEventListener("DOMContentLoaded", function () {
  const presupuestoInput = document.getElementById("presupuesto");
  if (presupuestoInput) {
    presupuestoInput.addEventListener("input", () => {
      actualizarPresupuestoDesdeSlider();
      actualizarDescripcionCompleta();
    });
  }

  const inputManual = document.getElementById("presupuesto-manual");
  if (inputManual) {
    inputManual.addEventListener("input", () => {
      actualizarPresupuestoDesdeManual();
      actualizarDescripcionCompleta();
    });
  }

  const agregarBtn = document.getElementById("agregar-destino");
  if (agregarBtn) {
    agregarBtn.addEventListener("click", agregarCampoDestino);
  }

  const cotizacionPresupuesto = document.getElementById("cotizacion-presupuesto");
  if (cotizacionPresupuesto) {
    cotizacionPresupuesto.addEventListener("change", function () {
      const slider = document.getElementById("presupuesto");
      const manualInput = document.getElementById("presupuesto-manual");
      const estaTildado = this.checked;
      if (slider) slider.disabled = estaTildado;
      if (manualInput) manualInput.disabled = estaTildado;
      actualizarDescripcionCompleta();
    });
  }

  const monedaInput = document.getElementById("moneda");
  if (monedaInput) monedaInput.addEventListener("change", actualizarSlider);

  const fechaDesdeInput = document.getElementById("fecha-desde");
  if (fechaDesdeInput) fechaDesdeInput.addEventListener("change", calcularDias);

  const fechaHastaInput = document.getElementById("fecha-hasta");
  if (fechaHastaInput) fechaHastaInput.addEventListener("change", calcularDias);

  [
    "pais",
    "destino",
    "presupuesto-manual",
    "moneda",
    "fecha-desde",
    "fecha-hasta",
    "cantidad-dias",
    "cantidad-adultos",
    "cantidad-ninos",
    "km-tramo",
  ].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.addEventListener("input", actualizarDescripcionCompleta);
      campo.addEventListener("change", actualizarDescripcionCompleta);
    }
  });

  document.querySelectorAll(".topic-btn").forEach((boton) => {
    boton.addEventListener("click", () => {
      const topico = boton.dataset.topico;
      if (topicosSeleccionados.has(topico)) {
        topicosSeleccionados.delete(topico);
        boton.classList.remove("active");
      } else {
        topicosSeleccionados.add(topico);
        boton.classList.add("active");
      }
      actualizarDescripcionCompleta();
    });
  });

  document.querySelectorAll(".transport-btn").forEach((boton) => {
    boton.addEventListener("click", () => {
      boton.classList.toggle("active");
      actualizarDescripcionCompleta();
    });
  });

  const formulario = document.getElementById("formulario-itinerario");
  if (formulario) {
    formulario.addEventListener("submit", async function(e) {
      e.preventDefault();
      const resultado = document.getElementById("resultado");
      const spinner = document.getElementById("spinner-carga");
      if (resultado) {
        resultado.style.display = "none";
        resultado.innerHTML = "";
      }
      if (spinner) spinner.style.display = "block";

      if (quiereCompararPrecios) {
        const desde = document.getElementById("pais")?.value.trim();
        const destinos = Array.from(document.querySelectorAll(".destino-input"))
          .map((d) => d.value.trim())
          .filter((d) => d !== "");

        if (!desde) {
          alert("Para comparar precios, tenés que indicar desde dónde viajás.");
          if (spinner) spinner.style.display = "none";
          return;
        }

        if (destinos.length < 2) {
          alert("Para comparar precios, tenés que ingresar al menos 2 destinos.");
          if (spinner) spinner.style.display = "none";
          return;
        }
      }

      const descripcionFinal = document.getElementById("descripcion")?.value.trim();
      if (!descripcionFinal) {
        alert("Por favor completá alguna información.");
        if (spinner) spinner.style.display = "none";
        return;
      }

      if (!esMensajeRelacionadoAViaje(descripcionFinal)) {
        alert("Tu consulta no parece relacionada con viajes. Por favor, escribí sobre destinos, turismo o planes de viaje.");
        if (spinner) spinner.style.display = "none";
        return;
      }

      historialMensajes.push({ role: "user", content: descripcionFinal });
      agregarMensajeAlHistorial("user", descripcionFinal);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historialMensajes }),
        });

        const data = await response.json();
        if (
          !data ||
          !data.choices ||
          !data.choices[0] ||
          !data.choices[0].message ||
          !data.choices[0].message.content
        ) {
          throw new Error("Respuesta inesperada del servidor");
        }
        const respuesta = data.choices[0].message.content;

        historialMensajes.push({ role: "assistant", content: respuesta });

        agregarMensajeAlHistorial("assistant", respuesta);

        const destinoDetectado = detectarDestinoDesdeRespuesta(respuesta);
        const imagenUrl = await buscarImagen(destinoDetectado);
        const imagenDestino = document.getElementById("imagen-destino");
        if (imagenDestino) imagenDestino.style.backgroundImage = `url('${imagenUrl}')`;

        // Mostrar el chat debajo del resultado
        mostrarResultado(resultado.innerHTML);

      } catch (error) {
        console.error("Error generando itinerario:", error);
        if (resultado) resultado.innerHTML = `<p class="error">Hubo un error generando tu itinerario.</p>`;
        mostrarResultado(resultado.innerHTML);
      } finally {
        if (spinner) spinner.style.display = "none";
      }
    });
  }

  const botonGuardar = document.getElementById("boton-guardar");
  if (botonGuardar) {
    botonGuardar.addEventListener("click", function () {
      const formularioEmail = document.getElementById("formulario-email");
      if (formularioEmail) formularioEmail.style.display = "block";
    });
  }

  const enviarItinerario = document.getElementById("enviar-itinerario");
  if (enviarItinerario) {
    enviarItinerario.addEventListener("click", async function () {
      const emailDestino = document.getElementById("email-destino")?.value.trim();
      let contenido = document.getElementById("resultado")?.innerText;
      const quiereContacto = document.getElementById("quiero-contacto")?.checked;

      if (!emailDestino || !contenido) {
        alert("Por favor completá el correo electrónico y asegurate de tener un itinerario generado.");
        return;
      }

      if (quiereContacto) {
        contenido += "\n\n🟢 El usuario desea ser contactado.";
      }

      try {
        await fetch("/api/enviar-itinerario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailDestino, contenido }),
        });

        alert("¡Itinerario enviado correctamente!");
        const formularioEmail = document.getElementById("formulario-email");
        if (formularioEmail) formularioEmail.style.display = "none";
        const emailInput = document.getElementById("email-destino");
        if (emailInput) emailInput.value = "";
        const contactoInput = document.getElementById("quiero-contacto");
        if (contactoInput) contactoInput.checked = false;
      } catch (error) {
        console.error("Error enviando itinerario:", error);
        alert("Hubo un error enviando el itinerario. Intentá nuevamente.");
      }
    });
  }

  actualizarSlider();
});

// Sugerencias de países
const listaPaises = [
  "Argentina", "Australia", "Austria", "Alemania", "Brasil", "Bolivia", "Bélgica", "Canadá", "Chile", "China",
  "Colombia", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Ecuador", "Egipto", "El Salvador", "España",
  "Estados Unidos", "Estonia", "Finlandia", "Francia", "Grecia", "Guatemala", "Honduras", "Hungría", "India",
  "Indonesia", "Irlanda", "Islandia", "Israel", "Italia", "Japón", "Letonia", "Lituania", "Luxemburgo", "México",
  "Mónaco", "Noruega", "Nueva Zelanda", "Países Bajos", "Panamá", "Paraguay", "Perú", "Polonia", "Portugal",
  "Puerto Rico", "Reino Unido", "República Checa", "Rumania", "Rusia", "Sudáfrica", "Suecia", "Suiza", "Tailandia",
  "Turquía", "Ucrania", "Uruguay", "Venezuela"
];

function mostrarSugerencias(inputId, sugerenciasId) {
  const input = document.getElementById(inputId);
  const sugerencias = document.getElementById(sugerenciasId);
  if (!input || !sugerencias) return;
  input.addEventListener("input", function () {
    const valor = input.value.trim().toLowerCase();
    sugerencias.innerHTML = "";
    if (valor.length === 0) {
      sugerencias.style.display = "none";
      return;
    }
    const filtrados = listaPaises.filter(pais => pais.toLowerCase().startsWith(valor));
    if (filtrados.length === 0) {
      sugerencias.style.display = "none";
      return;
    }
    filtrados.forEach(pais => {
      const div = document.createElement("div");
      div.textContent = pais;
      div.onclick = () => {
        input.value = pais;
        sugerencias.innerHTML = "";
        sugerencias.style.display = "none";
        actualizarDescripcionCompleta && actualizarDescripcionCompleta();
      };
      sugerencias.appendChild(div);
    });
    sugerencias.style.display = "block";
  });
  input.addEventListener("blur", function () {
    setTimeout(() => { sugerencias.style.display = "none"; }, 120);
  });
  input.addEventListener("focus", function () {
    if (sugerencias.innerHTML) sugerencias.style.display = "block";
  });
}

document.addEventListener("DOMContentLoaded", function () {
  mostrarSugerencias("pais", "sugerencias-pais");
  mostrarSugerencias("destino", "sugerencias-destino");
});

document.addEventListener("DOMContentLoaded", function () {
  const fechaDesde = document.getElementById("fecha-desde");
  const fechaHasta = document.getElementById("fecha-hasta");
  if (fechaDesde && fechaHasta) {
    fechaDesde.addEventListener("change", function () {
      fechaHasta.min = fechaDesde.value;
      if (fechaHasta.value && fechaHasta.value < fechaDesde.value) {
        fechaHasta.value = fechaDesde.value;
      }
    });
    fechaHasta.addEventListener("change", function () {
      fechaDesde.max = fechaHasta.value;
      if (fechaDesde.value && fechaDesde.value > fechaHasta.value) {
        fechaDesde.value = fechaHasta.value;
      }
    });
  }
});

// Función para mostrar el resultado y el chat
function mostrarResultado(itinerarioHtml) {
  document.getElementById('resultado').innerHTML = itinerarioHtml;
  document.getElementById('resultado').style.display = 'block';
  document.querySelector('.chat-section').style.display = 'block';
}

// Oculta el chat si el usuario vuelve a editar el formulario
document.getElementById('formulario-itinerario').addEventListener('input', function() {
  document.querySelector('.chat-section').style.display = 'none';
});

// --- CHAT INTERACTIVO DESPUÉS DEL ITINERARIO ---

const chatInput = document.getElementById('chat-input');
const chatBtn = document.getElementById('send-chat');
const chatMessages = document.getElementById('chat-messages');

if (chatBtn && chatInput && chatMessages) {
  chatBtn.addEventListener('click', enviarMensajeChat);
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      enviarMensajeChat();
    }
  });
}

async function enviarMensajeChat() {
  const mensaje = chatInput.value.trim();
  if (!mensaje) return;

  // Mostrar mensaje del usuario
  const userDiv = document.createElement('div');
  userDiv.className = 'mensaje usuario';
  userDiv.innerText = mensaje;
  chatMessages.appendChild(userDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.value = '';

  // Agregar al historial para contexto
  historialMensajes.push({ role: "user", content: mensaje });

  // Mostrar "escribiendo..."
  const aiDiv = document.createElement('div');
  aiDiv.className = 'mensaje ia';
  aiDiv.innerText = 'La IA está escribiendo...';
  chatMessages.appendChild(aiDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: historialMensajes }),
    });
    const data = await response.json();
    let respuesta = "No se pudo obtener respuesta.";
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      respuesta = data.choices[0].message.content;
    }
    historialMensajes.push({ role: "assistant", content: respuesta });
    aiDiv.innerHTML = respuesta.replace(/\n/g, "<br>");
  } catch (error) {
    aiDiv.innerText = "Error al obtener respuesta de la IA.";
  }
}