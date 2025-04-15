import puppeteer, {Browser, Page} from "puppeteer";
import readline from 'readline'
import tools_config from "./tools_config";
import OpenAI from "openai";
import prompt from "./prompt";
import processFunction from "./tools";
import {ResponseFunctionToolCall, ResponseInputItem} from "openai/resources/responses/responses";

const getUserInput = async (): Promise<string> => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        })

        // Listen for input and build the string
        rl.on('line', (input: string) => {
            rl.close()
            resolve(input)
        });
    });
};

async function main() {
    const client = new OpenAI({apiKey: process.env.OPENAI_APIKEY})

    const firstInput = await getUserInput()

    const firstResponse = await client.responses.create({
        model: 'gpt-4.1-mini-2025-04-14',
        input: [...prompt, {role: 'user', content: firstInput}],
        text: {
            format: {
                type: "text"
            }
        },
        reasoning: {},
        tools: tools_config,
        temperature: 0.5,
        max_output_tokens: 1200,
        top_p: 1,
        store: true,
    })

    // function calls are not considered
    let prevID: string | null = null
    let fnResponseInput: OpenAI.Responses.ResponseInput = []
    let currentResponse = firstResponse
    let browser: Browser | null = null
    let page: Page | null = null

    while (true) {
        currentResponse.output.forEach(r => console.log(r))
        const newInput: OpenAI.Responses.ResponseInput = []

        switch (currentResponse.output[0].type) {
            case "message": {
                // only message IDs are considered
                // because we need to include the previous input for function calling
                // and putting its ID means it's a duplicate. it doesn't like it.
                prevID = currentResponse.id
                fnResponseInput = []

                const userMessage = await getUserInput()
                newInput.push({role: 'user', content: userMessage})
                break
            }
            case "function_call": {
                // if prev_id does not exist, that means this is the first message
                // we have to reinclude the system prompt
                // and the user message
                if (!prevID) {
                    newInput.push(...prompt)
                    newInput.push({role: 'user', content: firstInput})
                }

                newInput.push(...fnResponseInput)

                const latestResponse = currentResponse.output[0] as ResponseFunctionToolCall
                newInput.push(latestResponse)
                fnResponseInput.push(latestResponse)
                const result = await processFunction(latestResponse)
                console.log(result)

                const caller: ResponseInputItem = {
                    type: 'function_call_output',
                    call_id: latestResponse.call_id,
                    output: result,
                }
                newInput.push(caller)
                fnResponseInput.push(caller)
                break
            }
        }

        currentResponse = await client.responses.create({
            model: 'gpt-4.1-mini-2025-04-14',
            previous_response_id: prevID,
            input: newInput,
            text: {
                format: {
                    type: "text"
                }
            },
            reasoning: {},
            tools: tools_config,
            temperature: 0.5,
            max_output_tokens: 1200,
            top_p: 1,
            store: true,
        })
    }
}

main().then()