<script setup lang="ts">
const props = defineProps({
  size: {
    type: String,
    default: '40px'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="spinner-container">
    <svg
      class="spinner"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      :style="{ width: size, height: size, color: color }"
    >
      <circle
        class="spinner-track"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="spinner-head"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    
    <span v-if="text" class="spinner-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  animation: spin 1s linear infinite;
}

.spinner-track {
  opacity: 0.25;
}

.spinner-head {
  opacity: 0.75;
}

.spinner-text {
  font-size: 0.875rem;
  color: #4b5563;
  font-family: inherit;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>