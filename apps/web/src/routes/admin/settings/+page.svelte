<script lang="ts">
  import { ArrowLeft, Calendar, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-svelte';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/api';

  const DIA_MAP: { api: string; label: string }[] = [
    { api: 'lunes', label: 'Lunes' },
    { api: 'martes', label: 'Martes' },
    { api: 'miercoles', label: 'Miércoles' },
    { api: 'jueves', label: 'Jueves' },
    { api: 'viernes', label: 'Viernes' },
    { api: 'sabado', label: 'Sábado' },
    { api: 'domingo', label: 'Domingo' },
  ];

  type SaveState = 'idle' | 'saved';

  const queryClient = useQueryClient();

  const configQuery = createQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await api.api.admin.config.get();
      if (res.error) throw new Error((res.error as any).message ?? 'Error al cargar la configuración');
      return res.data;
    },
  });

  // Agenda state — starts empty; initialized once data arrives
  let initialized = $state(false);
  let tiempoEntreCitas = $state('30');
  let horaInicio = $state('08:00');
  let horaFin = $state('17:00');
  let diasHabiles = $state<string[]>([]);
  let agendaErrors = $state<Record<string, string>>({});
  let agendaSave = $state<SaveState>('idle');

  // Contabilidad state
  let intervaloBCV = $state('4');
  let contErrors = $state<Record<string, string>>({});
  let contSave = $state<SaveState>('idle');

  // Initialize form fields once from query data (runs only on first successful load)
  $effect(() => {
    if ($configQuery.data && !initialized) {
      tiempoEntreCitas = String($configQuery.data.agenda.tiempo_entre_citas_minutos);
      horaInicio = $configQuery.data.agenda.hora_inicio;
      horaFin = $configQuery.data.agenda.hora_fin;
      diasHabiles = [...$configQuery.data.agenda.dias_habiles];
      intervaloBCV = String($configQuery.data.contabilidad.actualizar_tasa_cada_horas);
      initialized = true;
    }
  });

  const agendaMutation = createMutation({
    mutationFn: async (body: any) => {
      const res = await api.api.admin.config.patch(body);
      if (res.error) throw new Error((res.error as any).message ?? 'Error al guardar la agenda');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      agendaSave = 'saved';
    },
  });

  const contMutation = createMutation({
    mutationFn: async (body: any) => {
      const res = await api.api.admin.config.patch(body);
      if (res.error) throw new Error((res.error as any).message ?? 'Error al guardar la contabilidad');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      contSave = 'saved';
    },
  });

  function toggleDia(dia: string) {
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
    $agendaMutation.mutate({
      agenda: {
        tiempo_entre_citas_minutos: parseInt(tiempoEntreCitas),
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        dias_habiles: diasHabiles,
      },
    });
  }

  function validateCont() {
    const e: Record<string, string> = {};
    const v = parseInt(intervaloBCV);
    if (!v || v <= 0) e.intervaloBCV = 'Debe ser mayor a 0 horas.';
    return e;
  }

  function handleGuardarCont() {
    const e = validateCont();
    contErrors = e;
    if (Object.keys(e).length) return;
    $contMutation.mutate({
      contabilidad: {
        actualizar_tasa_cada_horas: parseInt(intervaloBCV),
      },
    });
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

    {#if $configQuery.isPending}
      <!-- Loading skeleton -->
      <section class="flex flex-col gap-3">
        <div class="h-5 w-48 rounded bg-gray-200 animate-pulse"></div>
        <div class="rounded-xl border bg-white p-4 flex flex-col gap-4">
          <div class="h-9 rounded-lg bg-gray-200 animate-pulse"></div>
          <hr class="border-gray-100" />
          <div class="grid grid-cols-2 gap-3">
            <div class="h-9 rounded-lg bg-gray-200 animate-pulse"></div>
            <div class="h-9 rounded-lg bg-gray-200 animate-pulse"></div>
          </div>
          <hr class="border-gray-100" />
          <div class="flex gap-2">
            {#each [0, 1, 2, 3, 4, 5, 6] as i (i)}
              <div class="h-7 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            {/each}
          </div>
        </div>
      </section>
    {:else if $configQuery.isError}
      <div class="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-2 text-red-700 text-sm">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        No se pudo cargar la configuración. Intenta recargar la página.
      </div>
    {:else}
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
              {#each DIA_MAP as diaMap (diaMap.api)}
                <button
                  type="button"
                  onclick={() => toggleDia(diaMap.api)}
                  class={[
                    'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                    diasHabiles.includes(diaMap.api)
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {diaMap.label.slice(0, 3)}
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
            disabled={$agendaMutation.isPending}
            class="rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {$agendaMutation.isPending ? 'Guardando…' : 'Guardar agenda'}
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
          <label for="intervalo-bcv" class="text-xs font-medium text-gray-700">Intervalo de actualización de tasa BCV (horas)</label>
          <input
            id="intervalo-bcv"
            type="number"
            inputmode="numeric"
            min="1"
            placeholder="4"
            bind:value={intervaloBCV}
            oninput={() => { contSave = 'idle'; }}
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
          />
          <p class="text-xs text-gray-500">Cada cuántas horas el sistema consulta la tasa oficial al BCV para conversiones USD → VES.</p>
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
            disabled={$contMutation.isPending}
            class="rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {$contMutation.isPending ? 'Guardando…' : 'Guardar contabilidad'}
          </button>
        </div>
      </section>
    {/if}
  </main>
</div>
