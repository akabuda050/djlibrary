<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

    <!-- Sticky filters -->
    <header class="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 pt-3 pb-2 space-y-2">

      <!-- Row 1: search + count -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            ref="searchInput"
            v-model="searchRaw"
            type="text"
            placeholder="Search track or artist..."
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
          />
          <button
            v-if="searchRaw"
            @click="searchRaw = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-lg leading-none p-1"
          >✕</button>
        </div>
        <span class="text-sm text-zinc-500 shrink-0 tabular-nums">{{ totalFiltered }}</span>
      </div>

      <!-- Row 2: BPM presets -->
      <div class="flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          v-for="preset in bpmPresets"
          :key="preset.label"
          @click="toggleBpm(preset)"
          :class="[
            'shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            activeBpm === preset.label
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
          ]"
        >{{ preset.label }}</button>
      </div>

      <!-- Row 3: key pills -->
      <div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        <button
          v-for="k in availableKeys"
          :key="k"
          @click="toggleKey(k)"
          :class="[
            'shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            filterKey === k
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
          ]"
        >{{ k }}</button>
      </div>

    </header>

    <!-- Track list -->
    <main class="flex-1 px-4 py-2">
      <div v-if="loading" class="text-center text-zinc-600 py-24">Loading...</div>

      <div v-else-if="visibleTracks.length === 0" class="text-center text-zinc-600 py-24">
        No tracks found
      </div>

      <div v-else class="space-y-1">
        <TrackCard
          v-for="track in visibleTracks"
          :key="track.id"
          :track="track"
        />
      </div>

      <!-- Load more -->
      <div v-if="visibleCount < totalFiltered" class="py-4 flex justify-center">
        <button
          @click="loadMore"
          class="w-full max-w-sm py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-sm text-zinc-300 transition-colors"
        >
          Load {{ Math.min(PAGE_SIZE, totalFiltered - visibleCount) }} more
          <span class="text-zinc-500">({{ totalFiltered - visibleCount }} left)</span>
        </button>
      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDebounceFn } from './composables/useDebounceFn.js'
import TrackCard from './components/TrackCard.vue'

const PAGE_SIZE = 60

const allTracks = ref([])
const loading = ref(true)
const searchRaw = ref('')
const search = ref('')
const filterKey = ref('')
const activeBpm = ref('')
const visibleCount = ref(PAGE_SIZE)

const bpmPresets = [
  { label: '< 100', min: 0,   max: 99  },
  { label: '100–120', min: 100, max: 120 },
  { label: '120–128', min: 120, max: 128 },
  { label: '128–135', min: 128, max: 135 },
  { label: '135+',  min: 135, max: Infinity },
]

fetch('./my_library.json')
  .then(r => r.json())
  .then(data => {
    allTracks.value = data.tracks
    loading.value = false
  })

// Debounce search input 200ms
const updateSearch = useDebounceFn((val) => { search.value = val }, 200)
watch(searchRaw, updateSearch)

const availableKeys = computed(() => {
  const keys = new Set(allTracks.value.map(t => t.key).filter(Boolean))
  return [...keys].sort()
})

const activeBpmPreset = computed(() =>
  bpmPresets.find(p => p.label === activeBpm.value) ?? null
)

const filteredTracks = computed(() => {
  let tracks = allTracks.value
  const q = search.value.trim().toLowerCase()

  if (q) {
    tracks = tracks.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.artist?.toLowerCase().includes(q)
    )
  }

  if (filterKey.value) {
    tracks = tracks.filter(t => t.key === filterKey.value)
  }

  if (activeBpmPreset.value) {
    const { min, max } = activeBpmPreset.value
    tracks = tracks.filter(t => t.bpm != null && t.bpm >= min && t.bpm <= max)
  }

  return tracks
})

const totalFiltered = computed(() => filteredTracks.value.length)
const visibleTracks = computed(() => filteredTracks.value.slice(0, visibleCount.value))

watch([search, filterKey, activeBpm], () => { visibleCount.value = PAGE_SIZE })

function toggleKey(k) {
  filterKey.value = filterKey.value === k ? '' : k
}

function toggleBpm(preset) {
  activeBpm.value = activeBpm.value === preset.label ? '' : preset.label
}

function loadMore() {
  visibleCount.value += PAGE_SIZE
}
</script>

<style>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
