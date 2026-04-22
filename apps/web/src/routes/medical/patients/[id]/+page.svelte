<script lang="ts">
  import { DateTime } from 'luxon';
  import { Drawer } from 'vaul-svelte';
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
    CheckCircle2,
    X,
  } from 'lucide-svelte';

  const PACIENTE = {
    id: '1',
    nombre: 'Ana Sofía',
    apellido: 'Ramírez Torres',
    cedula: 'V-12.345.678',
    fechaNac: '1985-06-15',
    sexo: 'F',
    telefono: '0414-1234567',
    direccion: 'Urb. San Félix, Calle 3, Casa 12',
  };

  const ANTECEDENTES = [
    {
      id: 'a1',
      tipo: 'patologico',
      descripcion: 'Hipertensión arterial diagnosticada en 2018. Bajo control con Enalapril.',
      fecha: '2018-03-10',
    },
    {
      id: 'a2',
      tipo: 'quirurgico',
      descripcion: 'Apendicectomía. Sin complicaciones.',
      fecha: '2010-07-22',
    },
    {
      id: 'a3',
      tipo: 'alergico',
      descripcion: 'Alergia a la Penicilina. Reacción cutánea moderada.',
      fecha: '2005-01-15',
    },
  ];

  const CITAS_RECIENTES = [
    {
      id: 'c1',
      fecha: '2025-04-10',
      medico: 'Dra. García',
      estado: 'completada',
      motivo: 'Control de presión arterial',
    },
    {
      id: 'c2',
      fecha: '2025-02-28',
      medico: 'Dr. Rodríguez',
      estado: 'completada',
      motivo: 'Dolor de cabeza persistente',
    },
    {
      id: 'c3',
      fecha: '2025-06-01',
      medico: 'Dra. García',
      estado: 'pendiente',
      motivo: 'Control rutinario',
    },
  ];

  const TIPO_LABELS: Record<string, { label: string; color: string }> = {
    patologico: { label: 'Patológico', color: 'bg-red-50 text-red-700 border-red-200' },
    quirurgico: { label: 'Quirúrgico', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    alergico: { label: 'Alérgico', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    familiar: { label: 'Familiar', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    otro: { label: 'Otro', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  };

  const ESTADO_BADGE: Record<string, string> = {
    completada: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    pendiente: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelada: 'bg-gray-100 text-gray-500 border-gray-300',
  };

  function calcEdad(fechaNac: string): number {
    return Math.floor(Math.abs(DateTime.fromISO(fechaNac).diffNow('years').years));
  }

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("dd 'de' LLLL yyyy");
  }

  let antecedentesOpen = $state(true);
  let citasOpen = $state(false);
  let antDrawerOpen = $state(false);
  let editAnt = $state<(typeof ANTECEDENTES)[0] | null>(null);
  let antForm = $state({ tipo: 'patologico', descripcion: '', fecha: '' });
  let antErrors = $state<{ descripcion?: string; tipo?: string }>({});
  let antGuardado = $state(false);

  function openNuevoAnt() {
    antForm = { tipo: 'patologico', descripcion: '', fecha: '' };
    editAnt = null;
    antErrors = {};
    antGuardado = false;
    antDrawerOpen = true;
  }

  function openEditAnt(a: (typeof ANTECEDENTES)[0]) {
    antForm = { tipo: a.tipo, descripcion: a.descripcion, fecha: a.fecha };
    editAnt = a;
    antErrors = {};
    antGuardado = false;
    antDrawerOpen = true;
  }

  function handleGuardarAnt() {
    antErrors = {};
    if (!antForm.tipo) antErrors.tipo = 'El tipo es requerido.';
    if (!antForm.descripcion.trim()) antErrors.descripcion = 'La descripción es requerida.';
    if (antErrors.tipo || antErrors.descripcion) return;
    antGuardado = true;
  }

  function handleDrawerClose() {
    setTimeout(() => {
      antForm = { tipo: 'patologico', descripcion: '', fecha: '' };
      antErrors = {};
      antGuardado = false;
      editAnt = null;
    }, 300);
  }

  const iniciales =
    `${PACIENTE.nombre.charAt(0)}${PACIENTE.apellido.charAt(0)}`.toUpperCase();
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
    <a
      href="/medical/patients/{PACIENTE.id}/edit"
      class="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <Pencil class="h-4 w-4" />
      Editar
    </a>
  </header>

  <!-- Main content -->
  <main class="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-24 pt-4">
    <!-- Identidad card -->
    <div class="flex items-start gap-4 rounded-xl border bg-white p-4">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F]/10 text-xl font-bold text-[#2D6A4F]"
      >
        {iniciales}
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-gray-900">{PACIENTE.nombre} {PACIENTE.apellido}</p>
        <p class="text-sm text-gray-500">{PACIENTE.cedula}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span class="rounded-full border px-2 py-0.5 text-xs text-gray-600">
            {PACIENTE.sexo === 'F' ? 'Femenino' : 'Masculino'}
          </span>
          <span class="rounded-full border px-2 py-0.5 text-xs text-gray-600">
            {calcEdad(PACIENTE.fechaNac)} años
          </span>
        </div>
      </div>
    </div>

    <!-- Contacto card -->
    <div class="flex flex-col gap-3 rounded-xl border bg-white p-4">
      <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Contacto</p>
      <div class="flex items-start gap-3">
        <Calendar class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div class="flex flex-1 flex-wrap items-center justify-between gap-1">
          <span class="text-sm text-gray-500">Fecha de nacimiento</span>
          <span class="text-sm font-medium text-gray-800">{formatFecha(PACIENTE.fechaNac)}</span>
        </div>
      </div>
      <hr class="border-gray-100" />
      <div class="flex items-start gap-3">
        <Phone class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div class="flex flex-1 flex-wrap items-center justify-between gap-1">
          <span class="text-sm text-gray-500">Teléfono</span>
          <span class="text-sm font-medium text-gray-800">{PACIENTE.telefono}</span>
        </div>
      </div>
      <hr class="border-gray-100" />
      <div class="flex items-start gap-3">
        <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div class="flex flex-1 flex-wrap items-center justify-between gap-1">
          <span class="text-sm text-gray-500">Dirección</span>
          <span class="text-sm font-medium text-gray-800">{PACIENTE.direccion}</span>
        </div>
      </div>
    </div>

    <!-- Antecedentes colapsable -->
    <div class="overflow-hidden rounded-xl border bg-white">
      <button
        onclick={() => (antecedentesOpen = !antecedentesOpen)}
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
      >
        <div class="flex items-center gap-2">
          <HeartPulse class="h-5 w-5 text-[#2D6A4F]" />
          <span class="font-medium text-gray-800">Antecedentes médicos</span>
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {ANTECEDENTES.length}
          </span>
        </div>
        {#if antecedentesOpen}
          <ChevronUp class="h-4 w-4 text-gray-400" />
        {:else}
          <ChevronDown class="h-4 w-4 text-gray-400" />
        {/if}
      </button>

      {#if antecedentesOpen}
        <div class="border-t">
          {#each ANTECEDENTES as ant, i (ant.id)}
            {#if i > 0}
              <hr class="border-gray-100" />
            {/if}
            <div class="flex items-start justify-between gap-3 px-4 py-3">
              <div class="flex min-w-0 flex-1 flex-col gap-1.5">
                <span
                  class="inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium {TIPO_LABELS[
                    ant.tipo
                  ]?.color ?? TIPO_LABELS.otro.color}"
                >
                  {TIPO_LABELS[ant.tipo]?.label ?? ant.tipo}
                </span>
                <p class="text-sm text-gray-700">{ant.descripcion}</p>
                <p class="text-xs text-gray-400">{formatFecha(ant.fecha)}</p>
              </div>
              <button
                onclick={() => openEditAnt(ant)}
                class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <Pencil class="h-4 w-4" />
              </button>
            </div>
          {/each}
          <div class="border-t px-4 py-3">
            <button
              onclick={openNuevoAnt}
              class="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus class="h-4 w-4" />
              Agregar antecedente
            </button>
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
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {CITAS_RECIENTES.length}
          </span>
        </div>
        {#if citasOpen}
          <ChevronUp class="h-4 w-4 text-gray-400" />
        {:else}
          <ChevronDown class="h-4 w-4 text-gray-400" />
        {/if}
      </button>

      {#if citasOpen}
        <div class="border-t">
          {#each CITAS_RECIENTES as cita, i (cita.id)}
            {#if i > 0}
              <hr class="border-gray-100" />
            {/if}
            <a
              href="/medical/appointments/{cita.id}"
              class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <p class="truncate text-sm font-medium text-gray-800">{cita.motivo}</p>
                <p class="text-xs text-gray-400">{cita.medico} · {formatFecha(cita.fecha)}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span
                  class="rounded-full border px-2 py-0.5 text-xs font-medium {ESTADO_BADGE[
                    cita.estado
                  ] ?? ESTADO_BADGE.cancelada}"
                >
                  {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                </span>
                <ChevronRight class="h-4 w-4 text-gray-400" />
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </main>

  <!-- Fixed bottom bar -->
  <div class="fixed bottom-0 left-0 right-0 border-t bg-white px-4 py-3 md:pl-64">
    <a
      href="/medical/appointments/new?paciente={PACIENTE.id}"
      class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#245a41]"
    >
      <Plus class="h-4 w-4" />
      Agendar cita
    </a>
  </div>
</div>

<!-- Antecedente Drawer -->
<Drawer.Root bind:open={antDrawerOpen} onClose={handleDrawerClose}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />
    <Drawer.Content
      class="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85svh] flex-col rounded-t-2xl bg-white outline-none"
    >
      <div class="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-gray-300"></div>

      {#if !antGuardado}
        <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <!-- Drawer header -->
          <div class="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
            <div>
              <h2 class="text-base font-semibold text-gray-900">
                {editAnt ? 'Editar' : 'Registrar'} antecedente
              </h2>
              <p class="text-sm text-gray-500">{PACIENTE.nombre} {PACIENTE.apellido}</p>
            </div>
            <button
              onclick={() => (antDrawerOpen = false)}
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Form -->
          <div class="flex flex-col gap-4 px-4 pb-4">
            <!-- Tipo -->
            <div class="flex flex-col gap-1">
              <label for="ant-tipo" class="text-xs font-medium text-gray-700">
                Tipo <span class="text-red-500">*</span>
              </label>
              <select
                id="ant-tipo"
                bind:value={antForm.tipo}
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
              >
                <option value="patologico">Patológico</option>
                <option value="quirurgico">Quirúrgico</option>
                <option value="alergico">Alérgico</option>
                <option value="familiar">Familiar</option>
                <option value="otro">Otro</option>
              </select>
              {#if antErrors.tipo}
                <p class="mt-0.5 text-xs text-red-600">{antErrors.tipo}</p>
              {/if}
            </div>

            <!-- Descripcion -->
            <div class="flex flex-col gap-1">
              <label for="ant-descripcion" class="text-xs font-medium text-gray-700">
                Descripción <span class="text-red-500">*</span>
              </label>
              <textarea
                id="ant-descripcion"
                bind:value={antForm.descripcion}
                rows={4}
                placeholder="Describa el antecedente..."
                class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
              ></textarea>
              {#if antErrors.descripcion}
                <p class="mt-0.5 text-xs text-red-600">{antErrors.descripcion}</p>
              {/if}
            </div>

            <!-- Fecha -->
            <div class="flex flex-col gap-1">
              <label for="ant-fecha" class="text-xs font-medium text-gray-700">Fecha</label>
              <input
                id="ant-fecha"
                type="date"
                bind:value={antForm.fecha}
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                onclick={() => (antDrawerOpen = false)}
                class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onclick={handleGuardarAnt}
                class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#245a41]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      {:else}
        <div class="flex flex-col items-center gap-4 px-4 py-10">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
          >
            <CheckCircle2 class="h-7 w-7" />
          </div>
          <p class="text-base font-semibold text-gray-900">Antecedente guardado</p>
          <button
            onclick={() => (antDrawerOpen = false)}
            class="rounded-lg bg-[#2D6A4F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#245a41]"
          >
            Cerrar
          </button>
        </div>
      {/if}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
