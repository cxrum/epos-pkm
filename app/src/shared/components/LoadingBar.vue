<script setup lang="ts">
const props = defineProps({
  height: {
    type: String,
    default: '4px' // Default thickness
  },
  color: {
    type: String,
    default: '#3b82f6' // Tailwind blue-500
  },
  trackColor: {
    type: String,
    default: '#e5e7eb' // Tailwind gray-200
  },
  rounded: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div 
    class="loading-track" 
    :style="{ height: height, backgroundColor: trackColor }"
    :class="{ 'is-rounded': rounded }"
  >
    <div 
      class="loading-runner" 
      :style="{ backgroundColor: color }"
      :class="{ 'is-rounded': rounded }"
    ></div>
  </div>
</template>

<style scoped>
.loading-track {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.is-rounded {
  border-radius: 9999px;
}

.loading-runner {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  animation: endless-loading 1.5s infinite ease-in-out;
}

@keyframes endless-loading {
  0% {
    left: -50%;
  }
  100% {
    left: 100%;
  }
}
</style>