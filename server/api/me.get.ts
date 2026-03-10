// server/api/me.get.ts
import { auth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  return {
    user: session.user,
  };
});
