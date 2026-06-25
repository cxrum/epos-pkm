<template>
  <div
    class="graph-container"
    :class="{ 'is-panning': isSpacePressed }"
    @mousedown="startPan"
    @mousemove="doPan"
    @mouseup="endPan"
    @mouseleave="endPan"
    @wheel.prevent="doZoom"
  >
    <svg
      viewBox="0 0 1000 1000"
      width="100%"
      height="100%"
      ref="svgRef"
      v-if="!typeEditorStore.isTypeLoading"
    >
      <g
        ref="containerRef"
        :transform="`translate(${transform.x}, ${transform.y}) scale(${transform.k})`"
      >
        <path
          v-for="edge in graphEdges"
          :key="edge.id"
          :d="generatePath(edge)"
          stroke="var(--hover)"
          stroke-width="2"
          fill="none"
        />

        <g
          v-for="node in graphNodes"
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          class="node"
        >
          <rect
            :width="node.width"
            :height="node.height"
            fill="var(--bg-class)"
            stroke="var(--border)"
            stroke-width="2"
            rx="4"
          />
          <rect
            :width="node.width"
            :height="node.header.height"
            fill="var(--bg-class-label)"
            rx="4"
          />
          <text
            :x="node.header.label.x"
            :y="node.header.label.y"
            font-family="fixel"
            font-weight="bold"
            font-size="18"
            fill="var(--class-label)"
          >
            {{ node.label }}
          </text>
          <g
            v-for="(it, index) in node.content.items"
            :key="index"
            :transform="`translate(${0}, ${node.header.height + node.content.height * index})`"
          >
            <g v-if="isPropRow(it)">
              <text
                font-family="fixel"
                font-weight="medium"
                font-size="18"
                :x="it.label.x"
                :y="it.label.y"
                fill="var(--property-label)"
              >
                {{ it.prop.title }}
              </text>
              <text
                font-family="fixel"
                font-weight="medium"
                font-size="18"
                :x="it.type.x + it.type.width"
                :y="it.type.y"
                fill="var(--property-type-label)"
                text-anchor="end"
              >
                {{ it.prop.type }}
              </text>
            </g>
            <g v-else-if="isLabelRow(it)">
              <text
                font-family="fixel"
                font-weight="medium"
                font-size="18"
                :x="it.label.x"
                :y="it.label.y"
                fill="var(--property-parent-label)"
              >
                {{ it.label.data }}:
              </text>
            </g>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from "vue";
import {
  useTypeEditorStore,
  type PropertyEntry,
  type TypeTreeNodes,
} from "../store/typeEditorStore";
import ELK from "elkjs/lib/elk.bundled.js";

const typeEditorStore = useTypeEditorStore();
const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<SVGGElement | null>(null);
const isSpacePressed = ref(false);
const transform = ref({ x: 100, y: 100, k: 1 });
let isPanning = false;
let startPoint = { x: 0, y: 0 };

interface Node {
  id: string;
  width: number;
  height: number;
  label: string;

  header: {
    height: number;
    label: {
      width: number;
      x: number;
      y: number;
    };
  };
  content: {
    height: number;
    items: (PropRow | LabelRow)[];
  };
  x?: number;
  y?: number;
}

function isPropRow(row: any): row is PropRow {
  return typeof row === "object" && row["prop"];
}

function isLabelRow(row: any): row is LabelRow {
  return typeof row === "object" && row["label"] && row.label["data"];
}

interface PropRow {
  prop: PropertyEntry;
  label: { x: number; y: number; width: number };
  type: { x: number; y: number; width: number };
}

interface LabelRow {
  label: { data: string; x: number; y: number; width: number };
}

interface Edge {
  id: string;
  sources: string[];
  targets: string[];
}

const measureTextWidth = (text: string, font: string): number => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
};

const elk = new ELK();

const graphNodes = ref<Node[]>([]);
const graphEdges = ref<Edge[]>([]);

const generatePath = (edge: any) => {
  if (!edge.sections || edge.sections.length === 0) return "";

  const section = edge.sections[0];
  let d = `M ${section.startPoint.x} ${section.startPoint.y}`;

  if (section.bendPoints) {
    section.bendPoints.forEach((pt: any) => {
      d += ` L ${pt.x} ${pt.y}`;
    });
  }

  d += ` L ${section.endPoint.x} ${section.endPoint.y}`;
  return d;
};

