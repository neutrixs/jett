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

    public async openURL(url: string): Promise<ActionResult> {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: false,
                userDataDir: path.resolve(process.cwd(), "db/browser"),
                pipe: true,
            })
            this.page = null
        }

        try {
            if (!this.page) {
                this.page = await this.browser.newPage()
                await this.page.setViewport({width: 1024, height: 768, deviceScaleFactor: 0.75})
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