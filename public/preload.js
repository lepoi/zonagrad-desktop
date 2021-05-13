const os = require("os");
const { readFile, existsSync } = require("fs");

// imports
window.xlsToJson = require("convert-excel-to-json");
window.process = require("child_process");
window.fs = require("file-system");
window.path = require("path");
window.electron = require("electron");
window.csvToJson = require("csvjson");
window.qr = require("qr-image");
window.pdf = require("pdfkit");

// constants
window.constants = {
  baseDir: path.join(os.homedir(), "Documents", "zonagrad_photos", "photos"),
  configDir: path.join(os.homedir(), "Documents", "zonagrad_photos", "config"),
  levels: {
    PRE: "Pre-escolar",
    PRI: "Primaria",
    SEC: "Secundaria",
    TEC: "Secundaria Técnica",
    PRP: "Preparatoria",
    UNI: "Universidad",
    POS: "Posgrado",
    DIP: "Diplomado",
    CUR: "Curso",
    TAL: "Taller",
    CER: "Certificado"
  },
  shifts: {
    M: "Matutino",
    I: "Intermedio",
    V: "Vespertino"
  },
  defaultToast: {
    message: "[DEFAULT TOAST]",
    intent: "primary",
    duration: 3000
  }
};

const home_config = path.join(
  os.homedir(),
  "Documents",
  "zonagrad_photos",
  "config",
  "config.json"
);

if (existsSync(home_config))
  readFile(home_config, "utf8", (err, data) => {
    if (err) return console.error(err);

    const { baseDir } = JSON.parse(data);
    if (baseDir) window.constants.baseDir = baseDir;
  });
else console.info("Fallback to default config");
