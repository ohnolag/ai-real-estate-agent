import 'dotenv/config';

import { makeRentCastToolSchema, rentCastTool } from '../tools/rentCastTool.js';

import OpenAI from 'openai';

const client = new OpenAI();

const tools = [ makeRentCastToolSchema({
    zipCode: true,
    price: true,
    squareFootage: true,
    bedrooms: true,
    propertyType: true
})];

export async function testAI(prompt) {
    const response = await client.responses.create({
        model: "gpt-5-mini",
        input: [
            { role: "user", content: prompt },
        ],
        tools,
    });

    console.log(JSON.stringify(response.output, null, 2));
}