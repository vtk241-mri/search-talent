import { z } from "zod";

export function getZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message || "Invalid request data";
}

export async function parseJsonRequest<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<
  | { success: true; data: z.infer<TSchema> }
  | { success: false; error: string }
> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        success: false,
        error: getZodErrorMessage(parsed.error),
      };
    }

    return {
      success: true,
      data: parsed.data,
    };
  } catch {
    return {
      success: false,
      error: "Invalid JSON body",
    };
  }
}
