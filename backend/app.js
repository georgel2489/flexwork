const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const arrangementRoutes = require("./routes/arrangementRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const { specs, swaggerUi } = require("./swagger");
require("dotenv").config();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/auth", authRoutes);
app.use("/arrangements", arrangementRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/notification", notificationRoutes);
app.use("/holidays", holidayRoutes);

app.use((err, req, res, next) => {
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
