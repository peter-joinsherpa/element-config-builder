// Initialize Input Parameters
function initialLoad() {

    let param;

    param = document.getElementById('placement');
    for (const [key, value] of Object.entries(config.placement)) {
        var bSelected = (key == 'discovery') ? true : false;
        param.options.add( new Option(key + " - " + value, key, false, bSelected) );
    }   

    param = document.getElementById('language');
    // get language configured in user's browser
    const browserLanguage = navigator.language || navigator.userLanguage;
    for (const [key, value] of Object.entries(config.language)) {
        var bSelected = (browserLanguage == key) ? true : false;
        param.options.add( new Option(value, key, false, bSelected) );
    }  

    param = document.getElementById('passport');
    for (const [key, value] of Object.entries(config.country)) {
        param.options.add( new Option(value, key) );
    }   

    paramOrigin = document.getElementById('origin');
    paramDestination = document.getElementById('destination');
    paramConnection = document.getElementById('connection');
    for (const [key, value] of Object.entries(config.country)) {
        paramOrigin.options.add( new Option(value, 'countryCode~' + key + '~' + value) );
        paramDestination.options.add( new Option(value, 'countryCode~' + key + '~' + value) );
        paramConnection.options.add( new Option(value, 'countryCode~' + key + '~' + value) );
    }
    for (const [key, value] of Object.entries(config.airport)) {
        paramOrigin.options.add( new Option(key + " - " + value, 'airportCode~' + key + '~' + value) );
        paramDestination.options.add( new Option(key + " - " + value, 'airportCode~' + key + '~' + value) );
        paramConnection.options.add( new Option(key + " - " + value, 'airportCode~' + key + '~' + value) );
    }         
    
    let departureDate = new Date();
    let returnDate =  new Date();
    returnDate.setDate(departureDate.getDate() + 7);

    param = document.getElementById('departureDate');
    param.value = departureDate.toISOString().split('T')[0]
    param.min = departureDate.toISOString().split('T')[0]

    param = document.getElementById('returnDate');
    param.value = returnDate.toISOString().split('T')[0]
    param.min = departureDate.toISOString().split('T')[0]

// Set feature flags from UI
    for (const [key, value] of Object.entries(config.features)) {

        document.getElementById(key).checked = value;
        
    }     

// Display Example Code
    generateExampleCode("initialLoad") 

}


// Replace text        
function replaceText(text, searchValue, newValue, isHighlight = false) {

    // return original string if not replacement value provided
    if (!newValue) { return text;} 

    if (isHighlight) {

        return text.replace(searchValue, '<span class=\'highlight\'>' + newValue + '</span>');

    } else {

        return text.replace(searchValue, newValue);

    }
}

