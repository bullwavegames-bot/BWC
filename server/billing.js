import { randomUUID } from 'node:crypto'

export const PACKS = [
  { id: 'p49', rupees: 49, credit: 500 },
  { id: 'p99', rupees: 99, credit: 1200 },
  { id: 'p199', rupees: 199, credit: 3000 },
]

export const depositUtrs = new Map()
export const payoutUtrs = new Map()
export const receipts = []
export const cashouts = []

export function telegramChannel() {
  return String(process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/bullwaveclub').trim()
}

export function cashoutPayoutsEnabled() {
  return String(process.env.CASHOUT_PAYOUTS_ENABLED || 'false').toLowerCase() === 'true'
}

export function normalizeUtr(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function cashForRupees(rupees) {
  const pack = PACKS.find((p) => p.rupees === Number(rupees))
  if (pack) return pack.credit
  return Number(rupees)
}

export function publicBillingConfig() {
  return {
    packs: PACKS,
    telegramChannel: telegramChannel(),
    cashoutHours: 12,
    cashoutPayoutsEnabled: cashoutPayoutsEnabled(),
    createDeposit: 'gone',
  }
}

export function buildReceiptPdf(receipt) {
  const lines = [
    'BULLWAVE CLUB',
    'Cash-in receipt',
    '',
    `Receipt: ${receipt.id}`,
    `UID: ${receipt.accountNumber}`,
    `Player: ${receipt.username || receipt.email || receipt.phone || '—'}`,
    `Paid: INR ${receipt.rupees}`,
    `Credited cash: INR ${receipt.credit}`,
    `UTR: ${receipt.utr}`,
    `Taxable: INR ${receipt.taxable ?? receipt.rupees}`,
    `GST ${receipt.gstRate || 18}%: INR ${receipt.gst ?? 0}`,
    `Note: ${receipt.note || '—'}`,
    `Settled: ${receipt.createdAt}`,
    '',
    'GST cash-in bill. This UTR cannot credit twice.',
  ]
  const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  let stream = 'BT /F1 12 Tf 50 760 Td\n'
  lines.forEach((line, i) => {
    if (i) stream += '0 -18 Td\n'
    stream += `(${escape(line)}) Tj\n`
  })
  stream += 'ET'
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${obj}\n`
  }
  const xref = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf, 'utf8')
}

export function settleBill(user, { rupees, credit, utr, note, settledBy } = {}) {
  const paid = Number(rupees)
  const cash = Number(credit)
  const key = normalizeUtr(utr)
  if (!Number.isFinite(paid) || paid <= 0) {
    const err = new Error('Enter the INR amount paid.')
    err.status = 400
    throw err
  }
  if (!Number.isFinite(cash) || cash <= 0) {
    const err = new Error('Enter cash (INR) to credit.')
    err.status = 400
    throw err
  }
  if (key.length < 8) {
    const err = new Error('Enter the bank/UPI UTR from the player proof.')
    err.status = 400
    throw err
  }
  if (depositUtrs.has(key)) {
    const err = new Error('This UTR already settled a cash-in. Replay does not pay twice.')
    err.status = 409
    throw err
  }
  user.balance = Number((Number(user.balance || 0) + cash).toFixed(2))
  const receipt = {
    id: `BWC-${randomUUID().slice(0, 8).toUpperCase()}`,
    userId: user.id,
    accountNumber: user.accountNumber,
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    rupees: paid,
    credit: cash,
    gstRate: 18,
    gst: Number(((paid * 18) / 118).toFixed(2)),
    taxable: Number((paid - ((paid * 18) / 118)).toFixed(2)),
    utr: key,
    note: String(note || '').trim(),
    settledBy: settledBy || '',
    createdAt: new Date().toISOString(),
  }
  depositUtrs.set(key, receipt.id)
  receipts.push(receipt)
  return receipt
}

export function requestCashout(user, { amount, destination, method }) {
  const cash = Number(amount)
  if (!Number.isFinite(cash) || cash <= 0) {
    const err = new Error('Enter cash to withdraw.')
    err.status = 400
    throw err
  }
  if (cash > Number(user.balance || 0)) {
    const err = new Error('Only cash can leave. Bonus/promo cannot be withdrawn.')
    err.status = 400
    throw err
  }
  const dest = String(destination || '').trim()
  if (dest.length < 4) {
    const err = new Error('Add UPI ID or bank account details.')
    err.status = 400
    throw err
  }
  user.balance = Number((Number(user.balance || 0) - cash).toFixed(2))
  const row = {
    id: randomUUID(),
    userId: user.id,
    accountNumber: user.accountNumber,
    amount: cash,
    destination: dest,
    method: method || 'upi',
    phone: user.phone || '',
    email: user.email || '',
    status: 'PENDING',
    payoutUtr: null,
    createdAt: new Date().toISOString(),
    settledAt: null,
    note: 'Settlement within 12 hours. Staff pay outside the site.',
  }
  cashouts.push(row)
  return row
}

export function markCashoutPaid(id, utr) {
  const row = cashouts.find((c) => c.id === id)
  if (!row) {
    const err = new Error('Cash-out not found.')
    err.status = 404
    throw err
  }
  if (row.status !== 'PENDING') {
    const err = new Error('This cash-out is already closed.')
    err.status = 409
    throw err
  }
  const key = normalizeUtr(utr)
  if (key.length < 8) {
    const err = new Error('Enter the unique payout UTR.')
    err.status = 400
    throw err
  }
  if (payoutUtrs.has(key)) {
    const err = new Error('This payout UTR already settled a cash-out.')
    err.status = 409
    throw err
  }
  payoutUtrs.set(key, row.id)
  row.status = 'PAID'
  row.payoutUtr = key
  row.settledAt = new Date().toISOString()
  return row
}

export function rejectCashout(id, reason, user) {
  const row = cashouts.find((c) => c.id === id)
  if (!row) {
    const err = new Error('Cash-out not found.')
    err.status = 404
    throw err
  }
  if (row.status !== 'PENDING') {
    const err = new Error('This cash-out is already closed.')
    err.status = 409
    throw err
  }
  row.status = 'REJECTED'
  row.note = reason || 'Rejected by Super Admin'
  row.settledAt = new Date().toISOString()
  if (user) user.balance = Number((Number(user.balance || 0) + row.amount).toFixed(2))
  return row
}
