import OpenAI from "openai";
import db, { DbParam } from "./database";

export default async function processFunction(call:  OpenAI.Responses.ResponseFunctionToolCall) {
    let output = ''
    switch (call.name) {
        case 'database': {
            const args: DbParam = JSON.parse(call.arguments)
            switch (args.action) {
                case 'retrieve': {
                    const result = db.retrieve(args.path)
                    output = JSON.stringify(result)
                    break
                }
                case 'set': {
                    const result = db.set(args.path, args.value)
                    output = JSON.stringify(result)
                    break
                }
            }
            break
        }
    }

    return output || 'Unknown Error'
}