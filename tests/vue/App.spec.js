import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../../src/App.vue'

const PAGE_SIZE = 60

function makeTrack(overrides = {}) {
  return {
    id: `ksuid-${Math.random()}`,
    title: 'Test Track',
    artist: 'Test Artist',
    bpm: 128,
    key: 'Am',
    duration: 240,
    sources: [{ provider: 'youtube', id: 'yt1', url: 'https://youtube.com/watch?v=yt1', thumbnail: 'https://thumb.jpg' }],
    ...overrides,
  }
}

function makeTracks(n, overrides = {}) {
  return Array.from({ length: n }, (_, i) => makeTrack({ id: `ksuid-${i}`, title: `Track ${i}`, ...overrides }))
}

function stubFetch(tracks) {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ tracks }) })
  ))
}

async function mountApp(tracks) {
  stubFetch(tracks)
  const wrapper = mount(App)
  await flushPromises()
  return wrapper
}

// Type into search and flush debounce timer
async function typeSearch(wrapper, value) {
  await wrapper.find('input[type="text"]').setValue(value)
  vi.runAllTimers()
  await flushPromises()
}

// Find key pill button by label
function keyPill(wrapper, key) {
  return wrapper.findAll('button').find(b => b.text() === key)
}

// Find BPM preset button by label
function bpmButton(wrapper, label) {
  return wrapper.findAll('button').find(b => b.text() === label)
}

// Find load more button
function loadMoreBtn(wrapper) {
  return wrapper.findAll('button').find(b => b.text().includes('Load') && b.text().includes('more'))
}