const calculateTableDimensions = (node: TypeTreeNodes) => {
  const paddingX = 16;
  const paddingY = 16;
  const fontSize = 18;

  const boldFont = `bold ${fontSize}px fixel`;
  const mediumFont = `${fontSize}px fixel`;

  const headerHeight = Math.max(fontSize + paddingY, 32);
  const rowHeight = Math.max(fontSize + paddingY, 22);
  const paddingYBottom = 4;
  const minSpaceBetweenLabelType = 32;
  const minWidth = 128;

  let titleWidth = measureTextWidth(node.label, boldFont);

  let resultWidth = Math.max(titleWidth + paddingX, minWidth);

  for (let i = 0; i < node.properties.length; i++) {
    const prop = node.properties[i];
    let labelWidth = measureTextWidth(prop.title, mediumFont);
    let typeWidth = measureTextWidth(prop.type, mediumFont);
    let rowRequiredWidth =
      labelWidth + typeWidth + minSpaceBetweenLabelType + paddingX;

    if (rowRequiredWidth > resultWidth) {
      resultWidth = rowRequiredWidth;
    }
  }

  const content = [];

  const totalWidth = resultWidth + paddingX;

  for (let i = 0; i < node.properties.length; i++) {
    const prop = node.properties[i];

    let labelWidth = measureTextWidth(prop.title, `${fontSize}px fixel`);
    let typeWidth = measureTextWidth(prop.type, `${fontSize}px fixel`);

    const rowY = Math.ceil(rowHeight / 2 + fontSize / 2);
    content.push({
      prop: prop,
      label: {
        x: Math.ceil(paddingX / 2),
        y: rowY,
        width: labelWidth,
      },
      type: {
        x: Math.ceil(totalWidth - typeWidth - paddingX / 2),
        y: rowY,
        width: typeWidth,
      },
    });
  }

  const resYPaddingBottom = node.properties.length > 0 ? paddingYBottom : 0;

  return {
    width: totalWidth,
    height: headerHeight + content.length * rowHeight + resYPaddingBottom,
    header: {
      height: headerHeight,
      label: {
        width: titleWidth,
        x: Math.ceil(totalWidth / 2 - titleWidth / 2),
        y: Math.ceil(headerHeight / 2 + fontSize / 3),
      },
    },
    content: {
      height: rowHeight,
      x: Math.ceil(paddingX / 2),
      y: Math.ceil(rowHeight / 2 + fontSize / 3),
      items: content,
    },
  };
};

const calculateLayout = async () => {
  if (!typeEditorStore.typeTreeNodes.length) return;

  const children = (): Node[] => {
    return typeEditorStore.typeTreeNodes.map((it): Node => {
      const dimension = calculateTableDimensions(it);

      return {
        id: it.id,
        label: it.label,
        width: dimension.width,
        height: dimension.height,
        header: dimension.header,
        content: dimension.content,
      };
    });
  };

  const currentGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.alignment": "CENTER",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.mergeEdges": "true",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "40",
    },
    children: children(),
    edges: typeEditorStore.typeTreeEdges.map((it) => ({
      id: it.id,
      sources: [it.sourceId],
      targets: [it.target],
    })),
  };

  try {
    const layoutedGraph = await elk.layout(currentGraph);
    graphNodes.value = (layoutedGraph.children as Node[]) || [];
    graphEdges.value = (layoutedGraph.edges as Edge[]) || [];
  } catch (error) {
    console.error(error);
  }
};

const doZoom = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = transform.value.k * zoomFactor;

    if (newScale >= 0.1 && newScale <= 4) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      transform.value.x = mouseX - (mouseX - transform.value.x) * zoomFactor;
      transform.value.y = mouseY - (mouseY - transform.value.y) * zoomFactor;
      transform.value.k = newScale;
    }
  } else {
    const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
    const deltaY = e.shiftKey ? 0 : e.deltaY;

    transform.value.x -= deltaX;
    transform.value.y -= deltaY;
  }
};

const startPan = (e: MouseEvent) => {
  if (!isSpacePressed.value || e.button !== 0) return;

  isPanning = true;

  startPoint = {
    x: e.clientX - transform.value.x,
    y: e.clientY - transform.value.y,
  };
};

const doPan = (e: MouseEvent) => {
  if (!isPanning) return;

  transform.value.x = e.clientX - startPoint.x;
  transform.value.y = e.clientY - startPoint.y;
};

const endPan = () => {
  isPanning = false;
};

watch(
  () => [typeEditorStore.typeTreeNodes, typeEditorStore.typeTreeEdges],
  () => {
    calculateLayout();
  },
  { deep: true },
);

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === "Space") {
    if (
      document.activeElement?.tagName !== "INPUT" &&
      document.activeElement?.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      isSpacePressed.value = true;
    }
  }
};

const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === "Space") {
    isSpacePressed.value = false;
  }
};

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  typeEditorStore.loadTree();
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
});
</script>

<style scoped>
.graph-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
  cursor: default;

  --bg-class: transparent;
  --bg-class-label: var(--bg-bottom-layer-contrast);
  --class-label: var(--text-default-color);
  --property-label: var(--text-default-color);
  --property-parent-label: var(--text-secondary-color);
  --property-type-label: var(--text-secondary-color);
}

.is-panning,
.is-panning * {
  cursor: grab !important;
  user-select: none;
}

.is-panning:active,
.is-panning:active * {
  cursor: grabbing !important;
}

.node {
  cursor: pointer;
}
</style>
