<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.vue";
import Cross from "@/assets/icons/Cross.vue";
import SidebarState from "@/assets/icons/SidebarState.vue";
import User from "@/assets/icons/User.vue";
import BaseButton from "@/shared/components/BaseButton.vue";
import BaseCheckbox from "@/shared/components/BaseCheckbox.vue";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import BaseInput from "@/shared/components/BaseInput.vue";
import BaseSelect from "@/shared/components/BaseSelect.vue";
import { useAuthStore } from "@/core/store/authStore";
import { useGlobalSettingsStore } from "@/core/store/globalSettingsStore";
import { SYNC_SERVER_URL_SETTING_ID } from "@/core/store/globalSettingsStore";
import type { SettingEntry } from "@/core/types";
import SettingsAuthDialog from "../components/SettingsAuthDialog.vue";

const globalSettingsStore = useGlobalSettingsStore();
const authStore = useAuthStore();
const router = useRouter();
const authDialogOpen = ref(false);
const GENERAL_SETTINGS_CATEGORY_ID = "core.category.general";

const categories = computed(() => globalSettingsStore.categories);
const selectedCategory = ref<string>(categories.value[0]?.id ?? "");
const selectedCategoryLabel = computed(() => {
  return globalSettingsStore.categories.find(
    (it) => it.id === selectedCategory.value,
  );
});

const settings = computed(() => {
  if (!selectedCategory.value) {
    return [];
  }

  return globalSettingsStore.settingsByCategory(selectedCategory.value);
});

const componentMap: Record<string, any> = {
  boolean: BaseCheckbox,
  text: BaseInput,
  number: BaseInput,
  select: BaseSelect,
};

const closeModal = () => {
  router.push("/workspace");
};

const isCategoriesOpen = ref(false);

const openCategories = () => {
  isCategoriesOpen.value = true;
};

const closeCategories = () => {
  isCategoriesOpen.value = false;
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeModal();
  }
};

const settingBindings = (setting: SettingEntry) => {
  if (setting.type === "select") {
    return {
      options: setting.options ?? [],
    };
  }

  if (setting.type === "text" || setting.type === "number") {
    return {
      placeholder: setting.placeholder,
      type: setting.inputType ?? "text",
    };
  }

  return {};
};

const handleSettingUpdate = async (setting: SettingEntry, value: unknown) => {
  await globalSettingsStore.updateSetting(
    selectedCategory.value,
    setting.id,
    value,
  );

  if (setting.id === SYNC_SERVER_URL_SETTING_ID) {
    await authStore.loadAuthState();
  }
};

const isAuthenticated = computed(
  () => authStore.authState?.authenticated ?? false,
);

const shouldShowAccountPanel = computed(
  () => selectedCategory.value === GENERAL_SETTINGS_CATEGORY_ID,
);

const accountEmail = computed(
  () => authStore.authState?.user?.email ?? "Guest",
);

const accountDescription = computed(() => {
  if (authStore.isLoading && !authStore.authState) {
    return "Checking account status...";
  }

  if (isAuthenticated.value) {
    return `Connected as ${accountEmail.value}.`;
  }

  return "Sign in to enable sync across devices.";
});

const accountActionLabel = computed(() =>
  isAuthenticated.value ? "Logout" : "Login",
);

const accountActionVariant = computed<"secondary" | "accent">(() =>
  isAuthenticated.value ? "secondary" : "accent",
);

const handleAccountAction = async () => {
  if (isAuthenticated.value) {
    await authStore.logout();
    return;
  }

  authDialogOpen.value = true;
};

const closeAuthDialog = () => {
  authDialogOpen.value = false;
};

