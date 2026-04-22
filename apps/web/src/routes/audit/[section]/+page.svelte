<script lang="ts">
  import { page } from '$app/state';
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/api';
  import { ArrowLeft, User2, CalendarDays, Clock, FileText, ChevronRight, X, ChevronLeft } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';

  // ── Types ──────────────────────────────────────────────────────────────
  type Accion = 'registro' | 'edicion' | 'edicion_resultado' | 'cancelacion' | 'dispensacion' | 'desactivacion' | 'activacion' | 'acceso';

  interface RegistroAuditoria {
    id: string;
    fecha: string;
    accion: Accion;
    entidad: string;
    actor: string | null;
    datosAnteriores: Record<string, unknown> | null;
    datosNuevos: Record<string, unknown> | null;
    tipoConsulta?: string;
    parametros?: Record<string, unknown> | null;
  }

  type TipoAuditoria = 'pacientes' | 'antecedentes' | 'citas' | 'insumos' | 'donantes' | 'donaciones' | 'asientos' | 'recipes-externos' | 'accesos-contables';

  // ── Section → tipo mapping ─────────────────────────────────────────────
  const SECTION_MAP: Record<string, TipoAuditoria> = {
    'patients':          'pacientes',
    'antecedents':       'antecedentes',
    'appointments':      'citas',
    'supplies':          'insumos',
    'donors':            'donantes',
    'donations':         'donaciones',
    'journal-entries':   'asientos',
    'external-recipes':  'recipes-externos',
    'accounting-access': 'accesos-contables',
  };

  // ── Config per tipo ────────────────────────────────────────────────────
  type SectionConfig = {
    titulo: string;
    acciones: Accion[];
    soloRegistro?: boolean;
    esAcceso?: boolean;
  };

  const CONFIG: Record<TipoAuditoria, SectionConfig> = {
    'pacientes':          { titulo: 'Auditoría de pacientes',          acciones: ['registro', 'edicion'] },
    'antecedentes':       { titulo: 'Auditoría de antecedentes',       acciones: ['registro', 'edicion'] },
    'citas':              { titulo: 'Auditoría de citas',              acciones: ['registro', 'edicion_resultado', 'cancelacion'] },
    'insumos':            { titulo: 'Auditoría de insumos',            acciones: ['registro', 'edicion', 'dispensacion'] },
    'donantes':           { titulo: 'Auditoría de donantes',           acciones: ['registro', 'edicion'] },
    'donaciones':         { titulo: 'Auditoría de donaciones',         acciones: ['registro', 'edicion'] },
    'asientos':           { titulo: 'Auditoría de asientos contables', acciones: ['registro'], soloRegistro: true },
    'recipes-externos':   { titulo: 'Auditoría de récipes externos',   acciones: ['registro'], soloRegistro: true },
    'accesos-contables':  { titulo: 'Accesos a consultas contables',   acciones: ['acceso'], esAcceso: true },
  };

  // ── Accion labels/colors ───────────────────────────────────────────────
  const ACCION_META: Record<Accion, { label: string; cls: string }> = {
    registro:          { label: 'Registro',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    edicion:           { label: 'Edición',        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    edicion_resultado: { label: 'Resultado cita', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    cancelacion:       { label: 'Cancelación',    cls: 'bg-red-50 text-red-700 border-red-200' },
    dispensacion:      { label: 'Dispensación',   cls: 'bg-[#2D6A4F]/5 text-[#2D6A4F] border-[#2D6A4F]/30' },
    desactivacion:     { label: 'Desactivación',  cls: 'bg-red-50 text-red-700 border-red-200' },
    activacion:        { label: 'Activación',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    acceso:            { label: 'Acceso',          cls: 'bg-slate-50 text-slate-700 border-slate-200' },
  };

  // ── API endpoint map ───────────────────────────────────────────────────
  const PAGE_SIZE = 20;

  function fetchAudit(section: string, queryParams: Record<string, unknown>) {
    switch (section) {
      case 'patients':          return api.api.audit.patients.get({ query: queryParams });
      case 'antecedents':       return api.api.audit.antecedents.get({ query: queryParams });
      case 'appointments':      return api.api.audit.appointments.get({ query: queryParams });
      case 'supplies':          return api.api.audit.supplies.get({ query: queryParams });
      case 'donors':            return api.api.audit.donors.get({ query: queryParams });
      case 'donations':         return api.api.audit.donations.get({ query: queryParams });
      case 'journal-entries':   return api.api.audit['accounting-entries'].get({ query: queryParams });
      case 'external-recipes':  return api.api.audit['external-recipes'].get({ query: queryParams });
      case 'accounting-access': return api.api.audit['accounting-access'].get({ query: queryParams });
      default:                  return api.api.audit.patients.get({ query: queryParams });
    }
  }

  // ── Entity label helpers ───────────────────────────────────────────────
  function getEntidadLabel(sec: string, item: any): string {
    switch (sec) {
      case 'patients':          return item.paciente ? `${item.paciente.nombre} (${item.paciente.cedula})` : '—';
      case 'antecedents':       return item.antecedente ? item.antecedente.descripcion.substring(0, 60) : '—';
      case 'appointments':      return item.cita ? `Cita · ${item.cita.paciente?.nombre ?? ''}` : '—';
      case 'supplies':          return item.insumo ? `${item.insumo.tipo} · Lote ${item.insumo.numeroLote}` : '—';
      case 'donors':            return item.donante ? item.donante.nombre : '—';
      case 'donations':         return item.donacion ? `Donación · ${item.donacion.donante?.nombre ?? ''}` : '—';
      case 'journal-entries':   return item.asiento ? item.asiento.concepto : '—';
      case 'external-recipes':  return item.recipe ? `Récipe externo #${item.recipe.id.substring(0, 8)}` : '—';
      case 'accounting-access': return item.tipoConsulta ?? '—';
      default:                  return '—';
    }
  }

  function getActorLabel(item: any): string {
    const actor = item.actor ?? item.personal ?? null;
    return actor ? actor.nombre : 'Sistema';
  }

  function mapItem(sec: string, item: any): RegistroAuditoria {
    const accion = (item.accion ?? item.tipoConsulta ?? 'acceso') as Accion;
    const entidad = getEntidadLabel(sec, item);
    const actor = getActorLabel(item);

    let datosAnteriores: Record<string, unknown> | null = null;
    let datosNuevos: Record<string, unknown> | null = null;
    let parametros: Record<string, unknown> | null = null;

    try {
      datosAnteriores = item.datosAnteriores ? JSON.parse(item.datosAnteriores) : null;
    } catch {
      datosAnteriores = item.datosAnteriores ?? null;
    }
    try {
      datosNuevos = item.datosNuevos ? JSON.parse(item.datosNuevos) : null;
    } catch {
      datosNuevos = item.datosNuevos ?? null;
    }
    try {
      parametros = item.parametros ? JSON.parse(item.parametros) : null;
    } catch {
      parametros = item.parametros ?? null;
    }

    return {
      id: item.id,
      fecha: item.auditoria?.fecha ?? new Date().toISOString(),
      accion,
      entidad,
      actor,
      datosAnteriores,
      datosNuevos,
      tipoConsulta: item.tipoConsulta ?? undefined,
      parametros,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function formatHora(iso: string) {
    return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Reactive state ─────────────────────────────────────────────────────
  const section = $derived(page.params.section ?? '');
  const tipo = $derived((SECTION_MAP[section] ?? 'pacientes') as TipoAuditoria);
  const cfg = $derived(CONFIG[tipo]);

  // Track which section the current page number belongs to; reset to 1 when section changes
  let _pageSection = $state('');
  let _currentPage = $state(1);
  const currentPage = $derived.by(() => {
    if (_pageSection !== section) {
      _pageSection = section;
      _currentPage = 1;
    }
    return _currentPage;
  });

  let accionFiltro = $state('all');
  let detalle = $state<RegistroAuditoria | null>(null);
  let detalleDrawerOpen = $state(false);

  // ── Query ──────────────────────────────────────────────────────────────
  const auditQuery = $derived(
    createQuery({
      queryKey: ['audit', section, currentPage, accionFiltro] as const,
      queryFn: async () => {
        const params: Record<string, unknown> = {
          page: currentPage,
          pageSize: PAGE_SIZE,
        };
        if (accionFiltro !== 'all') {
          params.accion = accionFiltro;
        }
        const res = await fetchAudit(section, params);
        if (res.error) throw res.error;
        return res.data as { total: number; page: number; pageSize: number; items: any[] };
      },
      enabled: !!section,
    })
  );

  // ── Derived display data ───────────────────────────────────────────────
  const registros = $derived(
    ($auditQuery.data?.items ?? []).map((item: any) => mapItem(section, item))
  );

  const totalItems = $derived($auditQuery.data?.total ?? 0);
  const totalPages = $derived(Math.max(1, Math.ceil(totalItems / PAGE_SIZE)));
  const rangeStart = $derived(totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1);
  const rangeEnd = $derived(Math.min(currentPage * PAGE_SIZE, totalItems));

  function abrirDetalle(r: RegistroAuditoria) {
    detalle = r;
    detalleDrawerOpen = true;
  }
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <header class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
    <a href="/audit" class="flex items-center justify-center rounded-md p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors -ml-1">
      <ArrowLeft class="h-4 w-4" />
    </a>
    <h1 class="flex-1 text-base font-semibold text-gray-900 leading-tight">{cfg.titulo}</h1>
  </header>

  <main class="flex-1 px-4 pt-3 pb-8 max-w-2xl mx-auto w-full flex flex-col gap-3">
    <!-- Action chips -->
    <div class="flex gap-2 flex-wrap">
      <button
        type="button"
        onclick={() => { accionFiltro = 'all'; _currentPage = 1; }}
        class={[
          'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
          accionFiltro === 'all' ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
        ].join(' ')}
      >
        Todas
      </button>
      {#each cfg.acciones as accion (accion)}
        <button
          type="button"
          onclick={() => { accionFiltro = accionFiltro === accion ? 'all' : accion; _currentPage = 1; }}
          class={[
            'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
            accionFiltro === accion ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          {ACCION_META[accion].label}
        </button>
      {/each}
    </div>

    <!-- Error state -->
    {#if $auditQuery.isError}
      <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Error al cargar los registros de auditoría. Intenta de nuevo.
      </div>
    {/if}

    <!-- Loading skeletons -->
    {#if $auditQuery.isPending}
      <ul class="flex flex-col gap-2">
        {#each { length: 5 } as _, i (i)}
          <li class="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-3 animate-pulse">
            <div class="flex-1 flex flex-col gap-2">
              <div class="h-4 w-2/3 rounded bg-gray-200"></div>
              <div class="h-3 w-1/3 rounded bg-gray-100"></div>
              <div class="flex gap-2 mt-1">
                <div class="h-5 w-16 rounded-full bg-gray-200"></div>
                <div class="h-5 w-24 rounded bg-gray-100"></div>
              </div>
            </div>
          </li>
        {/each}
      </ul>

    <!-- Empty state -->
    {:else if registros.length === 0}
      <div class="flex flex-col items-center justify-center py-16 gap-2 text-center">
        <FileText class="h-10 w-10 text-gray-300" />
        <p class="text-sm text-gray-500">Sin registros</p>
        <p class="text-xs text-gray-400">No hay entradas para el filtro seleccionado.</p>
      </div>

    <!-- List -->
    {:else}
      <!-- Counter -->
      <p class="text-xs text-gray-500">{totalItems} registro{totalItems !== 1 ? 's' : ''}</p>

      <ul class="flex flex-col gap-2">
        {#each registros as r (r.id)}
          <li>
            <button
              type="button"
              onclick={() => abrirDetalle(r)}
              class="w-full rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex flex-col gap-0.5 min-w-0">
                    {#if cfg.esAcceso}
                      <p class="font-medium text-sm text-gray-900 capitalize">
                        {r.tipoConsulta?.replace('_', ' ')}
                      </p>
                    {:else}
                      <p class="font-medium text-sm text-gray-900 leading-tight line-clamp-1">{r.entidad}</p>
                    {/if}
                    <div class="flex items-center gap-1 text-xs text-gray-500">
                      <User2 class="h-3 w-3 shrink-0" />
                      <span>{r.actor ?? 'Sistema'}</span>
                    </div>
                  </div>
                  <ChevronRight class="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                </div>
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span class={['text-xs px-2 py-0.5 rounded-full border font-medium', ACCION_META[r.accion]?.cls ?? 'bg-gray-50 text-gray-700 border-gray-200'].join(' ')}>
                    {ACCION_META[r.accion]?.label ?? r.accion}
                  </span>
                  <span class="text-xs text-gray-500 flex items-center gap-1">
                    <CalendarDays class="h-3 w-3" />
                    {formatFecha(r.fecha)}
                  </span>
                  <span class="text-xs text-gray-500 flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    {formatHora(r.fecha)}
                  </span>
                </div>
              </div>
            </button>
          </li>
        {/each}
      </ul>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-between pt-1 text-xs text-gray-500">
          <span>Mostrando {rangeStart}–{rangeEnd} de {totalItems}</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick={() => { _currentPage = Math.max(1, currentPage - 1); }}
              disabled={currentPage <= 1}
              class="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft class="h-3 w-3" />
              Anterior
            </button>
            <button
              type="button"
              onclick={() => { _currentPage = Math.min(totalPages, currentPage + 1); }}
              disabled={currentPage >= totalPages}
              class="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight class="h-3 w-3" />
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </main>
</div>

<!-- Drawer: Detalle del registro -->
<Drawer.Root bind:open={detalleDrawerOpen} onClose={() => { detalle = null; }}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[85vh] outline-none">
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-gray-300"></div>

      {#if detalle}
        <div class="px-4 pb-1 pt-2 flex items-start justify-between shrink-0">
          <div>
            <Drawer.Title class="text-base font-semibold text-gray-900">
              {cfg.esAcceso
                ? `Acceso: ${detalle.tipoConsulta?.replace('_', ' ')}`
                : detalle.entidad}
            </Drawer.Title>
            <div class="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <User2 class="h-3.5 w-3.5" />
                {detalle.actor ?? 'Sistema'}
              </span>
              <span class="flex items-center gap-1">
                <CalendarDays class="h-3.5 w-3.5" />
                {formatFecha(detalle.fecha)} · {formatHora(detalle.fecha)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onclick={() => { detalleDrawerOpen = false; }}
            class="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            aria-label="Cerrar"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pt-3 pb-8 flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-900">Acción:</p>
            <span class={['text-xs px-2 py-0.5 rounded-full border font-medium', ACCION_META[detalle.accion]?.cls ?? 'bg-gray-50 text-gray-700 border-gray-200'].join(' ')}>
              {ACCION_META[detalle.accion]?.label ?? detalle.accion}
            </span>
          </div>

          <hr class="border-gray-100" />

          {#if cfg.esAcceso && detalle.parametros}
            <div class="flex flex-col gap-1.5">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parámetros de consulta</p>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 overflow-x-auto">
                <pre class="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap break-all">{JSON.stringify(detalle.parametros, null, 2)}</pre>
              </div>
            </div>
          {/if}

          {#if cfg.soloRegistro && detalle.datosNuevos}
            <div class="flex flex-col gap-1.5">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos registrados</p>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 overflow-x-auto">
                <pre class="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap break-all">{JSON.stringify(detalle.datosNuevos, null, 2)}</pre>
              </div>
            </div>
          {/if}

          {#if !cfg.esAcceso && !cfg.soloRegistro}
            {#if detalle.datosAnteriores}
              <div class="flex flex-col gap-1.5">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Antes</p>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 overflow-x-auto">
                  <pre class="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap break-all">{JSON.stringify(detalle.datosAnteriores, null, 2)}</pre>
                </div>
              </div>
            {/if}
            {#if detalle.datosNuevos}
              <div class="flex flex-col gap-1.5">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{detalle.datosAnteriores ? 'Después' : 'Datos registrados'}</p>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 overflow-x-auto">
                  <pre class="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap break-all">{JSON.stringify(detalle.datosNuevos, null, 2)}</pre>
                </div>
              </div>
            {/if}
            {#if !detalle.datosAnteriores && !detalle.datosNuevos}
              <p class="text-sm text-gray-500">Sin datos de cambio registrados.</p>
            {/if}
          {/if}
        </div>
      {/if}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
