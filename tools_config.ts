import OpenAI from "openai";

const tools: OpenAI.Responses.Tool[] = [
    {
        type: "function",
        name: "database",
        strict: false,
        parameters: {
            type: "object",
            required: ["path", "action", "summary"],
            properties: {
                path: {
                    type: "string",
                    description: "use [cat].[key] to set/delete a value. example: memory.mark_instagram"
                },
                value: {
                    type: "string",
                    description: "value of the key, used for set"
                },
                action: {
                    type: "string",
                    enum: ["set", "delete"],
                    description: "What to do with the database. Retrieve will return everything inside the category."
                },
                summary: {
                    type: "string",
                    description: "Summary of your action"
                },
            },
            additionalProperties: false
        },
        description: "Access to a structured, key-value database"
    },
    {
        type: "function",
        name: "browser_open_url",
        strict: true,
        parameters: {
            type: "object",
            required: ["summary", "url"],
            properties: {
                url: {
                    type: "string",
                    description: "URL to open"
                },
                summary: {
                    type: "string",
                    description: "Summary of your action"
                },
            },
            additionalProperties: false
        },
        description: "To open browser"
    },
    {
        type: "function",
        name: "browser_close",
        strict: true,
        parameters: {
            type: "object",
            required: ["summary"],
            properties: {
                summary: {
                    type: "string",
                    description: "Summary of your action"
                },
            },
            additionalProperties: false
        },
        description: "To close browser"
    }
    // {
    //     type: "web_search_preview",
    //     user_location: {
    //         city: "Bandung",
    //         type: "approximate",
    //         region: "West Java",
    //         country: "ID"
    //     },
    //     search_context_size: "medium"
    // }
]

export default tools