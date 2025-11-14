export function mapUserRecord(record) {
  return {
    id: Number(record.id),
    name: record.name ?? '',
    email: record.email ?? '',
    tier: record.tier ?? 'free',
    role: record.role ?? 'user',
    cpf: record.cpf ?? '',
    credits: Number(record.credits ?? 0),
    freeWordsUsed: Number(record.free_words_used ?? 0),
  };
}

export function mapTransactionRecord(record) {
  return {
    id: Number(record.id),
    userId: Number(record.user_id),
    credits: Number(record.credits ?? 0),
    amount: Number(record.amount ?? 0),
    method: record.method ?? 'PIX',
    createdAt: record.created_at ?? new Date().toISOString(),
  };
}
