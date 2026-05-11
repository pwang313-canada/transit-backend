const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");

// ✅ Helper
function getToday() {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

//
// ✅ 1. SUPER API (your existing one)
//
router.get("/", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const cache = req.cache;

    if (cache[date] && cache[date].expiresAt > Date.now()) {
      console.log("⚡ Cache HIT:", date);
      return res.json(cache[date].data);
    }

    console.log("🐢 Cache MISS:", date);

    const data = await metrolinx.getScheduleAllLine(date);

    cache[date] = {
      data,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

//
// ✅ 2. LINE endpoint (from cache 🚀)
//
router.get("/line", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { line, direction } = req.query;
    const cache = req.cache;

    if (!cache[date]) {
      return res.status(400).json({ error: "Cache not ready" });
    }

    const result = cache[date].data.filter(
      item =>
        item.LineCode === line &&
        item.Direction == direction
    );

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// ✅ 3. TRIP endpoint (from cache 🚀)
//
router.get("/trip", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { trip } = req.query;
    const cache = req.cache;

    if (!cache[date]) {
      return res.status(400).json({ error: "Cache not ready" });
    }

    const result = cache[date].data.find(
      item => item.TripNumber == trip
    );

    res.json(result || {});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// ✅ 4. JOURNEY endpoint (LIVE API)
//
router.get("/trip-on-date", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { from, to, start, maxJourney } = req.query;

    const data = await metrolinx.getScheduleTripOnDate(
      date,
      from,
      to,
      start,
      maxJourney
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/journey", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { from, to, start, maxJourney } = req.query;

    const data = await metrolinx.getScheduleJourney(
      date,
      trip
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all-line", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { from, to, start, maxJourney } = req.query;

    const data = await metrolinx.getScheduleAllLine(
      date
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/date-line-direction", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { from, to, start, maxJourney } = req.query;

    const data = await metrolinx.getScheduleDateLineDirection(
      date,
      line,
      direction
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/date-date-trip", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { from, to, start, maxJourney } = req.query;

    const data = await metrolinx.getScheduleDateTrip(
      date,
      trip
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;