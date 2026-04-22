<script lang="ts">
  import { page } from '$app/state';
  import { ArrowLeft, Search, User2, CalendarDays, Clock, FileText, ChevronRight, X } from 'lucide-svelte';
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

  // ── Mock data generator ────────────────────────────────────────────────
  function generarMock(tipo: TipoAuditoria): RegistroAuditoria[] {
    const cfg = CONFIG[tipo];
    const actores = ['Dr. Carlos Rodríguez', 'Lcda. María González', 'Admin Principal', null];
    const entidadesMap: Record<TipoAuditoria, string[]> = {
      'pacientes':          ['Juan Pérez (C-18.345.210)', 'Ana Martínez (C-22.100.456)', 'Pedro López (C-15.876.321)'],
      'antecedentes':       ['Hipertensión — Juan Pérez', 'Diabetes T2 — Ana Martínez', 'Asma — Pedro López'],
      'citas':              ['Cita #C-0045 · Dr. Rodríguez', 'Cita #C-0046 · Dr. Flores', 'Cita #C-0047 · Dr. Rodríguez'],
      'insumos':            ['Amoxicilina 500mg (LT-2024-001)', 'Ibuprofeno 400mg (LT-2024-002)', 'Guantes nitrilo M'],
      'donantes':           ['Farmacia Central C.A.', 'Cruz Roja Venezolana', 'Familia Pérez Hernández'],
      'donaciones':         ['DON-2025-0012 · Farmacia Central', 'DON-2025-0013 · Cruz Roja', 'DON-2025-0014 · Familia Pérez'],
      'asientos':           ['ASI-2025-0041 · Ingreso cita #C-0045', 'ASI-2025-0042 · Egreso insumos', 'ASI-2025-0043 · Donación'],
      'recipes-externos':   ['REC-EXT-0021 · Juan Pérez', 'REC-EXT-0022 · Ana Martínez', 'REC-EXT-0023 · Pedro López'],
      'accesos-contables':  ['libro_diario', 'estado_resultados', 'libro_diario'],
    };

    const lista = entidadesMap[tipo];
    const rows: RegistroAuditoria[] = [];
    const now = Date.now();

    for (let i = 0; i < 18; i++) {
      const accion = cfg.acciones[i % cfg.acciones.length];
      const esEdicion = accion === 'edicion' || accion === 'edicion_resultado';
      const entidad = lista[i % lista.length];
      const actor = actores[i % actores.length];
      const msAtras = i * 4_800_000 + (i * 1_234_567 % 3_600_000);

      rows.push({
        id: `aud-${tipo}-${i + 1}`,
        fecha: new Date(now - msAtras).toISOString(),
        accion,
        entidad: cfg.esAcceso ? '' : entidad,
        actor,
        tipoConsulta: cfg.esAcceso ? entidad : undefined,
        parametros: cfg.esAcceso ? { desde: '2025-01-01', hasta: '2025-06-30' } : null,
        datosAnteriores: esEdicion && !cfg.soloRegistro ? { nombre: 'Valor anterior', stock: 45, estado: 'activo' } : null,
        datosNuevos: cfg.esAcceso ? null : { nombre: 'Valor nuevo', stock: 40, estado: 'activo' },
      });
    }
    return rows;
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
  const registros = $derived(generarMock(tipo));

  let search = $state('');
  let accionFiltro = $state('all');
  let detalle = $state<RegistroAuditoria | null>(null);
  let detalleDrawerOpen = $state(false);

  const filtered = $derived(
    registros.filter(r => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        r.entidad.toLowerCase().includes(q) ||
        (r.actor ?? 'sistema').toLowerCase().includes(q) ||
        (r.tipoConsulta ?? '').toLowerCase().includes(q);
      const matchAccion = accionFiltro === 'all' || r.accion === accionFiltro;
      return matchSearch && matchAccion;
    })
  );

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
    <!-- Search -->
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        placeholder={cfg.esAcceso ? 'Buscar por tipo de consulta o actor...' : 'Buscar por entidad o actor...'}
        bind:value={search}
        class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
      />
    </div>

    <!-- Action chips -->
    <div class="flex gap-2 flex-wrap">
      <button
        type="button"
        onclick={() => { accionFiltro = 'all'; }}
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
          onclick={() => { accionFiltro = accionFiltro === accion ? 'all' : accion; }}
          class={[
            'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
            accionFiltro === accion ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          {ACCION_META[accion].label}
        </button>
      {/each}
    </div>

    <!-- Counter -->
    <p class="text-xs text-gray-500">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>

    <!-- List -->
    {#if filtered.length === 0}
      <div class="flex flex-col items-center justify-center py-16 gap-2 text-center">
        <FileText class="h-10 w-10 text-gray-300" />
        <p class="text-sm text-gray-500">Sin registros</p>
        <p class="text-xs text-gray-400">Ajusta el término de búsqueda o los filtros.</p>
      </div>
    {:else}
      <ul class="flex flex-col gap-2">
        {#each filtered as r (r.id)}
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
                  <span class={['text-xs px-2 py-0.5 rounded-full border font-medium', ACCION_META[r.accion].cls].join(' ')}>
                    {ACCION_META[r.accion].label}
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
            <span class={['text-xs px-2 py-0.5 rounded-full border font-medium', ACCION_META[detalle.accion].cls].join(' ')}>
              {ACCION_META[detalle.accion].label}
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
