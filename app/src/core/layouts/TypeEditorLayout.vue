<script setup lang="ts">
import { ref } from 'vue';
import Accordion from '@/shared/components/Accordion.vue';
import BaseInput from '@/shared/components/BaseInput.vue';
import BaseSelect from '@/shared/components/BaseSelect.vue';

const selectedBasicType = ref(null)
const selectBasicTypeOptions = [
    {label: 'Type 1', value: 'ab1'},
    {label: 'Type 2', value: 'ab2'},
    {label: 'Type 3', value: 'ab3'},
]


</script>


<template>
    <div
        class="flex flex-col gap-2 h-full"
    >
        <span class="pb-4">
            Editing type
        </span>
        
        <BaseInput 
            class="w-full"
            :label="'Title'"
            placeholder="Title"
        />
        <div class="flex flex-row w-full items-center justify-between pb-2 border-b border-(--border)">
            <span class="">
                Basic Type
            </span>

            <BaseSelect 
                v-model="selectedBasicType" 
                :options="selectBasicTypeOptions"
                class="w-1/2"
            >
            </BaseSelect>
        </div>

        <Accordion :label="'Properties'">
            <p>Sample data</p>
            <p>Sample data</p>
            <p>Sample data</p>
            <p>Sample data</p>
            <p>Sample data</p>
        </Accordion>

        <span class="pb-4">
            Editing type
        </span>
        
        <Accordion :label="'Type 1'">
            <p class="text-(--text-header-color)" >Sample data</p>
            <p class="text-(--text-header-color)" >Sample data</p>
            <p class="text-(--text-header-color)" >Sample data</p>
            <p class="text-(--text-header-color)" >Sample data</p>
            <p class="text-(--text-header-color)" >Sample data</p>
        </Accordion>
    
    </div>


</template>