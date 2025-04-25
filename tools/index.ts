import OpenAI from "openai";
import db, {DbParam} from "./database";
import browser, {BrowserArgs} from "./browser";
import {ModelStore} from "../index";

export default async function processFunction(call: OpenAI.Responses.ResponseFunctionToolCall, currentModel: ModelStore) {
    let output: string
    try {
        const args = JSON.parse(call.arguments)
        if (args.summary) {
            console.log(`\x1b[34m${args.summary}\x1b[0m`)
        }
    } catch (_) {}

    switch (call.name) {
        case 'database': {
            const args: DbParam = JSON.parse(call.arguments)
            output = JSON.stringify(db.action(args))
            break
        }
        case 'browser': {
            const args: BrowserArgs = JSON.parse(call.arguments)
            output = JSON.stringify(await browser.call(args, currentModel))
            break
        }
        default: {
            output = 'Unrecognized function call'
            break
        }
    }

    return output || 'Unknown Error'
}