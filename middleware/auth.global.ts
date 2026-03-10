import { authClient } from "~/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  const protectedRoutes = ["/dashboard"];
  const isProtected = protectedRoutes.some((route) =>
    to.path.startsWith(route),
  );

  if (isProtected && !session.value) {
    return navigateTo("/login");
  }

  const authRoutes = ["/login", "/register"];
  if (authRoutes.includes(to.path) && session.value) {
    return navigateTo("/dashboard");
  }
});
