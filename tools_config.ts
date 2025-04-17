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
                    description: "use [cat].[key] to set/delete a value. to retrieve: [cat]. example: memory.mark_instagram"
                },
                value: {
                    type: "string",
                    description: "value of the key, used for set"
                },
                action: {
                    type: "string",
                    enum: ["set", "retrieve", "delete"],
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
        name: "browser",
        strict: true,
        parameters: {
            type: "object",
            required: ["action", "summary"],
            properties: {
                action: {
                    type: "string",
                    enum: ["open", "close"],
                    description: "Open/Close browser based on needs"
                },
                summary: {
                    type: "string",
                    description: "Summary of your action"
                },
            },
            additionalProperties: false
        },
        description: "Open a URL in puppeteer"
    },
    {
        type: "function",
        name: "browser_action",
        strict: false,
        parameters: {
            type: "object",
            required: ["action", "summary"],
            properties: {
                value: {
                    type: "string",
                    description: "The value to be passed to the functions. Evaluate is basically like the browser's console, you can do everything there."
                },
                action: {
                    type: "string",
                    enum: ["evaluate", "open_url"],
                    description: "The action to do in puppeteer."
                },
                summary: {
                    type: "string",
                    description: "Summary of your action"
                },
            },
            additionalProperties: false
        },
        description: "Open a URL in puppeteer"
    },
    {
        type: "function",
        name: "screen_reader_get_snapshot",
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
        }
    },
    {
        type: "function",
        name: "screen_reader_search",
        description: "search through the snapshot either by its role or by its name",
        strict: true,
        parameters: {
            type: "object",
            required: ["by", "content", "summary", "chunk"],
            properties: {
                by: {
                    type: "string",
                    enum: ["role", "name"],
                    description: "Search by role or name"
                },
                content: {
                    type: "string",
                    description: "The content to search for"
                },
                chunk: {
                    type: "number",
                    description: "Starts from 0. To go to the next chunk, simply increment the value by 1"
                },
                summary: {
                    type: "string",
                    description: "Summary of your action"
                },
            },
            additionalProperties: false
        }
    },
    {
        type: "function",
        name: "screen_reader_click",
        description: "click on the element that matches the last search",
        strict: true,
        parameters: {
            type: "object",
            required: ["index", "summary"],
            properties: {
                index: {
                    type: "number",
                    description: "The index of the element to click from the last search"
                },
                summary: {
                    type: "string",
                    description: "Summary of your action"
                },
            },
            additionalProperties: false,
        }
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