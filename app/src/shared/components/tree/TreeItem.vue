<script setup lang="ts">
import ChevronRight from '@/assets/icons/ChevronRight.vue';
import type { TreeControllerContract, TreeNode } from './contract';
import BaseIcon from '../icon/BaseIcon.vue';
import DynamicIcon from '../icon/DynamicIcon.vue';
import { ref } from 'vue';

const props = defineProps<{ 
  node: TreeNode
  layer: number
  controller: TreeControllerContract
  ancestors?: string[]
}>()

const emit = defineEmits(['moveNode'])

const dropState = ref<'above' | 'inside' | 'below' | 'none'>('none')

const onDragStart = (event: DragEvent, id: string) => {
  event.dataTransfer?.setData('text/plain', id)
  event.dataTransfer?.setData(`dragged-id-${id}`, '')
  event.dataTransfer!.effectAllowed = 'move'
  event.stopPropagation()
}

const onDragOver = (event: DragEvent) => {
  const isSelf = event.dataTransfer?.types.includes(`dragged-id-${props.node.id}`)
  const isDescendant = props.ancestors?.some(id => 
    event.dataTransfer?.types.includes(`dragged-id-${id}`)
  )

  if (isSelf || isDescendant) {
    dropState.value = 'none'
    return
  }

  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer!.dropEffect = 'move'

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  const y = event.clientY - rect.top

  if (y < rect.height * 0.25) {
    dropState.value = 'above'
  } else if (y > rect.height * 0.75) {
    dropState.value = 'below'
  } else {
    dropState.value = props.node.children ? 'inside' : 'below'
  }
}

const onDragLeave = (event: DragEvent) => {
  event.stopPropagation()
  dropState.value = 'none'
}

const onDrop = (event: DragEvent, targetId: string | undefined) => {
  event.stopPropagation()
  event.preventDefault()
  
  const draggedId = event.dataTransfer?.getData('text/plain') 
  
  if (draggedId && draggedId !== targetId) {
    emit('moveNode', { 
      draggedId, 
      targetId, 
      position: dropState.value 
    })

    console.log(`${draggedId} to ${targetId} as ${dropState.value}`)
    
    const parsedDraggedId = Number.parseInt(draggedId, 10);
    const parsedTargetId = Number.parseInt(targetId ?? '-1', 10);

    if(dropState.value === 'inside'){
      if (!Number.isNaN(parsedDraggedId) && !Number.isNaN(parsedTargetId)) {
        props.controller.moveIn(parsedDraggedId, parsedTargetId);
      } else {
        console.error('Failed to parse node IDs', { draggedId, targetId });
      }
    }else if (dropState.value === 'above'){
      if (!Number.isNaN(parsedDraggedId) && !Number.isNaN(parsedTargetId)) {
        props.controller.moveAbove(parsedDraggedId, parsedTargetId);
      } else {
        console.error('Failed to parse node IDs', { draggedId, targetId });
      }
    }else if (dropState.value === 'below'){
      if (!Number.isNaN(parsedDraggedId) && !Number.isNaN(parsedTargetId)) {
        props.controller.moveBelow(parsedDraggedId, parsedTargetId);
      } else {
        console.error('Failed to parse node IDs', { draggedId, targetId });
      }
    }
  }
  
  dropState.value = 'none'
}

</script>

<template>
  <template v-if="node.id === -1">
    <TreeItem
      v-for="child in node.children" 
      :key="child.id"
      :node="child"
      :controller="controller"
      :layer="props.layer"
      :ancestors="props.ancestors"
      @moveNode="emit('moveNode', $event)"
    />
  </template>

  <li v-else>
    <span 
      class="tree-row"
      :class="
          { 'is-selected': controller.isSelected(node.id) }
      "
      >
      <BaseIcon 
        :class="controller.isExpanded(node.id) ? 'rotate-90': ''"
        interactive @click="controller.toggleExpand(node.id)"
        v-if="node.children?.length"
        >
        <ChevronRight/>   
      </BaseIcon>
      <div 
        draggable="true"
        @dragstart="onDragStart($event, node.id.toString())"
        @dragover="onDragOver($event)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, node.id.toString())"
        @click="controller.selectNode(node.id)"
        @dblclick="controller.toggleExpand(node.id)"
        :class="[
          `drop-${dropState} w-full`,
        ]"
      >
        
        <DynamicIcon :icon="node.type?.icon" class="base-icon" />
        {{ node.title }}
      </div>

    </span>
    
    <ul
      class="childs"
      v-if="controller.isExpanded(node.id) && node.children"
    >
      <TreeItem
        v-for="child in node.children" 
        :key="child.id"
        :node="child"
        :controller="controller"
        :layer="props.layer+1"
        :ancestors="[...(props.ancestors || []), node.id.toString()]"
        @moveNode="emit('moveNode', $event)"
      />
    </ul>
  </li>
</template>

<style scoped>
.tree-row {
  position: relative;
  transition: all 0.1s ease;
}

.drop-above::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--border);
  z-index: 10;
}

.drop-below::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--border);
  z-index: 10;
}

.drop-inside {
  background-color: var(--bg-selected-tree-item);
  outline: 1.5px solid var(--border);
}
</style>