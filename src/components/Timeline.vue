<script setup>
import { computed } from 'vue';

const props = defineProps({
  history: {
    type: Array,
    required: true
  }
});

const formatDate = (dateString, full = false) => {
  const date = new Date(dateString);
  if (full) return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(date);
};

// SVG Paths matching User's Visual Reference
const featureIcons = {
    'video-carousel': '<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>',
    'ai-overview': '<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M9 21.03l2.25-5.25L16.5 13.5l-5.25-2.25L9 6l-2.25 5.25L1.5 13.5l5.25 2.25L9 21.03zM21 9l-1.5-3.37L16.13 4.13L19.5 2.63L21 6l1.5-3.37L25.88 4.13L22.5 5.63L21 9z"/></svg>', 
    'ads-pack': '<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 2h1.5l.5 1.5.5-1.5H16v3h-1v-1.5l-.5 1.5h-1l-.5-1.5V8h-1v3h-1V5zm5 0h2.5c.83 0 1.5.67 1.5 1.5S20.33 8 19.5 8H17V5zm1 1v1h1.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H18z"/></svg>',
    'featured-snippet': '<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>',
    'questions': '<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>',
    'knowledge-graph': '<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M19 15c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-6-2c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-4.32 1.45-5.12 3.5h1.67c.69-1.19 1.97-2 3.45-2s2.76.81 3.45 2h1.67c-.8-2.05-2.79-3.5-5.12-3.5zM5 15c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
    'default': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="100%" height="100%"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>'
};

// Map API Codes to Visual Keys
const apiCodeToKey = {
    'VID': 'video-carousel', 'VP': 'video-carousel',
    'AIO': 'ai-overview', 'AIB': 'ai-overview',
    'ADT': 'ads-pack', 'ADS': 'ads-pack',
    'QNS': 'questions', 'PAA': 'questions',
    'FS': 'featured-snippet',
    'KG': 'knowledge-graph',
    'IMG': 'images-pack',
    'LOC': 'local-pack', 'MAP': 'local-pack',
    'NWS': 'top-stories'
};

const getFeatureIcon = (featureCode) => {
    const key = apiCodeToKey[featureCode] || 'default';
    return featureIcons[key] || featureIcons['default'];
};

const getFeatureName = (featureCode) => {
    const names = {
        'FS': 'Featured Snippet',
        'KG': 'Knowledge Graph',
        'AIB': 'AI Overview',
        'AIO': 'AI Overview',
        'PAA': 'People Also Ask',
        'QNS': 'Questions',
        'VP': 'Video Pack',
        'VID': 'Video',
        'ADS': 'Ads',
        'ADT': 'Top Ads'
    };
    return names[featureCode] || featureCode;
};

// Compute unique features present across the entire history
const uniqueFeatures = computed(() => {
    const featureSet = new Set();
    props.history.forEach(day => {
        day.features.forEach(f => featureSet.add(f));
    });
    return Array.from(featureSet).sort();
});
</script>

<template>
  <div class="timeline-matrix">
    <div v-if="history.length === 0" class="empty-state">No history</div>
    
    <div v-else class="matrix-grid">
        <!-- One Row per Feature Type -->
        <div v-for="featureCode in uniqueFeatures" :key="featureCode" class="matrix-row">
            
            <!-- Icon Label (Left) -->
            <div class="row-label" :title="getFeatureName(featureCode)">
                <div class="icon-inner" v-html="getFeatureIcon(featureCode)"></div>
            </div>

            <!-- 30 columns for days -->
            <div class="days-track">
                <div 
                    v-for="(day, index) in history" 
                    :key="index" 
                    class="matrix-cell"
                    :title="`${formatDate(day.date, true)}\nFeature: ${getFeatureName(featureCode)}\nStatus: ${day.features.includes(featureCode) ? (day.won.includes(featureCode) ? 'WON' : 'Present (Not Won)') : 'Not Present'}`"
                >
                    <div class="status-dot"
                         :class="{
                             'won': day.won.includes(featureCode),
                             'present': day.features.includes(featureCode) && !day.won.includes(featureCode),
                             'missing': !day.features.includes(featureCode)
                         }">
                    </div>
                </div>
            </div>

        </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-matrix {
    width: 100%;
}

.matrix-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem; /* Spacing between Rows */
}

.matrix-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.row-label {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    background: var(--bg-surface-hover);
    border-radius: 4px;
}

.icon-inner {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.days-track {
    display: flex;
    gap: 3px; /* Tight spacing for dots */
    align-items: center;
}

.matrix-cell {
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: help;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: transform 0.2s ease;
}

/* 3 Status Colors */
.status-dot.missing {
    background-color: #E5E7EB; /* Light Gray (tw-gray-200) */
}

.status-dot.present {
    background-color: #FBBF24; /* Amber-400 for 'Present but not won' */
}

.status-dot.won {
    background-color: var(--success); /* Green */
}

/* Hover effects */
.matrix-cell:hover .status-dot {
    transform: scale(1.5);
}
</style>
