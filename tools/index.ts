import OpenAI from "openai";
import db, {DbParam} from "./database";
import browser, {BrowserActionParam, BrowserParam, ClickParam, DumpParam} from "./browser";

export default async function processFunction(call:  OpenAI.Responses.ResponseFunctionToolCall) {
    let output = ''
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
            const args: BrowserParam = JSON.parse(call.arguments)
            switch(args.action) {
                case 'open': {
                    const result = await browser.open(args.headless)
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
        case 'screen_reader_get_snapshot': {
            output = JSON.stringify(await browser.get_snapshot())
            break
        }
        case 'screen_reader_dump': {
            const args: DumpParam = JSON.parse(call.arguments)
            output = JSON.stringify(browser.dump(args.id, args.chunk))
            break
        }
        case 'screen_reader_click': {
            const args: ClickParam = JSON.parse(call.arguments)
            output = JSON.stringify(await browser.click(args.id))
            break
        }
        default: {
            output = 'Unrecognized function call'
            break
        }
    }

    return output || 'Unknown Error'
}