export function calculateRevisionCredits(baseCredits: number) {
  return Math.ceil(baseCredits * 1.2)
}

export function calculateOverageValue(shortage: number, avulsoValue = 14) {
  return Math.max(shortage, 0) * avulsoValue
}

export function getCurrentCycleDate(date = new Date()) {
  return {
    mes: date.getMonth() + 1,
    ano: date.getFullYear(),
  }
}
