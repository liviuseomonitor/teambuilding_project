<script setup>
import { ref, onMounted, watch } from 'vue';
import { getCampaigns, getTrackedKeywords, getDailySerpFeaturePresence } from '../services/api';
import Timeline from './Timeline.vue';

const campaigns = ref([]);
const selectedCampaignId = ref(null);
const keywords = ref([]);
const loading = ref(true);
const serpHistory = ref({});
const useDemo = ref(false); // Toggle state

const formatDate = (date) => date.toISOString().split('T')[0];

const loadCampaigns = async () => {
    campaigns.value = await getCampaigns(useDemo.value);
    if (campaigns.value.length > 0 && !selectedCampaignId.value) {
        selectedCampaignId.value = campaigns.value[0].id;
    } else if (campaigns.value.length > 0) {
       // Check if selected ID still exists in new list (e.g. switching demo modes)
       const exists = campaigns.value.find(c => c.id === selectedCampaignId.value);
       if (!exists) selectedCampaignId.value = campaigns.value[0].id;
    } else {
        selectedCampaignId.value = null;
    }
}

const loadKeywordData = async () => {
    if (!selectedCampaignId.value) return;
    
    loading.value = true;
    keywords.value = [];
    serpHistory.value = {};
    
    try {
        keywords.value = await getTrackedKeywords(selectedCampaignId.value, useDemo.value);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        for (const kw of keywords.value) {
            serpHistory.value[kw.id] = await getDailySerpFeaturePresence(selectedCampaignId.value, kw.id, startStr, endStr, useDemo.value);
        }
    } catch (error) {
        console.error('Failed to load data:', error);
    } finally {
        loading.value = false;
    }
};

const initialize = async () => {
    loading.value = true;
    await loadCampaigns();
    await loadKeywordData();
    if (!selectedCampaignId.value) loading.value = false;
};

onMounted(() => {
    initialize();
});

// Reload everything when Demo Mode toggles
watch(useDemo, () => {
    selectedCampaignId.value = null; // Reset selection to force re-pick
    initialize();
});

// Reload keywords when Campaign changes
watch(selectedCampaignId, (newId) => {
    if (newId) loadKeywordData();
});
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-content">
          <h1>SERP Watchdog</h1>
          <p class="subtitle">Monitoring <b>{{ keywords.length }}</b> keywords</p>
      </div>
      
      <div class="controls">
          <div class="campaign-selector" v-if="campaigns.length > 0">
              <select v-model="selectedCampaignId" class="campaign-select">
                  <option v-for="camp in campaigns" :key="camp.id" :value="camp.id">
                      {{ camp.title }}
                  </option>
              </select>
          </div>

          <div class="mode-toggle">
              <label class="switch">
                  <input type="checkbox" v-model="useDemo">
                  <span class="slider round"></span>
              </label>
              <span class="mode-label">{{ useDemo ? 'Demo Mode' : 'Live Data' }}</span>
          </div>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading ranking data...</p>
    </div>

    <div v-else-if="keywords.length === 0" class="empty-state">
        <p>No data found.</p>
        <p v-if="!useDemo" class="hint">Try switching to <b>Demo Mode</b> if your API has no data.</p>
    </div>

    <div v-else class="table-container glass-panel">
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-kw">Keyword</th>
                    <th class="col-rank">Rank</th>
                    <th class="col-vol">Search Vol</th>
                    <th class="col-feat">SERP Features</th>
                    <th class="col-hist">History (30 Days)</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="kw in keywords" :key="kw.id">
                    <td class="col-kw">
                        <span class="keyword-text">{{ kw.keyword }}</span>
                    </td>
                    <td class="col-rank">
                        <span class="rank-badge" :class="{ 'top-3': kw.current_rank <= 3 }">
                            {{ kw.current_rank }}
                        </span>
                    </td>
                    <td class="col-vol">
                        {{ kw.search_volume.toLocaleString() }}
                    </td>
                    <td class="col-feat">
                        <div class="features-list">
                            <span v-for="feat in kw.serp_features" :key="feat" class="feat-tag">
                                {{ feat }}
                            </span>
                        </div>
                    </td>
                    <td class="col-hist">
                        <Timeline :history="serpHistory[kw.id] || []" />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.controls {
    display: flex;
    align-items: center;
}

/* Data Table Container */
.table-container {
    background: var(--bg-surface);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    overflow: hidden; /* For rounded corners */
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.data-table th {
    text-align: left;
    padding: 1rem 1.5rem;
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border-color);
}

.data-table td {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
    color: var(--text-primary);
}

.data-table tr:last-child td {
    border-bottom: none;
}

.data-table tr:hover {
    background-color: var(--bg-app);
}

/* Column Specifics */
.col-kw { width: 25%; }
.col-rank { width: 10%; }
.col-vol { width: 10%; }
.col-feat { width: 25%; }
.col-hist { width: 30%; }

.keyword-text {
    font-weight: 600;
    color: var(--primary);
}

.rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--bg-surface-hover);
    font-weight: 600;
    color: var(--text-secondary);
}

.rank-badge.top-3 {
    background: var(--success);
    color: white;
}

.features-list {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.feat-tag {
    font-size: 0.75rem;
    background: var(--bg-surface-hover);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-secondary);
}

/* Campaign Selector */
.campaign-selector {
    margin-right: 1.5rem;
}

.campaign-select {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-surface);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    min-width: 200px;
    transition: box-shadow 0.2s;
}

.campaign-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light);
}

/* Toggle Switch */
.mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--bg-surface);
    padding: 0.5rem 1rem;
    border-radius: 50px;
    border: 1px solid var(--border-color);
}
.mode-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 24px;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #E5E7EB;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

input:checked + .slider { background-color: var(--primary); }
input:focus + .slider { box-shadow: 0 0 1px var(--primary); }
input:checked + .slider:before { transform: translateX(16px); }
.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }

.loading-state, .empty-state {
    padding: 4rem;
    text-align: center;
    color: var(--text-muted);
}
.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    margin: 0 auto 1rem;
    animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
