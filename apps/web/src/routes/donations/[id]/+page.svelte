<script lang="ts">
  import { page } from '$app/state';
  import { DateTime } from 'luxon';
  import {
    ArrowLeft,
    User,
    Building2,
    Package,
    ChevronRight,
    BookCheck,
    Pill,
    Stethoscope,
    Barcode,
  } from 'lucide-svelte';

  const DONACIONES = [
    {
      id: 'd1',
      fecha: '2025-03-15',
      donante: { tipo: 'persona', nombre: 'María González', identificacion: 'V-12345678' },
      observaciones: 'Medicamentos en buen estado',
      contabilizada: true,
      valorRefTotal: 450.00,
      items: [
        { id: 'i1', itemId: 'inv1', tipo: 'medicamento', nombre: 'Paracetamol 500mg', presentacion: 'Caja x 20 tab', cantidad: 3, lote: 'L2025-01', vencimiento: '2026-06-30', valorRef: 80 },
        { id: 'i2', itemId: 'inv2', tipo: 'medicamento', nombre: 'Ibuprofeno 400mg', presentacion: 'Caja x 10 tab', cantidad: 2, lote: 'L2025-02', vencimiento: '2026-09-15', valorRef: 75 },
      ],
    },
    {
      id: 'd2',
      fecha: '2025-03-10',
      donante: { tipo: 'institucion', nombre: 'Fundación Salud Bolívar', identificacion: 'J-30987654-0' },
      observaciones: '',
      contabilizada: true,
      valorRefTotal: 1200.00,
      items: [
        { id: 'i3', itemId: 'inv3', tipo: 'medicamento', nombre: 'Amoxicilina 500mg', presentacion: 'Caja x 12 cap', cantidad: 5, lote: 'L2025-03', vencimiento: '2026-03-01', valorRef: 120 },
        { id: 'i4', itemId: 'inv4', tipo: 'material', nombre: 'Guantes de látex', presentacion: 'Caja x 100 uds', cantidad: 2, lote: 'L2025-04', vencimiento: '2027-01-01', valorRef: 300 },
      ],
    },
    {
      id: 'd3',
      fecha: '2025-02-28',
      donante: { tipo: 'persona', nombre: 'Carlos Martínez', identificacion: 'V-8765432' },
      observaciones: '',
      contabilizada: false,
      valorRefTotal: 180.00,
      items: [
        { id: 'i5', itemId: 'inv5', tipo: 'medicamento', nombre: 'Vitamina C 500mg', presentacion: 'Frasco x 30 comp', cantidad: 3, lote: 'L2025-05', vencimiento: '2026-12-31', valorRef: 60 },
      ],
    },
    {
      id: 'd4',
      fecha: '2025-02-14',
      donante: { tipo: 'institucion', nombre: 'Iglesia San José', identificacion: 'J-28765432-1' },
      observaciones: 'Incluye materiales quirúrgicos',
      contabilizada: true,
      valorRefTotal: 980.00,
      items: [
        { id: 'i6', itemId: 'inv6', tipo: 'material', nombre: 'Gasas estériles', presentacion: 'Caja x 50 uds', cantidad: 4, lote: 'L2025-06', vencimiento: '2027-06-30', valorRef: 150 },
        { id: 'i7', itemId: 'inv7', tipo: 'material', nombre: 'Jeringas 5ml', presentacion: 'Caja x 100 uds', cantidad: 2, lote: 'L2025-07', vencimiento: '2028-01-01', valorRef: 190 },
      ],
    },
  ];

  const donacion = $derived(DONACIONES.find((d) => d.id === page.params.id));

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("d 'de' LLLL yyyy");
  }

  function formatBs(amount: number): string {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
  }
</script>

{#if donacion}
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
        <span
          class={[
            'shrink-0 rounded-lg p-2',
            donacion.donante.tipo === 'persona'
              ? 'bg-primary/10 text-primary'
              : 'bg-blue-100 text-blue-600',
          ].join(' ')}
        >
          {#if donacion.donante.tipo === 'persona'}
            <User class="size-6" />
          {:else}
            <Building2 class="size-6" />
          {/if}
        </span>

        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">{donacion.donante.nombre}</p>
          <p class="text-xs text-gray-500 mt-0.5">{donacion.donante.identificacion}</p>
          <p class="text-xs text-gray-500 mt-0.5">{formatFecha(donacion.fecha)}</p>
          {#if donacion.contabilizada}
            <span
              class="inline-flex mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200"
            >
              Contabilizada
            </span>
          {/if}
        </div>
      </div>

      <!-- Observaciones -->
      {#if donacion.observaciones}
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-semibold text-gray-700 mb-1">Observaciones</p>
          <p class="text-sm text-gray-600 italic">{donacion.observaciones}</p>
        </div>
      {/if}

      <!-- Resumen -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <p class="text-sm font-semibold text-gray-700 mb-3">Resumen</p>
        <ul class="flex flex-col gap-2">
          <li class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Total de insumos</span>
            <span class="font-medium text-gray-900">{donacion.items.length}</span>
          </li>
          <li class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Valor de referencia total</span>
            <span class="font-medium text-gray-900">{formatBs(donacion.valorRefTotal)}</span>
          </li>
          {#if donacion.contabilizada}
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
          {#each donacion.items as item (item.id)}
            <li>
              <a
                href="/inventory/{item.itemId}"
                class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <!-- Item type icon -->
                <span
                  class={[
                    'shrink-0 rounded-lg p-2',
                    item.tipo === 'medicamento'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-blue-100 text-blue-600',
                  ].join(' ')}
                >
                  {#if item.tipo === 'medicamento'}
                    <Pill class="size-5" />
                  {:else}
                    <Stethoscope class="size-5" />
                  {/if}
                </span>

                <!-- Item info -->
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">{item.nombre}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{item.presentacion}</p>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    <span class="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Package class="size-3" />
                      x{item.cantidad}
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Barcode class="size-3" />
                      {item.lote}
                    </span>
                    <span class="text-xs font-medium text-gray-700">{formatBs(item.valorRef)}</span>
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
