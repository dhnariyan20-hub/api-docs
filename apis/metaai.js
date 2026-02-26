const axios = require('axios');
const crypto = require("crypto");

function extractOnlineImages(streamText) {
  try {
    if (!streamText) return [];

    const imageUrls = [];
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
          if (img?.url && img.url.startsWith("http")) {
            imageUrls.push(img.url);
          }
        }
      } catch (e) {
        continue;
      }
    }

    return [...new Set(imageUrls)];

  } catch (err) {
    return [];
  }
}

function formatCookie(Cookie) {
  if (!Cookie) return null;

  if (Array.isArray(Cookie)) {
    return Cookie.map(c => c.trim()).join("; ");
  }

  if (typeof Cookie === "string") {
    try {
      const parsed = JSON.parse(Cookie);
      if (Array.isArray(parsed)) {
        return parsed.map(c => c.trim()).join("; ");
      }
    } catch {}

    return Cookie.trim();
  }

  return null;
}

function parsePromptAndRatio(input) {
  let ratio = "VERTICAL";
  let prompt = input;

  const ratioRegex = /(?:--?ratio|--?ar)\s*=?\s*(\d+:\d+)/i;
  const match = input.match(ratioRegex);

  if (match) {
    const value = match[1].trim();

    const ratioMap = {
      "1:1": "SQUARE",
      "9:16": "VERTICAL",
      "16:9": "HORIZONTAL",
      "4:5": "VERTICAL",
      "5:4": "HORIZONTAL",
      "3:2": "HORIZONTAL",
      "2:3": "VERTICAL"
    };

    ratio = ratioMap[value] || "VERTICAL";

    prompt = input.replace(ratioRegex, "").trim();
  }

  return { prompt, ratio };
}

async function generateImage(fullPrompt, Cookie) {
  const formattedCookie = formatCookie(Cookie);
  const { prompt, ratio } = parsePromptAndRatio(fullPrompt);
  
  try {
    let data = JSON.stringify({
      "doc_id": "4eef2a9345d205688e5ee546f5f04961",
      "variables": {
        "conversationId": crypto.randomUUID(),
        "content": prompt,
        "userMessageId": "b941ad48-6102-4259-9661-6b51825e598b",
        "assistantMessageId": "8be77445-a89e-4568-8f0c-2d2f7affd433",
        "userUniqueMessageId": "7427283429708096677",
        "turnId": "150a18b3-6547-4e1b-b034-2917587a3846",
        "spaceId": null,
        "mode": "create",
        "rewriteOptions": null,
        "attachments": null,
        "mentions": null,
        "clippyIp": null,
        "isNewConversation": true,
        "imagineOperationRequest": {
          "operation": "TEXT_TO_IMAGE",
          "textToImageParams": {
            "prompt": prompt,
            "orientation": ratio
          }
        },
        "qplJoinId": null,
        "clientTimezone": "Asia/Dhaka",
        "developerOverridesForMessage": null,
        "clientLatitude": null,
        "clientLongitude": null,
        "devicePixelRatio": null,
        "entryPoint": null,
        "promptSessionId": "dc2e3578-77bd-475e-a217-abd893a19416",
        "promptType": null,
        "conversationStarterId": null,
        "userAgent": "Mozilla/5.0 (Linux; Android 15; XANON X91 Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.109 Mobile Safari/537.36",
        "currentBranchPath": null,
        "promptEditType": "new_message",
        "userLocale": "en-US",
        "userEventId": null
      }
    });

    let config = {
      method: 'POST',
      url: 'https://www.meta.ai/api/graphql',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 15; XANON X91 Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.109 Mobile Safari/537.36',
        'Accept': 'text/event-stream',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        'sec-ch-ua-platform': '"Windows"',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144"',
        'sec-ch-ua-mobile': '?0',
        'baggage': 'sentry-environment=production,sentry-release=72aa5ac2b2e32f1808920e3cc45126e26f9dbeb4,sentry-public_key=2cb2a7b32f5c43f4e020eb1ef6dfc066,sentry-trace_id=7fe733bf1995ccf31f8598f3d6617da0,sentry-org_id=4509963614355457,sentry-sampled=false,sentry-sample_rand=0.33044750871468886,sentry-sample_rate=0.005',
        'sentry-trace': '7fe733bf1995ccf31f8598f3d6617da0-898e65f9904253ff-0',
        'sec-ch-prefers-color-scheme': 'dark',
        'origin': 'https://www.meta.ai',
        'x-requested-with': 'mark.via.gp',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://www.meta.ai/',
        'accept-language': 'en-US,en;q=0.9',
        'priority': 'u=1, i',
        'Cookie': formattedCookie
      },
      data: data
    };

    const response = await axios.request(config);
    return response.data;

  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  config: {
    name: "metaai",
    version: "1.0",
    author: "Ariyan",
    limitation: {
      second: 60,
      useCount: 100
    },
    description: "Generate image using Meta AI",
    sampleBody: {
      prompt: "A cat",
      Cookie: "datr=xxx; sb=xxx;"
    },
    usage: ["{api}/api/ai/metaai?prompt=A cat&Cookie=YOUR_COOKIE"],
    requestBody: {
      prompt: {
        type: "String",
        required: true,
        description: "Text prompt used to generate the image (e.g., 'A futuristic city at night')."
      },
      Cookie: {
        type: "Array | String",
        required: true,
        description: "Valid Meta session cookie. Can be a single cookie string ('datr=xxx; sb=xxx;') or an array of cookie strings ([\"datr=xxx\", \"sb=xxx\"])."
      }
    },
    category: "ai",
    method: "GET",
    endpoint: "/api/ai/metaai"
  },

  execute: async function ({ req, res, log, author, success, error, validationError }) {
    try {
      const { prompt, Cookie } = req.query;

      if (!prompt)
        return validationError(res, "prompt is required", author);

      if (!Cookie)
        return validationError(res, "Cookie is required", author);

      const response = await generateImage(prompt, Cookie);
      const images = extractOnlineImages(response);

      return success(res, images, author);

    } catch (err) {
      log.err("API", `Error in POST /api/ai/metaai: ${err.message}`);
      return error(res, "Failed to generate image", err, author);
    }
  }
};