// server/api/me.get.ts
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
