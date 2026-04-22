<script lang="ts">
  import { page } from '$app/state';
  import { DateTime } from 'luxon';
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/api';
  import {
    ArrowLeft,
    User,
    Package,
    ChevronRight,
    BookCheck,
    Pill,
    Stethoscope,
    Barcode,
  } from 'lucide-svelte';

  const id = $derived(page.params.id ?? '');

  const donationQuery = createQuery({
    get queryKey() { return ['donation', id]; },
    queryFn: async () => {
      const res = await api.api.donations({ id }).get();
      if (res.error) throw res.error;
      return res.data as any;
    },
  });

  const donation = $derived($donationQuery.data ?? null);

  const valorRefTotal = $derived(
    donation?.items.reduce(
      (sum: number, item: any) => sum + item.insumo.precioUnitarioReferencial * item.insumo.cantidad,
      0
    ) ?? 0
  );

  const contabilizada = $derived(
    (donation?.contabilizable?.asientosContables?.length ?? 0) > 0
  );

  function getNombreInsumo(insumo: any): string {
    if (insumo.materialQuirurgico) return insumo.materialQuirurgico.nombre;
    if (insumo.presentacionMedicamento) {
      const med = insumo.presentacionMedicamento.medicamento;
      if (med.marca.esGenerico && med.principiosActivos.length > 0) {
        return (
          med.principiosActivos
            .map((pa: any) => `${pa.principioActivo.nombre} ${pa.concentracion}`)
            .join(' + ') + ` — ${med.marca.laboratorio.nombre}`
        );
      }
      return med.marca.nombre;
    }
    return 'Sin nombre';
  }

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("d 'de' LLLL yyyy");
  }

  function formatBs(amount: number): string {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
  }
</script>

{#if $donationQuery.isPending}
  <div class="flex flex-col min-h-screen bg-gray-50">
    <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <a
        href="/donations"
        class="inline-flex items-center justify-center size-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        aria-label="Volver a donaciones"
      >
        <ArrowLeft class="size-5" />
      </a>
      <h1 class="text-lg font-bold text-gray-900 truncate">Detalle de Donación</h1>
    </header>
    <main class="flex-1 px-4 py-4 max-w-2xl mx-auto w-full flex flex-col gap-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-3 animate-pulse">
        <div class="shrink-0 rounded-lg p-2 bg-gray-200 size-10"></div>
        <div class="flex-1 flex flex-col gap-2">
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/3"></div>
          <div class="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 animate-pulse flex flex-col gap-2">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-3 bg-gray-200 rounded w-full"></div>
        <div class="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 animate-pulse flex flex-col gap-2">
        <div class="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
        <div class="h-3 bg-gray-200 rounded w-full"></div>
        <div class="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    </main>
  </div>
{:else if $donationQuery.isError}
  <div class="flex flex-col items-center justify-center min-h-screen gap-3 text-gray-400 px-4">
    <p class="text-base font-medium text-gray-600">No se pudo cargar la donación</p>
    <a
      href="/donations"
      class="text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
      Volver a donaciones
    </a>
  </div>
{:else if donation}
  <div class="flex flex-col min-h-screen bg-gray-50">
    <!-- Sticky header -->
    <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <a
        href="/donations"
        class="inline-flex items-center justify-center size-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        aria-label="Volver a donaciones"
      >
        <ArrowLeft class="size-5" />
      </a>
      <h1 class="text-lg font-bold text-gray-900 truncate">Detalle de Donación</h1>
    </header>

    <main class="flex-1 px-4 py-4 max-w-2xl mx-auto w-full flex flex-col gap-4">
      <!-- Donor card -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-3">
        <span class="shrink-0 rounded-lg p-2 bg-primary/10 text-primary">
          <User class="size-6" />
        </span>

        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">{donation.donante.nombre}</p>
          <p class="text-xs text-gray-500 mt-0.5">{donation.donante.pais}</p>
          <p class="text-xs text-gray-500 mt-0.5">{formatFecha(donation.fechaRecepcion)}</p>
          {#if contabilizada}
            <span
              class="inline-flex mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200"
            >
              Contabilizada
            </span>
          {/if}
        </div>
      </div>

      <!-- Observaciones -->
      {#if donation.observaciones}
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-semibold text-gray-700 mb-1">Observaciones</p>
          <p class="text-sm text-gray-600 italic">{donation.observaciones}</p>
        </div>
      {/if}

      <!-- Resumen -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <p class="text-sm font-semibold text-gray-700 mb-3">Resumen</p>
        <ul class="flex flex-col gap-2">
          <li class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Total de insumos</span>
            <span class="font-medium text-gray-900">{donation.items.length}</span>
          </li>
          <li class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Valor de referencia total</span>
            <span class="font-medium text-gray-900">{formatBs(valorRefTotal)}</span>
          </li>
          {#if contabilizada}
            <li class="flex items-center gap-2 text-sm text-emerald-700 mt-1">
              <BookCheck class="size-4 shrink-0" />
              <span>Asiento contable registrado</span>
            </li>
          {/if}
        </ul>
      </div>

      <!-- Items list -->
      <div>
        <p class="text-sm font-semibold text-gray-700 mb-2 px-1">Insumos donados</p>
        <ul class="flex flex-col gap-2">
          {#each donation.items as item (item.id)}
            <li>
              <a
                href="/inventory/{item.insumo.id}"
                class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <!-- Item type icon -->
                <span
                  class={[
                    'shrink-0 rounded-lg p-2',
                    item.insumo.tipo === 'MEDICAMENTO'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-blue-100 text-blue-600',
                  ].join(' ')}
                >
                  {#if item.insumo.tipo === 'MEDICAMENTO'}
                    <Pill class="size-5" />
                  {:else}
                    <Stethoscope class="size-5" />
                  {/if}
                </span>

                <!-- Item info -->
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">{getNombreInsumo(item.insumo)}</p>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    <span class="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Package class="size-3" />
                      x{item.insumo.cantidad}
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Barcode class="size-3" />
                      {item.insumo.numeroLote}
                    </span>
                    <span class="text-xs font-medium text-gray-700">
                      {formatBs(item.insumo.precioUnitarioReferencial * item.insumo.cantidad)}
                    </span>
                  </div>
                </div>

                <!-- Arrow -->
                <ChevronRight class="size-4 text-gray-400 shrink-0" />
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </main>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center min-h-screen gap-3 text-gray-400 px-4">
    <p class="text-base font-medium text-gray-600">Donación no encontrada</p>
    <a
      href="/donations"
      class="text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
      Volver a donaciones
    </a>
  </div>
{/if}
