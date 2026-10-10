export interface RecurringSubscription {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  student_phone?: string;
  plan_id?: string;
  plan_name?: string;
  amount: number;
  status: "active" | "paused" | "canceled";
  started_at: string;
  next_billing_date: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  subscription_id: string;
  amount: number;
  due_date: string;
  payment_link?: string;
  abacate_payment_id?: string;
  status: "pending" | "paid" | "overdue" | "canceled";
  paid_at?: string;
  sent_at?: string;
  last_reminder_at?: string;
  reminder_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReminderSchedule {
  day: number;
  type: "normal" | "urgent" | "final";
  message: string;
}

export const REMINDER_SCHEDULE: ReminderSchedule[] = [
  { day: 0, type: "normal", message: "Fatura gerada" },
  { day: 10, type: "normal", message: "Primeiro lembrete" },
  { day: 20, type: "normal", message: "Segundo lembrete" },
  { day: 25, type: "urgent", message: "Lembrete urgente - Final do mês" },
  { day: 28, type: "final", message: "Último aviso" },
];
