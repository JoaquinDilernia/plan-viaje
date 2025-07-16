require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const app = express();

const API_KEY_OPENAI = process.env.OPENAI_API_KEY; // poné tu key acá

app.use(express.static("public"));
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  // 🧭 Mensaje system: configura a la IA como asesor de viajes
  const systemMessage = {
    role: "system",
    content: `
Sos un asesor de viajes experto y creativo. Tu misión es ayudar al usuario a planificar viajes atractivos, sugerir destinos y actividades originales, y motivarlo a decidirse.
Respondé siempre con algo relacionado a viajar, sin importar lo que diga el usuario.
Si el usuario da alguna pista de interés o menciona fechas, lugares, preferencias o presupuesto, hacé preguntas específicas para mejorar la recomendación.
Sé entusiasta, claro, útil y profesional. No salgas del contexto de los viajes.
Siempre intenta dar distintas opciones y sugerencias, y a medida que el usuario vaya dando más detalles, ajustá las recomendaciones.
Tener en cuenta el presupuesto, fechas, cantidad de personas, y cualquier otro dato que el usuario haya dado.
Incluí detalles de actividades, gastronomía, cultura local, tips de viaje y recomendaciones personalizadas.
Usá un tono inspirador y profesional, y estructurá la respuesta en secciones claras (por ejemplo: "Itinerario sugerido", "Opciones alternativas", "Tips útiles").
    `.trim(),
  };

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [systemMessage, ...messages],
        temperature: 0.85, // Más creatividad
        max_tokens: 1200,  // Respuestas más largas y completas
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY_OPENAI}`,
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error en /api/chat:", error);
    res.status(500).json({ error: "Error llamando a OpenAI" });
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/enviar-itinerario", async (req, res) => {
  const { email, contenido } = req.body;

  try {
    const doc = new PDFDocument();
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(buffers);

      try {
        await transporter.sendMail({
          from: `"MiPlanDeViaje.com" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "¡Tu Plan de Viaje!",
          text: "Adjuntamos tu itinerario de viaje. Cualquier consulta podés escribirnos por acá. ¡Buen viaje!",
          html: `
                     <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; border-radius: 10px;">
                       <h2 style="color: #007bff; text-align: center;">¡Tu Plan de Viaje está listo! ✈️</h2>
                       <p style="font-size: 16px;">Adjuntamos tu itinerario de viaje en formato PDF.</p>
                       <p style="font-size: 16px;">Si tenés cualquier consulta o querés ajustar algo, podés escribirnos respondiendo este correo.</p>
                       <p style="font-size: 16px; margin-top: 30px;">¡Buen viaje! 🌍</p>
                       <hr style="margin: 30px 0;">
                       <p style="font-size: 12px; color: #666; text-align: center;">MiPlanDeViaje.com — Planificá tu próxima aventura</p>
                     </div>
                   `,
          attachments: [
            {
              filename: "plan_de_viaje.pdf",
              content: pdfData,
            },
          ],
        });

        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error enviando mail:", error);
        res.status(500).json({ error: "No se pudo enviar el mail." });
      }
    });

    // 📄 📄 📄 ACA, después de configurar el doc, armás el contenido del PDF:
    doc.fontSize(22).text("Tu Plan de Viaje", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(contenido, {
      align: "left",
      lineGap: 6,
    });
    doc.end(); // Siempre cerrás el PDF después de armarlo
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF." });
  }
});

app.post("/api/enviar-itinerario", async (req, res) => {
  const { email, contenido } = req.body;

  try {
    await transporter.sendMail({
      from: `"MiPlanDeViaje.com" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "¡Tu Itinerario de Viaje!",
      text: contenido,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.5;"><h2>¡Gracias por usar MiPlanDeViaje.com!</h2><p>Te enviamos tu itinerario:</p><div style="background:#f0f0f0;padding:20px;border-radius:10px;">${contenido.replace(/\n/g, "<br>")}</div><p>¡Buen viaje!</p></div>`,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error enviando mail:", error);
    res.status(500).json({ error: "No se pudo enviar el mail." });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

app.post("/api/imagen", async (req, res) => {
  const { destino } = req.body;

  try {
    const responseUnsplash = await axios.get(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destino)}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`,
    );

    if (responseUnsplash.data.results.length > 0) {
      const imagen =
        responseUnsplash.data.results[
          Math.floor(Math.random() * responseUnsplash.data.results.length)
        ];
      res.json({ imagen: imagen.urls.regular });
    } else {
      res.json({
        imagen:
          "https://upload.wikimedia.org/wikipedia/commons/4/4f/Travel_icon_generic.jpg",
      });
    }
  } catch (error) {
    console.error("Error buscando imagen:", error);
    res.json({
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/4/4f/Travel_icon_generic.jpg",
    });
  }
});