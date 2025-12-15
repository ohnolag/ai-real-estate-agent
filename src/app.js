import { rentCastTool, makeRentCastToolSchema } from "./tools/rentCastTool.js";

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

testRentCastTool();