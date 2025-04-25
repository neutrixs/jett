import {Browser, Page} from "puppeteer";
import puppeteer from "puppeteer-extra"
import stealth from "puppeteer-extra-plugin-stealth"
import adblocker from "puppeteer-extra-plugin-adblocker"
import * as path from "node:path";
import TreeManager, {SimpleResult} from "./tree_manager";
import {DEFAULT_MODEL, ModelStore, REASONING_MODEL} from "../index";

const MAX_EVAL_CHARS = 1000

puppeteer.use(stealth())
puppeteer.use(adblocker({blockTrackers: true}))

export interface BrowserArgs {
    action: 'open' | 'close' | 'open_url' | 'get_snapshot' | 'dump' | 'click' | 'evaluate'
    headless?: boolean
    id?: string
    chunk?: number
    url?: string
    command?: string
}

interface EvalResult {
    success: boolean,
    reason?: string,
    content?: string,
    currentURL?: string,
    pageTitle?: string,
}

class BrowserManager {
    public browser: Browser | null
    public page: Page | null
    private tree: TreeManager | null

    public constructor() {
        this.browser = null
        this.page = null
        this.tree = null
    }

    public async call(args: BrowserArgs, currentModel: ModelStore): Promise<SimpleResult | EvalResult> {
        switch (args.action) {
            case 'open': {
                const result = await this.open(args.headless)
                if (result.success) currentModel.model = REASONING_MODEL

                return result
            }
            case 'close': {
                currentModel.model = DEFAULT_MODEL
                return this.close()
            }
            case 'open_url': {
                if (!args.url) return {
                    success: false,
                    reason: "URL is not provided"
                }
                return this.openURL(args.url)
            }
            case 'get_snapshot': {
                return this.get_snapshot()
            }
            case 'dump': {
                if (args.chunk === undefined) return {
                    success: false,
                    reason: "Chunk is not provided. Provide 0 instead"
                }

                return this.dump(args.id ?? "", args.chunk)
            }
            case 'click': {
                if (!args.id) return {
                    success: false,
                    reason: "ID is not provided"
                }
                return this.click(args.id)
            }
            case 'evaluate': {
                if (!args.command) return {
                    success: false,
                    reason: "Command is not provided"
                }
                return this.evaluate(args.command)
            }
            default: {
                return {
                    success: false,
                    reason: "Invalid action"
                }
            }
        }
    }

    public async get_snapshot(): Promise<SimpleResult> {
        if (!this.page) return {
            success: false,
            reason: "No active pages"
        }

        const snapshot = await this.page.accessibility.snapshot()
        if (!snapshot) return {
            success: false,
            reason: "Cannot get snapshot"
        }

        try{
            this.tree = new TreeManager(snapshot)

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

    public dump(id: string, chunk: number): SimpleResult {
        if (!this.tree) return {
            success: false,
            reason: "No snapshot"
        }
        return this.tree.dump(id, chunk)
    }

    public async click(id: string): Promise<SimpleResult> {
        if (!this.tree) return {
            success: false,
            reason: "No snapshot"
        }
        return await this.tree.click(id)
    }

    public async openURL(url: string): Promise<SimpleResult> {
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

    public async evaluate(command: string): Promise<EvalResult> {
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

    public open(headless?: boolean): Promise<SimpleResult> {
        return new Promise(r => {
            if (this.browser) {
                r({success: true})
                return
            }

            puppeteer.launch({
                headless: headless ?? true,
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

    public close(): Promise<SimpleResult> {
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