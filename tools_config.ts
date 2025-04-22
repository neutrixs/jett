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
        name: "browser_open",
        strict: true,
        parameters: {
            type: "object",
            required: ["headless", "summary"],
            properties: {
                headless: {
                    type: "boolean",
                    description: "Whether to use headless mode"
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
    },
    {
        type: "function",
        name: "browser_open_url",
        description: "Open a url in the browser",
        strict: true,
        parameters: {
            type: "object",
            required: ["url", "summary"],
            properties: {
                url: {
                    type: "string",
                    description: "The url to open"
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
        name: "browser_evaluate",
        description: "Evaluate commands in the browser console. Only use as last resort",
        strict: true,
        parameters: {
            type: "object",
            required: ["command", "summary"],
            properties: {
                command: {
                    type: "string",
                    description: "The command to be passed to the functions. Evaluate is basically like the browser's console, you can do everything there"
                },
                summary: {
                    type: "string",
                    description: "Summary of your action"
                }
            },
            additionalProperties: false,
        }
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
        name: "screen_reader_dump",
        description: "get list of children inside an element",
        strict: true,
        parameters: {
            type: "object",
            required: ["id", "summary", "chunk"],
            properties: {
                id: {
                    type: "string",
                    description: "The ID of the parent element. Supply empty string to get the root elements"
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
        description: "click on the element with specific ID",
        strict: true,
        parameters: {
            type: "object",
            required: ["id", "summary"],
            properties: {
                id: {
                    type: "string",
                    description: "The ID of the element to click"
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