// Initialize Input Parameters
function initialLoad() {

    let param;

    param = document.getElementById('element');
    for (const [key, value] of Object.entries(config.element)) {
        param.options.add( new Option(value, key) );
    }   

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
    for (const [key, value] of Object.entries(config.country)) {
        paramOrigin.options.add( new Option(value, 'countryCode~' + key + '~' + value) );
        paramDestination.options.add( new Option(value, 'countryCode~' + key + '~' + value) );
    }
    for (const [key, value] of Object.entries(config.airport)) {
        paramOrigin.options.add( new Option(key + " - " + value, 'airportCode~' + key + '~' + value) );
        paramDestination.options.add( new Option(key + " - " + value, 'airportCode~' + key + '~' + value) );
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
    let element = document.getElementById("element").value;
    let placement = document.getElementById("placement").value;
    let language = document.getElementById("language").value;
    let traveller = travellerModel;
    let passport = document.getElementById("passport").value;
    let tripType = document.getElementById("trip_type").value;
    let vaccination = document.getElementById("vaccination").value;
    let origin = document.getElementById("origin").value;
    let destination = document.getElementById("destination").value;
    let departureDate = document.getElementById("departureDate").value;
    let returnDate = document.getElementById("returnDate").value;
    let appid = document.getElementById("appid").value;

    try {

        exampleCode = exampleCode.replace(/{{ELEMENT}}/g, element);
        exampleCode = exampleCode.replace('{{HOST_SDK}}', config.hostSDK[environment]);
        if (appid) {
            exampleCode = exampleCode.replace('{{APP_ID}}', appid);
        }
        
        if (element == 'trip') {
            elementConfig = `\nplacement: '${placement}',`;
            elementConfig += `\nlanguage: '${language}',`;

            traveller = traveller.replace('{{PASSPORT}}', passport);
            traveller = traveller.replace('{{VACCINATION_TYPE}}', vaccination.split("-")[0]);
            traveller = traveller.replace('{{VACCINATION_STATUS}}', vaccination.split("-")[1]);
            elementConfig += `\n${traveller}`;

            let segmentOutbound = segmentObject;
            segmentOutbound = segmentOutbound.replace('{{SEGMENT_TYPE}}', 'OUTBOUND');
            segmentOutbound = segmentOutbound.replace('{{DEPARTURE_DATE}}', departureDate);
            segmentOutbound = segmentOutbound.replace('{{DEPARTURE_TIME}}', '12:59:00');
            segmentOutbound = segmentOutbound.replace('{{ARRIVAL_DATE}}', departureDate);
            segmentOutbound = segmentOutbound.replace('{{ARRIVAL_TIME}}', '12:59:00');
            if (origin) {
                segmentOutbound = segmentOutbound.replace('{{ORIGIN_CODE}}', origin.split("~")[0]);
                segmentOutbound = segmentOutbound.replace('{{ORIGIN_VALUE}}', origin.split("~")[1]);
                    
            }
            if (destination) {
                segmentOutbound = segmentOutbound.replace('{{DESTINATION_CODE}}', destination.split("~")[0]);
                segmentOutbound = segmentOutbound.replace('{{DESTINATION_VALUE}}', destination.split("~")[1]);
                    
            }

            let segmentReturn = '';
            if (tripType == 'round_trip') {
                segmentReturn = ',\n' + segmentObject;    
                segmentReturn = segmentReturn.replace('{{SEGMENT_TYPE}}', 'RETURN');
                segmentReturn = segmentReturn.replace('{{DEPARTURE_DATE}}', returnDate);
                segmentReturn = segmentReturn.replace('{{DEPARTURE_TIME}}', '12:59:00');
                segmentReturn = segmentReturn.replace('{{ARRIVAL_DATE}}', returnDate);
                segmentReturn = segmentReturn.replace('{{ARRIVAL_TIME}}', '12:59:00');
                if (destination) {
                    segmentReturn = segmentReturn.replace('{{ORIGIN_CODE}}', destination.split("~")[0]);
                    segmentReturn = segmentReturn.replace('{{ORIGIN_VALUE}}', destination.split("~")[1]);
                        
                }
                if (origin) {
                    segmentReturn = segmentReturn.replace('{{DESTINATION_CODE}}', origin.split("~")[0]);
                    segmentReturn = segmentReturn.replace('{{DESTINATION_VALUE}}', origin.split("~")[1]);
                        
                }                
            }
            elementConfig += `\nsegments: [${segmentOutbound}${segmentReturn}]`;

        }
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

    var range = document.createRange();

    range.selectNode(document.getElementById(id));
    window.getSelection().removeAllRanges(); // clear current selection
    window.getSelection().addRange(range); // to select text
    document.execCommand("copy");
    window.getSelection().removeAllRanges();// to deselect

}
