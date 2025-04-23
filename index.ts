import readline from 'readline'
import tools_config from "./tools_config";
import OpenAI from "openai";
import prompt from "./prompt";
import processFunction from "./tools/index";
import {ResponseInput, Tool} from "openai/resources/responses/responses";
import {ResponsesModel} from "openai/resources";
import processComputer from "./computer/computer";

export interface ModelStore {
    current: ResponsesModel
}

export const COMPUTER_MODEL: ResponsesModel = "computer-use-preview"
export const DEFAULT_MODEL: ResponsesModel = "gpt-4.1-mini-2025-04-14"

const model: ModelStore = {
    current: DEFAULT_MODEL,
}

const computer_tool: Tool = {
    type: "computer-preview",
    display_height: 768,
    display_width: 1024,
    environment: 'browser'
}

const tools_with_computer = [...tools_config, computer_tool]

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

const getUserConfirm = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
            prompt: ''
        })

        rl.on('line', (input: string) => {
            rl.close()
            if (input.toLowerCase() == 'y') {
                resolve(true)
            } else {
                resolve(false)
            }
        });
    })
}

const request = async (client: OpenAI, input: OpenAI.Responses.ResponseInput, prev_id: string | null) => client.responses.create({
    model: model.current,
    previous_response_id: prev_id,
    input,
    text: {
        format: {
            type: "text",
        }
    },
    tools: model.current == COMPUTER_MODEL ? tools_with_computer : tools_config,
    temperature: 0.5,
    max_output_tokens: 1200,
    top_p: 1,
    store: true,
    truncation: "auto"
})

async function main() {
    const client = new OpenAI()
    let prev_id: string | null = null
    const firstInput = await getUserInput()
    let currentInput: ResponseInput = [...prompt, {role: 'user', content: firstInput}]

    // ts warning duh
    let always = true
    while (always) {
        const response = await request(client, currentInput, prev_id)
        prev_id = response.id
        currentInput = []

        for (const [index, output] of response.output.entries()) {
            switch (output.type) {
                case "message": {
                    console.log(`Jett: ${output.content.map(c => c.type == 'output_text' ? c.text : c.refusal).join("\n")}`)
                    if (index != response.output.length - 1) break

                    const userMessage = await getUserInput()
                    currentInput.push({role: "user", content: userMessage})
                    break
                }
                case "function_call": {
                    const result = await processFunction(output, model)
                    // console.log(result)

                    currentInput.push({
                        type: 'function_call_output',
                        call_id: output.call_id,
                        output: result
                    })
                    break
                }
                case "computer_call": {
                    for (const check of output.pending_safety_checks) {
                        process.stdout.write(`\x1b[31m${check.message}\x1b[0m [y/n]: `)
                        const confirm = await getUserConfirm()
                        if (!confirm) return
                    }

                    const result = await processComputer(output)

                    currentInput.push({
                        type: 'computer_call_output',
                        call_id: output.call_id,
                        output: result,
                        acknowledged_safety_checks: output.pending_safety_checks
                    })
                }
            }
        }
    }
}

main().then()