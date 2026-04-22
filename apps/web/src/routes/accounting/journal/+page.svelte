<script lang="ts">
  import { DateTime } from 'luxon';
  import { Drawer } from 'vaul-svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/api';
  import {
    ArrowLeft,
    Plus,
    Search,
    SlidersHorizontal,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    ChevronLeft,
    Calendar,
    FileText,
    X
  } from 'lucide-svelte';

  // ── Types ──────────────────────────────────────────────────────────────────
  type TipoAsiento = 'INGRESO' | 'EGRESO';

  interface Asiento {
    id: string;
    fecha: string;
    tipo: TipoAsiento;
    concepto: string;
    monto: number;
    contabilizableId: string | null;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatVES(n: number): string {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2
    }).format(n);
  }

  function formatDate(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat('dd MMM yyyy');
  }

  function groupByDate(items: Asiento[]): [string, Asiento[]][] {
    const map: Record<string, Asiento[]> = {};
    for (const a of items) {
      const dateKey = a.fecha.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(a);
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let search = $state('');
  let tipoFiltro = $state<'all' | TipoAsiento>('all');
  let fromDate = $state('');
  let toDate = $state('');
  let filtroDrawerOpen = $state(false);
  let detalleDrawerOpen = $state(false);
  let detalle = $state<Asiento | null>(null);
  // pageOffset is reset to 0 whenever filters change by being derived from filterKey
  let pageOffset = $state(0);

  const PAGE_SIZE = 20;

  // Produce a stable key for the active filter set — when it changes, pageOffset must be 0
  const filterKey = $derived(`${tipoFiltro}|${fromDate}|${toDate}|${search}`);

  // The effective page is always 1 + pageOffset, but pageOffset is only meaningful
  // for the current filterKey. We pair them together so the query key captures both.
  const currentPage = $derived(pageOffset + 1);

  // ── Derived query params ───────────────────────────────────────────────────
  const queryParams = $derived({
    ...(tipoFiltro !== 'all' && { type: tipoFiltro }),
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
    ...(search && { concept: search }),
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  // ── Queries ────────────────────────────────────────────────────────────────
  const ledgerQuery = createQuery({
    get queryKey() { return ['ledger', queryParams]; },
    queryFn: async () => {
      const res = await api.api.accounting.ledger.get({ query: queryParams });
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al cargar el libro diario');
      return res.data!;
    },
  });

  const rateQuery = createQuery({
    queryKey: ['exchange-rate'],
    queryFn: async () => {
      const res = await api.api.accounting['exchange-rate'].get();
      if (res.error) return null;
      return res.data ?? null;
    },
  });

  // ── Derived display values ─────────────────────────────────────────────────
  const items = $derived($ledgerQuery.data?.items ?? []);
  const total = $derived($ledgerQuery.data?.total ?? 0);
  const totalPages = $derived(Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const grupos = $derived(groupByDate(items));
  const totalIngresos = $derived(items.filter((a: Asiento) => a.tipo === 'INGRESO').reduce((s: number, a: Asiento) => s + a.monto, 0));
  const totalEgresos = $derived(items.filter((a: Asiento) => a.tipo === 'EGRESO').reduce((s: number, a: Asiento) => s + a.monto, 0));
  const hayFiltros = $derived(tipoFiltro !== 'all' || !!fromDate || !!toDate);
  const exchangeRate = $derived(($rateQuery.data as { rate?: number } | null)?.rate ?? null);

  // ── Page navigation helpers ────────────────────────────────────────────────
  function prevPage() {
    if (pageOffset > 0) pageOffset -= 1;
  }
  function nextPage() {
    if (currentPage < totalPages) pageOffset += 1;
  }
  function resetFilters() {
    tipoFiltro = 'all';
    fromDate = '';
    toDate = '';
    pageOffset = 0;
  }
</script>

<div class="flex flex-col min-h-screen bg-gray-50">

  <!-- ── Sticky header ───────────────────────────────────────────────────── -->
  <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-2">
    <a
      href="/accounting"
      class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
      aria-label="Volver"
    >
      <ArrowLeft class="size-5" />
    </a>

    <span class="flex-1 font-semibold text-base">Libro diario</span>

    <button
      onclick={() => { filtroDrawerOpen = true; }}
      class="relative flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <SlidersHorizontal class="size-3.5" />
      Filtros
      {#if hayFiltros}
        <span class="absolute -top-1 -right-1 size-2 rounded-full bg-[#2D6A4F]"></span>
      {/if}
    </button>

    <a
      href="/accounting/expenses/new"
      class="flex items-center gap-1.5 bg-[#2D6A4F] text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[#235c43] transition-colors"
    >
      <Plus class="size-3.5" />
      Egreso
    </a>
  </header>

  <!-- ── Resumen rápido ──────────────────────────────────────────────────── -->
  <div class="px-4 pt-3 grid grid-cols-2 gap-2">
    <div class="rounded-xl border bg-emerald-50 border-emerald-200 p-3 flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-emerald-700">
        <TrendingUp class="size-4 shrink-0" />
        <span class="text-xs font-medium">Ingresos</span>
      </div>
      {#if $ledgerQuery.isPending}
        <div class="h-4 w-24 bg-emerald-100 rounded animate-pulse"></div>
      {:else}
        <p class="text-emerald-800 font-semibold tabular-nums text-sm leading-tight">{formatVES(totalIngresos)}</p>
      {/if}
    </div>
    <div class="rounded-xl border bg-red-50 border-red-200 p-3 flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-red-700">
        <TrendingDown class="size-4 shrink-0" />
        <span class="text-xs font-medium">Egresos</span>
      </div>
      {#if $ledgerQuery.isPending}
        <div class="h-4 w-24 bg-red-100 rounded animate-pulse"></div>
      {:else}
        <p class="text-red-800 font-semibold tabular-nums text-sm leading-tight">{formatVES(totalEgresos)}</p>
      {/if}
    </div>
  </div>

  <!-- ── Search ─────────────────────────────────────────────────────────── -->
  <div class="px-4 pt-3 pb-2">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        placeholder="Buscar por concepto…"
        bind:value={search}
        oninput={() => { pageOffset = 0; }}
        class="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
      />
    </div>
  </div>

  <!-- ── List grouped by date ────────────────────────────────────────────── -->
  <div class="px-4 pb-6 flex flex-col gap-4">
    {#if $ledgerQuery.isPending}
      {#each { length: 5 } as _, i (i)}
        <div class="rounded-xl border bg-white p-3.5 flex items-center gap-3">
          <div class="rounded-full size-9 bg-gray-100 animate-pulse shrink-0"></div>
          <div class="flex-1 flex flex-col gap-1.5">
            <div class="h-3.5 bg-gray-100 rounded animate-pulse w-3/4"></div>
            <div class="h-3 bg-gray-100 rounded animate-pulse w-1/3"></div>
          </div>
          <div class="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
        </div>
      {/each}
    {:else if $ledgerQuery.isError}
      <div class="flex flex-col items-center gap-2 py-16 text-center">
        <div class="rounded-full bg-red-100 p-4">
          <FileText class="size-6 text-red-400" />
        </div>
        <p class="font-semibold text-sm text-gray-700">Error al cargar los asientos</p>
        <p class="text-xs text-gray-500">{$ledgerQuery.error?.message ?? 'Intenta de nuevo más tarde.'}</p>
        <button
          onclick={() => $ledgerQuery.refetch()}
          class="mt-2 text-xs text-[#2D6A4F] font-medium hover:underline"
        >
          Reintentar
        </button>
      </div>
    {:else if grupos.length === 0}
      <div class="flex flex-col items-center gap-2 py-16 text-center">
        <div class="rounded-full bg-gray-100 p-4">
          <FileText class="size-6 text-gray-400" />
        </div>
        <p class="font-semibold text-sm text-gray-700">Sin asientos</p>
        <p class="text-xs text-gray-500">Ajusta los filtros para ver resultados.</p>
      </div>
    {:else}
      {#each grupos as [fecha, asientos] (fecha)}
        {@const dIngresos = asientos.filter(a => a.tipo === 'INGRESO').reduce((s, a) => s + a.monto, 0)}
        {@const dEgresos  = asientos.filter(a => a.tipo === 'EGRESO').reduce((s, a) => s + a.monto, 0)}
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-1.5">
            <Calendar class="size-3.5 text-gray-400 shrink-0" />
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">
              {formatDate(fecha)}
            </span>
            <div class="flex items-center gap-2">
              {#if dIngresos > 0}
                <span class="text-xs font-medium tabular-nums text-emerald-700">+{formatVES(dIngresos)}</span>
              {/if}
              {#if dEgresos > 0}
                <span class="text-xs font-medium tabular-nums text-red-700">-{formatVES(dEgresos)}</span>
              {/if}
            </div>
          </div>

          {#each asientos as a (a.id)}
            <button
              onclick={() => { detalle = a; detalleDrawerOpen = true; }}
              class="rounded-xl border bg-white p-3.5 flex items-center gap-3 w-full text-left hover:bg-gray-50 transition-colors"
            >
              <span class="rounded-full p-2 border shrink-0 {a.tipo === 'INGRESO' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}">
                {#if a.tipo === 'INGRESO'}
                  <TrendingUp class="size-4" />
                {:else}
                  <TrendingDown class="size-4" />
                {/if}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium line-clamp-1">{a.concepto}</p>
                <p class="text-xs text-gray-400">{a.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}</p>
              </div>
              <div class="flex flex-col items-end shrink-0">
                <span class="text-sm font-semibold tabular-nums {a.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-red-700'}">
                  {a.tipo === 'INGRESO' ? '+' : '-'}{formatVES(a.monto)}
                </span>
              </div>
              <ChevronRight class="size-4 text-gray-400 shrink-0" />
            </button>
          {/each}
        </div>
      {/each}

      <!-- ── Paginator ──────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between pt-2 pb-8 text-xs text-gray-500">
        <span>Mostrando {items.length} de {total}</span>
        <div class="flex items-center gap-1">
          <button
            onclick={prevPage}
            disabled={currentPage <= 1}
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft class="size-3.5" />
            Anterior
          </button>
          <span class="px-2 font-medium">{currentPage} / {totalPages}</span>
          <button
            onclick={nextPage}
            disabled={currentPage >= totalPages}
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Siguiente
            <ChevronRight class="size-3.5" />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- ── Filtros Drawer ──────────────────────────────────────────────────────── -->
<Drawer.Root bind:open={filtroDrawerOpen} onClose={() => { filtroDrawerOpen = false; }}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[85vh]">
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-gray-200"></div>
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Drawer.Title class="font-semibold text-base">Filtrar asientos</Drawer.Title>
        <button
          onclick={() => { filtroDrawerOpen = false; }}
          class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <X class="size-4" />
        </button>
      </div>
      <div class="flex flex-col gap-5 px-4 py-5 overflow-y-auto">
        <div class="flex flex-col gap-1.5">
          <label for="filtro-tipo" class="text-sm font-medium text-gray-700">Tipo</label>
          <select
            id="filtro-tipo"
            bind:value={tipoFiltro}
            onchange={() => { pageOffset = 0; }}
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          >
            <option value="all">Todos</option>
            <option value="INGRESO">Ingresos</option>
            <option value="EGRESO">Egresos</option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="filtro-from" class="text-sm font-medium text-gray-700">Desde</label>
          <input
            id="filtro-from"
            type="date"
            bind:value={fromDate}
            onchange={() => { pageOffset = 0; }}
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="filtro-to" class="text-sm font-medium text-gray-700">Hasta</label>
          <input
            id="filtro-to"
            type="date"
            bind:value={toDate}
            onchange={() => { pageOffset = 0; }}
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          />
        </div>
      </div>
      <div class="flex items-center justify-between px-4 py-4 border-t border-gray-100 gap-3">
        <button
          onclick={resetFilters}
          class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Limpiar
        </button>
        <button
          onclick={() => { filtroDrawerOpen = false; }}
          class="flex-1 bg-[#2D6A4F] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#235c43] transition-colors"
        >
          Aplicar
        </button>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>

<!-- ── Detalle Drawer ──────────────────────────────────────────────────────── -->
<Drawer.Root
  bind:open={detalleDrawerOpen}
  onClose={() => { setTimeout(() => { detalle = null; }, 300); }}
>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[85vh]">
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-gray-200"></div>
      {#if detalle}
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <Drawer.Title class="font-semibold text-base">Detalle del asiento</Drawer.Title>
          <button
            onclick={() => { detalleDrawerOpen = false; }}
            class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X class="size-4" />
          </button>
        </div>
        <div class="flex flex-col gap-4 px-4 py-5 overflow-y-auto">
          <div class="flex items-center gap-3">
            <span class="rounded-full p-2.5 border shrink-0 {detalle.tipo === 'INGRESO' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}">
              {#if detalle.tipo === 'INGRESO'}
                <TrendingUp class="size-5" />
              {:else}
                <TrendingDown class="size-5" />
              {/if}
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm leading-snug">{detalle.concepto}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                {detalle.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} · {formatDate(detalle.fecha)}
              </p>
            </div>
          </div>

          <hr class="border-gray-100" />

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <p class="text-xs text-gray-500 font-medium">Tipo</p>
              {#if detalle.tipo === 'INGRESO'}
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 w-fit">
                  Ingreso
                </span>
              {:else}
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 w-fit">
                  Egreso
                </span>
              {/if}
            </div>

            <div class="flex flex-col gap-1">
              <p class="text-xs text-gray-500 font-medium">Monto (VES)</p>
              <p class="text-sm font-bold tabular-nums {detalle.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-red-700'}">
                {formatVES(detalle.monto)}
              </p>
            </div>

            {#if exchangeRate !== null}
              <div class="flex flex-col gap-1">
                <p class="text-xs text-gray-500 font-medium">Equivalente (USD)</p>
                <p class="text-sm font-medium tabular-nums">${(detalle.monto / exchangeRate).toFixed(2)}</p>
              </div>
              <div class="flex flex-col gap-1">
                <p class="text-xs text-gray-500 font-medium">Tasa BCV</p>
                <p class="text-sm font-medium tabular-nums">Bs. {exchangeRate.toFixed(2)} / USD</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
