<script lang="ts">
  import { DateTime } from 'luxon';

  interface Props {
    fechaVencimiento: string;
  }

  const { fechaVencimiento }: Props = $props();

  const dias = $derived(Math.floor(DateTime.fromISO(fechaVencimiento).diffNow('days').days));
</script>

{#if dias < 0}
  <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Vencido</span>
{:else if dias <= 90}
  <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Vence en {dias} días</span>
{/if}