// Generate Example Code
function generateExampleCode(idName) {

    let exampleCode = htmlTemplate;
    let elementConfig = "";
    let environment = document.getElementById("environment").value;
    let placement = document.getElementById("placement").value;
    let language = document.getElementById("language").value;
    let traveller = travellerModel;
    let passport = document.getElementById("passport").value;
    let tripType = document.getElementById("trip_type").value;
    let vaccination = document.getElementById("vaccination").value;
    let origin = document.getElementById("origin").value;
    let destination = document.getElementById("destination").value;
    let connection = document.getElementById("connection").value;
    let departureDate = document.getElementById("departureDate").value;
    let returnDate = document.getElementById("returnDate").value;
    let appid = document.getElementById("appid").value;
    let features = config.features;
    
    let utm = {};
    utm['utm_medium'] = document.getElementById("utm_medium").value.trim();
    utm['utm_source'] = document.getElementById("utm_source").value.trim();
    utm['utm_campaign'] = document.getElementById("utm_campaign").value.trim();

    try {

// Set feature flags from UI
        for (const [key, value] of Object.entries(features)) {

            features[key] = (document.getElementById(key).checked)

        }        
        
        exampleCode = exampleCode.replace(/{{ELEMENT}}/g, 'trip');
        exampleCode = exampleCode.replace('{{HOST_SDK}}', config.hostSDK[environment]);
        if (appid) {
            exampleCode = exampleCode.replace('{{APP_ID}}', appid);
        }
        
        elementConfig = `\nplacement: '${placement}',`;
        elementConfig += `\nlanguage: '${language}',`;

        traveller = traveller.replace('{{PASSPORT}}', passport);
        traveller = traveller.replace('{{VACCINATION_TYPE}}', vaccination.split("-")[0]);
        traveller = traveller.replace('{{VACCINATION_STATUS}}', vaccination.split("-")[1]);
        elementConfig += `\n${traveller}`;

        segments = {
            'OutboundConnection': '',
            'Outbound': '',
            'ReturnConnection': '',
            'Return': ''
        };

        if (origin || destination) {
// OUTBOUND

            let startLocation = (connection) ? connection : origin;
            segments['Outbound'] = buildSegmentObject(departureDate, startLocation, destination, 'OUTBOUND');

// Check if only one location selected. If that is the case, set showResults feature-flag to false                
            if ((origin && !destination) || (!origin && destination)) {

                features.showResults = false;

            } else {

                features.showResults = true;

            }

        }

        if (origin && destination && connection) {
// Connection/Transit OUTBOUND

            segments['OutboundConnection'] = buildSegmentObject(departureDate, origin, connection, 'OUTBOUND', 'TRANSIT');

        }


        if (tripType == 'round_trip') {
// RETRUN/Round-Trip

            document.getElementById("returnDate").disabled = false;

            let startLocation = (connection) ? connection : destination;
            segments['Return'] = buildSegmentObject(returnDate, startLocation, origin, 'RETURN');

            if (origin && destination && connection) {
// Connection/Transit RETURN

                segments['ReturnConnection'] = buildSegmentObject(returnDate, destination, connection, 'RETURN', 'TRANSIT');

            }

        } else { // One Way trip

            document.getElementById("returnDate").disabled = true;

        }

        if (segments['Outbound'] || segments['Return']) {

// Show Segment information

            let segmentListOrder = ['OutboundConnection','Outbound','ReturnConnection','Return'];
            let segmentResults = '';
            let segmentFirstFound = false;

            for (const segmentList of segmentListOrder) {
                if (segments[segmentList]) {
                    if (segmentFirstFound) {
                        segmentResults += ',\n';
                    } else {
                        segmentFirstFound = true;
                    }
                    segmentResults += segments[segmentList];
                }    
            }
            elementConfig += `,\nsegments: [${segmentResults}]`;

        }

// Add Features Model if a parameter is false
        let featuresModel = '';
        for (const [key, value] of Object.entries(features)) {

            if (value == false) {
                featuresModel += `\t${key}: ${value},\n`;
            }

            // Toggle Feature Flags            
            document.getElementById(key).checked = value;
        }
        if (featuresModel) {
            elementConfig += `,\nfeatures: {\n${featuresModel}}`;
        }

// Analytics/UTM Codes
        let queryParams = '';
        for (const [key, value] of Object.entries(utm)) {

            if (value) {
                queryParams += `\t${key}: '${value}',\n`;
            }
        }
        if (queryParams) {
            elementConfig += `,\nqueryParams: {\n${queryParams}}`;
        }        

// Load code into Example textarea
        exampleCode = exampleCode.replace('{{ELEMENT_CONFIG}}', elementConfig);
        document.getElementById("textarea_example_code").value = exampleCode;

// Enable/Disable [Submit Request] button 
        document.getElementById("btnExecuteCode").disabled = (exampleCode.indexOf('{{') !== -1) ? true : false;  
        
// Clear iFrame Results
        document.getElementById("iframe_results").srcdoc = ''; 

    } catch(err) {

        document.getElementById("textarea_example_code").value = "ERROR: " + err;

    }
}

// Run Example Code
function executeCode() {
    
    document.getElementById("iframe_results").srcdoc = document.getElementById("textarea_example_code").value; 

}

// Copy content of element/id to clipboard
function copyToClipboard(id) {

    let textarea = document.getElementById(id);
    textarea.select();
    document.execCommand("copy");

}

function buildSegmentObject(travelDate, origin, destination, segmentType, segmentSubType = '') {

    let segment = '';
    if (origin || destination) {

        segment += segmentObject;
        segment = segment.replace('{{SEGMENT_TYPE}}', segmentType.toUpperCase());

        let subType = (segmentSubType) ? `\nsegmentSubType: '${segmentSubType.toUpperCase()}',` : '';
        segment = segment.replace('{{SEGMENT_SUBTYPE}}', subType);

        segment = segment.replace('{{DEPARTURE_DATE}}', travelDate);
        segment = segment.replace('{{DEPARTURE_TIME}}', '12:59:00');
        segment = segment.replace('{{ARRIVAL_DATE}}', travelDate);
        segment = segment.replace('{{ARRIVAL_TIME}}', '12:59:00');

        let originDetails = '';
        let destinationDetails = '';

        if (origin) {

            originDetails = segmentObjectOrigin;
            originDetails = originDetails.replace('{{ORIGIN_CODE}}', origin.split("~")[0]);
            originDetails = originDetails.replace('{{ORIGIN_VALUE}}', origin.split("~")[1]);
                
        }
        if (destination) {

            destinationDetails = segmentObjectDestination;
            destinationDetails = destinationDetails.replace('{{DESTINATION_CODE}}', destination.split("~")[0]);
            destinationDetails = destinationDetails.replace('{{DESTINATION_VALUE}}', destination.split("~")[1]);
                
        }
        segment = segment.replace('{{ORIGIN_DETAILS}}', originDetails);
        segment = segment.replace('{{DESTINATION_DETAILS}}', destinationDetails);
        

    }

    return segment;
}