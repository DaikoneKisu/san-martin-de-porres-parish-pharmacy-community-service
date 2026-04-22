<script lang="ts">
  import { page } from '$app/state';
  import { api } from '$lib/api';
  import { createQuery } from '@tanstack/svelte-query';
  import { ArrowLeft, Printer, ExternalLink, Loader2 } from 'lucide-svelte';

  const pdfQuery = createQuery({
    get queryKey() {
      return ['recipe-pdf', page.params.id];
    },
    get queryFn() {
      const id: string = page.params.id ?? '';
      return async () => {
        const res = await api.api.medical.appointments({ id }).recipe.pdf.get();
        if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al generar el récipe');
        return res.data!;
      };
    },
    get enabled() {
      return !!page.params.id;
    },
    staleTime: 1000 * 60 * 10,
  });
</script>

<svelte:head>
  <style>
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</svelte:head>

<div class="flex flex-col h-screen">
  <header class="no-print sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
    <a
      href="/medical/appointments/{page.params.id}"
      class="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
      aria-label="Volver a la cita"
    >
      <ArrowLeft size={18} />
    </a>
    <span class="flex-1 text-base font-semibold">Récipe médico</span>
    {#if $pdfQuery.data?.url}
      <a
        href={$pdfQuery.data.url}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
      >
        <ExternalLink size={15} />
        Abrir en nueva pestaña
      </a>
    {/if}
    <button
      onclick={() => window.print()}
      class="bg-primary text-white px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5"
      disabled={!$pdfQuery.data?.url}
    >
      <Printer size={15} />
      Imprimir
    </button>
  </header>

  <div class="flex-1 overflow-hidden">
    {#if $pdfQuery.isPending}
      <div class="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
        <Loader2 size={32} class="animate-spin" />
        <p class="text-sm">Generando récipe...</p>
      </div>
    {:else if $pdfQuery.isError}
      <div class="flex flex-col items-center justify-center h-full gap-2 text-red-600 px-4">
        <p class="text-base font-semibold">Error al generar el récipe</p>
        <p class="text-sm text-center">{$pdfQuery.error?.message ?? 'Ocurrió un error inesperado.'}</p>
      </div>
    {:else if $pdfQuery.data?.url}
      <iframe
        src={$pdfQuery.data.url}
        class="w-full h-full border-0"
        title="Récipe médico"
      ></iframe>
    {/if}
  </div>
</div>
