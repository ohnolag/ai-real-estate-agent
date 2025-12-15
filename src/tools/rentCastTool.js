import 'dotenv/config';

export function makeRentCastToolSchema({
    zipCode=false,
    price=false,
    squareFootage=false
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
        maximum_square_footage
    } = params;

    //helper to convert min/max to API range format
    function convertToRange(min, max){
        return `${min ?? '*'}:${max ?? '*'}`;
    }

    const url = 'https://api.rentcast.io/v1/listings/sale?limit=500&status=Active';
    //add search params
    if (zip_code) { url += `&zipCode=${zip_code}`; }
    if (minimum_price != null || maximum_price != null) { 
        url += `&price=${convertToRange(minimum_price, maximum_price)}`;
    }
    if (minimum_square_footage != null || maximum_square_footage != null) { 
        url += `&squareFootage=${convertToRange(minimum_square_footage, maximum_square_footage)}`;
    }

    console.log("constructed URL:", url);
    return url;
}

//call the RentCast API to get listings
async function getListingsRentCast(url) { 

    const options = {method: 'GET', headers: {accept: 'application/json', 'X-Api-Key': process.env.RENT_CAST_API_KEY}};

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
function deserializeListings(data) {
    return data;
}

export async function rentCastTool(params) {
    return serializeParams(params)
    .then(getListingsRentCast)
    .then(deserializeListings);
}
