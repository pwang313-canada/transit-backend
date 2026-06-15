const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");
global.cache = {};

/**
 * Test route
 */
router.get("/test", (req, res) => {
    res.send("Schedule route works!");
});

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
    const maxTrips = parseInt(req.query.maxTrips, 10) || 10;

    const cache = req.cache || global.cache;
    if (!cache) {
      return res.status(500).json({ error: "Cache not initialized" });
    }

    if (!line || !direction) {
      return res.status(400).json({ error: "Missing line or direction" });
    }

    const cacheKey = `${date}_${line}_${direction}`;
    let rawData = cache[cacheKey]?.data;

    if (!rawData) {
      console.log(`🐢 Cache MISS: ${cacheKey} – fetching live`);
      rawData = await metrolinx.getScheduleDateLineDirection(date, line, direction);
      cache[cacheKey] = { data: rawData };
    } else {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
    }

    const todayStr = getToday();
    let filteredData = rawData;

    if (date === todayStr) {
      const now = new Date();
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const timeToSeconds = (timeStr) => {
        // If string contains space, take the part after space (the time)
        let timePart = timeStr;
        if (timeStr.includes(' ')) {
          timePart = timeStr.split(' ')[1];
        }
        const parts = timePart.split(':');
        if (parts.length < 2) return 0;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
        if (hours === 24) return 86400;
        return hours * 3600 + minutes * 60 + seconds;
      };

      // Deep clone to avoid mutating cache
      filteredData = JSON.parse(JSON.stringify(rawData));

      const lines = filteredData.Lines?.Line;
      if (lines && lines.length > 0) {
        for (const lineObj of lines) {
          if (lineObj.Trip && Array.isArray(lineObj.Trip)) {
            // ✅ Keep only trips where last stop time > current time
            const originalCount = lineObj.Trip.length;
            lineObj.Trip = lineObj.Trip.filter(trip => {
              const stops = trip.Stops;
              if (!stops || stops.length === 0) return false;
              const lastStop = stops[stops.length - 1];
              const lastStopTime = lastStop.Time;
              if (!lastStopTime) return false;
              const lastSeconds = timeToSeconds(lastStopTime);
              // Strictly greater than current time (no grace)
              return lastSeconds > currentSeconds;
            });
            console.log(`✂️ Filtered trips for ${lineObj.Code}: ${originalCount} → ${lineObj.Trip.length}`);
          }
        }
      }

      // Check if any trips remain
      const anyTripLeft = lines?.some(lineObj =>
        lineObj.Trip && lineObj.Trip.length > 0
      );
      if (!anyTripLeft) {
        console.log(`🗑️ All trips passed for ${cacheKey} – deleting cache entry`);
        delete cache[cacheKey];
        return res.json({ Lines: { Line: [] } });
      }
    }

    // ---- Limit number of trips per line to maxTrips ----
    const lines = filteredData.Lines?.Line;
    if (lines && lines.length > 0) {
      for (const lineObj of lines) {
        if (lineObj.Trip && Array.isArray(lineObj.Trip) && lineObj.Trip.length > maxTrips) {
          console.log(`✂️ Limiting trips from ${lineObj.Trip.length} to ${maxTrips}`);
          lineObj.Trip = lineObj.Trip.slice(0, maxTrips);
        }
      }
    }

    return res.json(filteredData);

  } catch (err) {
    console.error("Date-line-direction error:", err.message);
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