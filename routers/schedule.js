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

    const todayStr = getToday();
    const isToday = (date === todayStr);
    const cacheKey = `${date}_${line}_${direction}`;
    let rawData;

    // ---- LOGGING: Show current environment info ----
    const now = new Date();
    console.log(`[DEBUG] Server time: ${now.toString()}`);
    console.log(`[DEBUG] UTC time: ${now.toUTCString()}`);
    console.log(`[DEBUG] ISO string: ${now.toISOString()}`);
    console.log(`[DEBUG] Requested date: ${date}, todayStr: ${todayStr}, isToday: ${isToday}`);

    if (isToday) {
      console.log(`🟢 Today’s date (${date}) – bypassing cache, fetching live`);
      rawData = await metrolinx.getScheduleDateLineDirection(date, line, direction);
      cache[cacheKey] = { data: rawData, timestamp: Date.now() };
    } else {
      if (cache[cacheKey]?.data) {
        console.log(`⚡ Cache HIT: ${cacheKey}`);
        rawData = cache[cacheKey].data;
      } else {
        console.log(`🐢 Cache MISS: ${cacheKey} – fetching live`);
        rawData = await metrolinx.getScheduleDateLineDirection(date, line, direction);
        cache[cacheKey] = { data: rawData };
      }
    }

    // ---- LOG RAW TRIP COUNT ----
    let rawTripCount = 0;
    const rawLines = rawData?.Lines?.Line;
    if (rawLines && rawLines.length > 0) {
      const lineObj = Array.isArray(rawLines) ? rawLines[0] : rawLines;
      rawTripCount = lineObj.Trip?.length || 0;
    }
    console.log(`[DEBUG] Raw trips from metrolinx: ${rawTripCount}`);

    // ---- Apply time filter only for today ----
    let filteredData = rawData;
    if (isToday) {
      const nowLocal = new Date();
      const currentSeconds = nowLocal.getHours() * 3600 + nowLocal.getMinutes() * 60 + nowLocal.getSeconds();
      console.log(`[DEBUG] Current local time: ${nowLocal.toLocaleString()}, seconds since midnight: ${currentSeconds}`);

      const timeToSeconds = (timeStr) => {
        let timePart = timeStr;
        if (timeStr.includes(' ')) timePart = timeStr.split(' ')[1];
        const parts = timePart.split(':');
        if (parts.length < 2) return 0;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
        if (hours === 24) return 86400;
        return hours * 3600 + minutes * 60 + seconds;
      };

      filteredData = JSON.parse(JSON.stringify(rawData));
      const lines = filteredData.Lines?.Line;
      if (lines && lines.length > 0) {
        for (const lineObj of lines) {
          if (lineObj.Trip && Array.isArray(lineObj.Trip)) {
            const originalCount = lineObj.Trip.length;
            const keptTrips = [];
            for (const trip of lineObj.Trip) {
              const stops = trip.Stops;
              if (!stops || stops.length === 0) {
                console.log(`[DEBUG] Trip ${trip.Number} has no stops – skipping`);
                continue;
              }
              const lastStop = stops[stops.length - 1];
              if (!lastStop.Time) {
                console.log(`[DEBUG] Trip ${trip.Number} last stop has no time – skipping`);
                continue;
              }
              const lastSeconds = timeToSeconds(lastStop.Time);
              const keep = lastSeconds > currentSeconds;
              console.log(`[DEBUG] Trip ${trip.Number}: last stop "${lastStop.Code}" time "${lastStop.Time}" -> seconds ${lastSeconds} > ${currentSeconds} ? ${keep}`);
              if (keep) keptTrips.push(trip);
            }
            lineObj.Trip = keptTrips;
            console.log(`⏰ Filtered ${lineObj.Code}: ${originalCount} → ${lineObj.Trip.length} trips (last stop > now)`);
          }
        }
      }

      const anyTripLeft = lines?.some(lineObj =>
        lineObj.Trip && lineObj.Trip.length > 0
      );
      if (!anyTripLeft) {
        console.log(`🗑️ No remaining trips for today – deleting cache entry`);
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

    // ---- FINAL LOG: how many trips are being returned ----
    const finalTripCount = lines && lines[0]?.Trip?.length || 0;
    console.log(`[DEBUG] Returning ${finalTripCount} trips for ${line} ${direction} on ${date}`);

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