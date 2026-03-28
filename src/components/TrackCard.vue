<template>
  <div class="flex items-center gap-3 bg-zinc-900 active:bg-zinc-800 rounded-lg px-3 py-3 min-h-[56px]">

    <!-- Thumbnail -->
    <div class="shrink-0 w-10 h-10 rounded overflow-hidden bg-zinc-800">
      <img
        v-if="thumbnail"
        :src="thumbnail"
        :alt="track.title"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-zinc-700">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
        </svg>
      </div>
    </div>

    <!-- Title + artist -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-zinc-100 truncate leading-tight" :title="track.title">
        {{ track.title || 'Unknown' }}
      </p>
      <p class="text-xs text-zinc-500 truncate mt-0.5" :title="track.artist">
        {{ track.artist || '—' }}
      </p>
    </div>

    <!-- Key + BPM -->
    <div class="flex flex-col items-end gap-0.5 shrink-0 text-right">
      <span v-if="track.key" class="text-xs font-semibold text-purple-400">{{ track.key }}</span>
      <span v-if="track.bpm" class="text-xs text-zinc-500 tabular-nums">{{ track.bpm }}</span>
    </div>

    <!-- YouTube Music — large touch target -->
    <a
      v-if="ytMusicUrl"
      :href="ytMusicUrl"
      target="_blank"
      rel="noopener"
      title="Open on YouTube Music"
      class="shrink-0 flex items-center justify-center w-11 h-11 -mr-1 rounded-lg text-zinc-600 hover:text-red-400 active:text-red-400 transition-colors"
      @click.stop
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
      </svg>
    </a>

  </div>
</template>

<script setup>
const props = defineProps({
  track: { type: Object, required: true }
})

const youtubeSource = props.track.sources?.find(s => s.provider === 'youtube')
const thumbnail = youtubeSource?.thumbnail ?? null
const ytMusicUrl = youtubeSource?.id
  ? `https://music.youtube.com/watch?v=${youtubeSource.id}`
  : null
</script>
