<script lang="ts">
  import { DateTime } from 'luxon';
  import {
    Search,
    Pill,
    Stethoscope,
    ChevronRight,
    Package,
    BookOpen,
    Filter,
    AlertTriangle,
    X,
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';
  import StockIndicator from '$lib/components/custom/stock-indicator.svelte';
  import ExpiryIndicator from '$lib/components/custom/expiry-indicator.svelte';

  const INSUMOS = [
    { id: 'inv1', tipo: 'medicamento', nombre: 'Paracetamol 500mg', presentacion: 'Caja x 20 tab', stockDisponible: 8, cantidadInicial: 15, fechaVencimiento: '2026-06-30', categoria: 'Analgésico' },
    { id: 'inv2', tipo: 'medicamento', nombre: 'Ibuprofeno 400mg', presentacion: 'Caja x 10 tab', stockDisponible: 2, cantidadInicial: 10, fechaVencimiento: '2026-09-15', categoria: 'Antiinflamatorio' },
    { id: 'inv3', tipo: 'medicamento', nombre: 'Amoxicilina 500mg', presentacion: 'Caja x 12 cap', stockDisponible: 0, cantidadInicial: 5, fechaVencimiento: '2026-03-01', categoria: 'Antibiótico' },
    { id: 'inv4', tipo: 'material', nombre: 'Guantes de látex', presentacion: 'Caja x 100 uds', stockDisponible: 4, cantidadInicial: 10, fechaVencimiento: '2027-01-01', categoria: 'Protección' },
    { id: 'inv5', tipo: 'medicamento', nombre: 'Vitamina C 500mg', presentacion: 'Frasco x 30 comp', stockDisponible: 9, cantidadInicial: 9, fechaVencimiento: '2026-12-31', categoria: 'Vitaminas' },
    { id: 'inv6', tipo: 'material', nombre: 'Gasas estériles', presentacion: 'Caja x 50 uds', stockDisponible: 1, cantidadInicial: 8, fechaVencimiento: '2027-06-30', categoria: 'Curaciones' },
    { id: 'inv7', tipo: 'material', nombre: 'Jeringas 5ml', presentacion: 'Caja x 100 uds', stockDisponible: 6, cantidadInicial: 6, fechaVencimiento: '2028-01-01', categoria: 'Inyectables' },
  ];

  let search = $state('');
  let tipoFiltro = $state<'all' | 'medicamento' | 'material'>('all');
  let stockFiltro = $state<'all' | 'ok' | 'low' | 'out'>('all');
  let orden = $state<'nombre' | 'stock' | 'vencimiento'>('nombre');
  let filtrosDrawerOpen = $state(false);

  const alertaItems = $derived(
    INSUMOS.filter((item) => {
      const ratio = item.cantidadInicial > 0 ? item.stockDisponible / item.cantidadInicial : 0;
      const dias = Math.floor(DateTime.fromISO(item.fechaVencimiento).diffNow('days').days);
      return item.stockDisponible === 0 || ratio < 0.25 || dias <= 90;
    })
  );

  const activeFilterCount = $derived(
    (stockFiltro !== 'all' ? 1 : 0) + (orden !== 'nombre' ? 1 : 0)
  );

  const filtered = $derived((() => {
    let items = INSUMOS.slice();

    // Filter by tipo
    if (tipoFiltro !== 'all') {
      items = items.filter((i) => i.tipo === tipoFiltro);
    }

    // Filter by search (nombre or categoria)
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          i.categoria.toLowerCase().includes(q)
      );
    }

    // Filter by stock
    if (stockFiltro !== 'all') {
      items = items.filter((i) => {
        const ratio = i.cantidadInicial > 0 ? i.stockDisponible / i.cantidadInicial : 0;
        if (stockFiltro === 'out') return i.stockDisponible === 0;
        if (stockFiltro === 'low') return i.stockDisponible > 0 && ratio < 0.25;
        if (stockFiltro === 'ok') return i.stockDisponible > 0 && ratio >= 0.25;
        return true;
      });
    }

    // Sort
    items.sort((a, b) => {
      if (orden === 'stock') return a.stockDisponible - b.stockDisponible;
      if (orden === 'vencimiento')
        return DateTime.fromISO(a.fechaVencimiento).toMillis() - DateTime.fromISO(b.fechaVencimiento).toMillis();
      return a.nombre.localeCompare(b.nombre);
    });

    return items;
  })());
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
    <h1 class="text-xl font-bold text-gray-900 shrink-0">Inventario</h1>
    <a
      href="/inventory/catalogs"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
    >
      <BookOpen class="size-4" />
      <span class="hidden sm:inline">Catálogos</span>
    </a>
  </header>

  <main class="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
    <!-- Alert banner -->
    {#if alertaItems.length > 0}
      <div class="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-4 text-sm text-amber-800">
        <AlertTriangle class="size-4 shrink-0 mt-0.5" />
        <p>
          <span class="font-medium">{alertaItems.length} insumo(s)</span> requieren atención (stock bajo, agotado o próximos a vencer)
        </p>
      </div>
    {/if}

    <!-- Search input -->
    <div class="relative mb-3">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        placeholder="Buscar por nombre o categoría…"
        bind:value={search}
        class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
    </div>

    <!-- Tipo filter chips -->
    <div class="flex items-center gap-2 mb-3">
      {#each [
        { value: 'all', label: 'Todos' },
        { value: 'medicamento', label: 'Medicamentos' },
        { value: 'material', label: 'Materiales' },
      ] as chip (chip.value)}
        <button
          type="button"
          onclick={() => { tipoFiltro = chip.value as typeof tipoFiltro; }}
          class={[
            'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
            tipoFiltro === chip.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          {chip.label}
        </button>
      {/each}
    </div>

    <!-- Count + Filtros button -->
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs text-gray-500">{filtered.length} insumo(s)</p>

      <button
        type="button"
        onclick={() => { filtrosDrawerOpen = true; }}
        class="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Filter class="size-4" />
        Filtros
        {#if activeFilterCount > 0}
          <span class="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold leading-none">
            {activeFilterCount}
          </span>
        {/if}
      </button>
    </div>

    <Drawer.Root bind:open={filtrosDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content
            class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white px-4 pb-8 pt-3 max-h-[85vh] outline-none"
          >
            <!-- Drag handle -->
            <div class="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-gray-300"></div>

            <!-- Header -->
            <div class="flex items-center justify-between mb-5">
              <Drawer.Title class="text-base font-semibold text-gray-900">Filtros</Drawer.Title>
              <button
                type="button"
                onclick={() => { filtrosDrawerOpen = false; }}
                class="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar filtros"
              >
                <X class="size-5" />
              </button>
            </div>

            <!-- Stock section -->
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stock</p>
            <div class="flex flex-wrap gap-2 mb-5">
              {#each [
                { value: 'all', label: 'Todos' },
                { value: 'ok', label: 'Disponible' },
                { value: 'low', label: 'Stock bajo' },
                { value: 'out', label: 'Agotado' },
              ] as chip (chip.value)}
                <button
                  type="button"
                  onclick={() => { stockFiltro = chip.value as typeof stockFiltro; }}
                  class={[
                    'px-3 py-1.5 text-sm font-medium rounded-full border transition-colors',
                    stockFiltro === chip.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {chip.label}
                </button>
              {/each}
            </div>

            <!-- Ordenar por section -->
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ordenar por</p>
            <div class="flex flex-wrap gap-2 mb-6">
              {#each [
                { value: 'nombre', label: 'Nombre' },
                { value: 'stock', label: 'Stock' },
                { value: 'vencimiento', label: 'Vencimiento' },
              ] as chip (chip.value)}
                <button
                  type="button"
                  onclick={() => { orden = chip.value as typeof orden; }}
                  class={[
                    'px-3 py-1.5 text-sm font-medium rounded-full border transition-colors',
                    orden === chip.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {chip.label}
                </button>
              {/each}
            </div>

            <!-- Apply button -->
            <button
              type="button"
              onclick={() => { filtrosDrawerOpen = false; }}
              class="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Aplicar
            </button>
          </Drawer.Content>
        </Drawer.Portal>
    </Drawer.Root>

    <!-- Item list or empty state -->
    {#if filtered.length === 0}
      <div class="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
        <Package class="size-10 stroke-[1.5]" />
        <p class="text-sm">Sin insumos en el inventario</p>
      </div>
    {:else}
      <ul class="flex flex-col gap-3">
        {#each filtered as item (item.id)}
          <li>
            <a
              href="/inventory/{item.id}"
              class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <!-- Type icon -->
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

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{item.nombre}</p>
                <p class="text-xs text-gray-500 mt-0.5">{item.presentacion}</p>
                <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <StockIndicator stockDisponible={item.stockDisponible} cantidadInicial={item.cantidadInicial} />
                  <ExpiryIndicator fechaVencimiento={item.fechaVencimiento} />
                </div>
              </div>

              <!-- Arrow -->
              <ChevronRight class="size-4 text-gray-400 shrink-0" />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </main>
</div>
