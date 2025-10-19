'use server';

import { createAdminClient } from '../supabase';
import { parseStringify } from '../utils';

export const createTransaction = async (transaction: CreateTransactionProps) => {
  try {
    const client = await createAdminClient();

    const { data, error } = await client
      .from('transactions')
      .insert([
        {
          channel: 'online',
          category: 'Transfer',
          ...transaction,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};

export const getTransactionsByBankId = async ({ bankId }: getTransactionsByBankIdProps) => {
  try {
    const client = await createAdminClient();

    const [senderTransactions, receiverTransactions] = await Promise.all([
      client.from('transactions').select('*').eq('sender_bank_id', bankId),
      client.from('transactions').select('*').eq('receiver_bank_id', bankId),
    ]);

    if (senderTransactions.error) throw senderTransactions.error;
    if (receiverTransactions.error) throw receiverTransactions.error;

    const transactions = [
      ...(senderTransactions.data || []),
      ...(receiverTransactions.data || []),
    ];

    return parseStringify(transactions);
  } catch (error) {
    console.log(error);
  }
};
