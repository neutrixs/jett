import {mkdirSync, readFileSync, writeFileSync} from 'fs'
import * as path from "node:path";

type DbType = Record<string, Record<string, string>>
type Result = ResultWithContent | ResultNoContent
interface ResultWithContent {
    success: boolean
    reason?: string
    content: Record<string, string>
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

interface DbParamDelete {
    path: string,
    action: 'delete'
}

export type DbParam = DbParamSet | DbParamRetrieve | DbParamDelete

const path_relative = 'db/db.json'

export class Database {
    public data: DbType

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

    public action(args: DbParam): Result | ResultNoContent {
        switch (args.action) {
            case 'set': {
                return this.set(args.path, args.value)
            }
            case 'delete': {
                return this.delete(args.path)
            }
            // in case the A.I. goes wild
            default: {
                return {
                    success: false,
                    reason: "Invalid action",
                }
            }
        }
    }

    public set(location: string, value: string): ResultNoContent {
        let split = location.split('.')
        if (split.length != 2) return ({
            success: false,
            reason: "Invalid input syntax"
        })

        let cat = split[0]
        let key = split[1]

        if (!(cat in this.data)) return {
            success: false,
            reason: `Category ${cat} does not exist`
        }

        this.data[cat][key] = value

        this.sync()
        return ({
            success: true
        })
    }

    public delete(path: string): ResultNoContent {
        let split = path.split('.')
        if (split.length != 2) return ({
            success: false,
            reason: "Invalid input syntax"
        })

        let cat = split[0]
        let key = split[1]

        if (!(cat in this.data)) return ({
            success: false,
            reason: `Category ${cat} does not exist`
        })

        if (!(key in this.data[cat])) return {
            success: false,
            reason: `Key ${key} does not exist`
        }

        delete this.data[cat][key]

        this.sync()
        return {
            success: true
        }
    }

    private sync() {
        mkdirSync(path.dirname(path.resolve(process.cwd(), path_relative)), {recursive: true})
        writeFileSync(path.resolve(process.cwd(), path_relative), JSON.stringify(this.data), 'utf-8')
    }
}

const db = new Database()
export default db