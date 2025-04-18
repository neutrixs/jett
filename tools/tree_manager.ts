import { SerializedAXNode } from "puppeteer";

const CHUNK_SIZE = 100

// ID here is just the index path, joined by dot
// example: 1.4.0.1

export interface ExportResult {
    success: boolean
    content?: {
        role: string
        name: string
        hasChildren: boolean
        id: string
    }[]
    reason?: string
}

export interface SimpleResult {
    success: boolean
    reason?: string
}

export default class TreeManager {
    private tree: SerializedAXNode
    private currentTraversal: SerializedAXNode[]

    public constructor(node: SerializedAXNode) {
        if (!node.children) {
            throw new Error("Empty nodes. Try again after the page loads.")
        } else {
            this.tree = node
            this.currentTraversal = node.children
        }
    }

    private traverse(ids: number[]): SimpleResult {
        // will always exist
        let current = this.tree.children as SerializedAXNode[]

        for (const id of ids) {
            const element = current[id]
            if (!element) {
                return {
                    success: false,
                    reason: `ID ${ids.join('.')} does not exist`
                }
            }
            if (!element.children) {
                return {
                    success: false,
                    reason: `Cannot traverse. ID ${ids.join('.')} has no children`
                }
            }
            current = element.children
        }

        this.currentTraversal = current

        return {
            success: true
        }
    }

    private dumpAll(id: string): ExportResult {
        let ids: number []
        if (!id) {
            ids = []
        } else {
            ids = id.split('.').map(c => parseInt(c))
            if(ids.some(c => isNaN(c))) return {
                success: false,
                reason: "Invalid ID. ID must be numbers separated by dots"
            }
        }

        const result = this.traverse(ids)
        if (!result.success) return result

        const content: ExportResult["content"] = this.currentTraversal.map((c, i) => ({
            role: c.role,
            name: c.name || '',
            hasChildren: !!c.children,
            id: [...ids.join('.'), i].join(".")
        }))

        return {
            success: true,
            content
        }
    }

    public dump(id: string, chunk: number): ExportResult {
        const result = this.dumpAll(id)
        if (!result.success || !result.content) return result

        const start = chunk * CHUNK_SIZE
        const end = start + CHUNK_SIZE
        return {
            success: true,
            content: result.content.slice(start, end)
        }
    }

    public async click(id: string): Promise<SimpleResult> {
        const ids = id.split('.').map(c => parseInt(c))
        if(ids.some(c => isNaN(c))) return {
            success: false,
            reason: "Invalid ID. ID must be numbers separated by dots"
        }

        // impossible to be undefined
        // because ids could never be empty
        const index = ids.pop() as number
        const traverseResult = this.traverse(ids)
        if (!traverseResult.success) return traverseResult

        const element = this.currentTraversal[index]
        if (!element) return {
            success: false,
            reason: `ID ${id} does not exist`
        }

        const handle = await element.elementHandle()
        if (!handle) return {
            success: false,
            reason: `Element handle cannot be accessed. Maybe the element no longer exists?`
        }

        try {
            await handle.click()
        } catch (e) {
            return {
                success: false,
                reason: `Element may no longer exists. Error: ${e}`,
            }
        }
        return {
            success: true,
            reason: `Element clicked. Please check the URL again`
        }
    }
}