const API_BASE_URL = 'https://api.seomonitor.com';
const API_TOKEN = import.meta.env.VITE_API_TOKEN_2 || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzZW9tb25pdG9yLmNvbSIsImlhdCI6MTY2NjA5MjcxOCwidXNlcl9pZCI6MTk1Mjd9.TS5njd0hrq1knLWXe9VMNhPo6j5CFHIrv7jlqSmpG5s';

// Using direct API calls
const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
};

const MOCK_CAMPAIGNS = [
    { id: 12345, title: 'Demo Store (US)' },
    { id: 67890, title: 'Demo Store (UK)' }
];

const MOCK_SERP_FEATURES = [
    { date: '2023-10-25', features: ['AIB', 'KG'], won: ['KG'] },
    { date: '2023-10-26', features: ['AIB', 'KG', 'FS'], won: ['KG'] },
    { date: '2023-10-27', features: ['AIB', 'KG', 'FS'], won: ['KG', 'FS'] },
    { date: '2023-10-28', features: ['AIB', 'KG', 'FS'], won: ['KG', 'FS'] },
    { date: '2023-10-29', features: ['AIB', 'KG', 'FS'], won: ['KG'] }
];

const MOCK_KEYWORDS = [
    { id: 1, keyword: 'best seo software', search_volume: 5400, current_rank: 3, serp_features: ['AIB', 'KG', 'FS'] },
    { id: 2, keyword: 'rank tracker api', search_volume: 880, current_rank: 1, serp_features: ['FS', 'VP'] },
    { id: 3, keyword: 'competitor analysis', search_volume: 2900, current_rank: 12, serp_features: ['PAA', 'ADS'] }
];

export const getMockDailySerpFeaturePresence = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_SERP_FEATURES;
};

export const getMockTrackedKeywords = async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return MOCK_KEYWORDS;
};

export const getCampaigns = async (useDemo = false) => {
    if (useDemo) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return MOCK_CAMPAIGNS;
    }

    try {
        console.log('[API] Fetching campaigns from:', `${API_BASE_URL}/dashboard/v3.0/campaigns/tracked?limit=100`);
        const response = await fetch(`${API_BASE_URL}/dashboard/v3.0/campaigns/tracked?limit=100`, { headers });
        console.log('[API] Campaigns response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Campaigns fetch failed:', response.status, errorText);
            throw new Error(`Failed to fetch campaigns: ${response.status}`);
        }

        const data = await response.json();
        console.log('[API] Campaigns data:', data);

        const campaigns = Array.isArray(data) ? data : (data.data || []);

        // Map to a simple format { id, title }
        return campaigns.map(c => ({
            id: c.campaign_info.id,
            title: c.campaign_info.name || c.campaign_info.domain || 'Untitled Campaign'
        }));
    } catch (error) {
        console.error("[API] Error fetching campaigns:", error);
        return [];
    }
};

export const getDailySerpFeaturePresence = async (campaignId, keywordId, startDate, endDate, useDemo = false) => {
    if (useDemo) return getMockDailySerpFeaturePresence();

    try {
        const url = `${API_BASE_URL}/rank-tracker/v3.0/keywords/serp-feature-presence?campaign_id=${campaignId}&keyword_ids=${keywordId}&start_date=${startDate}&end_date=${endDate}`;
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Handle direct array response
        const items = Array.isArray(data) ? data : (data.data || []);

        if (items.length > 0) {
            const keywordData = items.find(k => k.keyword_id == keywordId);
            // API returns 'serp_data' an array of daily objects
            if (keywordData && keywordData.serp_data) {
                return keywordData.serp_data.map(day => {
                    // Extract desktop features by default
                    const deviceData = day.desktop || [];

                    const allFeatures = deviceData.map(f => f.feature);
                    const wonFeatures = deviceData.filter(f => f.listed).map(f => f.feature);

                    return {
                        date: day.date,
                        features: allFeatures,
                        won: wonFeatures
                    };
                });
            }
        }
        return [];
    } catch (error) {
        console.error("Error fetching SERP features:", error);
        return [];
    }
};

export const getTrackedKeywords = async (campaignId, useDemo = false) => {
    if (useDemo) return getMockTrackedKeywords();
    if (!campaignId) return [];

    try {
        // Add required dates (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const keywordsResponse = await fetch(`${API_BASE_URL}/rank-tracker/v3.0/keywords?campaign_id=${campaignId}&start_date=${startStr}&end_date=${endStr}&limit=5&order_by=search_volume&order_dir=desc`, { headers });
        const keywordsData = await keywordsResponse.json();

        const keywords = Array.isArray(keywordsData) ? keywordsData : (keywordsData.data || []);

        const mappedKeywords = keywords.map(k => ({
            id: k.keyword_id,
            campaign_id: campaignId,
            keyword: k.keyword,
            search_volume: k.search_data?.search_volume || 0,
            current_rank: k.ranking_data?.desktop?.rank || '-',
            serp_features: k.serp_data?.desktop?.map(f => f.feature) || []
        }));

        // Sort by search volume (descending) client-side to ensure proper order
        return mappedKeywords.sort((a, b) => b.search_volume - a.search_volume);

    } catch (error) {
        console.error("Error fetching keywords:", error);
        return [];
    }
}
