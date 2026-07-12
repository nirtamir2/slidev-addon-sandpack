<script setup lang="ts">
/* eslint-disable antfu/no-import-dist -- Published Slidev convention files intentionally consume the package's compiled runtime. */
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
import { mountSandpackRenderer } from "../dist/bridge.js";
import type { MountedSandpackRenderer } from "../dist/bridge.js";
import type { SandpackDemo } from "../dist/types.js";

/* eslint-enable antfu/no-import-dist */

const props = defineProps<{ demo: SandpackDemo }>();
const mountElement = ref<HTMLDivElement | null>(null);
const errorMessage = ref("");
const state: { renderer?: MountedSandpackRenderer } = {};

function renderDemo(): void {
  if (!state.renderer) return;
  try {
    state.renderer.render(toRaw(props.demo));
    errorMessage.value = "";
  } catch {
    errorMessage.value = "This live demo could not be mounted.";
  }
}

onMounted(() => {
  if (!mountElement.value) {
    errorMessage.value = "This live demo could not be mounted.";
    return;
  }

  try {
    state.renderer = mountSandpackRenderer(mountElement.value);
    renderDemo();
  } catch {
    errorMessage.value = "This live demo could not be mounted.";
  }
});

watch(() => props.demo, renderDemo, { deep: true });

onBeforeUnmount(() => {
  state.renderer?.unmount();
  delete state.renderer;
});
</script>

<template>
  <div class="slidev-sandpack-bridge">
    <div ref="mountElement" class="slidev-sandpack-bridge__mount" />
    <p v-if="errorMessage" class="slidev-sandpack__error" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>
