<script setup lang="ts">
import { computed } from 'vue';

interface BaseIconProps{
    size?: string,
    interactive?: boolean,
    href?: string | null
}

const props = withDefaults(defineProps<BaseIconProps>(),{
    size: '24px',
    interactive: false,
    href: null
});

const emit = defineEmits(['click']);

const numericSize = computed(() => {
    const parsed = parseInt(props.size);
    return isNaN(parsed) ? 24 : parsed;
});

const computedPadding = computed(() => {
    const size = numericSize.value;
    if (size >= 58) return '8px';
    if (size >= 48) return '4px';
    if (size >= 22) return '3px';
    return '0px';
});

const computedStyles = computed(() => ({
    width: props.size,
    height: props.size,
    padding: computedPadding.value
}));

const computedType = computed(() => {
    if (props.interactive){
        if(props.href){
            return 'a'
        }
        return 'button'
    }
    return 'span'
})

const handleClick = (event: Event) => {
    if (props.interactive) {
        emit('click', event);
    }
};


</script>

<template>
    <component 
        :is="computedType"
        :type="interactive ? 'button' : undefined"
        :href="computedType==='a' ? href: ''"
        :style="computedStyles" 
        class="icon-wrapper base-icon"
        :class="{ 'clickable': interactive }"
        @click="handleClick"
    >
        <slot></slot>
    </component>
</template>

<style scoped>
.icon-wrapper :deep(svg) {
    width: 100%;
    height: 100%;
    fill: currentColor;
}
</style>