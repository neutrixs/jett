import {Browser, Page} from "puppeteer";
import puppeteer from "puppeteer-extra"
import stealth from "puppeteer-extra-plugin-stealth"
import adblocker from "puppeteer-extra-plugin-adblocker"
import * as path from "node:path";
import TreeManager, {SimpleResult} from "./tree_manager";

const MAX_EVAL_CHARS = 1000

puppeteer.use(stealth())
puppeteer.use(adblocker({blockTrackers: true}))

export interface BrowserOpenParam {
    headless: boolean
}

export interface BrowserOpenURLParam {
    url: string
}

export interface BrowserEvaluateParam {
    command: string
}

export interface DumpParam {
    id: string
    chunk: number
}

export interface ClickParam {
    id: string
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
    private tree: TreeManager | null

    public constructor() {
        this.browser = null
        this.page = null
        this.tree = null
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
        this.tree = new TreeManager(snapshot)

        return {
            success: true
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

    public async openURL(url: string): Promise<ActionResult> {
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

    public open(headless?: boolean): Promise<OpenCloseResult> {
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