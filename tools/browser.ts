import puppeteer, {Browser, Page, SerializedAXNode} from "puppeteer";
import * as path from "node:path";

const MAX_EVAL_CHARS = 1000
const SEARCH_CHUNK_SIZE = 100

export interface BrowserParam {
    action: 'open' | 'close'
}

export interface BrowserActionParam {
    action: 'open_url' | 'evaluate' | 'click' | 'input',
    value?: string
}

export interface SearchParam {
    by: 'role' | 'name',
    content: string,
    chunk?: number,
}

export interface ClickParam {
    index: number
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

interface SearchResult {
    success: boolean
    reason?: string
    content?: SerializedAXNode[]
}

class BrowserManager {
    public browser: Browser | null
    public page: Page | null
    private accessibility_snapshot: SerializedAXNode | null
    private search_cache: SerializedAXNode[]

    public constructor() {
        this.browser = null
        this.page = null
        this.accessibility_snapshot = null
        this.search_cache = []
    }

    public async get_snapshot(): Promise<ActionResult> {
        if (!this.page) return {
            success: false,
            reason: "No active pages"
        }

        try {
            this.accessibility_snapshot = await this.page.accessibility.snapshot()
        } catch (e) {
            return {
                success: false,
                reason: String(e),
            }
        }

        return {
            success: true,
        }
    }

    public async search(by: 'role' | 'name', content: string, chunk?: number): Promise<SearchResult> {
        if (!this.page) return {
            success: false,
            reason: "No active pages"
        }
        if (!this.accessibility_snapshot) return {
            success: false,
            reason: "Please run get_snapshot first"
        }

        const searchResult = (this.accessibility_snapshot.children || []).filter(child => {
            if (by == 'role') {
                return child.role.toLowerCase() == content.toLowerCase()
            } else if (by == 'name') {
                return child.name?.toLowerCase() == content.toLowerCase()
            }
            return false
        })

        const startIndex = chunk ? chunk * SEARCH_CHUNK_SIZE : 0
        const cache = searchResult.slice(startIndex, startIndex + SEARCH_CHUNK_SIZE)

        this.search_cache = cache

        return {
            success: true,
            content: cache,
        }
    }

    public async click(index: number): Promise<ActionResult> {
        if (!this.page) return {
            success: false,
            reason: "No active pages"
        }

        if (!this.search_cache[index]) return {
            success: false,
            reason: "Index out of range. Make sure the index matches the output of search"
        }

        try {
            const handle = await this.search_cache[index].elementHandle()
            if (!handle) return {
                success: false,
                reason: "Element handle cannot be accessed"
            }
            await handle.click()
        } catch (e) {
            return {
                success: false,
                reason: String(e),
            }
        }

        return {
            success: true,
            reason: "Click successful. Please re-check the current URL of the page. run get_snapshot if needed."
        }
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