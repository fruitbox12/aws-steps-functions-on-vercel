export function replaceTemplateVariables(url, data) {
    // Regular expression to match template variables enclosed in double curly braces
    const templateVariableRegex = /\{\{(.*?)\}\}/g;
    
    return url.replace(templateVariableRegex, (match, path) => {
        // Split the path by dots and brackets to navigate through the data object
        const pathSegments = path.replace(/\[|\]\.?/g, '.').split('.').filter(Boolean);
        
        // Reduce the path segments to get the final value from the data object
        const replacement = pathSegments.reduce((currentData, segment) => {
            return (currentData && currentData[segment] !== undefined) ? currentData[segment] : match;
        }, data);
        
        // Return the replacement if found, or the original match if not
        return replacement !== match ? replacement : match;
    });
}
