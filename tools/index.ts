import OpenAI from "openai";
import db, {DbParam, ResultNoContent} from "./database";
import browser, {BrowserActionParam, BrowserParam} from "./browser";

export default async function processFunction(call:  OpenAI.Responses.ResponseFunctionToolCall) {
    let output = ''
    switch (call.name) {
        case 'database': {
            const args: DbParam = JSON.parse(call.arguments)
            switch (args.action) {
                case 'retrieve': {
                    const result = db.retrieve(args.path)
                    output = JSON.stringify(result)
                    break
                }
                case 'set': {
                    const result = db.set(args.path, args.value)
                    output = JSON.stringify(result)
                    break
                }
                default: {
                    const result: ResultNoContent = {
                        success: false,
                        reason: "Invalid action argument"
                    }
                    output = JSON.stringify(result)
                    break
                }
            }
            break
        }
        case 'browser': {
            const args: BrowserParam = JSON.parse(call.arguments)
            switch(args.action) {
                case 'open': {
                    const result = await browser.open()
                    output = JSON.stringify(result)
                    break
                }
                case 'close': {
                    const result = await browser.close()
                    output = JSON.stringify(result)
                    break
                }
            }
            break
        }
        case 'browser_action': {
            const args: BrowserActionParam = JSON.parse(call.arguments)
            output = JSON.stringify(await browser.browserAction(args))
            break
        }
    }

    return output || 'Unknown Error'
}