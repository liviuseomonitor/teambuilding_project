// Using native Node.js fetch (available in Node 18+)
// const fetch = require('node-fetch'); // Removed to avoid ESM/CJS issues with v3

exports.handler = async (event, context) => {
    console.log('[PROXY] Function called');
    console.log('[PROXY] Event path:', event.path);
    console.log('[PROXY] Query string:', event.rawQuery);

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
    console.log('[PROXY] Target URL:', targetUrl);

    // Get API Token from Environment Variable
    const API_TOKEN = process.env.VITE_API_TOKEN;
    console.log('[PROXY] Token exists:', !!API_TOKEN);

    if (!API_TOKEN) {
        console.error('[PROXY] Missing VITE_API_TOKEN environment variable');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error - missing API token' })
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
