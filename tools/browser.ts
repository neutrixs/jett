import puppeteer, {Browser, Page} from "puppeteer";
import * as path from "node:path";

const MAX_EVAL_CHARS = 1000

export interface BrowserParam {
    action: 'open' | 'close'
}

export interface BrowserActionParam {
    action: 'open_url' | 'evaluate' | 'click' | 'input',
    value?: string
}

interface ActionResult {
    success: boolean,
    reason?: string,
    content?: string,
}

interface EvalResult {
    success: boolean,
    reason?: string,
    content?: string,
    currentURL?: string,
    pageTitle?: string,
}

interface OpenCloseResult {
    success: boolean
    reason?: string
}

class BrowserManager {
    public browser: Browser | null
    public page: Page | null

    public constructor() {
        this.browser = null
        this.page = null
    }

    public async browserAction(args: BrowserActionParam): Promise<ActionResult | EvalResult> {
        switch(args.action) {
            case "open_url": {
                if (!args.value) return {
                    success: false,
                    reason: "Value is required for action open_url"
                }
                return this.openURL(args.value)
            }
            case "evaluate": {
                if (!args.value) return {
                    success: false,
                    reason: "Value is required for action evaluate"
                }
                return this.evaluate(args.value)
            }
            case "click":
            case "input":{
                return {
                    success: false,
                    reason: "Function not yet supported"
                }
            }
            default: return ({
                success: false,
                reason: "Unrecognized action"
            })
        }
    }

    private async openURL(url: string): Promise<ActionResult> {
        if (!this.browser) {
            return {
                success: false,
                reason: "Browser is not opened",
            }
        }

        try {
            if (!this.page) {
                this.page = await this.browser.newPage()
            }
            await this.page.goto(url)
            return {
                success: true
            }
        } catch (e) {
            return {
                success: false,
                reason: String(e),
            }
        }
    }

    private async evaluate(command: string): Promise<EvalResult> {
        if (!this.page) return {
            success: false,
            reason: "No active pages"
        }

        let result = ""
        try {
            result = String((await this.page.evaluate(command)))
        } catch (e: any) {
            if (e.message.includes("Execution context was destroyed")) {
                result = "[Page has been redirected/reloaded, please check the URL again]"
            } else {
                return {
                    success: false,
                    reason: String(e),
                }
            }
        }

        let title = "[cannot get page title]"
        try {
            title = await this.page.title()
        } catch (_) {}

        return {
            success: true,
            content: result.length > MAX_EVAL_CHARS ? result.slice(0, MAX_EVAL_CHARS) : result,
            currentURL: this.page.url(),
            pageTitle: title,
        }
    }

    public open(): Promise<OpenCloseResult> {
        return new Promise(r => {
            if (this.browser) {
                r({success: true})
                return
            }

            puppeteer.launch({
                headless: false,
                userDataDir: path.resolve(process.cwd(), "db/browser"),
                pipe: true,
            }).then(browser => {
                this.browser = browser
                this.page = null
                r({success: true})
            }).catch(e => {
                r({success: false, reason: String(e)})
            })
        })
    }

    public close(): Promise<OpenCloseResult> {
        return new Promise(r => {
            if (!this.browser) {
                r({success: true})
                return
            }

            this.browser.close().then(() => {
                this.browser = null
                r({success: true})
            }).catch(e => {
                r({success: false, reason: String(e)})
            })
        })
    }
}

const browser = new BrowserManager()
export default browser