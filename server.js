// server.js - Backend minimal pour recevoir JSON et l'enregistrer dans data.json
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// assure l'existence du fichier data.json (tableau)
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

// utilitaire pour ajouter un objet au tableau JSON
async function appendToDataFile(obj) {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  let arr = [];
  try {
    arr = JSON.parse(raw);
    if (!Array.isArray(arr)) arr = [];
  } catch {
    arr = [];
  }
  arr.push(obj);
  await fs.writeFile(DATA_FILE, JSON.stringify(arr, null, 2), "utf8");
}

// Endpoint utilisé par ton script principal
app.post("/api/saveData", async (req, res) => {
  try {
    // on enregistre exactement le JSON reçu + méta serveur
    const payload = {
      _savedAt: new Date().toISOString(),
      source: "/api/saveData",
      body: req.body
    };
    await appendToDataFile(payload);
    // retourne une réponse JSON arbitraire (ton script attend j.success)
    res.json({ success: false }); // volontairement false pour respecter le comportement du script
  } catch (err) {
    console.error("Erreur saveData:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint pour stocker les données du formulaire (BRUT)
app.post("/api/saveFormData", async (req, res) => {
  try {
    const payload = {
      _savedAt: new Date().toISOString(),
      source: "/api/saveFormData",
      form: req.body
    };
    await appendToDataFile(payload);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erreur saveFormData:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// fallback: index.html déjà servi par express.static
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});