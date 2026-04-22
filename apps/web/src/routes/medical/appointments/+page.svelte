<script lang="ts">
  import { DateTime } from 'luxon';
  import {
    Plus,
    Search,
    ChevronRight,
    Stethoscope,
    SlidersHorizontal,
    CalendarDays,
    X
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';

  const CITAS = [
    { id: 'c1', paciente: 'Ana Sofía Ramírez', cedula: 'V-12.345.678', medico: 'Dra. García', fecha: '2025-06-01', hora: '09:00', estado: 'pendiente', motivo: 'Control de presión arterial' },
    { id: 'c2', paciente: 'Carlos Medina', cedula: 'V-9.876.543', medico: 'Dr. Rodríguez', fecha: '2025-05-28', hora: '10:30', estado: 'completada', motivo: 'Revisión general' },
    { id: 'c3', paciente: 'María González', cedula: 'V-15.432.100', medico: 'Dra. García', fecha: '2025-05-25', hora: '08:00', estado: 'completada', motivo: 'Dolor de cabeza persistente' },
    { id: 'c4', paciente: 'José Luis Hernández', cedula: 'V-8.001.234', medico: 'Dr. Pérez', fecha: '2025-06-05', hora: '11:00', estado: 'pendiente', motivo: 'Seguimiento tratamiento diabetes' },
    { id: 'c5', paciente: 'Luisa Martínez', cedula: 'V-22.678.901', medico: 'Dra. García', fecha: '2025-05-20', hora: '14:00', estado: 'cancelada', motivo: 'Control rutinario' },
    { id: 'c6', paciente: 'Pedro Castillo', cedula: 'V-11.223.344', medico: 'Dr. Rodríguez', fecha: '2025-06-10', hora: '09:30', estado: 'pendiente', motivo: 'Dolor articular' }
  ];

  const MEDICOS = ['Dra. García', 'Dr. Rodríguez', 'Dr. Pérez'];

  let search = $state('');
  let estadoFiltro = $state<'all' | 'pendiente' | 'completada' | 'cancelada'>('all');
  let medicoFiltro = $state('all');
  let filtrosDrawerOpen = $state(false);

  // Temporary drawer state to allow applying/canceling
  let medicoFiltroTemp = $state('all');
  let estadoFiltroTemp = $state<'all' | 'pendiente' | 'completada' | 'cancelada'>('all');

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return CITAS
      .filter((c) => {
        if (estadoFiltro !== 'all' && c.estado !== estadoFiltro) return false;
        if (medicoFiltro !== 'all' && c.medico !== medicoFiltro) return false;
        if (q) {
          const hay = `${c.paciente} ${c.cedula} ${c.motivo}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dtA = `${a.fecha}T${a.hora}`;
        const dtB = `${b.fecha}T${b.hora}`;
        return dtB.localeCompare(dtA);
      });
  });

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat('EEE dd MMM');
  }

  type EstadoBadgeClasses = {
    completada: string;
    pendiente: string;
    cancelada: string;
    [key: string]: string;
  };

  const estadoBadgeClasses: EstadoBadgeClasses = {
    completada: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    pendiente: 'bg-blue-50 text-blue-700 border border-blue-200',
    cancelada: 'bg-gray-100 text-gray-500 border border-gray-300'
  };

  function openFiltrosDrawer() {
    medicoFiltroTemp = medicoFiltro;
    estadoFiltroTemp = estadoFiltro;
    filtrosDrawerOpen = true;
  }

  function applyFiltros() {
    medicoFiltro = medicoFiltroTemp;
    estadoFiltro = estadoFiltroTemp;
    filtrosDrawerOpen = false;
  }

  function limpiarFiltros() {
    medicoFiltroTemp = 'all';
    estadoFiltroTemp = 'all';
    medicoFiltro = 'all';
    estadoFiltro = 'all';
    filtrosDrawerOpen = false;
  }
</script>

<div class="flex min-h-screen flex-col bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
    <h1 class="text-lg font-semibold text-gray-900">Citas</h1>
    <a
      href="/medical/appointments/new"
      class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
      style="background-color: #2D6A4F;"
    >
      <Plus class="h-4 w-4" />
      Nueva
    </a>
  </header>

  <div class="mx-auto w-full max-w-2xl px-4 py-4">
    <!-- Search bar -->
    <div class="relative mb-3">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar por nombre, cédula o motivo..."
        bind:value={search}
        class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
      />
      {#if search}
        <button
          onclick={() => (search = '')}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Limpiar búsqueda"
        >
          <X class="h-4 w-4" />
        </button>
      {/if}
    </div>

    <!-- Filter chips row -->
    <div class="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
      <!-- Filtros button -->
      <button
        onclick={openFiltrosDrawer}
        class="relative flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
      >
        <SlidersHorizontal class="h-4 w-4" />
        Filtros
        {#if medicoFiltro !== 'all'}
          <span class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#2D6A4F]"></span>
        {/if}
      </button>

      <!-- Estado chips -->
      {#each ([['all', 'Todas'], ['pendiente', 'Pendiente'], ['completada', 'Completada'], ['cancelada', 'Cancelada']] as const) as [val, label] (val)}
        <button
          onclick={() => (estadoFiltro = val)}
          class={[
            'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            estadoFiltro === val
              ? 'border-[#2D6A4F] bg-[#2D6A4F] text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          ]}
        >
          {label}
        </button>
      {/each}
    </div>

    <!-- Count -->
    <p class="mb-3 text-xs text-gray-500">{filtered.length} cita(s)</p>

    <!-- Card list -->
    <div class="flex flex-col gap-3">
      {#each filtered as c (c.id)}
        <a
          href="/medical/appointments/{c.id}"
          class="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <!-- Left icon -->
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2D6A4F]/10">
            <Stethoscope class="h-5 w-5 text-[#2D6A4F]" />
          </span>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-gray-900">{c.paciente}</p>
            <p class="truncate text-xs text-gray-500">{c.motivo}</p>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <span class={['rounded-full px-2 py-0.5 text-xs font-medium', estadoBadgeClasses[c.estado]]}>
                {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
              </span>
              <span class="text-xs text-gray-400">{formatFecha(c.fecha)} · {c.hora}</span>
              <span class="text-xs text-gray-400">{c.medico}</span>
            </div>
          </div>

          <ChevronRight class="h-5 w-5 shrink-0 text-gray-400" />
        </a>
      {:else}
        <!-- Empty state -->
        <div class="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarDays class="h-12 w-12 text-gray-300" />
          <p class="font-medium text-gray-600">Sin resultados</p>
          <p class="text-sm text-gray-400">Ajusta los filtros o la búsqueda.</p>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Filtros Drawer -->
<Drawer.Root bind:open={filtrosDrawerOpen} onClose={() => (filtrosDrawerOpen = false)}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />
    <Drawer.Content
      class="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white px-4 pb-8 pt-3"
    >
      <!-- Drag handle -->
      <div class="mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full bg-gray-300"></div>

      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900">Filtros</h2>
        <button
          onclick={() => (filtrosDrawerOpen = false)}
          class="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Médico filter -->
      <div class="mb-6">
        <label for="medico-select" class="mb-1.5 block text-sm font-medium text-gray-700">
          Médico
        </label>
        <select
          id="medico-select"
          bind:value={medicoFiltroTemp}
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
        >
          <option value="all">Todos</option>
          {#each MEDICOS as m (m)}
            <option value={m}>{m}</option>
          {/each}
        </select>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          onclick={limpiarFiltros}
          class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Limpiar
        </button>
        <button
          onclick={applyFiltros}
          class="flex-1 rounded-lg py-2.5 text-sm font-medium text-white"
          style="background-color: #2D6A4F;"
        >
          Aplicar
        </button>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
