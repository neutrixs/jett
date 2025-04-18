import { SerializedAXNode } from "puppeteer";

const CHUNK_SIZE = 100

// ID here is just the index path, joined by dot
// example: 1.4.0.1

interface ExportResult {
    success: boolean
    content?: {
        role: string
        name: string
        hasChildren: boolean
        id: string
    }[]
    reason?: string
}

interface TraverseResult {
    success: boolean
    reason?: string
}

export default class TreeManager {
    private tree: SerializedAXNode
    private traversal: number[]

    public constructor(node: SerializedAXNode) {
        this.traversal = []
        if (!node.children) {
            throw new Error("Empty nodes. Try again after the page loads.")
        } else {
            this.tree = node
        }
    }

    public traverse(id: string): TraverseResult {
        const split = id.split(".")
        const requestedTraversal = split.map(c => parseInt(c))

        let current = this.tree.children as SerializedAXNode[]
        let currentTraversal: number[] = []
        for (const index of requestedTraversal) {
            let element = current[index]
            currentTraversal.push(index)

            if (!element) return {
                success: false,
                reason: `ID ${currentTraversal.join('.')} does not exist`
            }

            if (!element.children) return {
                success: false,
                reason: `Cannot traverse to ${currentTraversal.join('.')}. It does not have children`
            }

            current = element.children
        }

        this.traversal = requestedTraversal

        return {
            success: true
        }
    }

    public dump(chunk: number): ExportResult {
        // this will always exist
        // because it's checked already in constructor
        let current = this.tree.children as SerializedAXNode[]
        let currentTraversal: number[] = []

        for (const index of this.traversal) {
            let element = current[index]
            currentTraversal.push(index)

            // no need to check if element or its children exist
            // because whenever traverse is called
            // it will be checked
            current = element.children as SerializedAXNode[]
        }

        const result: ExportResult["content"] = current.map((e, i) => ({
            role: e.role,
            name: e.name || '',
            hasChildren: "children" in e,
            id: [...this.traversal, i].join('.'),
        }))

        const start = chunk * CHUNK_SIZE

        return {
            success: true,
            content: result.slice(start, start + CHUNK_SIZE),
        }
    }
}