// Find clear-search ✕ button (inside search input)
function clearSearchBtn(wrapper) {
  return wrapper.findAll('button').find(b => b.text() === '✕')
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('App — data loading', () => {
  it('renders all tracks after fetch resolves', async () => {
    const wrapper = await mountApp(makeTracks(3))
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(3)
  })

  it('shows loading state before fetch resolves', () => {
    stubFetch([])
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Loading')
  })
})

describe('App — search', () => {
  it('filters by title case-insensitively', async () => {
    const tracks = [makeTrack({ title: 'Deep Groove', key: 'Cm' }), makeTrack({ title: 'Something Else', key: 'Dm' })]
    const wrapper = await mountApp(tracks)
    await typeSearch(wrapper, 'groove')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(1)
  })

  it('filters by artist', async () => {
    const tracks = [makeTrack({ artist: 'DJ Shadow', key: 'Cm' }), makeTrack({ artist: 'Other', key: 'Dm' })]
    const wrapper = await mountApp(tracks)
    await typeSearch(wrapper, 'dj shadow')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(1)
  })

  it('empty search shows all tracks', async () => {
    const wrapper = await mountApp(makeTracks(5))
    await typeSearch(wrapper, '')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(5)
  })

  it('null title and artist do not crash', async () => {
    const tracks = [makeTrack({ title: null, artist: null, key: 'Cm' }), makeTrack({ title: 'Real Track', key: 'Dm' })]
    const wrapper = await mountApp(tracks)
    await typeSearch(wrapper, 'real')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(1)
  })

  it('clear ✕ button resets search', async () => {
    const wrapper = await mountApp(makeTracks(3))
    await typeSearch(wrapper, 'zzz')
    await clearSearchBtn(wrapper).trigger('click')
    vi.runAllTimers()
    await flushPromises()
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(3)
  })
})

describe('App — BPM filter', () => {
  it('preset button filters tracks by BPM range', async () => {
    const tracks = [
      makeTrack({ bpm: 95, key: 'Cm' }),
      makeTrack({ bpm: 125, key: 'Dm' }),
      makeTrack({ bpm: 132, key: 'Em' }),
    ]
    const wrapper = await mountApp(tracks)
    await bpmButton(wrapper, '120–128').trigger('click')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(1)
  })

  it('clicking active BPM preset again deactivates it', async () => {
    const wrapper = await mountApp(makeTracks(3))
    await bpmButton(wrapper, '120–128').trigger('click')
    await bpmButton(wrapper, '120–128').trigger('click')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(3)
  })

  it('track with null bpm excluded when BPM preset is active', async () => {
    const tracks = [makeTrack({ bpm: null, key: 'Cm' }), makeTrack({ bpm: 125, key: 'Dm' })]
    const wrapper = await mountApp(tracks)
    await bpmButton(wrapper, '120–128').trigger('click')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(1)
  })
})

describe('App — key filter', () => {
  it('key pill filters to matching tracks', async () => {
    const tracks = [
      makeTrack({ key: 'Am' }),
      makeTrack({ key: 'Cm' }),
      makeTrack({ key: 'Am' }),
    ]
    const wrapper = await mountApp(tracks)
    await keyPill(wrapper, 'Am').trigger('click')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(2)
  })

  it('clicking active key pill deactivates filter', async () => {
    const wrapper = await mountApp(makeTracks(4))
    await keyPill(wrapper, 'Am').trigger('click')
    await keyPill(wrapper, 'Am').trigger('click')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(4)
  })

  it('key pills contain sorted unique keys', async () => {
    const tracks = [
      makeTrack({ key: 'Cm' }),
      makeTrack({ key: 'Am' }),
      makeTrack({ key: 'Am' }),
      makeTrack({ key: 'Gm' }),
    ]
    const wrapper = await mountApp(tracks)
    // All button texts that are exactly key-like (2-3 chars)
    const pills = wrapper.findAll('button')
      .map(b => b.text())
      .filter(t => /^[A-G][#b]?m?$/.test(t))
    expect(pills).toEqual([...pills].sort())
    expect(new Set(pills).size).toBe(pills.length)
  })

  it('null key tracks do not appear as key pill', async () => {
    const tracks = [makeTrack({ key: null }), makeTrack({ key: 'Am' })]
    const wrapper = await mountApp(tracks)
    const pills = wrapper.findAll('button')
      .map(b => b.text())
      .filter(t => /^[A-G][#b]?m?$/.test(t))
    expect(pills).not.toContain('')
    expect(pills).toEqual(['Am'])
  })
})

describe('App — combined filters', () => {
  it('search and key filter applied together', async () => {
    const tracks = [
      makeTrack({ title: 'Groove Am', key: 'Am' }),
      makeTrack({ title: 'Groove Cm', key: 'Cm' }),
      makeTrack({ title: 'Other Am', key: 'Am' }),
    ]
    const wrapper = await mountApp(tracks)
    await typeSearch(wrapper, 'groove')
    await keyPill(wrapper, 'Am').trigger('click')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(1)
  })
})

describe('App — pagination', () => {
  it('shows only PAGE_SIZE tracks initially', async () => {
    const wrapper = await mountApp(makeTracks(PAGE_SIZE + 5))
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(PAGE_SIZE)
  })

  it('load more button shows how many are left', async () => {
    const wrapper = await mountApp(makeTracks(PAGE_SIZE + 10))
    expect(loadMoreBtn(wrapper)).toBeDefined()
    expect(wrapper.text()).toContain('10 left')
  })

  it('load more button absent when all tracks visible', async () => {
    const wrapper = await mountApp(makeTracks(10))
    expect(loadMoreBtn(wrapper)).toBeUndefined()
  })

  it('clicking load more reveals more tracks', async () => {
    const wrapper = await mountApp(makeTracks(PAGE_SIZE + 5))
    await loadMoreBtn(wrapper).trigger('click')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(PAGE_SIZE + 5)
  })

  it('filter change resets visible count to PAGE_SIZE', async () => {
    const tracks = Array.from({ length: PAGE_SIZE + 20 }, (_, i) =>
      makeTrack({ id: `ksuid-${i}`, title: `Mix Track ${i}` })
    )
    const wrapper = await mountApp(tracks)
    await loadMoreBtn(wrapper).trigger('click')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(PAGE_SIZE + 20)
    await typeSearch(wrapper, 'mix')
    expect(wrapper.findAllComponents({ name: 'TrackCard' })).toHaveLength(PAGE_SIZE)
  })

  it('shows no tracks message when filter returns nothing', async () => {
    const wrapper = await mountApp(makeTracks(3))
    await typeSearch(wrapper, 'zzznomatch')
    expect(wrapper.text()).toContain('No tracks found')
  })
})