onMounted(async () => {
  document.addEventListener("keydown", handleKeydown);
  await globalSettingsStore.loadSettings();

  if (!selectedCategory.value && categories.value[0]) {
    selectedCategory.value = categories.value[0].id;
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-0 md:px-24 md:py-16 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div
        class="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-none border border-(--border) bg-(--bg-settings) shadow-xl md:rounded-2xl"
      >
        <div class="relative flex h-full w-full flex-row">
          <div
            :class="isCategoriesOpen ? 'flex' : 'hidden md:flex'"
            class="absolute inset-0 md:relative md:min-w-64 md:w-64 flex-col border-r border-(--border) bg-(--bg-settings) px-8 pt-6 md:inset-auto"
          >
            <div class="flex flex-row items-center gap-2">
              <BaseIcon
                interactive
                size="32px"
                class="text-(--icon-color) md:hidden"
                @click="closeCategories"
              >
                <ArrowLeft />
              </BaseIcon>

              <h1 class="text-(--text-secondary-color)">Categories</h1>
            </div>

            <nav class="auto-hide-scroll flex flex-1 flex-col overflow-auto">
              <div class="h-8 shrink-0"></div>
              <label
                v-for="value in categories"
                :key="value.id"
                class="clickable flex cursor-pointer items-center rounded-md px-3 py-2 transition-colors"
                :class="selectedCategory === value.id ? 'active' : ''"
              >
                <div class="flex items-center gap-2">
                  <input
                    :id="value.id"
                    v-model="selectedCategory"
                    :value="value.id"
                    class="h-4 w-4 cursor-pointer"
                    type="radio"
                  />
                  <p :for="value.id" class="cursor-pointer">
                    {{ value.label }}
                  </p>
                </div>
              </label>
            </nav>
          </div>

          <div class="flex flex-1 flex-col pt-6 ps-8">
            <div class="flex flex-row items-center gap-2">
              <BaseIcon
                interactive
                size="32px"
                class="text-(--icon-color) md:hidden"
                @click="openCategories"
              >
                <SidebarState
                  :status="isCategoriesOpen ? 'closed' : 'opened'"
                />
              </BaseIcon>

              <h1 class="flex-1 text-(--text-secondary-color)">
                {{ selectedCategoryLabel?.label }}
              </h1>
            </div>

            <div
              class="auto-hide-scroll flex flex-1 flex-col overflow-y-auto px-4"
            >
              <div class="h-6 shrink-0"></div>

              <div v-if="shouldShowAccountPanel" class="mb-4">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div class="flex items-center gap-3">
                    <div class="flex flex-col gap-1">
                      <h3>Account</h3>
                      <label>
                        {{ accountDescription }}
                      </label>
                    </div>
                  </div>

                  <div class="sm:ml-auto">
                    <BaseButton
                      :variant="accountActionVariant"
                      :disabled="authStore.isLoading"
                      @click="handleAccountAction"
                      class="w-32"
                      align="center"
                    >
                      {{ accountActionLabel }}
                    </BaseButton>
                  </div>
                </div>

                <label
                  v-if="authStore.errorMsg"
                  class="mt-3 text-sm text-(--text-error-color)"
                >
                  {{ authStore.errorMsg }}
                </label>
                <label
                  v-else-if="authStore.noticeMsg"
                  class="mt-3 text-sm text-(--text-secondary-color)"
                >
                  {{ authStore.noticeMsg }}
                </label>
              </div>

              <div
                v-if="globalSettingsStore.isLoading"
                class="rounded-2xl border border-(--border) bg-black/10 p-4 text-(--text-secondary-color)"
              >
                Loading settings...
              </div>

              <div v-else class="flex flex-col gap-4">
                <div v-for="setting in settings" :key="setting.id">
                  <div class="flex flex-row gap-2">
                    <span class="flex-1">
                      <h3>{{ setting.label }}</h3>
                      <label v-if="setting.description">
                        {{ setting.description }}
                      </label>
                    </span>

                    <component
                      :is="componentMap[setting.type]"
                      v-bind="settingBindings(setting)"
                      v-model="setting.value"
                      class="w-fit h-fit"
                      :disabled="globalSettingsStore.isLoading"
                      @update:modelValue="
                        (val) => handleSettingUpdate(setting, val)
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BaseIcon
          interactive
          size="32px"
          class="absolute top-4 right-4"
          @click="closeModal"
        >
          <Cross />
        </BaseIcon>
      </div>
    </div>
  </Teleport>

  <SettingsAuthDialog
    :open="authDialogOpen"
    @close="closeAuthDialog"
    @authenticated="closeAuthDialog"
  />
</template>

<style scoped>
input[type="radio"] {
  visibility: hidden;
  height: 0;
  width: 0;
}
</style>
