import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import { TickTimer } from '../../../src/components/game/TickTimer'
import { formatTime } from '../../../src/utils/date'

// ------------------------------------------------------------------ //
//  Mocks — vi.hoisted ensures they're available before vi.mock runs  //
// ------------------------------------------------------------------ //

const defaultStore = vi.hoisted(() => ({
  serverRemainingMs: 30000,
  gameId: 1,
  setTickData: vi.fn(),
  setResource: vi.fn(),
  setSyncFailed: vi.fn(),
  syncFailed: false,
  setSyncRetryCount: vi.fn(),
  syncRetryCount: 0,
}))

const mockUseGameStore = vi.hoisted(() => vi.fn())
vi.mock('../../../src/store/gameStore', () => ({
  useGameStore: mockUseGameStore,
}))

const mockPlayerGameGet = vi.hoisted(() => vi.fn())
const mockResourceGet = vi.hoisted(() => vi.fn())

vi.mock('../../../src/services/api', () => ({
  api: {
    playerGame: {
      get: mockPlayerGameGet,
      getResource: mockResourceGet,
    },
  },
}))

function mockApiResponses(overrides?: {
  serverRemainingMs?: number
  tickIntervalMs?: number
}) {
  const serverRemainingMs = overrides?.serverRemainingMs ?? 30000
  const tickIntervalMs = overrides?.tickIntervalMs ?? 30000

  mockPlayerGameGet.mockResolvedValue({
    tickIntervalMs,
    serverRemainingMs,
    playerGame: { id: 1, lastTickAt: new Date().toISOString() },
  })
  mockResourceGet.mockResolvedValue({
    resource: { food: 200, wood: 150, metal: 50, civilians: 10, soldiers: 0 },
  })
}

// ------------------------------------------------------------------ //
//  formatTime (pure function)                                         //
// ------------------------------------------------------------------ //

describe('formatTime', () => {
  it('returns "now" for ms < 0', () => {
    expect(formatTime(-1)).toBe('now')
  })

  it('returns "now" for ms = 0', () => {
    expect(formatTime(0)).toBe('now')
  })

  it('ceils fractional seconds (500ms → "0m 1s")', () => {
    expect(formatTime(500)).toBe('0m 1s')
  })

  it('formats exactly 1 second (1000ms → "0m 1s")', () => {
    expect(formatTime(1000)).toBe('0m 1s')
  })

  it('formats 59 seconds (59000ms → "0m 59s")', () => {
    expect(formatTime(59000)).toBe('0m 59s')
  })

  it('formats exactly 1 minute (60000ms → "1m 0s")', () => {
    expect(formatTime(60000)).toBe('1m 0s')
  })

  it('formats 1m 5s (65000ms → "1m 5s")', () => {
    expect(formatTime(65000)).toBe('1m 5s')
  })

  it('formats 59m 59s boundary (3599000ms → "59m 59s")', () => {
    expect(formatTime(3599000)).toBe('59m 59s')
  })
})

// ------------------------------------------------------------------ //
//  TickTimer component                                                //
// ------------------------------------------------------------------ //

