<script setup lang="ts">
const session = authClient.useSession();

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
const has2FA = computed(
  () =>
    !!user.value?.twoFactorEnabled ||
    !!enableResult.value ||
    (import.meta.client && sessionStorage.getItem("2fa-enabled") === "true"),
);

async function handleSignOut() {
  if (import.meta.client) {
    sessionStorage.removeItem("2fa-enabled");
  }
  await authClient.signOut();
  // Invalidate cached session so middleware's useSession(useFetch) refetches
  await clearNuxtData();
  navigateTo("/login");
}

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

function dismissEnableSuccess() {
  enableResult.value = null;
  window.location.reload();
}

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

        <div class="border-t border-default pt-4 space-y-4">
          <h2 class="font-medium">Two-Factor Authentication</h2>
          <p v-if="has2FA" class="text-sm text-muted">
            2FA is enabled. You will be asked for a code when signing in.
          </p>
          <p v-else class="text-sm text-muted">
            Add an extra layer of security by enabling 2FA.
          </p>

          <template v-if="enableResult">
            <p class="text-sm font-medium text-green-600 dark:text-green-400">
              2FA enabled with OTP.
            </p>
            <p class="text-sm text-muted">
              When you sign in, you'll receive a one-time code (in development
              it's logged to the server console). Save your backup codes:
            </p>
            <ul class="text-sm text-muted list-disc list-inside">
              <li v-for="(c, i) in enableResult.backupCodes" :key="i">
                {{ c }}
              </li>
            </ul>
            <UButton block size="md" @click="dismissEnableSuccess">
              Done
            </UButton>
          </template>
          <template v-else-if="!has2FA">
            <UFormField label="Your password" required>
              <UInput
                v-model="twoFactorPassword"
                type="password"
                placeholder="Password"
                size="md"
                @keydown.enter="startEnable2FA"
              />
            </UFormField>
            <UAlert
              v-if="twoFactorError"
              color="error"
              variant="soft"
              :description="twoFactorError"
            />
            <UButton
              block
              size="md"
              :loading="twoFactorLoading"
              @click="startEnable2FA"
            >
              Enable 2FA
            </UButton>
          </template>
          <template v-else>
            <UFormField label="Your password" required>
              <UInput
                v-model="disablePassword"
                type="password"
                placeholder="Password to disable 2FA"
                size="md"
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
            >
              Disable 2FA
            </UButton>
          </template>
        </div>
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
