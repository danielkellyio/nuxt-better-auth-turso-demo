<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const session = authClient.useSession();

async function handleSignOut() {
  await authClient.signOut();
  navigateTo("/login");
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div v-if="session.isPending" class="space-y-4 w-full max-w-md">
      <USkeleton class="h-8 w-48" />
      <USkeleton class="h-32 w-full" />
    </div>

    <UCard v-else-if="session.data" class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Dashboard</h1>
      </template>

      <div class="space-y-4">
        <p class="text-lg">Welcome, {{ session.data.user.name }}!</p>
        <p class="text-sm text-muted">{{ session.data.user.email }}</p>
      </div>

      <template #footer>
        <UButton color="neutral" variant="outline" block @click="handleSignOut">
          Sign Out
        </UButton>
      </template>
    </UCard>

    <div v-else>
      <p>Not authenticated.</p>
      <UButton to="/login" size="md" class="mt-4">Sign In</UButton>
    </div>
  </div>
</template>
