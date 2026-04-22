<script lang="ts">
  import { DateTime } from 'luxon';
  import {
    AlertTriangle,
    Camera,
    CheckCircle2,
    Plus,
    Trash2,
    ImageIcon,
    Search,
    X,
    Package,
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';

  const PACIENTES = [
    { id: '1', nombre: 'Ana Sofía Ramírez Torres', cedula: 'V-12.345.678' },
    { id: '2', nombre: 'Carlos Medina López', cedula: 'V-9.876.543' },
    { id: '3', nombre: 'María González Pérez', cedula: 'V-15.432.100' },
    { id: '4', nombre: 'José Luis Hernández', cedula: 'V-8.001.234' },
  ];

  const INSUMOS_DISPONIBLES = [
    { id: '1', nombre: 'Amoxicilina 500mg', stock: 120, precioRef: 2.5 },
    { id: '5', nombre: 'Enalapril 10mg', stock: 60, precioRef: 2.0 },
    { id: '7', nombre: 'Loratadina 10mg', stock: 30, precioRef: 1.2 },
    { id: '3', nombre: 'Metformina 850mg', stock: 0, precioRef: 3.2 },
  ];

  type Linea = { insumoId: string; nombre: string; cantidad: number; precioUnit: number };

  // Form state
  let pacienteId = $state('');
  let medicoExt = $state('');
  let fecha = $state(DateTime.now().toISODate() ?? '');
  let fotoCapturada = $state(false);
  let lineas = $state<Linea[]>([]);
  let errors = $state<Record<string, string>>({});
  let insumoDrawerOpen = $state(false);
  let saved = $state(false);

  // Insumo drawer state
  let insumoSearch = $state('');
  let insumoQtys = $state<Record<string, string>>({});

  const filteredInsumos = $derived(
    INSUMOS_DISPONIBLES.filter((i) =>
      i.nombre.toLowerCase().includes(insumoSearch.toLowerCase())
    )
  );

  const total = $derived(lineas.reduce((sum, l) => sum + l.cantidad * l.precioUnit, 0));

  function handleGuardar() {
    const newErrors: Record<string, string> = {};

    if (!pacienteId) newErrors.paciente = 'Selecciona un paciente.';
    if (!medicoExt.trim()) newErrors.medico = 'Ingresa el nombre del médico emisor.';
    if (!fecha) newErrors.fecha = 'Selecciona la fecha del récipe.';
    if (!fotoCapturada) newErrors.foto = 'Se requiere fotografía del récipe físico.';
    if (lineas.length === 0) newErrors.lineas = 'Agrega al menos un medicamento a dispensar.';

    errors = newErrors;

    if (Object.keys(newErrors).length === 0) {
      saved = true;
    }
  }

  function handleAgregarInsumos() {
    for (const insumo of filteredInsumos) {
      const raw = insumoQtys[insumo.id];
      if (!raw) continue;
      const qty = parseInt(raw, 10);
      if (!Number.isFinite(qty) || qty <= 0 || qty > insumo.stock) continue;

      const existing = lineas.findIndex((l) => l.insumoId === insumo.id);
      if (existing >= 0) {
        lineas[existing].cantidad = qty;
      } else {
        lineas.push({
          insumoId: insumo.id,
          nombre: insumo.nombre,
          cantidad: qty,
          precioUnit: insumo.precioRef,
        });
      }
    }

    insumoDrawerOpen = false;
    insumoSearch = '';
    insumoQtys = {};
  }

  function removeLinea(insumoId: string) {
    lineas = lineas.filter((l) => l.insumoId !== insumoId);
  }

  function resetAll() {
    pacienteId = '';
    medicoExt = '';
    fecha = DateTime.now().toISODate() ?? '';
    fotoCapturada = false;
    lineas = [];
    errors = {};
    insumoSearch = '';
    insumoQtys = {};
    saved = false;
  }
</script>

{#if saved}
  <!-- Success screen -->
  <div class="flex flex-col items-center justify-center min-h-screen gap-5 px-6 text-center bg-gray-50">
    <div class="flex items-center justify-center rounded-full bg-emerald-100 p-5">
      <CheckCircle2 size={64} class="text-emerald-600" />
    </div>
    <div class="flex flex-col gap-1">
      <h2 class="text-xl font-bold text-gray-900">Récipe registrado</h2>
      <p class="text-sm text-gray-500">La dispensación quedó registrada en el inventario.</p>
    </div>
    <div class="flex flex-col gap-3 w-full max-w-xs">
      <a
        href="/medical/external-recipes"
        class="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors"
        style="background-color: #2D6A4F;"
      >
        Ver récipes
      </a>
      <button
        type="button"
        onclick={resetAll}
        class="flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Registrar otro
      </button>
    </div>
  </div>
{:else}
  <div class="flex flex-col min-h-screen bg-gray-50">
    <!-- Sticky header -->
    <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
      <a
        href="/medical/external-recipes"
        class="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Cancelar y volver"
      >
        <X size={20} />
      </a>
      <h1 class="flex-1 text-lg font-bold text-gray-900">Nuevo récipe externo</h1>
    </div>

    <!-- Form content -->
    <div class="flex flex-col gap-4 px-4 pt-4 pb-28 max-w-2xl w-full mx-auto">

      <!-- Section 1: Datos del récipe -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-4">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Datos del récipe</p>

        <!-- Paciente -->
        <div class="flex flex-col gap-1.5">
          <label for="paciente" class="text-sm font-medium text-gray-700">Paciente</label>
          <select
            id="paciente"
            bind:value={pacienteId}
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={errors.paciente ? 'border-color: #ef4444;' : ''}
          >
            <option value="">Seleccionar paciente</option>
            {#each PACIENTES as p (p.id)}
              <option value={p.id}>{p.nombre} · {p.cedula}</option>
            {/each}
          </select>
          {#if errors.paciente}
            <p class="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {errors.paciente}
            </p>
          {/if}
        </div>

        <!-- Médico -->
        <div class="flex flex-col gap-1.5">
          <label for="medico" class="text-sm font-medium text-gray-700">
            Médico que emitió el récipe
          </label>
          <input
            id="medico"
            type="text"
            bind:value={medicoExt}
            placeholder="Nombre del médico externo"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={errors.medico ? 'border-color: #ef4444;' : ''}
          />
          {#if errors.medico}
            <p class="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {errors.medico}
            </p>
          {/if}
        </div>

        <!-- Fecha -->
        <div class="flex flex-col gap-1.5">
          <label for="fecha" class="text-sm font-medium text-gray-700">Fecha del récipe</label>
          <input
            id="fecha"
            type="date"
            bind:value={fecha}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={errors.fecha ? 'border-color: #ef4444;' : ''}
          />
          {#if errors.fecha}
            <p class="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {errors.fecha}
            </p>
          {/if}
        </div>
      </div>

      <!-- Section 2: Fotografía -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Fotografía del récipe físico
        </p>
        <p class="text-sm text-gray-500">
          Captura o adjunta una foto del récipe original para el registro.
        </p>

        {#if fotoCapturada}
          <div
            class="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3"
          >
            <ImageIcon size={20} class="text-emerald-600 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-emerald-800">Foto capturada</p>
              <p class="text-xs text-emerald-600">recipe_externo.jpg</p>
            </div>
            <button
              type="button"
              onclick={() => (fotoCapturada = false)}
              class="text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Cambiar
            </button>
          </div>
        {:else}
          <div
            class="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 py-8"
          >
            <Camera size={28} class="text-gray-300" />
            <p class="text-sm font-medium text-gray-500">Tomar foto o adjuntar</p>
            <p class="text-xs text-gray-400">JPG, PNG — máx. 10 MB</p>
          </div>
          <button
            type="button"
            onclick={() => (fotoCapturada = true)}
            class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Camera size={16} />
            Simular captura de foto
          </button>
          {#if errors.foto}
            <p class="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {errors.foto}
            </p>
          {/if}
        {/if}
      </div>

      <!-- Section 3: Medicamentos -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Medicamentos a dispensar
        </p>

        {#if lineas.length > 0}
          <div class="rounded-lg border divide-y divide-gray-100">
            {#each lineas as linea (linea.insumoId)}
              <div class="flex items-center gap-3 px-3 py-3">
                <Package size={16} class="text-gray-400 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{linea.nombre}</p>
                  <p class="text-xs text-gray-500">
                    {linea.cantidad} uds × Bs. {linea.precioUnit.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => removeLinea(linea.insumoId)}
                  class="flex items-center justify-center p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                  aria-label="Eliminar {linea.nombre}"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            {/each}
          </div>
        {/if}

        {#if errors.lineas}
          <p class="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle size={12} />
            {errors.lineas}
          </p>
        {/if}

        <button
          type="button"
          onclick={() => (insumoDrawerOpen = true)}
          class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Plus size={16} />
          Agregar medicamentos
        </button>

        {#if lineas.length > 0}
          <hr class="border-gray-100" />
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">Total referencial</p>
            <p class="text-sm font-semibold text-gray-900">Bs. {total.toFixed(2)}</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Fixed bottom bar -->
    <div
      class="fixed bottom-0 left-0 right-0 md:pl-64 bg-white border-t px-4 py-3 flex gap-2 z-10"
    >
      <a
        href="/medical/external-recipes"
        class="flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Cancelar
      </a>
      <button
        type="button"
        onclick={handleGuardar}
        class="flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors"
        style="background-color: #2D6A4F;"
      >
        Guardar y dispensar
      </button>
    </div>
  </div>

  <!-- Insumo Drawer -->
  <Drawer.Root bind:open={insumoDrawerOpen} onClose={() => (insumoDrawerOpen = false)}>
    <Drawer.Portal>
      <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
      <Drawer.Content
        class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[85vh]"
      >
        <!-- Drag handle -->
        <div class="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-gray-300 shrink-0"></div>

        <!-- Header -->
        <div class="flex items-center justify-between px-4 pb-3 border-b shrink-0">
          <h2 class="text-base font-semibold text-gray-900">Medicamentos a dispensar</h2>
          <button
            type="button"
            onclick={() => (insumoDrawerOpen = false)}
            class="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <!-- Search -->
        <div class="px-4 py-3 shrink-0">
          <div class="relative">
            <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              bind:value={insumoSearch}
              placeholder="Buscar medicamento..."
              class="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
            />
          </div>
        </div>

        <!-- Insumo list -->
        <div class="flex-1 overflow-y-auto px-4 pb-4">
          <div class="flex flex-col divide-y divide-gray-100">
            {#each filteredInsumos as insumo (insumo.id)}
              <div class="flex items-center gap-3 py-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{insumo.nombre}</p>
                  <p class="text-xs text-gray-500">Stock: {insumo.stock}</p>
                </div>
                {#if insumo.stock === 0}
                  <span
                    class="rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-2.5 py-0.5 shrink-0"
                  >
                    Agotado
                  </span>
                {:else}
                  <input
                    type="number"
                    min="1"
                    max={insumo.stock}
                    placeholder="0"
                    bind:value={insumoQtys[insumo.id]}
                    class="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-offset-0 shrink-0"
                  />
                {/if}
              </div>
            {/each}

            {#if filteredInsumos.length === 0}
              <p class="py-8 text-center text-sm text-gray-400">Sin resultados</p>
            {/if}
          </div>
        </div>

        <!-- Confirm button -->
        <div class="px-4 pb-6 pt-3 border-t shrink-0">
          <button
            type="button"
            onclick={handleAgregarInsumos}
            class="w-full flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors"
            style="background-color: #2D6A4F;"
          >
            Agregar seleccionados
          </button>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
{/if}
