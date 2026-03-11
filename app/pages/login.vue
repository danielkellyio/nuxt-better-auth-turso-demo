<script setup lang="ts">
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

function signInWithGitHub() {
  authClient.signIn.social({
    provider: "github",
    callbackURL: "/dashboard",
  });
}

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

  // Invalidate cached session so middleware's useSession(useFetch) refetches
  await clearNuxtData();
  navigateTo("/dashboard");
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Sign In</h1>
      </template>

      <div class="space-y-4">
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
            <span class="bg-default px-2 text-muted">or</span>
          </div>
        </div>
      </div>

      <form class="space-y-4 mt-4" @submit.prevent="handleSignIn">
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
