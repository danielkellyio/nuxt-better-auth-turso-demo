<script setup lang="ts">
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md text-center">
      <template #header>
        <h1 class="text-2xl font-bold">Welcome</h1>
      </template>

      <p class="text-muted mb-6">Get started by signing in or creating an account.</p>

      <div class="flex gap-3 justify-center">
        <UButton to="/login" size="md">Sign In</UButton>
        <UButton to="/register" size="md" variant="outline" color="neutral">
          Sign Up
        </UButton>
      </div>
    </UCard>
  </div>
</template>
