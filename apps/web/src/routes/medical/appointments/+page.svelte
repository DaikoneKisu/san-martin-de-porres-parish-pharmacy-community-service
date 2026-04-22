<script lang="ts">
  import { DateTime } from 'luxon';
  import { createQuery } from '@tanstack/svelte-query';
  import {
    Plus,
    Search,
    ChevronRight,
    Stethoscope,
    SlidersHorizontal,
    CalendarDays,
    X,
    AlertCircle
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';
  import { api } from '$lib/api';

  type Appointment = {
    id: string;
    fechaHora: string;
    motivo: string;
    estado: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
    precioConsulta: number;
    adjuntos: string[];
    paciente: {
      id: string;
      nombre: string;
      cedula: string;
    };
    personal: {
      id: string;
      nombre: string;
      cedula: string;
    };
    recipe: null | { id: string; indicaciones: string };
  };

  const appointmentsQuery = createQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await api.api.medical.appointments.get();
      if (res.error) throw new Error('Error al cargar las citas');
      return (res.data ?? []) as Appointment[];
    }
  });

  let search = $state('');
  let estadoFiltro = $state<'all' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA'>('all');
  let medicoFiltro = $state('all');
  let filtrosDrawerOpen = $state(false);

  let medicoFiltroTemp = $state('all');
  let estadoFiltroTemp = $state<'all' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA'>('all');

  const medicoOptions = $derived.by(() => {
    const data = $appointmentsQuery.data ?? [];
    const names = data.map((c) => c.personal.nombre);
    return [...new Set(names)];
  });

  const filtered = $derived.by(() => {
    const data = $appointmentsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    return data
      .filter((c) => {
        if (estadoFiltro !== 'all' && c.estado !== estadoFiltro) return false;
        if (medicoFiltro !== 'all' && c.personal.nombre !== medicoFiltro) return false;
        if (q) {
          const hay = `${c.paciente.nombre} ${c.paciente.cedula} ${c.motivo}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
  });

  function formatFecha(fechaHora: string): string {
    return DateTime.fromISO(fechaHora).setLocale('es').toFormat("d 'de' LLLL");
  }

  function formatHora(fechaHora: string): string {
    return DateTime.fromISO(fechaHora).toFormat('HH:mm');
  }

  function estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      COMPLETADA: 'Completada',
      CANCELADA: 'Cancelada'
    };
    return labels[estado] ?? estado.toLowerCase();
  }

  type EstadoBadgeClasses = {
    COMPLETADA: string;
    PENDIENTE: string;
    CANCELADA: string;
    [key: string]: string;
  };

  const estadoBadgeClasses: EstadoBadgeClasses = {
    COMPLETADA: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    PENDIENTE: 'bg-blue-50 text-blue-700 border border-blue-200',
    CANCELADA: 'bg-gray-100 text-gray-500 border border-gray-300'
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
      {#each ([['all', 'Todas'], ['PENDIENTE', 'Pendiente'], ['COMPLETADA', 'Completada'], ['CANCELADA', 'Cancelada']] as const) as [val, label] (val)}
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

    <!-- Loading skeletons -->
    {#if $appointmentsQuery.isPending}
      <div class="flex flex-col gap-3">
        {#each [1, 2, 3] as i (i)}
          <div class="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <div class="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-200"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-2/3 animate-pulse rounded bg-gray-200"></div>
              <div class="h-3 w-1/2 animate-pulse rounded bg-gray-100"></div>
              <div class="h-3 w-1/3 animate-pulse rounded bg-gray-100"></div>
            </div>
          </div>
        {/each}
      </div>

    <!-- Error state -->
    {:else if $appointmentsQuery.isError}
      <div class="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle class="h-10 w-10 text-red-400" />
        <p class="font-medium text-red-700">Error al cargar las citas</p>
        <p class="text-sm text-red-500">Intenta recargar la página.</p>
      </div>

    {:else}
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
              <p class="truncate font-medium text-gray-900">{c.paciente.nombre}</p>
              <p class="truncate text-xs text-gray-500">{c.motivo}</p>
              <div class="mt-1.5 flex flex-wrap items-center gap-2">
                <span class={['rounded-full px-2 py-0.5 text-xs font-medium', estadoBadgeClasses[c.estado] ?? '']}>
                  {estadoLabel(c.estado)}
                </span>
                <span class="text-xs text-gray-400">{formatFecha(c.fechaHora)} · {formatHora(c.fechaHora)}</span>
                <span class="text-xs text-gray-400">{c.personal.nombre}</span>
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
    {/if}
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
          {#each medicoOptions as m (m)}
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
