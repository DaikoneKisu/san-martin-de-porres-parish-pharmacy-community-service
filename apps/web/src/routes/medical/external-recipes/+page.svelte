<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { DateTime } from 'luxon';
  import { Plus, Search, ChevronRight, FileText, X, ExternalLink } from 'lucide-svelte';
  import { api } from '$lib/api';

  type Insumo = {
    id: string;
    tipo: 'MEDICAMENTO' | 'MATERIAL';
    stockDisponible: number;
    cantidad: number;
    presentacionMedicamento: { medicamento: { marca: { nombre: string } } } | null;
    materialQuirurgico: { nombre: string } | null;
  };

  type InsumoConsumido = {
    id: string;
    insumoId: string;
    cantidadDespachada: number;
    precioUnitario: number;
    insumo: Insumo;
  };

  type ExternalRecipe = {
    id: string;
    indicaciones: string | null;
    adjuntoExterno: string;
    createdAt: string;
    insumosConsumidos: InsumoConsumido[];
    contabilizable: {
      id: string;
      asientosContables: Array<{ id: string }>;
    };
  };

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("dd 'de' LLLL yyyy");
  }

  let search = $state('');

  const query = createQuery({
    queryKey: ['external-recipes'],
    queryFn: async () => {
      const res = await api.api.medical['external-recipes'].get();
      if (res.error) throw res.error;
      return res.data as ExternalRecipe[];
    },
  });

  const filtered = $derived(
    ($query.data ?? []).filter((r: ExternalRecipe) => {
      const q = search.toLowerCase();
      return !q || r.id.toLowerCase().includes(q);
    })
  );
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
    <h1 class="text-lg font-bold text-gray-900">Récipes externos</h1>
    <a
      href="/medical/external-recipes/new"
      class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white"
      style="background-color: #2D6A4F;"
    >
      <Plus size={16} />
      Registrar
    </a>
  </div>

  <div class="flex-1 px-4 pt-4 pb-8 space-y-3 max-w-2xl mx-auto w-full">
    <!-- Search bar -->
    <div class="relative">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar por ID de récipe..."
        bind:value={search}
        class="w-full rounded-lg border bg-white pl-9 pr-9 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {#if search}
        <button
          onclick={() => (search = '')}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      {/if}
    </div>

    <!-- Count -->
    {#if !$query.isPending && !$query.isError}
      <div class="flex items-center">
        <span class="ml-auto text-xs text-gray-500">{filtered.length} récipe(s)</span>
      </div>
    {/if}

    <!-- Loading skeletons -->
    {#if $query.isPending}
      <ul class="space-y-2">
        {#each [1, 2, 3] as i (i)}
          <li class="flex items-center gap-3 rounded-xl bg-white border p-3">
            <div class="flex-shrink-0 rounded-lg p-2 bg-gray-100 w-10 h-10 animate-pulse"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
              <div class="h-2 bg-gray-100 rounded animate-pulse w-3/4"></div>
              <div class="h-2 bg-gray-100 rounded animate-pulse w-1/3"></div>
            </div>
          </li>
        {/each}
      </ul>

    <!-- Error state -->
    {:else if $query.isError}
      <div class="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div class="rounded-full bg-red-100 p-4">
          <FileText size={28} class="text-red-400" />
        </div>
        <p class="font-medium text-gray-700">Error al cargar los récipes</p>
        <p class="text-sm text-gray-500">Intenta recargar la página.</p>
      </div>

    <!-- Card list -->
    {:else if filtered.length > 0}
      <ul class="space-y-2">
        {#each filtered as r (r.id)}
          <li class="relative flex items-center gap-3 rounded-xl bg-white border p-3 hover:shadow-sm transition-shadow">
            <!-- Icon -->
            <div
              class="flex-shrink-0 rounded-lg p-2"
              style="background-color: #2D6A4F1A;"
            >
              <FileText size={20} style="color: #2D6A4F;" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0 space-y-0.5">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-medium text-gray-900 text-sm">
                  Récipe externo #{r.id.substring(0, 8).toUpperCase()}
                </p>
                <span class="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                  Contabilizado
                </span>
              </div>
              <p class="text-xs text-gray-500">
                {formatFecha(r.createdAt)} · {r.insumosConsumidos.length} insumo(s) dispensado(s)
              </p>
              {#if r.indicaciones}
                <p class="text-xs text-gray-400">Con indicaciones</p>
              {/if}
            </div>

            <!-- External file link (above the card overlay) -->
            <a
              href={r.adjuntoExterno}
              target="_blank"
              rel="noopener noreferrer"
              class="relative z-10 flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-600"
              title="Ver récipe externo"
            >
              <ExternalLink size={14} />
            </a>

            <ChevronRight size={16} class="flex-shrink-0 text-gray-400" />

            <!-- Full card click target -->
            <a
              href="/medical/external-recipes/{r.id}"
              class="absolute inset-0 rounded-xl"
              aria-label="Ver récipe externo #{r.id.substring(0, 8).toUpperCase()}"
            ></a>
          </li>
        {/each}
      </ul>

    <!-- Empty state -->
    {:else}
      <div class="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div class="rounded-full bg-gray-100 p-4">
          <FileText size={28} class="text-gray-400" />
        </div>
        <p class="font-medium text-gray-700">Sin resultados</p>
      </div>
    {/if}
  </div>
</div>
