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
        name: "browser",
        strict: false,
        parameters: {
            type: "object",
            required: ["summary", "action"],
            properties: {
                summary: {
                    type: "string",
                    description: "Summary of your action"
                },
                action: {
                    type: "string",
                    description: "What to do with the browser",
                    enum: ["open", "close", "open_url", "get_snapshot", "dump", "click", "evaluate"]
                },
                headless: {
                    type: "boolean",
                    description: "Whether to open the browser in headless mode"
                },
                url: {
                    type: "string",
                    description: "URL to open"
                },
                id: {
                    type: "string",
                    description: "ID of the element"
                },
                chunk: {
                    type: "integer",
                },
                command: {
                    type: "string",
                    description: "Command to evaluate"
                }
            },
            additionalProperties: false
        },
        description: "To open browser"
    }
]

export default tools