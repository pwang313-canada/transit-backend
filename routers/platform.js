const express = require("express");
const router = express.Router();

// ✅ FIX: import service, not router
const gotracker = require("../services/gotracker");

router.get("/", async (req, res) => {
    try {
        const data = await gotracker.getPlatForm(); // match exact name
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Platform API failed" });
    }
});

module.exports = router;