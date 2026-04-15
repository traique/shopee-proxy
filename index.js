import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * CORS middleware
 */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  next();
});

/**
 * Retry fetch
 */
async function fetchWithRetry(url, options, retries = 2) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error("Fetch failed");

    return await res.json();
  } catch (err) {
    if (retries > 0) {
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

/**
 * Shopee search proxy
 */
app.get("/search", async (req, res) => {
  try {
    const keyword = req.query.keyword;

    if (!keyword) {
      return res.status(400).json({ error: "Missing keyword" });
    }

    const url = `https://shopee.vn/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(
      keyword
    )}&limit=10`;

    const data = await fetchWithRetry(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
        "accept": "application/json",
        "accept-language": "vi-VN,vi;q=0.9",
        "referer": "https://shopee.vn/",
      },
    });

    const items =
      data?.items?.map((item) => ({
        id: item.item_basic?.itemid,
        shopid: item.item_basic?.shopid,
        name: item.item_basic?.name,
        price: item.item_basic?.price / 100000,
        image: item.item_basic?.image,
        sold: item.item_basic?.historical_sold || 0,
      })) || [];

    return res.json(items);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy failed" });
  }
});

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("Shopee Proxy Running 🚀");
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
