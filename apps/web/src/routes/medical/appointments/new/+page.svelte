<script lang="ts">
  import { DateTime } from 'luxon';
  import { ArrowLeft, CheckCircle2, AlertTriangle, Stethoscope } from 'lucide-svelte';

  // ── Mock data ──────────────────────────────────────────────────────────────
  const MEDICOS = [
    { id: 'm1', nombre: 'Dra. García', especialidad: 'Medicina general' },
    { id: 'm2', nombre: 'Dr. Rodríguez', especialidad: 'Medicina interna' },
    { id: 'm3', nombre: 'Dr. Pérez', especialidad: 'Medicina general' },
  ];

  const PACIENTES = [
    { id: '1', nombre: 'Ana Sofía Ramírez Torres', cedula: 'V-12.345.678' },
    { id: '2', nombre: 'Carlos Medina López', cedula: 'V-9.876.543' },
    { id: '3', nombre: 'María González Pérez', cedula: 'V-15.432.100' },
    { id: '4', nombre: 'José Luis Hernández', cedula: 'V-8.001.234' },
    { id: '5', nombre: 'Luisa Martínez Blanco', cedula: 'V-22.678.901' },
  ];

  const CITAS_EXISTENTES = [
    { medicoId: 'm1', fecha: '2025-06-03', hora: '09:00' },
    { medicoId: 'm1', fecha: '2025-06-03', hora: '10:00' },
    { medicoId: 'm2', fecha: '2025-06-04', hora: '08:00' },
  ];

  // ── Helper ─────────────────────────────────────────────────────────────────
  function checkConflicto(medicoId: string, fecha: string, hora: string): string | null {
    if (!medicoId || !fecha || !hora) return null;
    const [h, m] = hora.split(':').map(Number);
    const mins = h * 60 + m;
    for (const c of CITAS_EXISTENTES) {
      if (c.medicoId !== medicoId || c.fecha !== fecha) continue;
      const [ch, cm] = c.hora.split(':').map(Number);
      const cmins = ch * 60 + cm;
      if (Math.abs(mins - cmins) < 30) {
        return `El médico ya tiene una cita a las ${c.hora}. Se requieren al menos 30 min entre citas.`;
      }
    }
    return null;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let step = $state<'medico-fecha' | 'paciente' | 'confirmado'>('medico-fecha');
  let medicoId = $state('');
  let fecha = $state('');
  let hora = $state('');
  let pacienteId = $state('');
  let motivo = $state('');
  let errors = $state<Record<string, string>>({});
  let disponibilidadChecked = $state(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const conflicto = $derived(checkConflicto(medicoId, fecha, hora));
  const medicoNombre = $derived(MEDICOS.find((m) => m.id === medicoId)?.nombre ?? '');
  const pacienteNombre = $derived(PACIENTES.find((p) => p.id === pacienteId)?.nombre ?? '');
  const fechaFormateada = $derived(
    fecha ? DateTime.fromISO(fecha).setLocale('es').toFormat("EEEE d 'de' LLLL") : ''
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleVerificar() {
    const newErrors: Record<string, string> = {};
    if (!medicoId) newErrors.medico = 'Selecciona un médico.';
    if (!fecha) newErrors.fecha = 'Selecciona una fecha.';
    if (!hora) newErrors.hora = 'Selecciona una hora.';
    errors = newErrors;
    if (Object.keys(newErrors).length > 0) return;
    disponibilidadChecked = true;
  }

  function handleContinuar() {
    if (!disponibilidadChecked || !!conflicto) return;
    step = 'paciente';
  }

  function handleGuardar() {
    const newErrors: Record<string, string> = {};
    if (!pacienteId) newErrors.paciente = 'Selecciona un paciente.';
    if (!motivo.trim()) newErrors.motivo = 'Describe el motivo de la cita.';
    errors = newErrors;
    if (Object.keys(newErrors).length > 0) return;
    step = 'confirmado';
  }

  function resetForm() {
    step = 'medico-fecha';
    medicoId = '';
    fecha = '';
    hora = '';
    pacienteId = '';
    motivo = '';
    errors = {};
    disponibilidadChecked = false;
  }

  // ── Shared classes ─────────────────────────────────────────────────────────
  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'text-xs font-medium text-gray-700';
  const errorClass = 'text-xs text-red-600';
</script>

<style>
  :global(:root) {
    --color-primary: #2D6A4F;
  }

  .btn-primary {
    background-color: #2D6A4F;
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
    color: #2D6A4F;
    border: 1px solid #2D6A4F;
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
    background-color: #2D6A4F10;
  }
</style>

<div class="flex min-h-screen flex-col bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
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
    <div class="px-4 pt-4 pb-8 flex flex-col gap-4">

      <!-- Step indicator -->
      <div class="flex items-center gap-2">
        <!-- Circle 1 (active) -->
        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-xs font-semibold text-white">
          1
        </div>
        <span class="text-xs font-medium text-gray-900">Médico y horario</span>
        <!-- Connector -->
        <div class="h-px flex-1 bg-gray-200"></div>
        <!-- Circle 2 (pending) -->
        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-500">
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
          <select
            id="medico"
            class={inputClass}
            bind:value={medicoId}
            onchange={() => { disponibilidadChecked = false; }}
          >
            <option value="">Seleccionar médico</option>
            {#each MEDICOS as medico (medico.id)}
              <option value={medico.id}>{medico.nombre} · {medico.especialidad}</option>
            {/each}
          </select>
          {#if errors.medico}
            <p class={errorClass}>{errors.medico}</p>
          {/if}
        </div>
      </div>

      <!-- Card: Fecha y hora -->
      <div class="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p class="font-semibold text-gray-900">Fecha y hora</p>
          <p class="text-sm text-gray-500">
            Horario hábil: 8:00 – 16:00 · Mín. 30 min entre citas.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Date -->
          <div class="flex flex-col gap-1">
            <label for="fecha" class={labelClass}>Fecha</label>
            <input
              id="fecha"
              type="date"
              class={inputClass}
              bind:value={fecha}
              onchange={() => { disponibilidadChecked = false; }}
            />
            {#if errors.fecha}
              <p class={errorClass}>{errors.fecha}</p>
            {/if}
          </div>
          <!-- Time -->
          <div class="flex flex-col gap-1">
            <label for="hora" class={labelClass}>Hora</label>
            <input
              id="hora"
              type="time"
              min="08:00"
              max="16:00"
              class={inputClass}
              bind:value={hora}
              onchange={() => { disponibilidadChecked = false; }}
            />
            {#if errors.hora}
              <p class={errorClass}>{errors.hora}</p>
            {/if}
          </div>
        </div>

        <!-- Availability feedback -->
        {#if disponibilidadChecked && conflicto}
          <div class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p class="text-xs font-semibold text-amber-800">Conflicto de horario</p>
              <p class="text-xs text-amber-700">{conflicto}</p>
            </div>
          </div>
        {:else if disponibilidadChecked && !conflicto && medicoId && fecha && hora}
          <div class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600" />
            <p class="text-xs font-semibold text-emerald-800">Horario disponible</p>
          </div>
        {/if}

        <button type="button" onclick={handleVerificar} class="btn-outline">
          Verificar disponibilidad
        </button>
      </div>

      <!-- Continue button -->
      <button
        type="button"
        onclick={handleContinuar}
        class="btn-primary"
        disabled={!disponibilidadChecked || !!conflicto}
      >
        Continuar →
      </button>
    </div>

  <!-- ── STEP 2: paciente ───────────────────────────────────────────────── -->
  {:else if step === 'paciente'}
    <div class="px-4 pt-4 pb-8 flex flex-col gap-4">

      <!-- Step indicator -->
      <div class="flex items-center gap-2">
        <!-- Circle 1 (done) -->
        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-xs font-semibold text-white">
          ✓
        </div>
        <span class="text-xs font-medium text-gray-400">Médico y horario</span>
        <!-- Connector -->
        <div class="h-px flex-1 bg-[#2D6A4F]"></div>
        <!-- Circle 2 (active) -->
        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-xs font-semibold text-white">
          2
        </div>
        <span class="text-xs font-medium text-gray-900">Paciente</span>
      </div>

      <!-- Summary card -->
      <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <Stethoscope class="h-5 w-5 shrink-0 text-gray-400" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{medicoNombre}</p>
          <p class="text-xs capitalize text-gray-500 truncate">{fechaFormateada} · {hora}</p>
        </div>
        <button
          type="button"
          class="shrink-0 text-xs font-medium text-[#2D6A4F]"
          onclick={() => { step = 'medico-fecha'; disponibilidadChecked = false; }}
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
          <select id="paciente" class={inputClass} bind:value={pacienteId}>
            <option value="">Seleccionar paciente</option>
            {#each PACIENTES as paciente (paciente.id)}
              <option value={paciente.id}>{paciente.nombre} · {paciente.cedula}</option>
            {/each}
          </select>
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

      <!-- Action row -->
      <div class="flex gap-2">
        <button
          type="button"
          class="btn-outline flex-1"
          onclick={() => { step = 'medico-fecha'; }}
        >
          ← Volver
        </button>
        <button type="button" class="btn-primary flex-1" onclick={handleGuardar}>
          Agendar cita
        </button>
      </div>
    </div>
  {/if}
</div>
