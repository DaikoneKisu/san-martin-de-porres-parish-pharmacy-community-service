<script lang="ts">
  import { DateTime } from 'luxon';
  import {
    ArrowLeft,
    User2,
    Stethoscope,
    Calendar,
    FileText,
    ImageIcon,
    Package,
  } from 'lucide-svelte';

  const RECIPE = {
    id: 'r1',
    paciente: 'Ana Sofía Ramírez Torres',
    cedula: 'V-12.345.678',
    medico: 'Dr. Fuentes',
    fecha: '2025-05-10',
    dispensado: true,
    lineas: [
      { insumoId: '5', nombre: 'Enalapril 10mg', cantidad: 30, precioUnit: 2.0 },
      { insumoId: '3', nombre: 'Metformina 850mg', cantidad: 60, precioUnit: 3.2 },
    ],
    registradoPor: 'Farm. Rodríguez',
    fechaRegistro: '2025-05-10',
  };

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("dd 'de' LLLL yyyy");
  }

  const total = $derived(
    RECIPE.lineas.reduce((s, l) => s + l.cantidad * l.precioUnit, 0)
  );
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
    <a
      href="/medical/external-recipes"
      class="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
      aria-label="Volver"
    >
      <ArrowLeft size={20} />
    </a>
    <h1 class="flex-1 text-lg font-bold text-gray-900">Récipe externo</h1>
    {#if RECIPE.dispensado}
      <span
        class="bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full px-2.5 py-0.5 text-xs font-medium"
      >
        Dispensado
      </span>
    {:else}
      <span
        class="bg-amber-50 text-amber-700 border border-amber-300 rounded-full px-2.5 py-0.5 text-xs font-medium"
      >
        Pendiente
      </span>
    {/if}
  </div>

  <!-- Main content -->
  <div class="max-w-2xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
    <!-- Info card -->
    <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Información</p>

      <!-- Paciente -->
      <div class="flex items-start gap-3">
        <User2 size={16} class="text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p class="text-xs text-gray-400">Paciente</p>
          <p class="text-sm font-medium text-gray-900">{RECIPE.paciente} · {RECIPE.cedula}</p>
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Médico -->
      <div class="flex items-start gap-3">
        <Stethoscope size={16} class="text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p class="text-xs text-gray-400">Médico emisor</p>
          <p class="text-sm font-medium text-gray-900">{RECIPE.medico}</p>
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Fecha -->
      <div class="flex items-start gap-3">
        <Calendar size={16} class="text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p class="text-xs text-gray-400">Fecha del récipe</p>
          <p class="text-sm font-medium text-gray-900">{formatFecha(RECIPE.fecha)}</p>
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Registrado por -->
      <div class="flex items-start gap-3">
        <FileText size={16} class="text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p class="text-xs text-gray-400">Registrado por</p>
          <p class="text-sm font-medium text-gray-900">
            {RECIPE.registradoPor} · {formatFecha(RECIPE.fechaRegistro)}
          </p>
        </div>
      </div>
    </div>

    <!-- Fotografía card -->
    <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Fotografía del récipe</p>

      <div
        class="rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 h-40 flex flex-col items-center justify-center gap-2"
      >
        <ImageIcon size={28} class="text-gray-300" />
        <p class="text-sm text-gray-400">recipe_externo.jpg</p>
        <button
          type="button"
          class="mt-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Ver imagen
        </button>
      </div>
    </div>

    <!-- Medicamentos dispensados card -->
    <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Medicamentos dispensados
      </p>

      <div class="flex flex-col divide-y divide-gray-100">
        {#each RECIPE.lineas as linea (linea.insumoId)}
          <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Package size={16} class="text-gray-400 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{linea.nombre}</p>
              <p class="text-xs text-gray-500">
                {linea.cantidad} uds × Bs. {linea.precioUnit.toFixed(2)}
              </p>
            </div>
            <p class="text-sm font-medium text-gray-900 shrink-0">
              Bs. {(linea.cantidad * linea.precioUnit).toFixed(2)}
            </p>
          </div>
        {/each}
      </div>

      <hr class="border-gray-100" />

      <!-- Total row -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">Total referencial</p>
        <p class="text-sm font-semibold text-gray-900">Bs. {total.toFixed(2)}</p>
      </div>
    </div>
  </div>
</div>
