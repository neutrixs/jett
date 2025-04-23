import {ResponseComputerToolCall, ResponseComputerToolCallOutputScreenshot} from "openai/resources/responses/responses";
import browser from "../tools/browser";
import {KeyInput, MouseButton} from "puppeteer";

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default async function processComputer(request: ResponseComputerToolCall): Promise<ResponseComputerToolCallOutputScreenshot> {
    const action = request.action
    const page = browser.page
    if (!page) throw new Error("No page")
    switch (action.type) {
        case "click": {
            const {x, y, button: btn} = action
            const button: MouseButton = btn == "wheel" ? "middle" : btn

            console.log(`\x1b[34mAction: ${button} click at (${x}, ${y})\x1b[0m`)
            await page.mouse.click(x, y, {button})
            break
        }
        case "scroll": {
            const {x, y, scroll_x, scroll_y} = action
            console.log(`\x1b[34mAction: Scroll at (${x}, ${y}) with offsets (${scroll_x}, ${scroll_y})\x1b[0m`)
            await page.mouse.move(x, y)
            await page.evaluate(`window.scrollBy(${scroll_x}, ${scroll_y})`)
            break
        }
        case "keypress": {
            const {keys} = action;
            for (const k of keys) {
                console.log(`Action: keypress '${k}'`);
                // A simple mapping for common keys; expand as needed.
                if (k.includes("ENTER")) {
                    await page.keyboard.press("Enter");
                } else if (k.includes("SPACE")) {
                    await page.keyboard.press(" ");
                } else {
                    await page.keyboard.press(k as KeyInput);
                }
            }
            break
        }
        case "type": {
            const { text } = action;
            console.log(`\x1b[34mAction: type text '${text}'\x1b[0m`);
            await page.keyboard.type(text);
            break;
        }
        case "wait": {
            console.log(`\x1b[34mAction: wait\x1b[0m`);
            await timeout(2000);
            break;
        }
        case "screenshot": {
            console.log(`\x1b[34mAction: screenshot\x1b[0m`);
            break;
        }
        default: {
            console.log(`\x1b[31mAction: Unknown action ${action.type}\x1b[0m`)
            break;
        }
    }

    const screenshot = await page.screenshot({encoding: "base64", type: "png"})
    return {
        type: "computer_screenshot",
        image_url: `data:image/png;base64,${screenshot}`,
    }
}