// src/server.js
require('./db/db');
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const apiRoutes = require("./routes");
const fileRoutes = require("./routes/files");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;


app.use(cors());

app.use("/api/files", fileRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
