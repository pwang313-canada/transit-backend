const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json());

// ======================
// Config
// ======================
const PORT = process.env.PORT || 3001;
const METROLINX_KEY = process.env.METROLINX_KEY;

// Base URLs (clean + reusable)
const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI/api/V1";

// ======================
// Health check (important for Railway)
// ======================
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Transit API backend is running"
    });
});

// ======================
// Schedule API
// ======================
app.get("/api/schedule", async (req, res) => {
    try {
        const date = req.query.date || "20260706";

        const url = `${BASE_URL}/Schedule/Line/All/${date}?key=${METROLINX_KEY}`;

        const response = await axios.get(url);

        res.json(response.data);

    } catch (error) {
        console.error("Schedule API error:", error.message);
        res.status(500).json({
            error: "Failed to fetch schedule data"
        });
    }
});

// ======================
// Vehicle Position API (optional but useful)
// ======================
app.get("/api/vehicles", async (req, res) => {
    try {
        const url = `${BASE_URL}/Gtfs/FeedVehiclePosition?key=${METROLINX_KEY}`;

        const response = await axios.get(url);

        res.json(response.data);

    } catch (error) {
        console.error("Vehicle API error:", error.message);
        res.status(500).json({
            error: "Failed to fetch vehicle positions"
        });
    }
});

// ======================
// Service Alerts / Exceptions (optional)
// ======================
app.get("/api/alerts", async (req, res) => {
    try {
        const url = `${BASE_URL}/ServiceUpdate/Exceptions/Train?key=${METROLINX_KEY}`;

        const response = await axios.get(url);

        res.json(response.data);

    } catch (error) {
        console.error("Alerts API error:", error.message);
        res.status(500).json({
            error: "Failed to fetch service alerts"
        });
    }
});

app.get("/api/fares", async (req, res) => {
    try {
        const url = `${BASE_URL}/Fares/{from}/{to}?key=${METROLINX_KEY}`;

        const response = await axios.get(url);

        res.json(response.data);

    } catch (error) {
        console.error("Vehicle API error:", error.message);
        res.status(500).json({
            error: "Failed to fetch vehicle positions"
        });
    }
});
// ======================
// Start server
// ======================
app.listen(PORT, () => {
    console.log(`🚆 Transit API running on port ${PORT}`);
});

