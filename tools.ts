import OpenAI from "openai";

export default async function processFunction(call:  OpenAI.Responses.ResponseFunctionToolCall) {
    let output = ''
    switch (call.name) {
        case 'database': {
            //
            break
        }
    }

    return output || 'Unknown Error'
}