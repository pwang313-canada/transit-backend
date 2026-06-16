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

    if (isToday) {
      //console.log(`🟢 Today’s date (${date}) – fetching live (cache bypassed)`);
      rawData = await metrolinx.getScheduleDateStops(date, line, direction);
      // Optionally store raw data in cache for other uses, but do not rely on it for today's filtering
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

    return res.json(rawData);

  } catch (err) {
    console.error("Stop-Date-line-direction error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/date-line-direction", async (req, res) => {
  try {
    // Helper: get current time as a Date object in Toronto timezone
    const getCurrentTorontoDate = () => {
      const nowTorontoStr = new Date().toLocaleString("en-US", { timeZone: "America/Toronto" });
      return new Date(nowTorontoStr);
    };

    // Helper: parse API datetime string "YYYY-MM-DD HH:MM:SS" into a Date object
    // Assumes the string is in Toronto local time.
    const parseApiDateTime = (dateTimeStr) => {
      const [datePart, timePart] = dateTimeStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      // Create a Date object using UTC to avoid local timezone shifting
      // Then we will treat it as Toronto time by comparing with current Toronto time.
      // The trick: we will convert both to UTC milliseconds and compare, but we need the offset.
      // Simpler: create a Date using the components in UTC, then add the current Toronto offset?
      // Instead, we'll parse the string as if it were in the server's local time (which may not be Toronto).
      // To guarantee correctness, we must use the timezone. Without a library, it's messy.
      // However, since the backend is likely hosted in Toronto, we can assume the server's local time is Toronto.
      // If that's true, we can simply do:
      return new Date(`${datePart}T${timePart}`);
    };

    const getCurrentEST = () => {
      const now = getCurrentTorontoDate();
      return now;
    };

    const dateParam = req.query.date;
    const { line, direction, stopId } = req.query;
    const maxTrips = parseInt(req.query.maxTrips, 10) || 10;

    const cache = req.cache || global.cache;
    if (!cache) return res.status(500).json({ error: "Cache not initialized" });
    if (!line || !direction) return res.status(400).json({ error: "Missing line or direction" });

    // Use the requested date (or today) to fetch raw schedule
    const targetDateStr = dateParam || new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" }).replace(/-/g, "");
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

    const now = getCurrentEST();
    const filteredData = JSON.parse(JSON.stringify(rawData));
    const lines = filteredData.Lines?.Line;

    if (lines && lines.length > 0) {
      for (const lineObj of lines) {
        if (lineObj.Trip && Array.isArray(lineObj.Trip)) {
          const originalCount = lineObj.Trip.length;
          const keptTrips = [];

          for (const trip of lineObj.Trip) {
            const stops = trip.Stops;
            if (!stops || stops.length === 0) continue;

            let referenceTime = null;
            if (stopId) {
              const stopInfo = stops.find(s => s.Code === stopId);
              if (stopInfo) referenceTime = parseApiDateTime(stopInfo.Time);
            } else {
              referenceTime = parseApiDateTime(stops[0].Time);
            }

            if (referenceTime) {
              const diffMinutes = (referenceTime - now) / (1000 * 60);
              // Keep if departure time is not more than 15 minutes ago
              if (diffMinutes >= -15) {
                keptTrips.push(trip);
              }
            }
          }

          keptTrips.sort((a, b) => {
            const ta = parseApiDateTime(a.Stops[0].Time);
            const tb = parseApiDateTime(b.Stops[0].Time);
            return ta - tb;
          });

          lineObj.Trip = keptTrips.slice(0, maxTrips);
          console.log(`⏰ Filtered ${lineObj.Code}: ${originalCount} → ${lineObj.Trip.length} trips`);
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