<script setup lang="ts">
const name = ref("");
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
            <span class="bg-card px-2 text-muted">or</span>
          </div>
        </div>
      </div>

      <form class="space-y-4 mt-4" @submit.prevent="handleSignUp">
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
