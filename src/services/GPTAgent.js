import 'dotenv/config';

import { makeRentCastToolSchema, rentCastTool } from '../tools/rentCastTool.js';

import OpenAI from 'openai';

const TOOL_CALL_LIMIT = process.env.TOOL_CALL_LIMIT;

const client = new OpenAI();

const tools = [ makeRentCastToolSchema({
    zipCode: true,
    price: true,
    squareFootage: true,
    bedrooms: true,
    propertyType: true
})];

export async function testAI(prompt) {
    let input = [
        { role: "user", content: prompt },
    ];

    let response = await client.responses.create({
        model: "gpt-5-mini",
        instructions:`
            You are a helpful real estate assistant.

            Use the available tools to find real estate listings
            based on user criteria.

            Follow these rules:
            - Call at most ${TOOL_CALL_LIMIT} tool per request
            - Do not ask clarifying questions, if the user request is ambiguous, make your best guess
            `,
        input,
        tools,
    });

    console.log(JSON.stringify(response.output, null, 2));

    input.push(...response.output);

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

    console.log(JSON.stringify(input, null, 2));

    response = await client.responses.create({
        model: "gpt-5-mini",
        instructions:`
            You are a helpful real estate assistant.

            Follow these rules:
            - Respond only with the final answer to the user's request
            - Respond only with listings that were retrieved using the tool
            `,
        input
    });

    console.log(JSON.stringify(response.output, null, 2));
}