import 'dotenv/config';

import { makeRentCastToolSchema, rentCastTool } from '../tools/rentCastTool.js';

import OpenAI from 'openai';

const TOOL_CALL_LIMIT = process.env.TOOL_CALL_LIMIT;
const MODEL = process.env.CHATGPT_MODEL;

const client = new OpenAI();

const tools = [ makeRentCastToolSchema({
    zipCode: true,
    price: true,
    squareFootage: true,
    bedrooms: true,
    propertyType: true
})];

const instructions = `
            You are a helpful real estate assistant.

            Use the available tools to find real estate listings
            based on user criteria.

            Follow these rules:
            - call get_listings at most ${TOOL_CALL_LIMIT} times per request
            - if the user request is ambiguous, make your best guess
            - you must specify a location parameter for all get_listings calls
            - only report listings that were retrieved using the get_listings tool
`;

export async function chat(input) {
    let response = await client.responses.create({
        model: MODEL,
        instructions,
        input,
        tools,
    });

    input = [...input, ...response.output];

     await Promise.all(
        response.output
        .filter(item => item.type === 'function_call' && item.name === 'get_listings')
        .map(async (call, index) => {
            if(index >= TOOL_CALL_LIMIT) return;
            const args = JSON.parse(call.arguments);
            const listings = await rentCastTool(args);
            
            input.push({ 
                type: "function_call_output", 
                call_id: call.call_id, 
                output: JSON.stringify(listings) 
            });
        })
    );

    return input;
}
