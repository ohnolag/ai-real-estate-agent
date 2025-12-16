import 'dotenv/config';

import { log } from '../utils.js';

const CALL_API = process.env.CALL_API === 'true';
const LISTINGS_PER_REQUEST = process.env.LISTINGS_PER_REQUEST;

//generate JSON schema for RentCast tool
export function makeRentCastToolSchema({
    zipCode=false,
    price=false,
    squareFootage=false,
    bedrooms=false,
    propertyType=false
}={}) {
    let properties = {};
    let required = [];

    if(zipCode){
        properties.zip_code = {
            "type": ["string", "null"],
            "pattern": "^[0-9]{5}$",
            "description": "The five-digit US ZIP code to search for listings"
        }
        required.push("zip_code");
    }

    if(squareFootage){
        properties.minimum_square_footage = {
            "type": ["number", "null"],
            "description": "Minimum interior square footage of the listing"
        };
        properties.maximum_square_footage = {
            "type": ["number", "null"],
            "description": "Maximum interior square footage of the listing"
        };
        required.push("minimum_square_footage");
        required.push("maximum_square_footage");
    }

    if(price){
        properties.minimum_price = {
            "type": ["number", "null"],
            "description": "Minimum listing price in USD"
        };
        properties.maximum_price = {
            "type": ["number", "null"],
            "description": "Maximum listing price in USD"
        };
        required.push("minimum_price");
        required.push("maximum_price");
    }

    if(bedrooms){
        properties.minimum_bedrooms = {
            "type": ["number", "null"],
            "description": "Minimum number of bedrooms"
        };
        properties.maximum_bedrooms = {
            "type": ["number", "null"],
            "description": "Maximum number of bedrooms"
        };
        required.push("minimum_bedrooms");
        required.push("maximum_bedrooms");
    }

    if(propertyType){
        properties.property_type = {
            "type": ["string", "null"],
            "enum": ["Single Family", "Condo", "Townhouse", "Multi-Family", "Apartment", "Land", "Manufactured"],
            "description": "Type of property"
        };
        required.push("property_type");
    }

    //TODO: add strict mode enforcement
    return{
        "type": "function",
        "name": "get_listings",
        "description": "Retrieves a list of active real estate property listings",
        "strict": true,
        "parameters": {
            "type": "object",
            properties,
            "required": required,
            "additionalProperties": false
        },
    }
}

//convert tool params to API URL
function serializeParams(params){
    const {
        zip_code,
        minimum_price,
        maximum_price,
        minimum_square_footage,
        maximum_square_footage,
        minimum_bedrooms,
        maximum_bedrooms,
        property_type
    } = params;

    //helper to convert min/max to API range format
    function convertToRange(min, max){
        const minPart = min == null ? '*' : (min != 0 ? min - 0.1 : 0);
        const maxPart = max == null ? '*' : max + 0.1;
        return `${minPart}:${maxPart}`;
    }

    let url = new URL(`https://api.rentcast.io/v1/listings/sale?limit=${LISTINGS_PER_REQUEST}&status=Active`);
    //add search params
    if (zip_code) { 
        url.searchParams.set("zipCode", zip_code); 
    }
    if (minimum_price != null || maximum_price != null) { 
        url.searchParams.set("price", convertToRange(minimum_price, maximum_price));
    }
    if (minimum_square_footage != null || maximum_square_footage != null) { 
        url.searchParams.set("squareFootage", convertToRange(minimum_square_footage, maximum_square_footage));
    }
    if (minimum_bedrooms != null || maximum_bedrooms != null) { 
        url.searchParams.set("bedrooms", convertToRange(minimum_bedrooms, maximum_bedrooms));
    }
    if (property_type) {
        url.searchParams.set("propertyType", property_type);
    }

    log(4, "RentCast call", url);
    return url;
}

//call the RentCast API to get listings
async function getListingsRentCast(url) { 
    const key = CALL_API ? process.env.RENT_CAST_API_KEY : 0;

    const options = {method: 'GET', headers: {accept: 'application/json', 'X-Api-Key': key}};

    try{
        log(4, "RentCast called");
        const res = await fetch(url, options);
        log(4, "Rent Cast response received");
        if (!res.ok) {
            log(2, `RentCast API error: HTTP ${res.status}`);
            return { error: `HTTP ${res.status}` };
        }
        return { data: await res.json() };
    } catch (error) {
        log(2, `RentCast API error: ${error.message}`);
        return { error: error.message };
    }
}

//optimize API response for LLM consumption
function deserializeListings(res) {
    log(5, "deserializing Rent Cast data", res);
    if(res.error){
        return { error: res.error };
    }
    return res.data.map(listing => ({
        "address": listing.formattedAddress,
        "property_type": listing.propertyType,
        "price": listing.price,
        "bedrooms": listing.bedrooms,
        "bathrooms": listing.bathrooms,
        "square_footage": listing.squareFootage,
        "lot_size": listing.lotSize,
    }));
}

export async function rentCastTool(params) {
    const url = serializeParams(params);
    const res  = await getListingsRentCast(url)
    const data = deserializeListings(res);
    log(4, "RentCast tool data", data);
    return data;
}
