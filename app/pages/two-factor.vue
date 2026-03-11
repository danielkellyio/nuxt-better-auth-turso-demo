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
    const { error: verifyError } = await authClient.twoFactor.verifyBackupCode({
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
            I've updated the demo to send to your actual email, so check there.
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
            @click="
              useBackupCode = !useBackupCode;
              codeSent = false;
              code = '';
              backupCode = '';
            "
          >
            {{
              useBackupCode
                ? "Send one-time code instead"
                : "Use a backup code instead"
            }}
          </UButton>
        </p>
      </form>
    </UCard>
  </div>
</template>
