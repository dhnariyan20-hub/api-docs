/**
 * EASIR API DOCUMENTATION CONFIGURAITON
 */

module.exports = {
    total: 2,

    categories: {

        "Social Media Search": [
            {
                name: "TikTok Search",
                description: "Allows users to search for TikTok content based on the provided search term.",
                path: "/api/tiktok",
                method: "get",
                params: [
                    {
                        name: "search",
                        type: "string",
                        required: true,
                        description: "Search term to find relevant TikTok content (e.g. 'funny cats')"
                    }
                ]
            }
        ],

        "AI Generation": [
            {
                name: "Meta AI Image Generator",
                description: "Generate images using Meta AI with a custom prompt and session cookie.",
                path: "/api/metaai",
                method: "get",
                params: [
                    {
                        name: "prompt",
                        type: "string",
                        required: true,
                        description: "Text prompt used to generate the image (e.g. 'A futuristic city at night')"
                    },
                    {
                        name: "Cookie",
                        type: "string | array",
                        required: true,
                        description: "Valid Meta session cookie. Example: datr=xxx; sb=xxx;"
                    }
                ]
            }
        ]

    }
};