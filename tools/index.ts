import OpenAI from "openai";
import db, {DbParam} from "./database";
import browser, {
    BrowserEvaluateParam, BrowserOpenParam,
    BrowserOpenURLParam,
    ClickParam,
    DumpParam
} from "./browser";
import {COMPUTER_MODEL, DEFAULT_MODEL, ModelStore} from "../index";

export default async function processFunction(call:  OpenAI.Responses.ResponseFunctionToolCall, model: ModelStore) {
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
        case 'browser_close': {
            model.current = DEFAULT_MODEL
            output = JSON.stringify(await browser.close())
            break
        }
        case 'browser_open_url': {
            model.current = COMPUTER_MODEL
            const args: BrowserOpenURLParam = JSON.parse(call.arguments)
            output = JSON.stringify(await browser.openURL(args.url))
            break
        }
        default: {
            output = 'Unrecognized function call'
            break
        }
    }

    return output || 'Unknown Error'
}