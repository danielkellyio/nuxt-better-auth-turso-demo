<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

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
    callbackURL: "/dashboard",
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
