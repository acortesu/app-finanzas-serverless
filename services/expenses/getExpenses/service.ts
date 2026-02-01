// services/expenses/getExpenses/service.ts

import { validateGetExpensesQuery } from "./schema";
import { getExpenses, getExpensesAggregates } from "./repository";

type RawExpenseItem = {
  entityType: "EXPENSE";
  expenseId: string;
  amount: number;
  currency: string;
  categoryId: string;
  description?: string;
  date: string;
  paymentMethod?: string;
  tags?: string[];
  isDeleted?: boolean;
};

type ExpenseDTO = {
  expenseId: string;
  amount: number;
  currency: string;
  categoryId: string;
  description?: string;
  date: string;
  paymentMethod?: string;
  tags?: string[];
};

type GetExpensesServiceParams = {
  userId: string;
  queryParams: Record<string, string | undefined>;
};

type GetExpensesServiceResult = {
  items: ExpenseDTO[];
  meta: {
    totalAmount: number;
    expenseCount: number;
  };
  nextCursor?: string;
};

export async function getExpensesService({
  userId,
  queryParams,
}: GetExpensesServiceParams): Promise<GetExpensesServiceResult> {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // 1️⃣ Validar query params
  const query = validateGetExpensesQuery(queryParams);

  // 2️⃣ Obtener expenses (paginados)
  const { items, nextCursor } = await getExpenses({
    userId,
    limit: query.limit,
    cursor: query.cursor,
  });

  // 3️⃣ Filtrar y mapear expenses activos
  const expenses: ExpenseDTO[] = (items as RawExpenseItem[])
    .filter((item) => item.entityType === "EXPENSE" && item.isDeleted !== true)
    .map((item) => ({
      expenseId: item.expenseId,
      amount: item.amount,
      currency: item.currency,
      categoryId: item.categoryId,
      description: item.description,
      date: item.date,
      paymentMethod: item.paymentMethod,
      tags: item.tags,
    }));

  let months: string[] = [];

  if (query.type === "MONTH") {
    months = [query.month];
  }

  if (query.type === "RANGE") {
    const fromMonth = query.from.slice(0, 7);
    const toMonth = query.to.slice(0, 7);

    const current = new Date(`${fromMonth}-01`);
    const end = new Date(`${toMonth}-01`);

    while (current <= end) {
      months.push(current.toISOString().slice(0, 7));
      current.setMonth(current.getMonth() + 1);
    }
  }

  let totalAmount = 0;
  let expenseCount = 0;

  for (const month of months) {
    const agg = await getExpensesAggregates({
      userId,
      month,
    });

    totalAmount += agg.totalAmount;
    expenseCount += agg.expenseCount;
  }

  return {
    items: expenses,
    meta: {
      totalAmount,
      expenseCount,
    },
    nextCursor,
  };
}
