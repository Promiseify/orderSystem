export function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function nowText(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function todayText(): string {
  return nowText(new Date()).slice(0, 10)
}

export function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export function toMoney(value: number): string {
  return `￥${value.toFixed(2)}`
}

export function sameDate(datetime: string, date: string): boolean {
  return datetime.slice(0, 10) === date
}
