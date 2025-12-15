import { getListingsRentCast, makeRentCastToolSchema } from "./tools/rentCastTool.js";

console.log(makeRentCastToolSchema({zipCode:true, price:true, squareFootage:true}));
console.log(makeRentCastToolSchema({zipCode:true, price:true, squareFootage:true}).parameters.properties);