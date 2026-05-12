const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");

router.get("/alerts", async (req, res) => {
    try {
        const data = await metrolinx.getFeedAlerts();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Alerts API failed" });
    }
});

router.get("/tripUpdates", async (req, res) => {
    try {
        const data = await metrolinx.getFeedTripUpdates();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "TripUpdates API failed" });
    }
});
module.exports = router;
