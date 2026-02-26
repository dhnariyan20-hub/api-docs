const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();
const route = "/metaai";

/* ---------- Helpers ---------- */

function extractImages(streamText) {
  if (!streamText) return [];

  const urls = [];
  const events = streamText.split("event: next");

  for (const event of events) {
    const match = event.match(/data:\s*(\{.*\})/s);
    if (!match) continue;

    try {
      const json = JSON.parse(match[1]);
      const images =
        json?.data?.sendMessageStream?.images ||
        json?.data?.sendMessageStream?.contentRenderer?.mediaContent?.media ||
        json?.data?.sendMessageStream?.contentRenderer?.mediaContent?.message?.images ||
        [];

      for (const img of images) {
        if (img?.url?.startsWith("http")) {
          urls.push(img.url);
        }
      }
    } catch {}
  }

  return [...new Set(urls)];
}

function formatCookie(cookie) {
  if (!cookie) return null;

  if (Array.isArray(cookie)) {
    return cookie.join("; ");
  }

  try {
    const parsed = JSON.parse(cookie);
    if (Array.isArray(parsed)) {
      return parsed.join("; ");
    }
  } catch {}

  return cookie;
}

function parsePrompt(input) {
  let ratio = "VERTICAL";
  let prompt = input;

  const match = input.match(/(?:--?ar|--?ratio)\s*(\d+:\d+)/i);

  if (match) {
    const map = {
      "1:1": "SQUARE",
      "9:16": "VERTICAL",
      "16:9": "HORIZONTAL",
      "4:5": "VERTICAL",
      "5:4": "HORIZONTAL",
      "3:2": "HORIZONTAL",
      "2:3": "VERTICAL"
    };

    ratio = map[match[1]] || "VERTICAL";
    prompt = input.replace(match[0], "").trim();
  }

  return { prompt, ratio };
}

/* ---------- Route ---------- */

router.get(route, async (req, res) => {
  const { prompt, Cookie } = req.query;

  if (!prompt)
    return res.status(400).json({ error: "prompt is required" });

  if (!Cookie)
    return res.status(400).json({ error: "Cookie is required" });

  try {
    const formattedCookie = formatCookie(Cookie);
    const { prompt: cleanPrompt, ratio } = parsePrompt(prompt);

    const payload = {
      doc_id: "4eef2a9345d205688e5ee546f5f04961",
      variables: {
        conversationId: crypto.randomUUID(),
        content: cleanPrompt,
        userMessageId: crypto.randomUUID(),
        assistantMessageId: crypto.randomUUID(),
        userUniqueMessageId: crypto.randomUUID(),
        turnId: crypto.randomUUID(),
        isNewConversation: true,
        imagineOperationRequest: {
          operation: "TEXT_TO_IMAGE",
          textToImageParams: {
            prompt: cleanPrompt,
            orientation: ratio
          }
        },
        clientTimezone: "Asia/Dhaka",
        userLocale: "en-US"
      }
    };

    const response = await axios.post(
      "https://www.meta.ai/api/graphql",
      payload,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Origin: "https://www.meta.ai",
          Referer: "https://www.meta.ai/",
          Cookie: formattedCookie
        }
      }
    );

    const images = extractImages(response.data);

    return res.json({
      status: true,
      prompt: cleanPrompt,
      ratio,
      total: images.length,
      images
    });

  } catch (err) {
    console.error("META ERROR:", err.response?.data || err.message);
    return res.status(500).json({
      status: false,
      error: "Failed to generate image"
    });
  }
});

module.exports = router;