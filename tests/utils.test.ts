import { describe, it, expect } from 'vitest'
import { calcFinalPrice, calcSavings, isTimeInRange, isDealActiveToday } from '../src/lib/utils'

describe('calcFinalPrice', () => {
  it('should calculate percent discount correctly', () => {
    expect(calcFinalPrice(100, 20, 'percent')).toBe(80)
    expect(calcFinalPrice(299, 30, 'percent')).toBe(209.3)
  })

  it('should calculate amount discount correctly', () => {
    expect(calcFinalPrice(100, 20, 'amount')).toBe(80)
    expect(calcFinalPrice(299, 90, 'amount')).toBe(209)
  })

  it('should handle undefined original price', () => {
    expect(calcFinalPrice(undefined, 20)).toBeUndefined()
  })

  it('should handle zero discount', () => {
    expect(calcFinalPrice(100, 0)).toBe(100)
  })

  it('should not go below zero', () => {
    expect(calcFinalPrice(50, 100, 'amount')).toBe(0)
    expect(calcFinalPrice(50, 200, 'percent')).toBe(0)
  })
})

describe('calcSavings', () => {
  it('should calculate savings correctly', () => {
    expect(calcSavings(100, 80, 1)).toBe(20)
    expect(calcSavings(100, 80, 2)).toBe(40)
  })

  it('should handle undefined prices', () => {
    expect(calcSavings(undefined, 80)).toBe(0)
    expect(calcSavings(100, undefined)).toBe(0)
  })

  it('should not return negative savings', () => {
    expect(calcSavings(80, 100)).toBe(0)
  })
})

describe('isTimeInRange', () => {
  it('should return true when current time is in range', () => {
    const testTime = new Date('2023-01-01T14:30:00')
    expect(isTimeInRange('14:00', '15:00', testTime)).toBe(true)
  })

  it('should return false when current time is outside range', () => {
    const testTime = new Date('2023-01-01T16:30:00')
    expect(isTimeInRange('14:00', '15:00', testTime)).toBe(false)
  })

  it('should handle edge cases', () => {
    const startTime = new Date('2023-01-01T14:00:00')
    const endTime = new Date('2023-01-01T15:00:00')
    expect(isTimeInRange('14:00', '15:00', startTime)).toBe(true)
    expect(isTimeInRange('14:00', '15:00', endTime)).toBe(true)
  })
})

describe('isDealActiveToday', () => {
  it('should return true when today is included in days array', () => {
    // Assuming today is Monday (1)
    expect(isDealActiveToday([1, 2, 3, 4, 5])).toBe(true)
  })

  it('should handle Sunday correctly', () => {
    // Sunday should be treated as day 7
    const sundayDate = new Date('2023-01-01') // This is a Sunday
    const originalGetDay = Date.prototype.getDay
    Date.prototype.getDay = () => 0 // Mock Sunday
    
    expect(isDealActiveToday([7])).toBe(true)
    expect(isDealActiveToday([1, 2, 3, 4, 5, 6])).toBe(false)
    
    Date.prototype.getDay = originalGetDay // Restore
  })
})



























