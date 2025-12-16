import { rentCastTool, makeRentCastToolSchema } from "./tools/rentCastTool.js";
import { chat } from "./services/GPTAgent.js";
import { readChat, logChat } from "./utils.js";

//await logChat([{ role: "user", content: "find me a one bedroom condo in a nice neighborhood in Los Angeles with at least 1000 square feet." }]);

let raw = await readChat();
let input = JSON.parse(raw);

console.log(input);

await logChat(await chat(input));