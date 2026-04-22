<script lang="ts">
  import { createQuery, createMutation } from '@tanstack/svelte-query';
  import {
    AlertTriangle,
    CheckCircle2,
    Plus,
    Trash2,
    Search,
    X,
    Package,
    Link,
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';
  import { api } from '$lib/api';

  type Linea = {
    insumoId: string;
    nombre: string;
    cantidadDespachada: number;
    precioUnitario: number;
  };

  // Form state
  let adjuntoUrl = $state('');
  let indicaciones = $state('');
  let lineas = $state<Linea[]>([]);
  let errors = $state<Record<string, string>>({});
  let insumoDrawerOpen = $state(false);
  let saved = $state(false);
  let insumoSearch = $state('');
  let insumoQtys = $state<Record<string, string>>({});

  // Supplies query
  const suppliesQuery = createQuery({
    queryKey: ['supplies'],
    queryFn: async () => {
      const res = await api.api.inventory.supplies.get();
      if (res.error) throw new Error('Error al cargar insumos');
      return res.data!;
    },
    staleTime: 1000 * 60 * 5,
  });

  function getSupplyName(s: NonNullable<typeof $suppliesQuery.data>[0]): string {
    if (s.materialQuirurgico) return s.materialQuirurgico.nombre;
    return `Insumo #${s.id.substring(0, 8)}`;
  }

  const filteredSupplies = $derived(
    ($suppliesQuery.data ?? []).filter(
      (s: any) =>
        s.stockDisponible > 0 &&
        getSupplyName(s).toLowerCase().includes(insumoSearch.toLowerCase())
    )
  );

  const total = $derived(
    lineas.reduce((sum, l) => sum + l.cantidadDespachada * l.precioUnitario, 0)
  );

  // Mutation
  const recipeMutation = createMutation({
    mutationFn: async () => {
      const res = await api.api.medical['external-recipes'].post({
        adjuntoExterno: adjuntoUrl,
        indicaciones: indicaciones.trim() || undefined,
        insumosConsumidos: lineas.map((l) => ({
          insumoId: l.insumoId,
          cantidadDespachada: l.cantidadDespachada,
          precioUnitario: l.precioUnitario,
        })),
      });
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al guardar');
      return res.data!;
    },
    onSuccess: () => {
      saved = true;
    },
  });

  function handleGuardar() {
    const newErrors: Record<string, string> = {};
    if (!adjuntoUrl.trim()) newErrors.foto = 'La URL del récipe físico es requerida.';
    if (lineas.length === 0) newErrors.lineas = 'Agrega al menos un medicamento a dispensar.';
    errors = newErrors;
    if (Object.keys(newErrors).length === 0) $recipeMutation.mutate();
  }

  function handleAgregarInsumos() {
    const supplies = $suppliesQuery.data ?? [];
    for (const s of supplies) {
      const raw = insumoQtys[s.id];
      if (!raw) continue;
      const qty = parseFloat(raw);
      if (!Number.isFinite(qty) || qty <= 0 || qty > s.stockDisponible) continue;
      const existing = lineas.findIndex((l) => l.insumoId === s.id);
      if (existing >= 0) {
        lineas[existing].cantidadDespachada = qty;
      } else {
        lineas.push({
          insumoId: s.id,
          nombre: getSupplyName(s),
          cantidadDespachada: qty,
          precioUnitario: Number(s.precioUnitarioReferencial ?? 0),
        });
      }
    }
    insumoDrawerOpen = false;
    insumoSearch = '';
    insumoQtys = {};
  }

  function removeLinea(insumoId: string) {
    lineas = lineas.filter((l) => l.insumoId !== insumoId);
  }

  function resetAll() {
    adjuntoUrl = '';
    indicaciones = '';
    lineas = [];
    errors = {};
    insumoSearch = '';
    insumoQtys = {};
    saved = false;
  }
</script>

{#if saved}
  <!-- Success screen -->
  <div class="flex flex-col items-center justify-center min-h-screen gap-5 px-6 text-center bg-gray-50">
    <div class="flex items-center justify-center rounded-full bg-emerald-100 p-5">
      <CheckCircle2 size={64} class="text-emerald-600" />
    </div>
    <div class="flex flex-col gap-1">
      <h2 class="text-xl font-bold text-gray-900">Récipe registrado</h2>
      <p class="text-sm text-gray-500">La dispensación quedó registrada en el inventario.</p>
    </div>
    <div class="flex flex-col gap-3 w-full max-w-xs">
      <a
        href="/medical/external-recipes"
        class="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors"
        style="background-color: #2D6A4F;"
      >
        Ver récipes
      </a>
      <button
        type="button"
        onclick={resetAll}
        class="flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Registrar otro
      </button>
    </div>
  </div>
{:else}
  <div class="flex flex-col min-h-screen bg-gray-50">
    <!-- Sticky header -->
    <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
      <a
        href="/medical/external-recipes"
        class="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Cancelar y volver"
      >
        <X size={20} />
      </a>
      <h1 class="flex-1 text-lg font-bold text-gray-900">Nuevo récipe externo</h1>
    </div>

    <!-- Form content -->
    <div class="flex flex-col gap-4 px-4 pt-4 pb-28 max-w-2xl w-full mx-auto">

      <!-- Section 1: Récipe físico -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-4">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Récipe físico</p>

        <!-- URL del adjunto -->
        <div class="flex flex-col gap-1.5">
          <label for="adjunto-url" class="text-sm font-medium text-gray-700">
            URL de la fotografía / archivo del récipe
          </label>
          <div class="relative">
            <Link size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="adjunto-url"
              type="url"
              bind:value={adjuntoUrl}
              placeholder="https://..."
              class="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={errors.foto ? 'border-color: #ef4444;' : ''}
            />
          </div>
          {#if errors.foto}
            <p class="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {errors.foto}
            </p>
          {/if}
        </div>

        <!-- Indicaciones -->
        <div class="flex flex-col gap-1.5">
          <label for="indicaciones" class="text-sm font-medium text-gray-700">
            Indicaciones <span class="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            id="indicaciones"
            bind:value={indicaciones}
            placeholder="Notas o indicaciones del récipe..."
            rows={3}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Section 2: Medicamentos a dispensar -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Medicamentos a dispensar
        </p>

        {#if lineas.length > 0}
          <div class="rounded-lg border divide-y divide-gray-100">
            {#each lineas as linea (linea.insumoId)}
              <div class="flex items-center gap-3 px-3 py-3">
                <Package size={16} class="text-gray-400 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{linea.nombre}</p>
                  <p class="text-xs text-gray-500">
                    {linea.cantidadDespachada} uds × Bs. {linea.precioUnitario.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => removeLinea(linea.insumoId)}
                  class="flex items-center justify-center p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                  aria-label="Eliminar {linea.nombre}"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            {/each}
          </div>
        {/if}

        {#if errors.lineas}
          <p class="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle size={12} />
            {errors.lineas}
          </p>
        {/if}

        <button
          type="button"
          onclick={() => (insumoDrawerOpen = true)}
          class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Plus size={16} />
          Agregar medicamentos
        </button>

        {#if lineas.length > 0}
          <hr class="border-gray-100" />
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">Total referencial</p>
            <p class="text-sm font-semibold text-gray-900">Bs. {total.toFixed(2)}</p>
          </div>
        {/if}
      </div>

      {#if $recipeMutation.isError}
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p class="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle size={16} />
            {($recipeMutation.error as { message?: string })?.message ?? 'Error al guardar el récipe.'}
          </p>
        </div>
      {/if}
    </div>

    <!-- Fixed bottom bar -->
    <div class="fixed bottom-0 left-0 right-0 md:pl-64 bg-white border-t px-4 py-3 flex gap-2 z-10">
      <a
        href="/medical/external-recipes"
        class="flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Cancelar
      </a>
      <button
        type="button"
        onclick={handleGuardar}
        disabled={$suppliesQuery.isPending || $recipeMutation.isPending}
        class="flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
        style="background-color: #2D6A4F;"
      >
        {$recipeMutation.isPending ? 'Guardando...' : 'Guardar y dispensar'}
      </button>
    </div>
  </div>

  <!-- Insumo Drawer -->
  <Drawer.Root bind:open={insumoDrawerOpen} onClose={() => (insumoDrawerOpen = false)}>
    <Drawer.Portal>
      <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
      <Drawer.Content
        class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[85vh]"
      >
        <!-- Drag handle -->
        <div class="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-gray-300 shrink-0"></div>

        <!-- Header -->
        <div class="flex items-center justify-between px-4 pb-3 border-b shrink-0">
          <h2 class="text-base font-semibold text-gray-900">Medicamentos a dispensar</h2>
          <button
            type="button"
            onclick={() => (insumoDrawerOpen = false)}
            class="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <!-- Search -->
        <div class="px-4 py-3 shrink-0">
          <div class="relative">
            <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              bind:value={insumoSearch}
              placeholder="Buscar medicamento..."
              class="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
            />
          </div>
        </div>

        <!-- Supply list -->
        <div class="flex-1 overflow-y-auto px-4 pb-4">
          {#if $suppliesQuery.isPending}
            <div class="flex flex-col gap-3 pt-2">
              {#each [1, 2, 3, 4, 5] as _ (_)}
                <div class="h-14 w-full rounded-lg bg-gray-200 animate-pulse"></div>
              {/each}
            </div>
          {:else if $suppliesQuery.isError}
            <p class="py-8 text-center text-sm text-red-500">Error al cargar los insumos.</p>
          {:else}
            <div class="flex flex-col divide-y divide-gray-100">
              {#each filteredSupplies as supply (supply.id)}
                <div class="flex items-center gap-3 py-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{getSupplyName(supply)}</p>
                    <p class="text-xs text-gray-500">Stock: {supply.stockDisponible}</p>
                  </div>
                  <input
                    type="number"
                    min="0.001"
                    max={supply.stockDisponible}
                    step="0.001"
                    placeholder="0"
                    bind:value={insumoQtys[supply.id]}
                    class="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-offset-0 shrink-0"
                  />
                </div>
              {/each}

              {#if filteredSupplies.length === 0}
                <p class="py-8 text-center text-sm text-gray-400">Sin resultados</p>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Confirm button -->
        <div class="px-4 pb-6 pt-3 border-t shrink-0">
          <button
            type="button"
            onclick={handleAgregarInsumos}
            class="w-full flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors"
            style="background-color: #2D6A4F;"
          >
            Agregar seleccionados
          </button>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
{/if}
