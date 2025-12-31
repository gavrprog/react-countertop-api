const calcService = require("../services/calcService");
require("dotenv").config({
  path: `../.env.${process.env.NODE_ENV || "development"}`,
});
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser"); //to convert the body of incoming requests into JavaScript objects
const cors = require("cors"); //to configure Express to add headers stating that this API accepts requests coming = other origins
const helmet = require("helmet"); // helps to secure Express APIs by defining various HTTP headers
const morgan = require("morgan"); // adds some logging capabilities to this Express API
//const config = require('../config');
const connection = require("../db");

const PORT = process.env.SERVER_PORT || 3001;

const legalProducers = ["avant", "caesarstone", "atem"];

// defining the Express app
const app = express();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects {app.use(express.json());}
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

// обязательно, чтобы читать req.body в POST
app.use(express.json());

// Раздача статических файлов React (предполагаем, что build в папке /build)
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../build");
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    // Все остальные запросы — отдаем index.html для SPA
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

app.get("/api/:table", (req, res) => {
  const { producer, name } = req.params;
  connection.query("SELECT * FROM " + req.params.table, (err, rows, fields) => {
    if (err) throw err;
    res.send(rows);
  });
});

app.get("/api/:producer/:param", (req, res) => {
  const { producer, param } = req.params;
  let requestName = "";
  switch (producer) {
    case legalProducers.includes(producer) && producer:
      requestName = "color";
      break;
    case "chamfers":
      requestName = "type";
      break;
    default:
      return console.error("error in POST request");
  }
  connection.query(
    "SELECT * FROM " + `${producer}` + " WHERE " + `${requestName}` + "=?",
    [param],
    (err, rows, fields) => {
      if (err) throw err;
      res.send(rows);
    }
  );
});

app.get("/api/colors/:size/:producer", (req, res) => {
  connection.query(
    "SELECT " + req.params.size + " FROM " + req.params.producer,
    (err, rows, fields) => {
      if (err) throw err;
      res.send(rows);
    }
  );
});

app.post("/api/calc", async (req, res) => {
  try {
    const result = await calcService.calculate(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode and listening on port ${PORT}`
  );
});
