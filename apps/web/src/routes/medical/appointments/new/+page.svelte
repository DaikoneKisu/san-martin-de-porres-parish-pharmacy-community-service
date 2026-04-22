<script lang="ts">
  import { DateTime } from 'luxon';
  import { ArrowLeft, CheckCircle2, Stethoscope, Loader2 } from 'lucide-svelte';
  import { createQuery, createMutation } from '@tanstack/svelte-query';
  import { api } from '$lib/api';

  // ── Queries ────────────────────────────────────────────────────────────────
  const staffQuery = createQuery({
    queryKey: ['medical-staff'],
    queryFn: async () => {
      const res = await api.api.medical.staff.get();
      if (res.error) throw new Error('Error al cargar médicos');
      return res.data!;
    },
    staleTime: 1000 * 60 * 5,
  });

  const patientsQuery = createQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.api.medical.patients.get();
      if (res.error) throw new Error('Error al cargar pacientes');
      return res.data!;
    },
    staleTime: 1000 * 60 * 5,
  });

  const rateQuery = createQuery({
    queryKey: ['exchange-rate'],
    queryFn: async () => {
      const res = await api.api.accounting['exchange-rate'].get();
      if (res.error) throw new Error('Error al obtener tasa BCV');
      return res.data!;
    },
    staleTime: 1000 * 60 * 5,
  });

  // ── State ──────────────────────────────────────────────────────────────────
  let step = $state<'medico-fecha' | 'paciente' | 'confirmado'>('medico-fecha');
  let medicoId = $state('');
  let fecha = $state('');
  let hora = $state('');
  let pacienteId = $state('');
  let motivo = $state('');
  let precioConsultaVES = $state(0);
  let precioConsultaUSD = $state(0);
  let precioMoneda = $state<'VES' | 'USD'>('VES');
  let errors = $state<Record<string, string>>({});
  let conflictoError = $state('');

  // ── Derived ────────────────────────────────────────────────────────────────
  const medicos = $derived(
    ($staffQuery.data ?? []).filter((s: any) => s.roles.some((r: any) => r.nombre === 'doctor'))
  );

  const medicoNombre = $derived(
    ($staffQuery.data ?? []).find((m: any) => m.id === medicoId)?.nombre ?? ''
  );

  const pacienteNombre = $derived(
    ($patientsQuery.data ?? []).find((p: any) => p.id === pacienteId)?.nombre ?? ''
  );

  const fechaFormateada = $derived(
    fecha ? DateTime.fromISO(fecha).setLocale('es').toFormat("EEEE d 'de' LLLL") : ''
  );

  const tasa = $derived.by(() => {
    const r = $rateQuery.data as { rate?: number } | number | undefined;
    if (typeof r === 'number') return r;
    return r?.rate ?? 0;
  });

  const puedeContinar = $derived(
    !!medicoId &&
      !!fecha &&
      !!hora &&
      (precioMoneda === 'VES' ? precioConsultaVES > 0 : precioConsultaUSD > 0)
  );

  // ── Mutation ───────────────────────────────────────────────────────────────
  const appointmentMutation = createMutation({
    mutationFn: async () => {
      const fechaHora = `${fecha}T${hora}:00`;
      const montoVES =
        precioMoneda === 'USD' ? precioConsultaUSD * tasa : precioConsultaVES;
      const res = await api.api.medical.appointments.post({
        pacienteId,
        personalId: medicoId,
        fechaHora,
        motivo,
        precioConsulta: montoVES,
      });
      if (res.error) {
        const err = res.error as { code?: string; message?: string };
        if (err.code === 'SCHEDULE_CONFLICT') {
          conflictoError =
            'El médico ya tiene una cita en ese horario. Por favor selecciona otro horario.';
        } else {
          conflictoError = err.message ?? 'Error al agendar la cita';
        }
        throw new Error(conflictoError);
      }
      return res.data!;
    },
    onSuccess: () => {
      step = 'confirmado';
      conflictoError = '';
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleContinuar() {
    const newErrors: Record<string, string> = {};
    if (!medicoId) newErrors.medico = 'Selecciona un médico.';
    if (!fecha) newErrors.fecha = 'Selecciona una fecha.';
    if (!hora) newErrors.hora = 'Selecciona una hora.';
    if (precioMoneda === 'VES' && precioConsultaVES <= 0)
      newErrors.precio = 'Ingresa el precio de la consulta.';
    if (precioMoneda === 'USD' && precioConsultaUSD <= 0)
      newErrors.precio = 'Ingresa el precio de la consulta.';
    errors = newErrors;
    if (Object.keys(newErrors).length > 0) return;
    step = 'paciente';
  }

  function handleGuardar() {
    const newErrors: Record<string, string> = {};
    if (!pacienteId) newErrors.paciente = 'Selecciona un paciente.';
    if (!motivo.trim()) newErrors.motivo = 'Describe el motivo de la cita.';
    errors = newErrors;
    if (Object.keys(newErrors).length > 0) return;
    $appointmentMutation.mutate();
  }

  function resetForm() {
    step = 'medico-fecha';
    medicoId = '';
    fecha = '';
    hora = '';
    pacienteId = '';
    motivo = '';
    precioConsultaVES = 0;
    precioConsultaUSD = 0;
    precioMoneda = 'VES';
    errors = {};
    conflictoError = '';
  }

  // ── Shared classes ─────────────────────────────────────────────────────────
  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'text-xs font-medium text-gray-700';
  const errorClass = 'text-xs text-red-600';
</script>

<style>
  :global(:root) {
    --color-primary: #2d6a4f;
  }

  .btn-primary {
    background-color: #2d6a4f;
    color: white;
    border-radius: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: opacity 0.15s;
    width: 100%;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
  }
  .btn-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .btn-primary:not(:disabled):hover {
    opacity: 0.9;
  }

  .btn-outline {
    background-color: transparent;
    color: #2d6a4f;
    border: 1px solid #2d6a4f;
    border-radius: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.15s;
    width: 100%;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .btn-outline:hover {
    background-color: #2d6a4f10;
  }
</style>

<div class="flex min-h-screen flex-col bg-gray-50">
  <!-- Sticky header -->
  <header
    class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3"
  >
    <a href="/medical/appointments" class="text-gray-500 hover:text-gray-700">
      <ArrowLeft class="h-5 w-5" />
    </a>
    <h1 class="text-base font-semibold text-gray-900">Agendar cita</h1>
  </header>

  <!-- ── SUCCESS SCREEN ─────────────────────────────────────────────────── -->
  {#if step === 'confirmado'}
    <div class="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 class="h-8 w-8 text-emerald-600" />
      </div>
      <p class="text-lg font-semibold text-gray-900">Cita agendada</p>
      <p class="text-sm text-gray-500">{pacienteNombre} · {medicoNombre}</p>
      <p class="text-sm capitalize text-gray-500">{fechaFormateada} a las {hora}</p>
      <a href="/medical/appointments" class="btn-primary mt-2 max-w-xs">Ver citas</a>
      <button type="button" onclick={resetForm} class="btn-outline max-w-xs">
        Agendar otra cita
      </button>
    </div>

  <!-- ── STEP 1: médico y horario ───────────────────────────────────────── -->
  {:else if step === 'medico-fecha'}
    <div class="flex flex-col gap-4 px-4 pb-8 pt-4">
      <!-- Step indicator -->
      <div class="flex items-center gap-2">
        <div
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-xs font-semibold text-white"
        >
          1
        </div>
        <span class="text-xs font-medium text-gray-900">Médico y horario</span>
        <div class="h-px flex-1 bg-gray-200"></div>
        <div
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-500"
        >
          2
        </div>
        <span class="text-xs font-medium text-gray-400">Paciente</span>
      </div>

      <!-- Card: Médico -->
      <div class="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p class="font-semibold text-gray-900">Médico</p>
          <p class="text-sm text-gray-500">Selecciona el médico que atenderá la cita.</p>
        </div>
        <div class="flex flex-col gap-1">
          <label for="medico" class={labelClass}>Médico</label>
          {#if $staffQuery.isPending}
            <div class="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 class="h-4 w-4 animate-spin" />
              Cargando médicos...
            </div>
          {:else}
            <select id="medico" class={inputClass} bind:value={medicoId}>
              <option value="">Seleccionar médico</option>
              {#each medicos as m (m.id)}
                <option value={m.id}>{m.nombre} · {m.cedula}</option>
              {/each}
            </select>
          {/if}
          {#if errors.medico}
            <p class={errorClass}>{errors.medico}</p>
          {/if}
        </div>
      </div>

      <!-- Card: Fecha y hora -->
      <div class="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p class="font-semibold text-gray-900">Fecha y hora</p>
          <p class="text-sm text-gray-500">Horario hábil: 8:00 – 16:00.</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label for="fecha" class={labelClass}>Fecha</label>
            <input id="fecha" type="date" class={inputClass} bind:value={fecha} />
            {#if errors.fecha}
              <p class={errorClass}>{errors.fecha}</p>
            {/if}
          </div>
          <div class="flex flex-col gap-1">
            <label for="hora" class={labelClass}>Hora</label>
            <input
              id="hora"
              type="time"
              min="08:00"
              max="16:00"
              class={inputClass}
              bind:value={hora}
            />
            {#if errors.hora}
              <p class={errorClass}>{errors.hora}</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Card: Precio -->
      <div class="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p class="font-semibold text-gray-900">Precio de consulta</p>
          <p class="text-sm text-gray-500">
            Ingresa el monto.
            {#if precioMoneda === 'USD' && tasa > 0}
              Tasa BCV: {tasa.toFixed(2)} Bs.
            {/if}
          </p>
        </div>
        <div class="flex gap-2">
          <!-- Currency toggle -->
          <div class="flex overflow-hidden rounded-lg border border-gray-300">
            <button
              type="button"
              class="px-3 py-2 text-xs font-medium transition-colors {precioMoneda === 'VES'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}"
              onclick={() => (precioMoneda = 'VES')}
            >
              VES
            </button>
            <button
              type="button"
              class="px-3 py-2 text-xs font-medium transition-colors {precioMoneda === 'USD'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}"
              onclick={() => (precioMoneda = 'USD')}
            >
              USD
            </button>
          </div>
          <!-- Amount input -->
          <div class="flex flex-1 flex-col gap-1">
            {#if precioMoneda === 'VES'}
              <input
                id="precio-ves"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class={inputClass}
                bind:value={precioConsultaVES}
              />
            {:else}
              <input
                id="precio-usd"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class={inputClass}
                bind:value={precioConsultaUSD}
              />
            {/if}
          </div>
        </div>
        {#if precioMoneda === 'USD' && precioConsultaUSD > 0 && tasa > 0}
          <p class="text-xs text-gray-500">
            Equivale a {(precioConsultaUSD * tasa).toFixed(2)} Bs.
          </p>
        {/if}
        {#if errors.precio}
          <p class={errorClass}>{errors.precio}</p>
        {/if}
      </div>

      <!-- Continue button -->
      <button
        type="button"
        onclick={handleContinuar}
        class="btn-primary"
        disabled={!puedeContinar}
      >
        Continuar →
      </button>
    </div>

  <!-- ── STEP 2: paciente ───────────────────────────────────────────────── -->
  {:else if step === 'paciente'}
    <div class="flex flex-col gap-4 px-4 pb-8 pt-4">
      <!-- Step indicator -->
      <div class="flex items-center gap-2">
        <div
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-xs font-semibold text-white"
        >
          ✓
        </div>
        <span class="text-xs font-medium text-gray-400">Médico y horario</span>
        <div class="h-px flex-1 bg-[#2D6A4F]"></div>
        <div
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-xs font-semibold text-white"
        >
          2
        </div>
        <span class="text-xs font-medium text-gray-900">Paciente</span>
      </div>

      <!-- Summary card -->
      <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <Stethoscope class="h-5 w-5 shrink-0 text-gray-400" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-gray-900">{medicoNombre}</p>
          <p class="truncate text-xs capitalize text-gray-500">{fechaFormateada} · {hora}</p>
        </div>
        <button
          type="button"
          class="shrink-0 text-xs font-medium text-[#2D6A4F]"
          onclick={() => {
            step = 'medico-fecha';
          }}
        >
          Cambiar
        </button>
      </div>

      <!-- Card: Paciente -->
      <div class="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p class="font-semibold text-gray-900">Paciente</p>
          <p class="text-sm text-gray-500">Selecciona el paciente y describe el motivo.</p>
        </div>

        <!-- Paciente select -->
        <div class="flex flex-col gap-1">
          <label for="paciente" class={labelClass}>Paciente</label>
          {#if $patientsQuery.isPending}
            <div class="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 class="h-4 w-4 animate-spin" />
              Cargando pacientes...
            </div>
          {:else}
            <select id="paciente" class={inputClass} bind:value={pacienteId}>
              <option value="">Seleccionar paciente</option>
              {#each ($patientsQuery.data ?? []) as p (p.id)}
                <option value={p.id}>{p.nombre} · {p.cedula}</option>
              {/each}
            </select>
          {/if}
          {#if errors.paciente}
            <p class={errorClass}>{errors.paciente}</p>
          {/if}
        </div>

        <!-- Motivo textarea -->
        <div class="flex flex-col gap-1">
          <label for="motivo" class={labelClass}>Motivo de la cita</label>
          <textarea
            id="motivo"
            rows={3}
            placeholder="Describe brevemente el motivo..."
            class={inputClass}
            bind:value={motivo}
          ></textarea>
          {#if errors.motivo}
            <p class={errorClass}>{errors.motivo}</p>
          {/if}
        </div>
      </div>

      <!-- Conflict error -->
      {#if conflictoError}
        <div class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-xs font-semibold text-red-800">{conflictoError}</p>
        </div>
      {/if}

      <!-- Action row -->
      <div class="flex gap-2">
        <button
          type="button"
          class="btn-outline flex-1"
          onclick={() => {
            step = 'medico-fecha';
          }}
        >
          ← Volver
        </button>
        <button
          type="button"
          class="btn-primary flex-1"
          onclick={handleGuardar}
          disabled={$appointmentMutation.isPending}
        >
          {#if $appointmentMutation.isPending}
            <Loader2 class="h-4 w-4 animate-spin" />
            Agendando...
          {:else}
            Agendar cita
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