describe('TickTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUseGameStore.mockReturnValue({ ...defaultStore })
    mockApiResponses()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ----- rendering -----

  describe('rendering', () => {
    it('renders countdown text when serverRemainingMs > 0', () => {
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 30000,
      })
      render(<TickTimer />)
      expect(screen.getByText('Next tick in: 0m 30s')).toBeInTheDocument()
    })

    it('renders "now" when serverRemainingMs = 0', () => {
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)
      expect(screen.getByText('Next tick in: now')).toBeInTheDocument()
    })

    it('renders "now" when serverRemainingMs < 0', () => {
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: -1,
      })
      render(<TickTimer />)
      expect(screen.getByText('Next tick in: now')).toBeInTheDocument()
    })
  })

  // ----- sync on mount -----

  describe('sync on mount', () => {
    it('calls api.playerGame.get immediately when serverRemainingMs ≤ 0', async () => {
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      await vi.waitFor(() => {
        expect(mockPlayerGameGet).toHaveBeenCalledTimes(1)
      })
    })

    it('does NOT call api on mount when serverRemainingMs > 0 (uses setTimeout)', () => {
      vi.useFakeTimers()
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 30000,
      })
      render(<TickTimer />)

      expect(mockPlayerGameGet).not.toHaveBeenCalled()
      vi.useRealTimers()
    })
  })

  // ----- countdown behavior -----

  describe('countdown behavior', () => {
    it('decrements display every second', async () => {
      vi.useFakeTimers()
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 5000,
      })
      render(<TickTimer />)

      expect(screen.getByText('Next tick in: 0m 5s')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(1000)
      expect(screen.getByText('Next tick in: 0m 4s')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(1000)
      expect(screen.getByText('Next tick in: 0m 3s')).toBeInTheDocument()
    })

    it('stops decrementing at 0', async () => {
      vi.useFakeTimers()
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 2000,
      })
      render(<TickTimer />)

      await vi.advanceTimersByTimeAsync(2000)
      expect(screen.getByText('Next tick in: now')).toBeInTheDocument()

      // Advance extra time — should stay "now"
      await vi.advanceTimersByTimeAsync(5000)
      expect(screen.getByText('Next tick in: now')).toBeInTheDocument()
    })
  })

  // ----- trueRemainingMs edge cases -----

  describe('trueRemainingMs edge cases', () => {
    it('enters early branch when serverRemainingMs ≤ MAX_EARLY_THRESHOLD', async () => {
      // Use serverRemainingMs = 0 in the store so there's no timer race.
      // Only the immediate fetchTick runs. The API response controls the branch.
      mockApiResponses({ serverRemainingMs: 5000 })
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      await vi.waitFor(() => {
        expect(mockPlayerGameGet).toHaveBeenCalledTimes(1)
      })

      // Early branch: schedules a setTimeout retry but does NOT fetch resource
      expect(mockResourceGet).not.toHaveBeenCalled()
    })

    it('uses minimum 1000ms retry delay when serverRemainingMs < 1000', async () => {
      vi.useFakeTimers()
      mockApiResponses({ serverRemainingMs: 500 })
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      // FetchTick called immediately, API resolves, enters early branch,
      // schedules setTimeout(fetchTick, max(500, 2000)) = setTimeout(..., 2000)
      await vi.advanceTimersByTimeAsync(0)

      expect(mockPlayerGameGet).toHaveBeenCalledTimes(1)

      // Advance 2000ms — the retry fires
      await vi.advanceTimersByTimeAsync(2000)
      expect(mockPlayerGameGet).toHaveBeenCalledTimes(2)
    })

    it('enters late branch when serverRemainingMs = 0', async () => {
      vi.useFakeTimers()
      mockApiResponses({ serverRemainingMs: 0 })
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(0)

      expect(mockPlayerGameGet).toHaveBeenCalledTimes(1)
      expect(mockResourceGet).toHaveBeenCalledTimes(1)
    })

    it('enters new-tick branch when serverRemainingMs > MAX_EARLY_THRESHOLD', async () => {
      mockApiResponses({ serverRemainingMs: 30000 })
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      await vi.waitFor(() => {
        expect(mockPlayerGameGet).toHaveBeenCalledTimes(1)
      })

      expect(mockResourceGet).toHaveBeenCalledTimes(1)
    })
  })

  // ----- state updates on tick -----

  describe('state updates on tick', () => {
    it('applies resource and tick timing on late branch (serverRemainingMs = 0)', async () => {
      mockApiResponses({ serverRemainingMs: 0 })
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      await vi.waitFor(() => {
        expect(defaultStore.setTickData).toHaveBeenCalled()
      })

      expect(defaultStore.setResource).toHaveBeenCalledWith(
        expect.objectContaining({ food: 200, wood: 150, metal: 50, civilians: 10, soldiers: 0 })
      )
      expect(defaultStore.setTickData).toHaveBeenCalledWith(30000, 0)
    })

    it('applies resource and tick timing on new-tick branch (serverRemainingMs > 10000)', async () => {
      mockApiResponses({ serverRemainingMs: 30000 })
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      await vi.waitFor(() => {
        expect(defaultStore.setTickData).toHaveBeenCalled()
      })

      expect(defaultStore.setResource).toHaveBeenCalledWith(
        expect.objectContaining({ food: 200, wood: 150, metal: 50, civilians: 10, soldiers: 0 })
      )
      expect(defaultStore.setTickData).toHaveBeenCalledWith(30000, 30000)
    })

    it('does NOT call setResource on early branch', async () => {
      mockApiResponses({ serverRemainingMs: 5000 })
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      await vi.waitFor(() => {
        expect(defaultStore.setTickData).toHaveBeenCalled()
      })

      // Early branch: tick timing updated, retry state cleared, but resource not refreshed
      expect(defaultStore.setResource).not.toHaveBeenCalled()
      expect(defaultStore.setTickData).toHaveBeenCalledWith(30000, 5000)
      expect(defaultStore.setSyncRetryCount).toHaveBeenCalledWith(0)
      expect(defaultStore.setSyncFailed).toHaveBeenCalledWith(false)
    })

    it('calls setResource before setTickData (ordering)', async () => {
      mockApiResponses({ serverRemainingMs: 30000 })
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      await vi.waitFor(() => {
        expect(defaultStore.setTickData).toHaveBeenCalled()
      })

      const resourceOrder = defaultStore.setResource.mock.invocationCallOrder[0]
      const tickDataOrder = defaultStore.setTickData.mock.invocationCallOrder[0]
      expect(resourceOrder).toBeLessThan(tickDataOrder)
    })
  })

  // ----- error handling -----

  describe('error handling', () => {
    it('retries 4 times at 2s intervals then stops', async () => {
      vi.useFakeTimers()
      mockPlayerGameGet.mockRejectedValue(new Error('Network failure'))
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      // fetchTick called immediately, API fails → retry in 2s
      await vi.advanceTimersByTimeAsync(0)
      expect(mockPlayerGameGet).toHaveBeenCalledTimes(1)

      // 4 retries × 2s each
      for (let i = 1; i <= 4; i++) {
        await vi.advanceTimersByTimeAsync(2000)
        expect(mockPlayerGameGet).toHaveBeenCalledTimes(i + 1)
      }

      // Extra 10s — should NOT fire a 5th retry
      await vi.advanceTimersByTimeAsync(10000)
      expect(mockPlayerGameGet).toHaveBeenCalledTimes(5)

      // setSyncRetryCount called with 1,2,3,4 on retries, then 0 on cap
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(1, 1)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(2, 2)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(3, 3)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(4, 4)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(5, 0)
      expect(defaultStore.setSyncFailed).toHaveBeenCalledWith(true)
    })

    it('handles concurrent interval + backup timeout at tick boundary: exactly 5 retries, no double-fire', async () => {
      // When serverRemainingMs > 0, TWO timers fire fetchTick at the same
      // time when the countdown hits 0: the interval (line ~77) and the
      // backup setTimeout (line ~86). Without the `fetching` guard, each
      // path gets its own retry chain, inflating calls beyond the cap of 5.
      // This test proves the guard works.
      vi.useFakeTimers()
      mockPlayerGameGet.mockRejectedValue(new Error('Network disconnected'))
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 5000,
      })
      render(<TickTimer />)

      // No calls during countdown
      expect(mockPlayerGameGet).not.toHaveBeenCalled()

      // Advance past countdown (5s) + all 4 retries (4 × 2s)
      await vi.advanceTimersByTimeAsync(15000)

      // Exactly 5 calls: 1 initial + 4 retries.
      // Without the fetching guard you'd get 6+ (double concurrent chains).
      expect(mockPlayerGameGet).toHaveBeenCalledTimes(5)

      // Advance more — no new calls (cap hit)
      await vi.advanceTimersByTimeAsync(15000)
      expect(mockPlayerGameGet).toHaveBeenCalledTimes(5)

      // Retry count progresses 1..4 then resets to 0 on cap
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(1, 1)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(2, 2)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(3, 3)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(4, 4)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(5, 0)
      expect(defaultStore.setSyncFailed).toHaveBeenCalledWith(true)
    })

    it('resets retry counter on successful tick after transient failure', async () => {
      vi.useFakeTimers()
      const rejectThenResolve = vi.fn()
        .mockRejectedValueOnce(new Error('Network failure'))
        .mockRejectedValueOnce(new Error('Network failure'))
        .mockResolvedValueOnce({
          tickIntervalMs: 30000,
          serverRemainingMs: 0,
          playerGame: { id: 1, lastTickAt: new Date().toISOString() },
        })
      mockPlayerGameGet.mockImplementation(rejectThenResolve)
      mockUseGameStore.mockReturnValue({
        ...defaultStore,
        serverRemainingMs: 0,
      })
      render(<TickTimer />)

      // Initial call fails
      await vi.advanceTimersByTimeAsync(0)
      expect(mockPlayerGameGet).toHaveBeenCalledTimes(1)

      // Retry 1 fails (2s delay)
      await vi.advanceTimersByTimeAsync(2000)
      expect(mockPlayerGameGet).toHaveBeenCalledTimes(2)

      // Retry 2 succeeds — counter resets
      await vi.advanceTimersByTimeAsync(2000)
      expect(mockPlayerGameGet).toHaveBeenCalledTimes(3)
      expect(mockResourceGet).toHaveBeenCalledTimes(1)
      expect(defaultStore.setResource).toHaveBeenCalled()
      expect(defaultStore.setTickData).toHaveBeenCalled()
      expect(defaultStore.setSyncFailed).toHaveBeenCalledWith(false)
      expect(defaultStore.setSyncRetryCount).toHaveBeenNthCalledWith(3, 0)
    })
  })
})
