// services/expenses/createExpense/service.ts

import {
  validateCreateExpense,
  ValidationError,
  CreateExpenseInput,
} from "./schema";

import { createExpense as createExpenseRepo } from "./repository";
import {
  getCategory,
  CategoryNotFoundError,
} from "../../categories/getCategory/repository";

type CreateExpenseServiceParams = {
  userId: string;
  payload: unknown;
};

type CreateExpenseServiceResult = {
  expenseId: string;
};

export class DomainError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export async function createExpenseService({
  userId,
  payload,
}: CreateExpenseServiceParams): Promise<CreateExpenseServiceResult> {
  if (!userId) {
    throw new DomainError("User not authenticated");
  }

  // 1️⃣ Validación payload
  let input: CreateExpenseInput;
  try {
    input = validateCreateExpense(payload);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DomainError("Invalid expense payload");
  }

  // 2️⃣ Validar categoría
  let category: any;

  try {
    category = await getCategory({
      userId,
      categoryId: input.categoryId,
    });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      throw new DomainError("Invalid category");
    }

    // cualquier otro error inesperado
    throw error;
  }

  if (category.isDeleted) {
    throw new DomainError("Invalid category");
  }

  // 3️⃣ (opcional futuro) Validar tipo
  if (category.type !== "EXPENSE") {
    throw new DomainError("Category must be of type EXPENSE");
  }

  // 4️⃣ Persistencia
  try {
    return await createExpenseRepo({
      userId,
      input,
    });
  } catch (error) {
    console.error("DynamoDB error:", error);
    throw new DomainError("Failed to create expense");
  }
}
