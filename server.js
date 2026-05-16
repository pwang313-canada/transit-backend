const express = require("express");
const app = express();
const scheduleRouter = require("./routers/schedule");
const serviceUpdateRouter = require("./routers/serviceUpdate");
const faresRouter = require("./routers/fares");
const feedRouter = require("./routers/feed");

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/schedule", scheduleRouter);
app.use("/api/fares", faresRouter);
app.use("/api/service", serviceUpdateRouter);
app.use("/api/feed", feedRouter);

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

// Extract unique line‑direction pairs from a full schedule array
function extractLineDirectionPairs(scheduleData) {
  const pairs = new Set();
  for (const trip of scheduleData) {
    if (trip.LineCode && trip.Direction) {
      pairs.add(`${trip.LineCode}_${trip.Direction}`);
    }
  }
  return Array.from(pairs).map(pair => {
    const [line, direction] = pair.split('_');
    return { line, direction };
  });
}

async function preloadCache() {
  const today = getToday();
  console.log("🔥 Preloading cache for:", today);

  try {
    const metrolinx = require("./services/metrolinx");

    // 3. Preload each line‑direction combination
    for (const { line, direction } of pairs) {
      const key = `${today}_${line}_${direction}`;
      if (!cache[key] || cache[key].expiresAt <= Date.now()) {
        try {
          const lineData = await metrolinx.getScheduleDateLineDirection(today, line, direction);
          cache[key] = {
            data: lineData,
            expiresAt: Date.now() + msUntilMidnight()
          };
          console.log(`✅ Cached: ${key}`);
        } catch (err) {
          console.error(`❌ Failed to cache ${key}:`, err.message);
        }
      }
    }

    console.log("✅ Preload complete");

  } catch (err) {
    console.error("❌ Preload failed:", err.message);
  }
}

function startMidnightRefresh() {
  const delay = msUntilMidnight();
  console.log(`⏳ Next refresh in ${Math.round(delay / 1000)} sec`);

  setTimeout(async () => {
    console.log("🌙 Midnight refresh triggered");
    // Clear entire cache (all dates will be refetched)
    Object.keys(cache).forEach(k => delete cache[k]);
    await preloadCache();
    startMidnightRefresh();
  }, delay);
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