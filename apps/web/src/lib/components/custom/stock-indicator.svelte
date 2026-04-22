<script lang="ts">
  interface Props {
    stockDisponible: number;
    cantidadInicial: number;
  }

  const { stockDisponible, cantidadInicial }: Props = $props();

  const ratio = $derived(cantidadInicial > 0 ? stockDisponible / cantidadInicial : 0);
</script>

<span class="flex items-center gap-2">
  {#if stockDisponible === 0}
    <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Agotado</span>
  {:else if ratio < 0.25}
    <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Stock bajo</span>
  {:else}
    <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Disponible</span>
  {/if}
  <span class="text-xs text-gray-500">{stockDisponible} uds</span>
</span>
