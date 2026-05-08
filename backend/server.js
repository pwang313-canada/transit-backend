const express = require("express");
const cors = require("cors");

const scheduleRoutes = require("./routes/schedule");
const vehicleRoutes = require("./routes/vehicles");
const alertRoutes = require("./routes/alerts");
const faresRoutes = require("./routes/fares");
const feedRoutes = require("./routes/feed");
const serviceUpdateRoutes = require("./routes/serviceUpdate");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/schedule", scheduleRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/fares", faresRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/serviceUpdate", serviceUpdateRoutes);

app.get("/", (req, res) => {
    res.json({ status: "OK", service: "Transit API" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚆 Server running on port ${PORT}`);
});
