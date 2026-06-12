const express = require("express");
const app = express();
const scheduleRouter = require("./routers/schedule");
const serviceUpdateRouter = require("./routers/serviceUpdate");
const faresRouter = require("./routers/fares");
const feedRouter = require("./routers/feed");
const goTrackerRouter = require("./routers/goTracker");

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/schedule", scheduleRouter);
app.use("/api/fares", faresRouter);
app.use("/api/serviceUpdate", serviceUpdateRouter);
app.use("/api/feed", feedRouter);
app.use("/api/goTracker", goTrackerRouter);

app.get("/", (req, res) => {
  res.send("API is running");
});

// In‑memory cache (only for date‑line‑direction)
const cache = {};

function getToday() {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

async function preloadCache() {
  const today = getToday();
  console.log("🔥 Preloading cache for:", today);

  try {
    const data = await require("./services/metrolinx").getScheduleAllLine(today);

    cache[today] = {
      data,
      expiresAt: Date.now() + msUntilMidnight()
    };

    console.log("✅ Preload complete");

  } catch (err) {
    console.error("❌ Preload failed:", err.message);
  }
}

function startMidnightRefresh() {
  const ms = getMsUntilMidnight();

  setTimeout(async () => {
    console.log("🌙 Midnight refresh triggered");

    // ✅ FIXED
    Object.keys(cache).forEach(k => delete cache[k]);

    await preloadCache();

    startMidnightRefresh();
  }, ms);
}

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

// Attach cache to request (so routes can read it)
app.use((req, res, next) => {
  req.cache = cache;
  next();
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await preloadCache();
  startMidnightRefresh();
});