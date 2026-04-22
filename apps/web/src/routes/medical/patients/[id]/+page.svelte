<script lang="ts">
  import { page } from '$app/state';
  import { createQuery } from '@tanstack/svelte-query';
  import { DateTime } from 'luxon';
  import {
    ArrowLeft,
    Pencil,
    Phone,
    MapPin,
    Calendar,
    HeartPulse,
    Stethoscope,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Plus,
    AlertCircle,
  } from 'lucide-svelte';
  import { api } from '$lib/api';

  const ESTADO_BADGE: Record<string, string> = {
    COMPLETADA: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    PENDIENTE: 'bg-blue-50 text-blue-700 border-blue-200',
    CANCELADA: 'bg-gray-100 text-gray-500 border-gray-300',
  };

  const ESTADO_LABEL: Record<string, string> = {
    COMPLETADA: 'Completada',
    PENDIENTE: 'Pendiente',
    CANCELADA: 'Cancelada',
  };

  function calcEdad(fechaNac: string): number {
    return Math.abs(Math.floor(DateTime.fromISO(fechaNac).diffNow('years').years));
  }

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("dd 'de' LLLL yyyy");
  }

  function formatFechaHora(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("dd 'de' LLLL yyyy, hh:mm a");
  }

  function getIniciales(nombre: string): string {
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  let antecedentesOpen = $state(true);
  let citasOpen = $state(false);

  const patientQuery = createQuery({
    get queryKey() { return ['patient', page.params.id ?? '']; },
    queryFn: async () => {
      const id: string = page.params.id ?? '';
      const res = await api.api.medical.patients({ id }).get();
      if (res.error) throw new Error((res.error as any)?.message ?? 'Error al cargar paciente');
      return res.data;
    },
    get enabled() { return !!page.params.id; },
  });

  const antecedentsQuery = createQuery({
    get queryKey() { return ['antecedents', page.params.id ?? '']; },
    queryFn: async () => {
      const id: string = page.params.id ?? '';
      const res = await api.api.medical.patients({ id }).antecedents.get();
      if (res.error) throw new Error((res.error as any)?.message ?? 'Error al cargar antecedentes');
      return res.data ?? [];
    },
    get enabled() { return !!page.params.id; },
  });

  const appointmentsQuery = createQuery({
    get queryKey() { return ['patient-appointments', page.params.id ?? '']; },
    queryFn: async () => {
      const patientId: string = page.params.id ?? '';
      const res = await api.api.medical.appointments.get();
      if (res.error) throw new Error((res.error as any)?.message ?? 'Error al cargar citas');
      return (res.data ?? []).filter((c: any) => c.pacienteId === patientId || c.paciente?.id === patientId);
    },
    get enabled() { return !!page.params.id; },
  });
</script>

<div class="flex min-h-screen flex-col bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
    <a href="/medical/patients" class="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
      <ArrowLeft class="h-5 w-5" />
    </a>
    <h1 class="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
      Detalle del paciente
    </h1>
    {#if $patientQuery.data}
      <a
        href="/medical/patients/{page.params.id}/edit"
        class="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Pencil class="h-4 w-4" />
        Editar
      </a>
    {/if}
  </header>

  <!-- Main content -->
  <main class="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-24 pt-4">

    <!-- Patient identity card -->
    {#if $patientQuery.isPending}
      <div class="flex items-start gap-4 rounded-xl border bg-white p-4 animate-pulse">
        <div class="h-14 w-14 shrink-0 rounded-full bg-gray-200"></div>
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="h-4 w-40 rounded bg-gray-200"></div>
          <div class="h-3 w-28 rounded bg-gray-200"></div>
          <div class="mt-1 flex gap-2">
            <div class="h-5 w-20 rounded-full bg-gray-200"></div>
            <div class="h-5 w-14 rounded-full bg-gray-200"></div>
          </div>
        </div>
      </div>
    {:else if $patientQuery.isError}
      <div class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle class="h-4 w-4 shrink-0" />
        <span>No se pudo cargar la información del paciente.</span>
      </div>
    {:else if $patientQuery.data}
      {@const patient = $patientQuery.data}
      <div class="flex items-start gap-4 rounded-xl border bg-white p-4">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F]/10 text-xl font-bold text-[#2D6A4F]"
        >
          {getIniciales(patient.nombre)}
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-gray-900">{patient.nombre}</p>
          <p class="text-sm text-gray-500">{patient.cedula}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="rounded-full border px-2 py-0.5 text-xs text-gray-600">
              {patient.genero === 'M' ? 'Masculino' : 'Femenino'}
            </span>
            <span class="rounded-full border px-2 py-0.5 text-xs text-gray-600">
              {calcEdad(patient.fechaNac)} años
            </span>
          </div>
        </div>
      </div>

      <!-- Contact card -->
      <div class="flex flex-col gap-3 rounded-xl border bg-white p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Contacto</p>
        <div class="flex items-start gap-3">
          <Calendar class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <div class="flex flex-1 flex-wrap items-center justify-between gap-1">
            <span class="text-sm text-gray-500">Fecha de nacimiento</span>
            <span class="text-sm font-medium text-gray-800">{formatFecha(patient.fechaNac)}</span>
          </div>
        </div>
        <hr class="border-gray-100" />
        <div class="flex items-start gap-3">
          <Phone class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <div class="flex flex-1 flex-wrap items-center justify-between gap-1">
            <span class="text-sm text-gray-500">Teléfono</span>
            <span class="text-sm font-medium text-gray-800">{patient.telefono}</span>
          </div>
        </div>
        <hr class="border-gray-100" />
        <div class="flex items-start gap-3">
          <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <div class="flex flex-1 flex-wrap items-center justify-between gap-1">
            <span class="text-sm text-gray-500">Residencia</span>
            <span class="text-sm font-medium text-gray-800">{patient.residencia}</span>
          </div>
        </div>
        <hr class="border-gray-100" />
        <div class="flex items-start gap-3">
          <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <div class="flex flex-1 flex-wrap items-center justify-between gap-1">
            <span class="text-sm text-gray-500">Lugar de nacimiento</span>
            <span class="text-sm font-medium text-gray-800">{patient.lugarNac}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Antecedentes colapsable -->
    <div class="overflow-hidden rounded-xl border bg-white">
      <button
        onclick={() => (antecedentesOpen = !antecedentesOpen)}
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
      >
        <div class="flex items-center gap-2">
          <HeartPulse class="h-5 w-5 text-[#2D6A4F]" />
          <span class="font-medium text-gray-800">Antecedentes médicos</span>
          {#if $antecedentsQuery.data}
            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {$antecedentsQuery.data.length}
            </span>
          {/if}
        </div>
        {#if antecedentesOpen}
          <ChevronUp class="h-4 w-4 text-gray-400" />
        {:else}
          <ChevronDown class="h-4 w-4 text-gray-400" />
        {/if}
      </button>

      {#if antecedentesOpen}
        <div class="border-t">
          {#if $antecedentsQuery.isPending}
            <div class="flex flex-col gap-3 px-4 py-3">
              {#each [0, 1, 2] as n (n)}
                <div class="h-16 w-full rounded-lg bg-gray-200 animate-pulse"></div>
              {/each}
            </div>
          {:else if $antecedentsQuery.isError}
            <div class="flex items-center gap-2 px-4 py-3 text-sm text-red-600">
              <AlertCircle class="h-4 w-4 shrink-0" />
              <span>No se pudieron cargar los antecedentes.</span>
            </div>
          {:else if $antecedentsQuery.data}
            {#each $antecedentsQuery.data as ant, i (ant.id)}
              {#if i > 0}
                <hr class="border-gray-100" />
              {/if}
              <div class="flex items-start justify-between gap-3 px-4 py-3">
                <div class="flex min-w-0 flex-1 flex-col gap-1.5">
                  {#if ant.categorias.length > 0}
                    <div class="flex flex-wrap gap-1">
                      {#each ant.categorias as cat (cat.id)}
                        <span class="inline-flex w-fit rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {cat.nombre}
                        </span>
                      {/each}
                    </div>
                  {:else}
                    <span class="inline-flex w-fit rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      Antecedente
                    </span>
                  {/if}
                  <p class="text-sm text-gray-700">{ant.descripcion}</p>
                  <p class="text-xs text-gray-400">
                    {formatFecha(ant.fechaRegistro ?? ant.ultimaActualizacion)}
                  </p>
                </div>
                <a
                  href="/medical/patients/{page.params.id}/antecedents/{ant.id}/edit"
                  class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil class="h-4 w-4" />
                </a>
              </div>
            {/each}
            {#if $antecedentsQuery.data.length === 0}
              <p class="px-4 py-3 text-sm text-gray-400">No hay antecedentes registrados.</p>
            {/if}
          {/if}
          <div class="border-t px-4 py-3">
            <a
              href="/medical/patients/{page.params.id}/antecedents/new"
              class="flex w-fit items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus class="h-4 w-4" />
              Agregar antecedente
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Citas colapsable -->
    <div class="overflow-hidden rounded-xl border bg-white">
      <button
        onclick={() => (citasOpen = !citasOpen)}
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
      >
        <div class="flex items-center gap-2">
          <Stethoscope class="h-5 w-5 text-[#2D6A4F]" />
          <span class="font-medium text-gray-800">Citas</span>
          {#if $appointmentsQuery.data}
            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {$appointmentsQuery.data.length}
            </span>
          {/if}
        </div>
        {#if citasOpen}
          <ChevronUp class="h-4 w-4 text-gray-400" />
        {:else}
          <ChevronDown class="h-4 w-4 text-gray-400" />
        {/if}
      </button>

      {#if citasOpen}
        <div class="border-t">
          {#if $appointmentsQuery.isPending}
            <div class="flex flex-col gap-3 px-4 py-3">
              {#each [0, 1] as n (n)}
                <div class="h-14 w-full rounded-lg bg-gray-200 animate-pulse"></div>
              {/each}
            </div>
          {:else if $appointmentsQuery.isError}
            <div class="flex items-center gap-2 px-4 py-3 text-sm text-red-600">
              <AlertCircle class="h-4 w-4 shrink-0" />
              <span>No se pudieron cargar las citas.</span>
            </div>
          {:else if $appointmentsQuery.data}
            {#if $appointmentsQuery.data.length === 0}
              <p class="px-4 py-3 text-sm text-gray-400">No hay citas registradas.</p>
            {:else}
              {#each $appointmentsQuery.data as cita, i (cita.id)}
                {#if i > 0}
                  <hr class="border-gray-100" />
                {/if}
                <a
                  href="/medical/appointments/{cita.id}"
                  class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p class="truncate text-sm font-medium text-gray-800">{cita.motivo}</p>
                    <p class="text-xs text-gray-400">
                      {cita.personal.nombre} · {formatFechaHora(cita.fechaHora)}
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <span
                      class="rounded-full border px-2 py-0.5 text-xs font-medium {ESTADO_BADGE[cita.estado] ?? ESTADO_BADGE.CANCELADA}"
                    >
                      {ESTADO_LABEL[cita.estado] ?? cita.estado}
                    </span>
                    <ChevronRight class="h-4 w-4 text-gray-400" />
                  </div>
                </a>
              {/each}
            {/if}
          {/if}
        </div>
      {/if}
    </div>

  </main>

  <!-- Fixed bottom bar -->
  <div class="fixed bottom-0 left-0 right-0 border-t bg-white px-4 py-3 md:pl-64">
    <a
      href="/medical/appointments/new?paciente={page.params.id}"
      class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#245a41]"
    >
      <Plus class="h-4 w-4" />
      Agendar cita
    </a>
  </div>
</div>
