import OpenAI from "openai";
import db, {DbParam} from "./database";
import browser, {
    BrowserEvaluateParam, BrowserOpenParam,
    BrowserOpenURLParam,
    ClickParam,
    DumpParam
} from "./browser";

export default async function processFunction(call:  OpenAI.Responses.ResponseFunctionToolCall) {
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
        case 'browser_open': {
            const args: BrowserOpenParam = JSON.parse(call.arguments)
            output = JSON.stringify(await browser.open(args.headless))
            break
        }
        case 'browser_close': {
            output = JSON.stringify(await browser.close())
            break
        }
        case 'browser_open_url': {
            const args: BrowserOpenURLParam = JSON.parse(call.arguments)
            output = JSON.stringify(await browser.openURL(args.url))
            break
        }
        case 'browser_evaluate': {
            const args: BrowserEvaluateParam = JSON.parse(call.arguments)
            output = JSON.stringify(await browser.evaluate(args.command))
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