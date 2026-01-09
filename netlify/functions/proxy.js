const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Extract the path from the request URL (remove /.netlify/functions/proxy prefix if present) or just use the splat
    // In Netlify redirects, the splat is usually passed, but for safety let's look at the path.
    // The redirect logic /request_proxy/* -> /.netlify/functions/proxy/:splat maps the path.

    // We need the part AFTER /request_proxy/
    // The event.path might be /.netlify/functions/proxy/rank-tracker/v3.0/...

    const pathPrefix = '/.netlify/functions/proxy';
    let endpoint = event.path;

    if (endpoint.startsWith(pathPrefix)) {
        endpoint = endpoint.substring(pathPrefix.length);
    }

    // Construct the target URL
    const targetUrl = `https://api.seomonitor.com${endpoint}`; // Endpoint should start with /rank-tracker...

    // Get API Token from Environment Variable
    const API_TOKEN = process.env.VITE_API_TOKEN;

    if (!API_TOKEN) {
        console.error('Missing VITE_API_TOKEN environment variable');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error' })
        };
    }

    // Proxy the request
    try {
        // Forward Query Parameters
        const queryString = event.rawQuery;
        const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

        const response = await fetch(finalUrl, {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: event.body || undefined
        });

        const data = await response.text();

        return {
            statusCode: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Basic CORS for now
            },
            body: data
        };
    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to proxy request' })
        };
    }
};
