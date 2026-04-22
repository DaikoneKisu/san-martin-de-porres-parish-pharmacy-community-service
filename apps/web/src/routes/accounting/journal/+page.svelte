<script lang="ts">
  import { DateTime } from 'luxon';
  import { Drawer } from 'vaul-svelte';
  import {
    ArrowLeft,
    Plus,
    Search,
    SlidersHorizontal,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Calendar,
    FileText,
    Stethoscope,
    Heart,
    Receipt,
    X
  } from 'lucide-svelte';

  // ── Types ──────────────────────────────────────────────────────────────────
  type TipoAsiento = 'ingreso' | 'egreso';
  type Origen = 'cita' | 'donacion' | 'recipe_externo' | 'manual';

  interface Asiento {
    id: string;
    fecha: string;
    tipo: TipoAsiento;
    concepto: string;
    origen: Origen;
    monto_ves: number;
    monto_usd?: number;
    tasa_dia?: number;
    referencia?: string;
  }

  type OrigenMeta = { label: string; color: string };

  // ── Mock data ──────────────────────────────────────────────────────────────
  const ASIENTOS: Asiento[] = [
    { id: 'a1', fecha: '2025-06-10', tipo: 'ingreso', concepto: 'Cita médica — Carlos Pérez', origen: 'cita', monto_ves: 50.00, referencia: 'CIT-001' },
    { id: 'a2', fecha: '2025-06-10', tipo: 'ingreso', concepto: 'Donación — Farmacéutica Roca C.A.', origen: 'donacion', monto_ves: 1240.00, monto_usd: 34.44, tasa_dia: 36.0, referencia: 'DON-008' },
    { id: 'a3', fecha: '2025-06-09', tipo: 'egreso', concepto: 'Compra de material de limpieza', origen: 'manual', monto_ves: 180.00 },
    { id: 'a4', fecha: '2025-06-09', tipo: 'ingreso', concepto: 'Récipe externo — María Rodríguez', origen: 'recipe_externo', monto_ves: 25.00, referencia: 'REC-014' },
    { id: 'a5', fecha: '2025-06-08', tipo: 'egreso', concepto: 'Pago de servicio eléctrico', origen: 'manual', monto_ves: 420.00, monto_usd: 11.67, tasa_dia: 36.0 },
    { id: 'a6', fecha: '2025-06-08', tipo: 'ingreso', concepto: 'Cita médica — José Blanco', origen: 'cita', monto_ves: 50.00, referencia: 'CIT-002' },
    { id: 'a7', fecha: '2025-06-07', tipo: 'egreso', concepto: 'Adquisición de guantes nitrilo', origen: 'manual', monto_ves: 288.00, monto_usd: 8.00, tasa_dia: 36.0 },
    { id: 'a8', fecha: '2025-06-07', tipo: 'ingreso', concepto: 'Donación — Comunidad San Martín', origen: 'donacion', monto_ves: 360.00, referencia: 'DON-007' },
    { id: 'a9', fecha: '2025-06-06', tipo: 'egreso', concepto: 'Mantenimiento de equipos', origen: 'manual', monto_ves: 540.00, monto_usd: 15.00, tasa_dia: 36.0 },
    { id: 'a10', fecha: '2025-06-06', tipo: 'ingreso', concepto: 'Cita médica — Ana Gómez', origen: 'cita', monto_ves: 50.00, referencia: 'CIT-003' },
  ];

  const ORIGEN_META: Record<Origen, OrigenMeta> = {
    cita:           { label: 'Cita',    color: 'text-blue-600 bg-blue-50 border-blue-200' },
    donacion:       { label: 'Donación', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    recipe_externo: { label: 'Récipe',  color: 'text-amber-700 bg-amber-50 border-amber-200' },
    manual:         { label: 'Manual',  color: 'text-slate-600 bg-slate-50 border-slate-200' },
  };

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
      if (!map[a.fecha]) map[a.fecha] = [];
      map[a.fecha].push(a);
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let search = $state('');
  let tipoFiltro = $state<'all' | TipoAsiento>('all');
  let origenFiltro = $state<'all' | Origen>('all');
  let filtroDrawerOpen = $state(false);
  let detalleDrawerOpen = $state(false);
  let detalle = $state<Asiento | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = $derived(
    ASIENTOS
      .filter(a => tipoFiltro === 'all' || a.tipo === tipoFiltro)
      .filter(a => origenFiltro === 'all' || a.origen === origenFiltro)
      .filter(a =>
        a.concepto.toLowerCase().includes(search.toLowerCase()) ||
        (a.referencia ?? '').toLowerCase().includes(search.toLowerCase())
      )
  );

  const grupos = $derived(groupByDate(filtered));

  const totalIngresos = $derived(
    filtered.filter(a => a.tipo === 'ingreso').reduce((s, a) => s + a.monto_ves, 0)
  );
  const totalEgresos = $derived(
    filtered.filter(a => a.tipo === 'egreso').reduce((s, a) => s + a.monto_ves, 0)
  );

  const hayFiltros = $derived(tipoFiltro !== 'all' || origenFiltro !== 'all');
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

    <!-- Filtros button -->
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

    <!-- Nuevo egreso -->
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
    <!-- Ingresos -->
    <div class="rounded-xl border bg-emerald-50 border-emerald-200 p-3 flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-emerald-700">
        <TrendingUp class="size-4 shrink-0" />
        <span class="text-xs font-medium">Ingresos</span>
      </div>
      <p class="text-emerald-800 font-semibold tabular-nums text-sm leading-tight">
        {formatVES(totalIngresos)}
      </p>
    </div>
    <!-- Egresos -->
    <div class="rounded-xl border bg-red-50 border-red-200 p-3 flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-red-700">
        <TrendingDown class="size-4 shrink-0" />
        <span class="text-xs font-medium">Egresos</span>
      </div>
      <p class="text-red-800 font-semibold tabular-nums text-sm leading-tight">
        {formatVES(totalEgresos)}
      </p>
    </div>
  </div>

  <!-- ── Search ─────────────────────────────────────────────────────────── -->
  <div class="px-4 pt-3 pb-2">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        placeholder="Buscar por concepto o referencia…"
        bind:value={search}
        class="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
      />
    </div>
  </div>

  <!-- ── List grouped by date ────────────────────────────────────────────── -->
  <div class="px-4 pb-24 flex flex-col gap-4">
    {#if grupos.length === 0}
      <!-- Empty state -->
      <div class="flex flex-col items-center gap-2 py-16 text-center">
        <div class="rounded-full bg-gray-100 p-4">
          <FileText class="size-6 text-gray-400" />
        </div>
        <p class="font-semibold text-sm text-gray-700">Sin asientos</p>
        <p class="text-xs text-gray-500">Ajusta los filtros para ver resultados.</p>
      </div>
    {:else}
      {#each grupos as [fecha, asientos] (fecha)}
        {@const dIngresos = asientos.filter(a => a.tipo === 'ingreso').reduce((s, a) => s + a.monto_ves, 0)}
        {@const dEgresos  = asientos.filter(a => a.tipo === 'egreso').reduce((s, a) => s + a.monto_ves, 0)}

        <div class="flex flex-col gap-2">
          <!-- Date header -->
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

          <!-- Asientos of this day -->
          {#each asientos as a (a.id)}
            <button
              onclick={() => { detalle = a; detalleDrawerOpen = true; }}
              class="rounded-xl border bg-white p-3.5 flex items-center gap-3 w-full text-left hover:bg-gray-50 transition-colors"
            >
              <!-- Origin icon -->
              <span class="rounded-full p-2 border shrink-0 {ORIGEN_META[a.origen].color}">
                {#if a.origen === 'cita'}
                  <Stethoscope class="size-4" />
                {:else if a.origen === 'donacion'}
                  <Heart class="size-4" />
                {:else if a.origen === 'recipe_externo'}
                  <Receipt class="size-4" />
                {:else}
                  <FileText class="size-4" />
                {/if}
              </span>

              <!-- Concept + meta -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium line-clamp-1">{a.concepto}</p>
                <p class="text-xs text-gray-400">
                  {ORIGEN_META[a.origen].label}
                  {#if a.referencia}
                    · {a.referencia}
                  {/if}
                </p>
              </div>

              <!-- Amount -->
              <div class="flex flex-col items-end shrink-0">
                <span class="text-sm font-semibold tabular-nums {a.tipo === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}">
                  {a.tipo === 'ingreso' ? '+' : '-'}{formatVES(a.monto_ves)}
                </span>
                {#if a.monto_usd !== undefined}
                  <span class="text-xs text-gray-400 tabular-nums">${a.monto_usd.toFixed(2)}</span>
                {/if}
              </div>

              <ChevronRight class="size-4 text-gray-400 shrink-0" />
            </button>
          {/each}
        </div>
      {/each}
    {/if}
  </div>
</div>

<!-- ── Filtros Drawer ──────────────────────────────────────────────────────── -->
<Drawer.Root bind:open={filtroDrawerOpen} onClose={() => { filtroDrawerOpen = false; }}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
    <Drawer.Content
      class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[85vh]"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-gray-200"></div>

      <!-- Header -->
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

      <!-- Body -->
      <div class="flex flex-col gap-5 px-4 py-5 overflow-y-auto">
        <!-- Tipo -->
        <div class="flex flex-col gap-1.5">
          <label for="filtro-tipo" class="text-sm font-medium text-gray-700">Tipo</label>
          <select
            id="filtro-tipo"
            bind:value={tipoFiltro}
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          >
            <option value="all">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>
        </div>

        <!-- Origen -->
        <div class="flex flex-col gap-1.5">
          <label for="filtro-origen" class="text-sm font-medium text-gray-700">Origen</label>
          <select
            id="filtro-origen"
            bind:value={origenFiltro}
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          >
            <option value="all">Todos</option>
            <option value="cita">Citas</option>
            <option value="donacion">Donaciones</option>
            <option value="recipe_externo">Récipes externos</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      <!-- Footer actions -->
      <div class="flex items-center justify-between px-4 py-4 border-t border-gray-100 gap-3">
        <button
          onclick={() => { tipoFiltro = 'all'; origenFiltro = 'all'; }}
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
    <Drawer.Content
      class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[85vh]"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-gray-200"></div>

      {#if detalle}
        <!-- Header -->
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

        <!-- Body -->
        <div class="flex flex-col gap-4 px-4 py-5 overflow-y-auto">
          <!-- Icon + concepto -->
          <div class="flex items-center gap-3">
            <span class="rounded-full p-2.5 border shrink-0 {ORIGEN_META[detalle.origen].color}">
              {#if detalle.origen === 'cita'}
                <Stethoscope class="size-5" />
              {:else if detalle.origen === 'donacion'}
                <Heart class="size-5" />
              {:else if detalle.origen === 'recipe_externo'}
                <Receipt class="size-5" />
              {:else}
                <FileText class="size-5" />
              {/if}
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm leading-snug">{detalle.concepto}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                {ORIGEN_META[detalle.origen].label} · {formatDate(detalle.fecha)}
              </p>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Detail grid -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Tipo -->
            <div class="flex flex-col gap-1">
              <p class="text-xs text-gray-500 font-medium">Tipo</p>
              {#if detalle.tipo === 'ingreso'}
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 w-fit">
                  Ingreso
                </span>
              {:else}
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 w-fit">
                  Egreso
                </span>
              {/if}
            </div>

            <!-- Referencia -->
            {#if detalle.referencia}
              <div class="flex flex-col gap-1">
                <p class="text-xs text-gray-500 font-medium">Referencia</p>
                <p class="text-sm font-medium">{detalle.referencia}</p>
              </div>
            {/if}

            <!-- Monto VES -->
            <div class="flex flex-col gap-1">
              <p class="text-xs text-gray-500 font-medium">Monto (VES)</p>
              <p class="text-sm font-bold tabular-nums {detalle.tipo === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}">
                {formatVES(detalle.monto_ves)}
              </p>
            </div>

            <!-- Monto USD -->
            {#if detalle.monto_usd !== undefined}
              <div class="flex flex-col gap-1">
                <p class="text-xs text-gray-500 font-medium">Monto (USD)</p>
                <p class="text-sm font-medium tabular-nums">${detalle.monto_usd.toFixed(2)}</p>
              </div>
            {/if}

            <!-- Tasa BCV -->
            {#if detalle.tasa_dia !== undefined}
              <div class="flex flex-col gap-1 col-span-2">
                <p class="text-xs text-gray-500 font-medium">Tasa BCV</p>
                <p class="text-sm font-medium tabular-nums">Bs. {detalle.tasa_dia.toFixed(2)} / USD</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
