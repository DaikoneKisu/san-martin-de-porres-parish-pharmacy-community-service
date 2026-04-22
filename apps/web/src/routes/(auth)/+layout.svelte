<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-svh bg-background flex flex-col items-center justify-center px-4 py-10">
  {@render children()}
</div>
