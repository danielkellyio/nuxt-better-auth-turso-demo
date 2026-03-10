<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

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
    callbackURL: "/dashboard",
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
