import readline from 'readline'
import tools_config from "./tools_config";
import OpenAI from "openai";
import prompt from "./prompt";
import say from "say";
import processFunction from "./tools/index";
import {ResponseInput} from "openai/resources/responses/responses";
import {ResponsesModel} from "openai/resources";

const MODEL: ResponsesModel = "gpt-4.1-mini-2025-04-14"

const getUserInput = async (): Promise<string> => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        })

        process.stdout.write('\x1b[90m')
        rl.prompt()

        // Listen for input and build the string
        rl.on('line', (input: string) => {
            rl.close()
            process.stdout.write('\x1b[0m')
            resolve(input)
        });
    });
};

const request = async (client: OpenAI, input: OpenAI.Responses.ResponseInput, prev_id: string | null) => client.responses.create({
    model: MODEL,
    previous_response_id: prev_id,
    input,
    text: {
        format: {
            type: "text",
        }
    },
    tools: tools_config,
    temperature: 0.5,
    max_output_tokens: 1200,
    top_p: 1,
    store: true
})

async function main() {
    const client = new OpenAI({apiKey: process.env.OPENAI_APIKEY})
    // always send the previous response back to the API - even though it's only required for function calling
    // keeps the logic simple and consistent
    // so, previous_response_id refers to the one BEFORE the last response
    // prev_ids[0] is the oldest
    const prev_ids: [string | null, string | null] = [null, null]
    const firstInput = await getUserInput()

    // currentInput will be used twice. first, as an input (obviously)
    // and as the start of inputCache
    let inputCache: ResponseInput = [...prompt]
    // as an array because it *might* be empty (when the response only contains function calls for example)
    // simpler syntax with the spread operator
    let currentInput: ResponseInput = [{role: 'user', content: firstInput}]
    // gosh this 'all-new' response API is so trash


    // ts warning duh
    let always = true
    while (always) {
        const response = await request(client, [...inputCache, ...currentInput], prev_ids[0])
        prev_ids[0] = prev_ids[1]
        prev_ids[1] = response.id
        // if there's no reference to begin with
        // we shouldn't reset the cache
        if (prev_ids[0]) {
            inputCache = []
        }

        inputCache.push(...currentInput)
        currentInput = []

        for (const [index, output] of response.output.entries()) {
            switch (output.type) {
                case "message": {
                    const msg = output.content.map(c => c.type == 'output_text' ? c.text : c.refusal).join("\n")
                    console.log(`Assistant: ${msg}`)
                    say.speak(msg, "Microsoft David Desktop")
                    inputCache.push(output)

                    if (index != response.output.length - 1) break

                    const userMessage = await getUserInput()
                    currentInput.push({role: "user", content: userMessage})
                    break
                }
                case "function_call": {
                    inputCache.push(output)

                    const result = await processFunction(output)
                    // console.log(result)

                    currentInput.push({
                        type: 'function_call_output',
                        call_id: output.call_id,
                        output: result
                    })
                    break
                }
            }
        }
    }
}

main().then()