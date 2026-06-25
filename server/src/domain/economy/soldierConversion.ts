export function calculateConvertedSoldiers(amount: number, conversionRate: number): number {
  return Math.floor(amount * conversionRate)
}
