import { rentCastTool, makeRentCastToolSchema } from "./tools/rentCastTool.js";
import { testAI } from "./services/GPTAgent.js";

const testParams = {
    zip_code: "94103",
    minimum_price: 1000000,
    minimum_square_footage: 800,
    maximum_square_footage: 2000
};

async function testRentCastTool() {
    const listings = await rentCastTool(testParams);
    console.log("Listings:", listings);
}

//testRentCastTool();

testAI("Find me a condo to buy in a nice neighborhood in Los Angeles with at least 2 bedrooms and 1000 square feet.");