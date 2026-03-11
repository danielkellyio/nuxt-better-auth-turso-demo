---
title: Robust Nuxt Authentication with Better Auth
description: Learn how to add authentication to a Nuxt application using Better Auth and Nuxt UI — covering email/password sign-up, social login, SSR-safe sessions, route protection, and the plugin ecosystem.
---

Authentication is one of those features every serious web application needs, yet it remains one of the most tedious to implement correctly. Session management, CSRF protection, secure password hashing, OAuth flows, database schema — the surface area is large, and the stakes are high.

For Nuxt developers, the landscape has shifted over the past couple of years. Lucia Auth deprecated itself. Auth.js (NextAuth) has a Nuxt integration, but its callback-heavy configuration model can feel foreign in a Nuxt codebase. [Nuxt Auth utils is awesome](https://vueschool.io/courses/nuxt-auth-utils-secure-simple-and-flexible-logins), but leaves more robust features up to you. Meanwhile, a newer library called [Better Auth](https://better-auth.com/) has gained serious traction by offering a TypeScript-first, framework-agnostic approach with built-in support for features that other libraries treat as afterthoughts — two-factor authentication, organization management, rate limiting, and more.

In this article, we'll walk through integrating Better Auth into a Nuxt application from scratch. By the end, you'll have working email/password authentication, social login with GitHub, SSR-safe sessions, protected routes, and a clear path to extend the setup with plugins.

## Why Better Auth?

Before diving into code, it's worth understanding what sets Better Auth apart:

- **TypeScript-first**: Every API is fully typed. The client methods, server utilities, and plugin interfaces all provide strong type inference without manual type declarations.
- **Framework-agnostic with first-class Nuxt support**: Better Auth works with any JavaScript backend, but its [Nuxt integration](https://better-auth.com/docs/integrations/nuxt) is well-documented and feels native to the framework.
- **Plugin architecture**: Need two-factor auth? [Add the `twoFactor()` plugin](https://better-auth.com/docs/plugins/2fa). Need organization/team management? [There's a plugin for that too](https://better-auth.com/docs/plugins/organization). Over 27 plugins are available, and each one extends both the server and client APIs automatically.
- **Database flexibility**: It works with raw SQL drivers (SQLite, PostgreSQL, MySQL), ORMs like Drizzle and Prisma, or even MongoDB. An included CLI generates and runs migrations for you.
- **Built-in security defaults**: Secure password hashing, CSRF protection, rate limiting, and session management are handled out of the box.

## Project Setup

Let's start with a fresh Nuxt project. If you already have one, skip to the next section.

```bash
npx nuxi init nuxt-better-auth
cd nuxt-better-auth
npm install
```

Add [Nuxt UI](https://ui.nuxt.com/) for a consistent, accessible component set (buttons, inputs, cards, alerts). Install the module and Tailwind CSS:

```bash
npm install @nuxt/ui tailwindcss
```

Register the module and add the required CSS in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
});
```

Create `assets/css/main.css`:

```css
@import "tailwindcss";
@import "@nuxt/ui";
```

Wrap your app with `UApp` in `app.vue` so Toasts and other overlays work correctly:

```vue
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

Now install Better Auth and a database driver. We'll use `better-sqlite3` for simplicity — it requires zero configuration and stores everything in a local file. For production, you'd swap this for PostgreSQL, MySQL, or a cloud database like Turso.

```bash
npm install better-auth better-sqlite3
npm install -D @types/better-sqlite3
```

Add two environment variables to your `.env` file:

```bash
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
```

You can generate a strong secret with `openssl rand -base64 32`.

## Configuring the Auth Instance

Create a file at `server/utils/auth.ts`. This is where you define your Better Auth instance — the database connection, authentication methods, and any plugins you want to use.

```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
  },
});
```

This minimal configuration gives you a fully functional email/password auth system. Better Auth handles password hashing (using scrypt by default), session token generation, CSRF protection, and cookie management.

### Creating the Database Tables

Better Auth includes a CLI that generates the required database tables. Since our auth instance lives at `server/utils/auth.ts` (not at the project root), pass the config path explicitly:

```bash
npx @better-auth/cli migrate --config ./server/utils/auth.ts
```

This creates the `user`, `session`, `account`, and `verification` tables. Whenever you add plugins later, re-running this command will create any additional tables they require.

To codify this process, you can create a script in `package.json` to run the migration:

```json
{
  "scripts": {
    "better-auth:migrate": "npx @better-auth/cli migrate --config ./server/utils/auth.ts"
  }
}
```

If you prefer to generate a migration file instead of applying changes directly, use:

```bash
npx @better-auth/cli generate --config ./server/utils/auth.ts
```

## Mounting the API Handler

Better Auth needs a catch-all API route to handle authentication requests. Create `server/api/auth/[...all].ts`:

```typescript
import { auth } from "~/server/utils/auth";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
```

This single route handles every auth endpoint — sign-up, sign-in, sign-out, session retrieval, OAuth callbacks, and any endpoints added by plugins. The `toWebRequest` helper converts Nuxt's event into a standard Web Request that Better Auth understands.

## Creating the Auth Client

On the client side, Better Auth provides a Vue-specific client with reactive state. Create `composables/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient();
```

Nuxt auto-imports composables, so `authClient` is available in any component, page, or middleware without an explicit import.

Since the auth server runs on the same domain, you don't need to specify a `baseURL`. The client automatically calls `/api/auth/*` endpoints.

You can also destructure specific methods if you prefer a more explicit import style:

```typescript
export const { signIn, signUp, signOut, useSession } = createAuthClient();
```

## Building a Sign-Up Page

Create `pages/register.vue` using [Nuxt UI's](https://vueschool.io/courses/nuxt-ui-build-a-dashboard-template) `UCard`, `UFormField`, `UInput`, `UButton`, and `UAlert`:

```html
<script setup lang="ts">
  const name = ref("");
  const email = ref("");
  const password = ref("");
  const error = ref("");
  const loading = ref(false);

  async function handleSignUp() {
    error.value = "";
    loading.value = true;

    const { error: signUpError } = await authClient.signUp.email({
      name: name.value,
      email: email.value,
      password: password.value,
    });

    if (signUpError) {
      error.value = signUpError.message ?? "Something went wrong";
      loading.value = false;
      return;
    }

    navigateTo("/dashboard");
  }
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Create an Account</h1>
      </template>

      <form class="space-y-4" @submit.prevent="handleSignUp">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :description="error"
          icon="i-lucide-circle-alert"
        />

        <UFormField label="Name" required>
          <UInput
            v-model="name"
            type="text"
            placeholder="Your name"
            size="md"
            required
          />
        </UFormField>

        <UFormField label="Email" required>
          <UInput
            v-model="email"
            type="email"
            placeholder="you@example.com"
            size="md"
            required
          />
        </UFormField>

        <UFormField label="Password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="At least 8 characters"
            size="md"
            required
          />
        </UFormField>

        <UButton
          type="submit"
          block
          size="md"
          :loading="loading"
          :trailing="false"
        >
          {{ loading ? "Creating account..." : "Sign Up" }}
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-muted">
          Already have an account?
          <UButton to="/login" variant="link" size="sm" class="p-0">
            Sign in
          </UButton>
        </p>
      </template>
    </UCard>
  </div>
</template>
```

The `signUp.email` method sends the user's credentials to the server, creates the account, hashes the password, and, by default, automatically signs the user in. After a successful sign-up, we use Nuxt's `navigateTo` to redirect to the dashboard. (Note that the better auth client `callbackURL` option is designed for OAuth/redirect-based flows and won't trigger a client-side navigation for email/password auth — that's why we handle the redirect manually.)

![Create an Account form with Name, Email, and Password fields](./images/register.png)

## Building a Login Page

Create `pages/login.vue` with the same Nuxt UI patterns:

```html
<script setup lang="ts">
  const email = ref("");
  const password = ref("");
  const error = ref("");
  const loading = ref(false);

  async function handleSignIn() {
    error.value = "";
    loading.value = true;

    const { error: signInError } = await authClient.signIn.email({
      email: email.value,
      password: password.value,
    });

    if (signInError) {
      error.value = signInError.message ?? "Invalid credentials";
      loading.value = false;
      return;
    }

    navigateTo("/dashboard");
  }
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Sign In</h1>
      </template>

      <form class="space-y-4" @submit.prevent="handleSignIn">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :description="error"
          icon="i-lucide-circle-alert"
        />

        <UFormField label="Email" required>
          <UInput
            v-model="email"
            type="email"
            placeholder="you@example.com"
            size="md"
            required
          />
        </UFormField>

        <UFormField label="Password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="Your password"
            size="md"
            required
          />
        </UFormField>

        <UButton
          type="submit"
          block
          size="md"
          :loading="loading"
          :trailing="false"
        >
          {{ loading ? "Signing in..." : "Sign In" }}
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-muted">
          Don't have an account?
          <UButton to="/register" variant="link" size="sm" class="p-0">
            Sign up
          </UButton>
        </p>
      </template>
    </UCard>
  </div>
</template>
```

![Sign In form with Email and Password fields](./images/login.png)

## Working with Sessions

### Client-Side Sessions

Better Auth's Vue client provides a reactive `useSession` composable that updates automatically when the auth state changes. With Nuxt UI you can render loading, authenticated, and unauthenticated states using `USkeleton`, `UCard`, and `UButton`:

```html
<script setup lang="ts">
  const session = authClient.useSession();
</script>

<template>
  <div v-if="session.isPending">
    <USkeleton class="h-8 w-48" />
  </div>
  <UCard v-else-if="session.data" class="max-w-md">
    <template #header>
      <p class="font-medium">Welcome, {{ session.data.user.name }}</p>
    </template>
    <UButton color="neutral" variant="outline" @click="authClient.signOut()">
      Sign Out
    </UButton>
  </UCard>
  <div v-else>
    <UButton to="/login" size="md"> Sign In </UButton>
  </div>
</template>
```

The `useSession` composable returns a reactive object with `data` (the session and user), `isPending` (loading state), and `error` (if the session fetch failed). When the user signs out, `data` becomes `null` and your UI updates immediately.

![Dashboard showing authenticated user and Sign Out button](./images/dashboard.png)

### SSR-Safe Sessions

If your Nuxt app uses server-side rendering, you'll want the session to be available during the initial render. Pass Nuxt's `useFetch` to `useSession` so it fetches the session on the server and hydrates it on the client:

```html
<script setup lang="ts">
  const { data: session } = await authClient.useSession(useFetch);
</script>

<template>
  <p v-if="session" class="text-default">Welcome, {{ session.user.name }}</p>
</template>
```

[This is what the docs say anyways](https://better-auth.com/docs/integrations/nuxt#ssr-usage) however at the time of writing this article, it causes hydration errors. [See this github issue for more information](https://github.com/better-auth/better-auth/issues/5358) and a workaround.

### Server-Side Sessions

On the server, you can access the session through the `auth.api` object. This is useful for server routes, API endpoints, and server middleware:

```typescript
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
```

## Protecting Routes with Middleware

Nuxt middleware is the natural place to enforce authentication requirements. Create `middleware/auth.global.ts` for a global middleware that protects specific routes. `authClient` is auto-imported from your composable:

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  const protectedRoutes = ["/dashboard", "/settings", "/profile"];
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
```

The middleware does two things: it redirects unauthenticated users away from protected pages, and it redirects authenticated users away from the login and registration pages.

Alternately, we could create 2 named middlewares, one for protected routes and one for auth routes.

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  if (!session.value) {
    return navigateTo("/login");
  }
});
```

```typescript
// middleware/guest.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  if (session.value) {
    return navigateTo("/dashboard");
  }
});
```

And then register these middleware on the respective pages with `definePageMeta`:

```html
<!-- pages/dashboard.vue -->
<script setup lang="ts">
  definePageMeta({
    middleware: ["auth"],
  });
</script>
```

```html
<!-- pages/login.vue -->
<!-- pages/register.vue -->
<script setup lang="ts">
  definePageMeta({
    middleware: ["guest"],
  });
</script>
```

## Adding Social Login

Better Auth supports 33+ OAuth providers. Let's add GitHub as an example.

### Server Configuration

Update your auth instance in `server/utils/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
```

Add the GitHub OAuth credentials to your `.env` file (you can leave them empty until the app is created):

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

(Alternatviely, you could also use runtime config variables instead of reaching for process.env directly)

To get these credentials, create an OAuth App in your [GitHub Developer Settings](https://github.com/settings/developers). Set the **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`. Until these are set, the “Continue with GitHub” button will redirect to GitHub but the callback will fail; the email/password flow is unaffected.

![GitHub Developer Settings](./images/github-developer-settings.png)

### Client Usage

Add a social sign-in button to your login page (and optionally the register page) using Nuxt UI's `UButton`. Place it above the email/password form with a visual “or” divider so users can choose GitHub or email.

![GitHub Login Button](./images/github-login-button.jpg)

For OAuth, `callbackURL` is correct — it’s where users land after GitHub redirects back (unlike email/password, where you use `navigateTo` on success).

```html
<script setup lang="ts">
  function signInWithGitHub() {
    authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });
  }
</script>

<template>
  <!-- Inside your UCard, above the email form: -->
  <UButton
    block
    color="neutral"
    variant="outline"
    size="md"
    icon="i-simple-icons-github"
    @click="signInWithGitHub"
  >
    Continue with GitHub
  </UButton>

  <div class="relative">
    <div class="absolute inset-0 flex items-center">
      <span class="w-full border-t border-default" />
    </div>
    <div class="relative flex justify-center text-xs uppercase">
      <span class="bg-card px-2 text-muted">or</span>
    </div>
  </div>

  <!-- Then your existing email/password form -->
</template>
```

That's it. Better Auth handles the full OAuth flow — redirecting to GitHub, exchanging the authorization code for tokens, creating or linking the user account, and establishing the session. Add the same button and `signInWithGitHub` handler to your register page so users can sign up with GitHub as well.

Adding another provider like Google follows the same pattern:

```typescript
// server/utils/auth.ts
betterAuth({
  // ...
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
```

## Extending with Plugins

Better Auth's plugin system is where it really shines. Plugins extend both the server and client APIs with full type safety — once you add a plugin, its methods appear in autocomplete without any extra configuration.

### Two-Factor Authentication (OTP)

Adding 2FA is a good example of how plugins work. Here we use **OTP** (one-time password): the server generates a code and "sends" it somewhere you define; for development we log it to the server console. You can later switch to email or SMS by changing the `sendOTP` implementation. Better Auth also supports **TOTP** (authenticator apps like Google Authenticator); see the [2FA plugin documentation](https://better-auth.com/docs/plugins/2fa) to set up TOTP instead or in addition.

#### Step 1: Server plugin

Add the `twoFactor` plugin to your existing auth config in `server/utils/auth.ts`. Use `skipVerificationOnEnable: true` (so users don't have to verify a TOTP code when enabling) and `otpOptions.sendOTP` to define where the one-time code goes — for development, log it to the server console:

```typescript
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import Database from "better-sqlite3";

// ... any existing hasGitHub etc.

export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  appName: "Nuxt Better Auth",
  emailAndPassword: { enabled: true },
  plugins: [
    twoFactor({
      skipVerificationOnEnable: true,
      otpOptions: {
        async sendOTP({ user, otp }) {
          console.log("[2FA OTP]", user.email, "→ Code:", otp);
        },
      },
    }),
  ],
  // ... rest of config (e.g. socialProviders)
});
```

#### Step 2: Migration

Run the migration so the `twoFactor` table and user fields exist:

```bash
npx @better-auth/cli migrate --config ./server/utils/auth.ts
```

#### Step 3: Auth client plugin

In `composables/auth-client.ts`, add `twoFactorClient` and set `onTwoFactorRedirect` so that when a user with 2FA signs in, they are sent to your verification page:

```typescript
import { createAuthClient } from "better-auth/vue";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/two-factor";
      },
    }),
  ],
});
```

#### Step 4: Two-factor verification page

Create `pages/two-factor.vue`. The flow is:

1. User lands here after signing in with 2FA enabled.
2. Show a **"Send code"** button that calls `authClient.twoFactor.sendOtp({})`. Your server `sendOTP` runs (and in dev logs the code to the terminal).
3. After sending, show an input for the verification code and a **"Trust this device for 30 days"** checkbox.
4. On submit, call `authClient.twoFactor.verifyOtp({ code, trustDevice })` (or `authClient.twoFactor.verifyBackupCode({ code, trustDevice })` if they chose backup code).
5. On success, redirect to `/dashboard` (e.g. `window.location.href = "/dashboard"`).

Here's the code for the page:

```html
<script setup lang="ts">
  const code = ref("");
  const backupCode = ref("");
  const useBackupCode = ref(false);
  const error = ref("");
  const loading = ref(false);
  const sendOtpLoading = ref(false);
  const codeSent = ref(false);
  const trustDevice = ref(true);

  async function handleSendOtp() {
    error.value = "";
    sendOtpLoading.value = true;
    const { data, error: sendError } = await authClient.twoFactor.sendOtp({});
    sendOtpLoading.value = false;
    if (sendError) {
      error.value = sendError.message ?? "Failed to send code";
      return;
    }
    if (data) {
      codeSent.value = true;
    }
  }

  async function handleVerify() {
    error.value = "";
    loading.value = true;

    const toVerify = useBackupCode.value
      ? backupCode.value.trim()
      : code.value.replace(/\s/g, "");

    if (!toVerify) {
      error.value = useBackupCode.value
        ? "Enter a backup code"
        : "Enter the code";
      loading.value = false;
      return;
    }

    if (useBackupCode.value) {
      const { error: verifyError } =
        await authClient.twoFactor.verifyBackupCode({
          code: toVerify,
          trustDevice: trustDevice.value,
        });
      if (verifyError) {
        error.value = verifyError.message ?? "Invalid backup code";
        loading.value = false;
        return;
      }
    } else {
      const { error: verifyError } = await authClient.twoFactor.verifyOtp({
        code: toVerify,
        trustDevice: trustDevice.value,
      });
      if (verifyError) {
        error.value = verifyError.message ?? "Invalid code";
        loading.value = false;
        return;
      }
    }

    window.location.href = "/dashboard";
  }
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Two-Factor Authentication</h1>
        <p class="text-sm text-muted mt-1">
          Request a one-time code or use a backup code.
        </p>
      </template>

      <form class="space-y-4" @submit.prevent="handleVerify">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :description="error"
          icon="i-lucide-circle-alert"
        />

        <template v-if="!codeSent && !useBackupCode">
          <p class="text-sm text-muted">
            Click below to send a one-time code. In development the code is
            logged to the server console.
          </p>
          <UButton
            type="button"
            block
            size="md"
            :loading="sendOtpLoading"
            @click="handleSendOtp"
          >
            {{ sendOtpLoading ? "Sending..." : "Send code" }}
          </UButton>
        </template>

        <template v-else-if="!useBackupCode">
          <UFormField label="Verification code" required>
            <UInput
              v-model="code"
              type="text"
              inputmode="numeric"
              placeholder="Enter the code"
              size="md"
              maxlength="6"
              autocomplete="one-time-code"
            />
          </UFormField>
          <p class="text-xs text-muted">
            Check the terminal where <code>nr dev</code> is running for the
            code.
          </p>
        </template>

        <template v-else>
          <UFormField label="Backup code" required>
            <UInput
              v-model="backupCode"
              type="text"
              placeholder="Enter a backup code"
              size="md"
              autocomplete="one-time-code"
            />
          </UFormField>
        </template>

        <label class="flex items-center gap-2 cursor-pointer text-sm">
          <UCheckbox v-model="trustDevice" />
          <span>Trust this device for 30 days</span>
        </label>

        <UButton
          v-if="codeSent || useBackupCode"
          type="submit"
          block
          size="md"
          :loading="loading"
          :trailing="false"
        >
          {{ loading ? "Verifying..." : "Verify" }}
        </UButton>

        <p class="text-center text-sm text-muted">
          <UButton
            variant="link"
            size="sm"
            class="p-0"
            @click="useBackupCode = !useBackupCode; codeSent = false; code = ''; backupCode = ''"
          >
            {{ useBackupCode ? "Send one-time code instead" : "Use a backup code
            instead" }}
          </UButton>
        </p>
      </form>
    </UCard>
  </div>
</template>
```

![Two-factor page with Send code button](./images/send-code.jpg)

![Two-factor page with verification code input](./images/verify-code.jpg)

#### Step 5: Dashboard 2FA UI

Now we need a way to enable and disable 2FA for a user. In this project, we can do it on the dashboard page. In your own project, of course, you can do it wherever you want.

Let's walk through the code for the dashboard page and see how to integrate with the 2FA func

**Script Section: session, has2FA, and 2FA handlers**

```html
<script setup lang="ts">
  const session = authClient.useSession();

  // --- 2FA state ---
  const twoFactorPassword = ref("");
  const twoFactorError = ref("");
  const twoFactorLoading = ref(false);
  const enableResult = ref<{ backupCodes: string[] } | null>(null);
  const disablePassword = ref("");
  const disableError = ref("");
  const disableLoading = ref(false);

  // useSession() returns a Ref<{ data: { user, session }, isPending, ... }>
  const sessionRef = session as Ref<{
    data?: { user?: { twoFactorEnabled?: boolean } } | null;
  }>;
  const user = computed(() => sessionRef.value?.data?.user);

  // 2FA is "on" if the session says so, we just enabled it (enableResult), or we stored it in sessionStorage
  // (session may not return twoFactorEnabled immediately; sessionStorage survives until disable/sign out)
  const has2FA = computed(
    () =>
      !!user.value?.twoFactorEnabled ||
      !!enableResult.value ||
      (import.meta.client && sessionStorage.getItem("2fa-enabled") === "true"),
  );

  // Clear 2fa-enabled before sign out so the next user doesn't see 2FA as enabled
  async function handleSignOut() {
    if (import.meta.client) {
      sessionStorage.removeItem("2fa-enabled");
    }
    await authClient.signOut();
    navigateTo("/login");
  }

  // Enable 2FA: password → enable() → backup codes; then persist "2fa-enabled" and show success UI
  async function startEnable2FA() {
    if (!twoFactorPassword.value) {
      twoFactorError.value = "Enter your password";
      return;
    }
    twoFactorError.value = "";
    twoFactorLoading.value = true;
    const { data, error } = await authClient.twoFactor.enable({
      password: twoFactorPassword.value,
    });
    twoFactorLoading.value = false;
    if (error) {
      twoFactorError.value = error.message ?? "Failed to enable 2FA";
      return;
    }
    if (data?.backupCodes) {
      enableResult.value = { backupCodes: data.backupCodes };
      twoFactorPassword.value = "";
      if (import.meta.client) {
        sessionStorage.setItem("2fa-enabled", "true");
      }
    }
  }

  // After showing backup codes, "Done" clears state and reloads so the UI shows "2FA is enabled"
  function dismissEnableSuccess() {
    enableResult.value = null;
    window.location.reload();
  }

  // Disable 2FA: password → disable() → clear sessionStorage and reload
  async function handleDisable2FA() {
    if (!disablePassword.value) {
      disableError.value = "Enter your password";
      return;
    }
    disableError.value = "";
    disableLoading.value = true;
    const { error } = await authClient.twoFactor.disable({
      password: disablePassword.value,
    });
    disableLoading.value = false;
    if (error) {
      disableError.value = error.message ?? "Failed to disable 2FA";
      return;
    }
    disablePassword.value = "";
    if (import.meta.client) {
      sessionStorage.removeItem("2fa-enabled");
    }
    window.location.reload();
  }
</script>
```

**Template: 2FA block and sign out**

Inside your dashboard card, add a section that branches on `has2FA` and `enableResult`:

- **When 2FA is enabled:** show a short message and the disable form (password + "Disable 2FA" button).
- **When 2FA is off and not just enabled:** show the enable form (password + "Enable 2FA" button).
- **When `enableResult` is set:** show "2FA enabled with OTP", list `enableResult.backupCodes`, and a "Done" button that calls `dismissEnableSuccess()`.

Sign-out button in the card footer should call `handleSignOut()` so `sessionStorage.removeItem("2fa-enabled")` runs before signing out.

```html
<!-- Inside the dashboard card, after welcome message: -->
<div class="border-t border-default pt-4 space-y-4">
  <h2 class="font-medium">Two-Factor Authentication</h2>
  <p v-if="has2FA" class="text-sm text-muted">
    2FA is enabled. You will be asked for a code when signing in.
  </p>
  <p v-else class="text-sm text-muted">
    Add an extra layer of security by enabling 2FA.
  </p>

  <template v-if="enableResult">
    <!-- Just enabled: show backup codes and Done -->
    <p class="text-sm font-medium text-green-600 dark:text-green-400">
      2FA enabled with OTP.
    </p>
    <p class="text-sm text-muted">Save your backup codes:</p>
    <ul class="text-sm text-muted list-disc list-inside">
      <li v-for="(c, i) in enableResult.backupCodes" :key="i">{{ c }}</li>
    </ul>
    <UButton block size="md" @click="dismissEnableSuccess">Done</UButton>
  </template>
  <template v-else-if="!has2FA">
    <!-- Enable form: password + Enable 2FA -->
    <UFormField label="Your password" required>
      <UInput
        v-model="twoFactorPassword"
        type="password"
        placeholder="Password"
        @keydown.enter="startEnable2FA"
      />
    </UFormField>
    <UAlert
      v-if="twoFactorError"
      color="error"
      variant="soft"
      :description="twoFactorError"
    />
    <UButton block size="md" :loading="twoFactorLoading" @click="startEnable2FA"
      >Enable 2FA</UButton
    >
  </template>
  <template v-else>
    <!-- Disable form: password + Disable 2FA -->
    <UFormField label="Your password" required>
      <UInput
        v-model="disablePassword"
        type="password"
        placeholder="Password to disable 2FA"
        @keydown.enter="handleDisable2FA"
      />
    </UFormField>
    <UAlert
      v-if="disableError"
      color="error"
      variant="soft"
      :description="disableError"
    />
    <UButton
      block
      size="md"
      color="error"
      variant="outline"
      :loading="disableLoading"
      @click="handleDisable2FA"
      >Disable 2FA</UButton
    >
  </template>
</div>

<!-- Footer: sign out clears sessionStorage then signs out -->
<template #footer>
  <UButton color="neutral" variant="outline" block @click="handleSignOut"
    >Sign Out</UButton
  >
</template>
```

![Dashboard with Two-Factor Authentication section](./images/2fa-dashboard.jpg)

![Backup codes shown after enabling 2FA](./images/backup-codes.jpg)

This gives you a full OTP-based 2FA flow: enable and disable on the dashboard, redirect to `/two-factor` after sign-in when 2FA is on, send OTP (console in dev), verify code or backup code, then continue to the app. Two-factor applies only to credential (email/password) accounts; social logins rely on the provider's own 2FA.

### Other Notable Plugins

While the 2FA plugin is awesome in its own right, there are plenty of other plugins that are worth checking out.

| Plugin           | What It Does                                   |
| ---------------- | ---------------------------------------------- |
| **organization** | Team/org management with roles and invitations |
| **magicLink**    | Passwordless email authentication              |
| **passkey**      | WebAuthn/passkey support                       |
| **emailOTP**     | One-time passwords sent via email              |
| **admin**        | User management dashboard utilities            |
| **apiKey**       | API key generation and validation              |

Each plugin follows the same pattern: add it to the server, run the migration, add the client counterpart, and the new APIs are available with full type inference.

## The Nuxt Better Auth Module

If you want an even more integrated experience, the community-built [`@onmax/nuxt-better-auth`](https://better-auth.nuxt.dev/) module wraps Better Auth into a proper Nuxt module. It's currently in alpha, but it offers some compelling features:

- **Declarative route protection** via `routeRules` in your Nuxt config
- **Auto schema generation** so you never need to run migrations manually
- **SSR-safe `useUserSession` composable** that works without passing `useFetch`
- **Automatic API route mounting** so you don't need to create the catch-all handler

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@onmax/nuxt-better-auth"],
  routeRules: {
    "/dashboard/**": { auth: "user" },
    "/admin/**": { auth: "admin" },
  },
});
```

The module is worth watching as it matures. For production applications today, the manual integration described in this article gives you full control and avoids depending on alpha-stage software.

## Production Considerations

Before deploying, keep a few things in mind:

**Switch to a production database.** SQLite is great for development, but you'll want PostgreSQL, MySQL, or a managed solution like Turso for production. Better Auth supports them all — just swap the database driver:

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  // ...
});
```

**Use Drizzle or Prisma for larger projects.** If your application already uses an ORM, Better Auth has built-in adapters for both:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  // ...
});
```

**Set your `BETTER_AUTH_URL` correctly.** In production, this should be your application's public URL. Better Auth uses it for OAuth redirects and cookie configuration.

**Rotate secrets safely.** If you ever need to change your `BETTER_AUTH_SECRET`, use the `BETTER_AUTH_SECRETS` (plural) environment variable to provide both the old and new secrets during the transition period. This ensures existing sessions remain valid while new ones use the updated secret.

## Wrapping Up

Better Auth hits a sweet spot for Nuxt authentication. The core setup is straightforward — a server instance, a catch-all API route, and a client — but the plugin system means you're never boxed in. When requirements grow to include 2FA, team management, or API keys, you add a plugin instead of rearchitecting your auth layer.

The key pieces we covered:

1. **Nuxt UI** for consistent forms and UI (UCard, UFormField, UInput, UButton, UAlert)
2. **Server auth instance** at `server/utils/auth.ts` with database and auth method configuration
3. **Catch-all API route** at `server/api/auth/[...all].ts` to handle all auth endpoints
4. **Vue client** at `composables/auth-client.ts` (auto-imported) with reactive session management
5. **Route protection** with Nuxt middleware
6. **Social login** with minimal configuration
7. **Plugin system** for extending functionality

For further reading, the [Better Auth documentation](https://better-auth.com/docs) is thorough and well-organized. The [official Nuxt example](https://stackblitz.com/github/better-auth/examples/tree/main/nuxt-example) on StackBlitz is a good hands-on starting point, and [Sébastien Chopin's NuxtHub + Better Auth demo](https://github.com/atinux/nuxthub-better-auth) shows how the setup works with Cloudflare D1 and KV for edge deployment.

If you're looking to deepen your Nuxt skills beyond authentication, check out our [Nuxt.js courses at Vue School](https://vueschool.io/courses) — from fundamentals to advanced patterns like server routes, middleware, and full-stack application architecture.
