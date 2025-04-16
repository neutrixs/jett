import OpenAI from "openai";
import db, {DbParam} from "./database";
import browser, {BrowserActionParam, BrowserParam} from "./browser";

export default async function processFunction(call:  OpenAI.Responses.ResponseFunctionToolCall) {
    let output = ''
    switch (call.name) {
        case 'database': {
            const args: DbParam = JSON.parse(call.arguments)
            output = JSON.stringify(db.action(args))
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