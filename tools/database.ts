import {mkdirSync, readFileSync, writeFileSync} from 'fs'
import * as path from "node:path";

type DbType = Record<string, Record<string, string>>
type Result = ResultWithContent | ResultNoContent
interface ResultWithContent {
    success: boolean
    reason?: string
    content: Array<string> | string
}

export interface ResultNoContent {
    success: boolean
    reason?: string
}

interface DbParamSet {
    path: string
    action: 'set'
    value: string
}

interface DbParamRetrieve {
    path: string
    action: 'retrieve'
}

export type DbParam = DbParamSet | DbParamRetrieve

const path_relative = 'db/db.json'

export class Database {
    private data: DbType

    public constructor() {
        try {
            const cache_raw = readFileSync(path.resolve(process.cwd(), path_relative), 'utf-8')
            this.data = JSON.parse(cache_raw)
        } catch (e) {
            this.data = {
                memory: {},
                selectors: {},
            }

            this.sync()
        }
    }

    public set(location: string, content: string): ResultNoContent {
        let split = location.split('.')
        if (split.length != 2) return ({
            success: false,
            reason: "Invalid input syntax"
        })

        let cat = split[0]
        let key = split[1]

        if (!(cat in this.data)) {
            this.data[cat] = {}
        }

        this.data[cat][key] = content
        this.sync()
        return ({
            success: true
        })
    }

    public retrieve(location: string): Result {
        let split = location.split('.')

        let cat = split[0]
        if (!(cat in this.data)) return ({
            success: false,
            reason: "Category does not exist"
        })

        switch(split.length) {
            case 1: return ({
                success: true,
                content: Object.keys(this.data[cat])
            })
            case 2: {
                let key = split[1]
                if (!(key in this.data[cat])) return ({
                    success: false,
                    reason: "Key does not exist"
                })

                return ({
                    success: true,
                    content: this.data[cat][key],
                })
            }
            default: return ({
                success: false,
                reason: "Invalid input syntax"
            })
        }
    }

    private sync() {
        mkdirSync(path.dirname(path.resolve(process.cwd(), path_relative)), {recursive: true})
        writeFileSync(path.resolve(process.cwd(), path_relative), JSON.stringify(this.data), 'utf-8')
    }
}

const db = new Database()
export default db