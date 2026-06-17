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

router.get("/date-stops", async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const { line, direction } = req.query;

    const cache = req.cache || global.cache;
    if (!cache) {
      return res.status(500).json({ error: "Cache not initialized" });
    }

    if (!line || !direction) {
      return res.status(400).json({ error: "Missing line or direction" });
    }

    const todayStr = getToday();
    const isToday = (date === todayStr);
    const cacheKey = `stop_${date}_${line}_${direction}`;
    let rawData;

    // Determine if the requested date is in the future (for logging/consistency)
    const targetDate = new Date(
      parseInt(date.slice(0,4)),
      parseInt(date.slice(4,6)) - 1,
      parseInt(date.slice(6,8))
    );
    const todayDate = new Date(
      parseInt(todayStr.slice(0,4)),
      parseInt(todayStr.slice(4,6)) - 1,
      parseInt(todayStr.slice(6,8))
    );
    const isFuture = targetDate > todayDate;

    // For today, always fetch live; for other dates, use cache if available.
    if (isToday) {
      //console.log(`🟢 Today’s date (${date}) – fetching live (cache bypassed)`);
      rawData = await metrolinx.getScheduleDateStops(date, line, direction);
      cache[cacheKey] = { data: rawData, timestamp: Date.now() };
    } else {
      if (cache[cacheKey]?.data) {
        console.log(`⚡ Cache HIT: ${cacheKey}`);
        rawData = cache[cacheKey].data;
      } else {
        console.log(`🐢 Cache MISS: ${cacheKey} – fetching live`);
        rawData = await metrolinx.getScheduleDateStops(date, line, direction);
        cache[cacheKey] = { data: rawData };
      }
    }

    // No time filtering applied – we return all stops for the requested date.
    // For future dates, this returns the full stop list (same as today).
    return res.json(rawData);
  } catch (err) {
    console.error("Stop-Date-line-direction error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/date-line-direction", async (req, res) => {
  try {
    const { date, line, direction } = req.query;
    const maxTrips = parseInt(req.query.maxTrips, 20) || 20;

    const cache = req.cache || global.cache;
    if (!cache) return res.status(500).json({ error: "Cache not initialized" });
    if (!line || !direction) return res.status(400).json({ error: "Missing line or direction" });

    // Determine target date (default: today in Toronto)
    const targetDateStr = date || new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" }).replace(/-/g, "");
    const cacheKey = `trip_${targetDateStr}_${line}_${direction}`;
    let rawData;

    if (cache[cacheKey]?.data) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      rawData = cache[cacheKey].data;
    } else {
      console.log(`🐢 Cache MISS: ${cacheKey} – fetching live`);
      rawData = await metrolinx.getScheduleDateLineDirection(targetDateStr, line, direction);
      cache[cacheKey] = { data: rawData, timestamp: Date.now() };
    }

    const filteredData = JSON.parse(JSON.stringify(rawData));
    const lines = filteredData.Lines?.Line;

    // Helper: parse "YYYY-MM-DD HH:MM:SS" into Date (UTC)
    const parseDateTime = (str) => {
      if (!str) return null;
      const [datePart, timePart] = str.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    };

    // Determine if the requested date is in the future (compared to today in Toronto)
    const todayToronto = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Toronto" }));
    todayToronto.setHours(0, 0, 0, 0);
    const targetDate = new Date(
      parseInt(targetDateStr.slice(0,4)),
      parseInt(targetDateStr.slice(4,6)) - 1,
      parseInt(targetDateStr.slice(6,8))
    );
    const isFuture = targetDate > todayToronto;

    // Current Toronto time in UTC ms (only needed for non‑future dates)
    const nowToronto = new Date().toLocaleString("en-US", { timeZone: "America/Toronto" });
    const nowUtc = new Date(nowToronto).getTime();

    if (lines && lines.length > 0) {
      for (const lineObj of lines) {
        if (lineObj.Trip && Array.isArray(lineObj.Trip)) {
          const originalCount = lineObj.Trip.length;
          const keptTrips = [];

          for (const trip of lineObj.Trip) {
            const stops = trip.Stops;
            if (!stops || stops.length === 0) continue;

            if (!isFuture) {
              // For today/past: keep only if last stop is still in the future
              const lastStop = stops[stops.length - 1];
              if (!lastStop?.Time) continue;
              const lastTime = parseDateTime(lastStop.Time);
              if (!lastTime) continue;
              if (lastTime.getTime() <= nowUtc) {
                console.log(`⏱️ Discard trip ${trip.Number} (last stop ${lastStop.Code} at ${lastStop.Time}) – already passed`);
                continue;
              }
            }
            // For future dates: keep all trips
            keptTrips.push(trip);
          }

          // Sort remaining trips by first stop time (ascending)
          keptTrips.sort((a, b) => {
            const ta = parseDateTime(a.Stops[0]?.Time);
            const tb = parseDateTime(b.Stops[0]?.Time);
            return (ta?.getTime() || 0) - (tb?.getTime() || 0);
          });

          lineObj.Trip = keptTrips.slice(0, maxTrips);
          console.log(`⏰ Filtered ${lineObj.Code}: ${originalCount} → ${lineObj.Trip.length} trips (future? ${isFuture})`);
        }
      }
    }

    return res.json(filteredData);
  } catch (err) {
    console.error("Date-line-direction error:", err.message);
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