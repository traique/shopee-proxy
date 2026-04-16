import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

async function fetchShopee(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "accept": "application/json",
        "accept-language": "vi-VN,vi;q=0.9",
        "referer": "https://shopee.vn/",
        "x-api-source": "pc",
      },
    });

    const text = await res.text();

    // debug log
    console.log("STATUS:", res.status);

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

app.get("/search", async (req, res) => {
  try {
    const keyword = req.query.keyword;

    if (!keyword) {
      return res.status(400).json({ error: "Missing keyword" });
    }

    const url = `https://shopee.vn/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(
      keyword
    )}&limit=10`;

    const data = await fetchShopee(url);

    if (!data || !data.items) {
      return res.json([]);
    }

    const items = data.items.map((item) => ({
      id: item.item_basic?.itemid,
      shopid: item.item_basic?.shopid,
      name: item.item_basic?.name,
      price: item.item_basic?.price / 100000,
      image: item.item_basic?.image,
      sold: item.item_basic?.historical_sold || 0,
    }));

    res.json(items);
  } catch (err) {
    console.error("Proxy error:", err);
    res.json([]);
  }
});

app.get("/", (req, res) => {
  res.send("Shopee Proxy Running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
