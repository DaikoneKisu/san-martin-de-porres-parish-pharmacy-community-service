<script lang="ts">
  import { ArrowLeft, Calendar, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-svelte';

  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
  type Dia = typeof DIAS[number];
  type SaveState = 'idle' | 'saved';

  // Agenda state
  let tiempoEntreCitas = $state('30');
  let horaInicio = $state('08:00');
  let horaFin = $state('16:00');
  let diasHabiles = $state<Dia[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  let agendaErrors = $state<Record<string, string>>({});
  let agendaSave = $state<SaveState>('idle');

  // Contabilidad state
  let intervaloBCV = $state('60');
  let contErrors = $state<Record<string, string>>({});
  let contSave = $state<SaveState>('idle');

  function toggleDia(dia: Dia) {
    if (diasHabiles.includes(dia)) {
      diasHabiles = diasHabiles.filter(d => d !== dia);
    } else {
      diasHabiles = [...diasHabiles, dia];
    }
    agendaSave = 'idle';
  }

  function validateAgenda() {
    const e: Record<string, string> = {};
    const t = parseInt(tiempoEntreCitas);
    if (!t || t <= 0) e.tiempoEntreCitas = 'Debe ser mayor a 0 minutos.';
    if (!horaInicio) e.horaInicio = 'Requerido';
    if (!horaFin) e.horaFin = 'Requerido';
    if (horaInicio && horaFin && horaFin <= horaInicio) e.horaFin = 'Debe ser posterior a la hora de inicio.';
    if (diasHabiles.length === 0) e.diasHabiles = 'Selecciona al menos un día hábil.';
    return e;
  }

  function handleGuardarAgenda() {
    const e = validateAgenda();
    agendaErrors = e;
    if (Object.keys(e).length) return;
    agendaSave = 'saved';
  }

  function validateCont() {
    const e: Record<string, string> = {};
    const v = parseInt(intervaloBCV);
    if (!v || v <= 0) e.intervaloBCV = 'Debe ser mayor a 0 minutos.';
    return e;
  }

  function handleGuardarCont() {
    const e = validateCont();
    contErrors = e;
    if (Object.keys(e).length) return;
    contSave = 'saved';
  }
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <header class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
    <a href="/admin" class="flex items-center justify-center rounded-md p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors -ml-1">
      <ArrowLeft class="h-4 w-4" />
    </a>
    <h1 class="flex-1 text-base font-semibold text-gray-900">Configuración del sistema</h1>
  </header>

  <main class="flex flex-col gap-5 px-4 pt-4 pb-12 max-w-2xl mx-auto w-full">

    <!-- Agenda section -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <Calendar class="h-4 w-4 text-gray-500" />
        <h2 class="text-sm font-semibold text-gray-900">Parámetros de agenda</h2>
      </div>

      <div class="rounded-xl border bg-white p-4 flex flex-col gap-4">
        <!-- Tiempo entre citas -->
        <div class="flex flex-col gap-1.5">
          <label for="tiempo-citas" class="text-xs font-medium text-gray-700">Tiempo entre citas (minutos)</label>
          <input
            id="tiempo-citas"
            type="number"
            inputmode="numeric"
            min="5"
            step="5"
            placeholder="30"
            bind:value={tiempoEntreCitas}
            oninput={() => { agendaSave = 'idle'; }}
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
          />
          {#if agendaErrors.tiempoEntreCitas}
            <p class="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle class="h-3.5 w-3.5" />{agendaErrors.tiempoEntreCitas}
            </p>
          {/if}
        </div>

        <hr class="border-gray-100" />

        <!-- Horario -->
        <div class="flex flex-col gap-2">
          <p class="text-xs font-medium text-gray-700">Horario de atención</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500">Desde</span>
              <input
                type="time"
                bind:value={horaInicio}
                oninput={() => { agendaSave = 'idle'; }}
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
              />
              {#if agendaErrors.horaInicio}
                <p class="text-xs text-red-600">{agendaErrors.horaInicio}</p>
              {/if}
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500">Hasta</span>
              <input
                type="time"
                bind:value={horaFin}
                oninput={() => { agendaSave = 'idle'; }}
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
              />
              {#if agendaErrors.horaFin}
                <p class="text-xs text-red-600">{agendaErrors.horaFin}</p>
              {/if}
            </div>
          </div>
        </div>

        <hr class="border-gray-100" />

        <!-- Días hábiles -->
        <div class="flex flex-col gap-2">
          <p class="text-xs font-medium text-gray-700">Días hábiles</p>
          <div class="flex flex-wrap gap-2">
            {#each DIAS as dia (dia)}
              <button
                type="button"
                onclick={() => toggleDia(dia)}
                class={[
                  'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                  diasHabiles.includes(dia)
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                {dia.slice(0, 3)}
              </button>
            {/each}
          </div>
          {#if agendaErrors.diasHabiles}
            <p class="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle class="h-3.5 w-3.5" />{agendaErrors.diasHabiles}
            </p>
          {/if}
        </div>
      </div>

      {#if agendaSave === 'saved'}
        <div class="flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle2 class="h-4 w-4" />
          Parámetros de agenda guardados correctamente.
        </div>
      {/if}

      <div class="flex justify-end">
        <button
          type="button"
          onclick={handleGuardarAgenda}
          class="rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors"
        >
          Guardar agenda
        </button>
      </div>
    </section>

    <hr class="border-gray-200" />

    <!-- Contabilidad section -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <DollarSign class="h-4 w-4 text-gray-500" />
        <h2 class="text-sm font-semibold text-gray-900">Parámetros de contabilidad</h2>
      </div>

      <div class="rounded-xl border bg-white p-4 flex flex-col gap-1.5">
        <label for="intervalo-bcv" class="text-xs font-medium text-gray-700">Intervalo de actualización de tasa BCV (minutos)</label>
        <input
          id="intervalo-bcv"
          type="number"
          inputmode="numeric"
          min="1"
          placeholder="60"
          bind:value={intervaloBCV}
          oninput={() => { contSave = 'idle'; }}
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
        />
        <p class="text-xs text-gray-500">Cada cuántos minutos el sistema consulta la tasa oficial al BCV para conversiones USD → VES.</p>
        {#if contErrors.intervaloBCV}
          <p class="text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle class="h-3.5 w-3.5" />{contErrors.intervaloBCV}
          </p>
        {/if}
      </div>

      {#if contSave === 'saved'}
        <div class="flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle2 class="h-4 w-4" />
          Parámetros de contabilidad guardados correctamente.
        </div>
      {/if}

      <div class="flex justify-end">
        <button
          type="button"
          onclick={handleGuardarCont}
          class="rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors"
        >
          Guardar contabilidad
        </button>
      </div>
    </section>
  </main>
</div>
