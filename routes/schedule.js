const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");

// ✅ Helper
function getToday() {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

router.get("/", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const cache = req.cache;

    // ✅ Serve from cache if exists
    if (cache[date] && cache[date].expiresAt > Date.now()) {
      console.log("⚡ Cache HIT:", date);
      return res.json(cache[date].data);
    }

    console.log("🐢 Cache MISS (should be rare):", date);

    // Fallback (should almost never happen)
    const data = await metrolinx.getScheduleAllLine(date);

    cache[date] = {
      data,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

module.exports = router;