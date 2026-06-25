export function roundToIntegers(input: number): number {
    return Math.round(input)
}

export function roundToTwoDecimals(input: number): number {
    return Math.round(input * 100) / 100
}

export function isFinite(input: number): boolean {
	return Number.isFinite(input)
}

export function getLowestNumber(inputs: number[]): number {
	return Math.min(...inputs)
}

export function getHighestNumber(inputs: number[]): number {
	return Math.max(...inputs)
}

export function generateRandomInteger(range: number): number {
	return Math.floor(Math.random() * range)
}

export function generateRandomNumber(range: number): number {
	return Math.random()
}

export function isNegativeNumber(value: number): boolean {
    return value < 0
}
