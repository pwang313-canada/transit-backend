const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");

/**
 * Test route
 */
router.get("/test", (req, res) => {
    res.send("Schedule route works!");
});

/**
 * GET /api/schedule/journey
 * Example:
 * /api/schedule/journey?from=UN&to=BO&start=0800&date=20260512&maxJourney=3
 */
 /*
router.get("/journey", async (req, res) => {
    try {
        const data = await metrolinx.getScheduleDateLineDirection(req.query);
        res.json(data);
    } catch (err) {
        console.error("Journey error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
*/

/**
 * GET /api/schedule/lines
 */
router.get("/lines", async (req, res) => {
    try {
        const data = await metrolinx.getScheduleAllLine();
        res.json(data);
    } catch (err) {
        console.error("Lines error:", err.message);
        res.status(500).json({ error: err.message });
    }
});


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

router.get("/date-trip", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { trip } = req.query;

    const data = await metrolinx.getScheduleDateTrip(
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
    const { line, direction } = req.query;
    const cache = req.cache;

    // Build cache key matching the preload format
    const cacheKey = `${date}_${line}_${direction}`;

    // Check cache first
    if (cache[cacheKey] && cache[cacheKey].expiresAt > Date.now()) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cache[cacheKey].data);
    }

    console.log(`🐢 Cache MISS: ${cacheKey} – fetching live`);

    // Fetch live data
    const data = await metrolinx.getScheduleDateLineDirection(date, line, direction);

    // Store in cache (expires at midnight)
    cache[cacheKey] = {
      data,
      expiresAt: Date.now() + msUntilMidnight()
    };

    res.json(data);

  } catch (err) {
    console.error("Date‑line‑direction error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/date-date-trip", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { trip } = req.query;

    const data = await metrolinx.getScheduleDateTrip(
      date,
      trip
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/service-alert", async (req, res) => {
  try {
    console.log("🚨 SERVICE ALERT HIT");

    const data = await metrolinx.getServiceAlert();

    res.json(data);

  } catch (err) {
    console.error("❌ SERVICE ALERT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

//
// ✅ SUPER API (ALL-IN-ONE)
//
router.get("/super", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const cache = req.cache;

    console.log("🚀 SUPER API HIT:", date);

    // ✅ 1. Schedule (use cache)
    let scheduleData;

    if (cache[date] && cache[date].expiresAt > Date.now()) {
      console.log("⚡ schedule cache HIT");
      scheduleData = cache[date].data;
    } else {
      console.log("🐢 schedule fetch");
      scheduleData = await metrolinx.getScheduleAllLine(date);

      cache[date] = {
        data: scheduleData,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };
    }

    // ✅ 2. Service Alerts (short cache)
    let alertsData;
    const ALERT_KEY = "service-alert";

    if (
      cache[ALERT_KEY] &&
      cache[ALERT_KEY].expiresAt > Date.now()
    ) {
      console.log("⚡ alert cache HIT");
      alertsData = cache[ALERT_KEY].data;
    } else {
      console.log("🐢 alert fetch");
      alertsData = await metrolinx.getServiceAlert();

      cache[ALERT_KEY] = {
        data: alertsData,
        expiresAt: Date.now() + 60 * 1000
      };
    }

    // ✅ 3. Vehicles (optional, real-time)
    let vehicleData;
    const VEHICLE_KEY = "vehicles";

    if (
      cache[VEHICLE_KEY] &&
      cache[VEHICLE_KEY].expiresAt > Date.now()
    ) {
      vehicleData = cache[VEHICLE_KEY].data;
    } else {
      vehicleData = await metrolinx.getVehicles();

      cache[VEHICLE_KEY] = {
        data: vehicleData,
        expiresAt: Date.now() + 30 * 1000 // 30 sec cache
      };
    }

    // ✅ Final response
    res.json({
      date,
      schedule: scheduleData,
      serviceAlerts: alertsData,
      vehicles: vehicleData,
      lastUpdated: Date.now()
    });

  } catch (err) {
    console.error("❌ SUPER API ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;