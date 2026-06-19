<template>
  <div class="graph-container">
    <svg
      width="auto"
      height="auto"
      ref="svgRef"
      v-if="!typeEditorStore.isTypeLoading"
    >
      <g v-for="link in graphLinks" :key="link.id">
        <path
          :id="'path-' + link.id"
          :d="linkPath(link)"
          stroke="#999"
          stroke-width="2"
          fill="none"
        />
        <text font-size="14" font-family="sans-serif" dy="-5">
          <textPath
            :href="'#path-' + link.id"
            startOffset="50%"
            text-anchor="middle"
          >
            {{ link.label }}
          </textPath>
        </text>
      </g>

      <g v-for="node in graphNodes" :key="node.id" class="node">
        <text
          :x="node.x"
          :y="node.y"
          text-anchor="middle"
          dy="5"
          fill="white"
          font-family="sans-serif"
          font-weight="bold"
          pointer-events="none"
        >
          {{ node.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import * as d3 from "d3";
import { useTypeEditorStore } from "../store/typeEditorStore";

const typeEditorStore = useTypeEditorStore();
const svgRef = ref<SVGSVGElement | null>(null);

const graphNodes = ref<any[]>([]);
const graphLinks = ref<any[]>([]);

let simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null;

const syncGraphData = () => {
  const currentNodesMap = new Map(graphNodes.value.map((n) => [n.id, n]));

  graphNodes.value = typeEditorStore.typeTreeNodes.map((storeNode) => {
    const existingNode = currentNodesMap.get(storeNode.id);

    return {
      id: storeNode.id,
      label: storeNode.label,
      x: existingNode?.x ?? 400,
      y: existingNode?.y ?? 300,
      vx: existingNode?.vx ?? 0,
      vy: existingNode?.vy ?? 0,
      fx: existingNode?.fx,
      fy: existingNode?.fy,
    };
  });

  graphLinks.value = typeEditorStore.typeTreeEdges.map((storeEdge) => ({
    id: storeEdge.id,
    source: storeEdge.sourceId,
    target: storeEdge.target,
    label: storeEdge.label,
  }));

  updateSimulation();
};

const updateSimulation = () => {
  if (!simulation) return;

  simulation.nodes(graphNodes.value);

  const linkForce = simulation.force<d3.ForceLink<any, any>>("link");
  if (linkForce) {
    linkForce.links(graphLinks.value);
  }

  simulation.alpha(1).restart();
};

watch(
  () => [typeEditorStore.typeTreeNodes, typeEditorStore.typeTreeEdges],
  () => {
    syncGraphData();
  },
  { deep: true },
);

const linkPath = (link: any) => {
  const source =
    typeof link.source === "object"
      ? link.source
      : graphNodes.value.find((n) => n.id === link.source);
  const target =
    typeof link.target === "object"
      ? link.target
      : graphNodes.value.find((n) => n.id === link.target);

  if (!source || !target || source.x === undefined || target.x === undefined)
    return "";

  return `M${source.x},${source.y} L${target.x},${target.y}`;
};

onMounted(() => {
  typeEditorStore.loadTree();
  syncGraphData();

  simulation = d3
    .forceSimulation(graphNodes.value)
    .force(
      "link",
      d3
        .forceLink(graphLinks.value)
        .id((d: any) => d.id)
        .distance(150),
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(500, 500));
});

onUnmounted(() => {
  if (simulation) {
    simulation.stop();
  }
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
}

.node {
  cursor: pointer;
}
</style>
