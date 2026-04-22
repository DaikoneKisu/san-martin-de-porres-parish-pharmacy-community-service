<script lang="ts">
  import { page } from '$app/state';
  import { api } from '$lib/api';
  import { createQuery } from '@tanstack/svelte-query';
  import { DateTime } from 'luxon';
  import { ArrowLeft, FileText, ImageIcon, Package, ExternalLink } from 'lucide-svelte';

  type InsumoConsumido = {
    id: string;
    insumoId: string;
    cantidadDespachada: number;
    precioUnitario: number;
    insumo: {
      id: string;
      tipo: string;
      cantidad: number;
      stockDisponible: number;
      presentacionMedicamento?: Record<string, unknown>;
      materialQuirurgico?: { nombre: string };
    };
  };

  const recipeQuery = createQuery({
    get queryKey() {
      return ['external-recipe', page.params.id];
    },
    get queryFn() {
      const id: string = page.params.id ?? '';
      return async () => {
        const res = await api.api.medical['external-recipes']({ id }).get();
        if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error');
        return res.data as any;
      };
    },
    get enabled() {
      return !!page.params.id;
    },
  });

  function formatFecha(date: Date | string): string {
    const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
    return dt.setLocale('es').toFormat("dd 'de' LLLL yyyy");
  }

  function getNombreInsumo(ic: InsumoConsumido): string {
    if (ic.insumo.materialQuirurgico) return ic.insumo.materialQuirurgico.nombre;
    return 'Medicamento';
  }

  const total = $derived(
    ($recipeQuery.data?.insumosConsumidos ?? []).reduce(
      (s: number, ic: InsumoConsumido) => s + ic.cantidadDespachada * ic.precioUnitario,
      0
    )
  );
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
    <a
      href="/medical/external-recipes"
      class="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
      aria-label="Volver"
    >
      <ArrowLeft size={20} />
    </a>
    <h1 class="flex-1 text-lg font-bold text-gray-900">Récipe externo</h1>
    <span
      class="bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full px-2.5 py-0.5 text-xs font-medium"
    >
      Contabilizado
    </span>
  </div>

  <!-- Main content -->
  <div class="max-w-2xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
    {#if $recipeQuery.isPending}
      <!-- Skeleton loading state -->
      {#each [0, 1, 2] as i (i)}
        <div class="rounded-xl border bg-white p-4 flex flex-col gap-3 animate-pulse">
          <div class="h-3 w-24 rounded bg-gray-200"></div>
          <div class="h-4 w-full rounded bg-gray-100"></div>
          <div class="h-4 w-3/4 rounded bg-gray-100"></div>
          <div class="h-4 w-1/2 rounded bg-gray-100"></div>
        </div>
      {/each}
    {:else if $recipeQuery.isError}
      <!-- Error state -->
      <div class="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3 text-center">
        <p class="text-sm font-medium text-red-700">No se pudo cargar el récipe externo.</p>
        <p class="text-xs text-red-500">
          {($recipeQuery.error as { message?: string })?.message ?? 'Error desconocido'}
        </p>
      </div>
    {:else if $recipeQuery.data}
      <!-- Info card -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Información</p>

        <!-- ID -->
        <div class="flex items-start gap-3">
          <FileText size={16} class="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p class="text-xs text-gray-400">ID del récipe</p>
            <p class="text-sm font-medium text-gray-900 font-mono">
              {$recipeQuery.data.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        <hr class="border-gray-100" />

        <!-- Fecha de registro -->
        <div class="flex items-start gap-3">
          <FileText size={16} class="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p class="text-xs text-gray-400">Fecha de registro</p>
            <p class="text-sm font-medium text-gray-900">
              {formatFecha($recipeQuery.data.createdAt)}
            </p>
          </div>
        </div>

        {#if $recipeQuery.data.indicaciones}
          <hr class="border-gray-100" />

          <!-- Indicaciones -->
          <div class="flex items-start gap-3">
            <FileText size={16} class="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p class="text-xs text-gray-400">Indicaciones</p>
              <!-- Safe: indicaciones is sanitized server-side with sanitize-html -->
              <div class="prose prose-sm text-gray-900 mt-1">
                {@html $recipeQuery.data.indicaciones}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Fotografía card -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Fotografía del récipe</p>

        <div
          class="rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 h-40 flex flex-col items-center justify-center gap-2"
        >
          <ImageIcon size={28} class="text-gray-300" />
          <p class="text-sm text-gray-400">Récipe adjunto</p>
          <a
            href={$recipeQuery.data.adjuntoExterno}
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={12} />
            Ver imagen
          </a>
        </div>
      </div>

      <!-- Insumos dispensados card -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Insumos dispensados
        </p>

        {#if $recipeQuery.data.insumosConsumidos.length > 0}
          <div class="flex flex-col divide-y divide-gray-100">
            {#each $recipeQuery.data.insumosConsumidos as ic (ic.id)}
              <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Package size={16} class="text-gray-400 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{getNombreInsumo(ic)}</p>
                  <p class="text-xs text-gray-500">
                    {ic.cantidadDespachada} uds × Bs. {ic.precioUnitario.toFixed(2)}
                  </p>
                </div>
                <p class="text-sm font-medium text-gray-900 shrink-0">
                  Bs. {(ic.cantidadDespachada * ic.precioUnitario).toFixed(2)}
                </p>
              </div>
            {/each}
          </div>

          <hr class="border-gray-100" />

          <!-- Total row -->
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">Total referencial</p>
            <p class="text-sm font-semibold text-gray-900">Bs. {total.toFixed(2)}</p>
          </div>
        {:else}
          <p class="text-sm text-gray-400 text-center py-4">Sin insumos registrados.</p>
        {/if}
      </div>

      <!-- Back link -->
      <a
        href="/medical/external-recipes"
        class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Volver a récipes externos
      </a>
    {/if}
  </div>
</div>
