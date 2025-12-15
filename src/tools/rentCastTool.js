import 'dotenv/config';

const CALL_API_FLAG = true;

//generate JSON schema for RentCast tool
export function makeRentCastToolSchema({
    zipCode=false,
    price=false,
    squareFootage=false,
    bedrooms=false,
    propertyType=false
}={}) {
    let properties = {};

    if(zipCode){
        properties.zip_code = {
            "type": "string",
            "pattern": "^[0-9]{5}$",
            "description": "The five-digit US ZIP code to search for listings"
        }
    }

    if(squareFootage){
        properties.minimum_square_footage = {
            "type": "number",
            "description": "Minimum interior square footage of the listing"
        };
        properties.maximum_square_footage = {
            "type": "number",
            "description": "Maximum interior square footage of the listing"
        };
    }

    if(price){
        properties.minimum_price = {
            "type": "number",
            "description": "Minimum listing price in USD"
        };
        properties.maximum_price = {
            "type": "number",
            "description": "Maximum listing price in USD"
        };
    }

    if(bedrooms){
        properties.minimum_bedrooms = {
            "type": "number",
            "description": "Minimum number of bedrooms"
        };
        properties.maximum_bedrooms = {
            "type": "number",
            "description": "Maximum number of bedrooms"
        };
    }

    if(propertyType){
        properties.property_type = {
            "type": "string",
            "enum": ["Single Family", "Condo", "Townhouse", "Multi-Family", "Apartment", "Land", "Manufactured"],
            "description": "Type of property"
        };
    }

    //TODO: add strict mode enforcement
    return{
        "type": "function",
        "name": "get_listings",
        "description": "Retrieves a list of active real estate property listings",
        "parameters": {
            "type": "object",
            properties,
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
        const minPart = min == null ? '*' : min - 0.1;
        const maxPart = max == null ? '*' : max + 0.1;
        return `${minPart}:${maxPart}`;
    }

    let url = new URL('https://api.rentcast.io/v1/listings/sale?limit=500&status=Active');
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

    console.log("constructed URL:", url);
    return url;
}

//call the RentCast API to get listings
async function getListingsRentCast(url) { 
    const key = CALL_API_FLAG ? process.env.RENT_CAST_API_KEY : 0;

    const options = {method: 'GET', headers: {accept: 'application/json', 'X-Api-Key': key}};

    try{
        console.log("fetch called");
        const res = await fetch(url, options);
        console.log("response received");
        if (!res.ok) {
            return { error: `HTTP ${res.status}` };
        }
        return { data: await res.json() };
    } catch (error) {
        return { error: error.message };
    }
}

//optimize API response for LLM consumption
function deserializeListings(res) {
    //console.log("deserializing data:", res);
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
    return deserializeListings(res);
}
