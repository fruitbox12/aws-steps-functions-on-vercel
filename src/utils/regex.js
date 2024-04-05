export function replaceTemplateVariables(url, dataInput) {
    let parsedData;
    try {
        // First, parse the outer layer of JSON from the 'result' key
        parsedData = JSON.parse(dataInput.result);
    } catch (error) {
        console.error("Error parsing JSON from 'result':", error);
        return url;
    }

    const templateVariableRegex = /\{\{(.*?)\}\}/g;

    function navigateAndExtractValue(obj, path) {
        const segments = path.split(/[.\[\]']+/).filter(Boolean); // Splitting by dots and brackets, filtering out empty strings

        try {
            return segments.reduce((current, segment) => current[segment], obj);
        } catch (error) {
            console.error(`Error navigating path '${path}':`, error);
            return null;
        }
    }

    return url.replace(templateVariableRegex, (_, path) => {
        const extractedValue = navigateAndExtractValue(parsedData, path);
        return extractedValue !== null ? extractedValue.toString() : _;
    });
}
 function replaceTemplateVariables2(url, dataInput) {
    // Parse the initial JSON string within the 'result' key of dataInput
    let parsedData;
    try {
        parsedData = JSON.parse(dataInput.result);
    } catch (error) {
        console.error("Error parsing data.result:", error);
        return url;
    }

    // The target value is nested within http_0 -> first array item -> data -> first array item -> data -> usage -> prompt_tokens
    let targetValue;
    try {
        targetValue = parsedData.http_0[0].data[0].data.usage.prompt_tokens;
    } catch (error) {
        console.error("Error navigating to the target value:", error);
        return url;
    }

    // Replace the template variable in the URL with the target value
    const templateVariableRegex = /\{\{(.*?)\}\}/g;
    return url.replace(templateVariableRegex, (match, path) => {
        if (path === "http_0[0].data.usage.prompt_tokens") {
            return targetValue.toString();
        }
        return match; // If the path doesn't match, return the original placeholder
    });
}
