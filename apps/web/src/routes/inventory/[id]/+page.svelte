<script lang="ts">
  import { page } from '$app/state';
  import { DateTime } from 'luxon';
  import { Drawer } from 'vaul-svelte';
  import {
    ArrowLeft,
    Pencil,
    Pill,
    Stethoscope,
    ArrowRightLeft,
    ChevronDown,
    ChevronUp,
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    X,
    Clock,
  } from 'lucide-svelte';
  import StockIndicator from '$lib/components/custom/stock-indicator.svelte';
  import ExpiryIndicator from '$lib/components/custom/expiry-indicator.svelte';

  const INSUMOS = [
    { id: 'inv1', tipo: 'medicamento', nombre: 'Paracetamol 500mg', presentacion: 'Caja x 20 tab', stockDisponible: 8, cantidadInicial: 15, fechaVencimiento: '2026-06-30', lote: 'L2025-01', precioRef: 80, categoria: 'Analgésico', principioActivo: 'Paracetamol', laboratorio: 'Lab. Nacional', formaFarmaceutica: 'Tableta', empaque: 'Caja', observaciones: '' },
    { id: 'inv2', tipo: 'medicamento', nombre: 'Ibuprofeno 400mg', presentacion: 'Caja x 10 tab', stockDisponible: 2, cantidadInicial: 10, fechaVencimiento: '2026-09-15', lote: 'L2025-02', precioRef: 75, categoria: 'Antiinflamatorio', principioActivo: 'Ibuprofeno', laboratorio: 'Farma Bolívar', formaFarmaceutica: 'Tableta', empaque: 'Caja', observaciones: 'Usar con comida' },
    { id: 'inv3', tipo: 'medicamento', nombre: 'Amoxicilina 500mg', presentacion: 'Caja x 12 cap', stockDisponible: 0, cantidadInicial: 5, fechaVencimiento: '2026-03-01', lote: 'L2025-03', precioRef: 120, categoria: 'Antibiótico', principioActivo: 'Amoxicilina', laboratorio: 'BioFarma', formaFarmaceutica: 'Cápsula', empaque: 'Caja', observaciones: '' },
    { id: 'inv4', tipo: 'material', nombre: 'Guantes de látex', presentacion: 'Caja x 100 uds', stockDisponible: 4, cantidadInicial: 10, fechaVencimiento: '2027-01-01', lote: 'L2025-04', precioRef: 300, categoria: 'Protección', principioActivo: '', laboratorio: '', formaFarmaceutica: '', empaque: 'Caja', observaciones: '' },
    { id: 'inv5', tipo: 'medicamento', nombre: 'Vitamina C 500mg', presentacion: 'Frasco x 30 comp', stockDisponible: 9, cantidadInicial: 9, fechaVencimiento: '2026-12-31', lote: 'L2025-05', precioRef: 60, categoria: 'Vitaminas', principioActivo: 'Ácido ascórbico', laboratorio: 'Vitapharma', formaFarmaceutica: 'Comprimido', empaque: 'Frasco', observaciones: '' },
    { id: 'inv6', tipo: 'material', nombre: 'Gasas estériles', presentacion: 'Caja x 50 uds', stockDisponible: 1, cantidadInicial: 8, fechaVencimiento: '2027-06-30', lote: 'L2025-06', precioRef: 150, categoria: 'Curaciones', principioActivo: '', laboratorio: '', formaFarmaceutica: '', empaque: 'Caja', observaciones: '' },
    { id: 'inv7', tipo: 'material', nombre: 'Jeringas 5ml', presentacion: 'Caja x 100 uds', stockDisponible: 6, cantidadInicial: 6, fechaVencimiento: '2028-01-01', lote: 'L2025-07', precioRef: 190, categoria: 'Inyectables', principioActivo: '', laboratorio: '', formaFarmaceutica: '', empaque: 'Caja', observaciones: '' },
  ];

  const HISTORIAL = [
    { id: 'h1', fecha: '2025-03-20', tipo: 'dispensacion', cantidad: 2, paciente: 'Ana Torres', personal: 'Lic. López' },
    { id: 'h2', fecha: '2025-03-10', tipo: 'dispensacion', cantidad: 1, paciente: 'Juan Pérez', personal: 'Lic. García' },
    { id: 'h3', fecha: '2025-02-15', tipo: 'ingreso', cantidad: 5, paciente: '', personal: 'Sistema' },
  ];

  // Drawer state
  let dispensarDrawerOpen = $state(false);
  let dispensarCantidad = $state('');
  let dispensarPrecio = $state('');
  let dispensarError = $state('');
  let dispensarGuardado = $state(false);

  // Collapsible historial
  let historialAbierto = $state(false);

  // Derived: find insumo by route param
  const insumo = $derived(INSUMOS.find((i) => i.id === page.params.id));

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("d 'de' LLLL yyyy");
  }

  function handleDispensar() {
    dispensarError = '';
    const cantidad = Number(dispensarCantidad);
    if (!dispensarCantidad || isNaN(cantidad) || cantidad <= 0) {
      dispensarError = 'Ingrese una cantidad válida mayor a 0.';
      return;
    }
    if (!insumo) return;
    if (cantidad > insumo.stockDisponible) {
      dispensarError = `La cantidad no puede superar el stock disponible (${insumo.stockDisponible} uds).`;
      return;
    }
    dispensarGuardado = true;
  }

  function handleCerrarDispensar() {
    dispensarDrawerOpen = false;
    setTimeout(() => {
      dispensarCantidad = '';
      dispensarPrecio = '';
      dispensarError = '';
      dispensarGuardado = false;
    }, 300);
  }
</script>

{#if !insumo}
  <!-- Not found state -->
  <div class="flex flex-col min-h-screen items-center justify-center gap-4 bg-gray-50 px-4 text-center">
    <p class="text-lg font-semibold text-gray-700">Insumo no encontrado</p>
    <a
      href="/inventory"
      class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
    >
      <ArrowLeft class="size-4" />
      Volver al inventario
    </a>
  </div>
{:else}
  <div class="flex flex-col min-h-screen bg-gray-50">
    <!-- Sticky header -->
    <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <a
        href="/inventory"
        class="shrink-0 flex items-center justify-center rounded-md p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Volver al inventario"
      >
        <ArrowLeft class="size-5" />
      </a>

      <h1 class="flex-1 text-base font-semibold text-gray-900 truncate">{insumo.nombre}</h1>

      <a
        href="/inventory/{insumo.id}/edit"
        class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Pencil class="size-4" />
        <span>Editar</span>
      </a>
    </header>

    <main class="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-4">
      <!-- Badges row -->
      <div class="flex flex-wrap items-center gap-2">
        <StockIndicator stockDisponible={insumo.stockDisponible} cantidadInicial={insumo.cantidadInicial} />
        <ExpiryIndicator fechaVencimiento={insumo.fechaVencimiento} />
      </div>

      <!-- Info card -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <!-- Tipo + categoria -->
        <div class="flex items-center gap-2.5">
          <span
            class={[
              'shrink-0 flex items-center justify-center rounded-lg p-2',
              insumo.tipo === 'medicamento' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600',
            ].join(' ')}
          >
            {#if insumo.tipo === 'medicamento'}
              <Pill class="size-5" />
            {:else}
              <Stethoscope class="size-5" />
            {/if}
          </span>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-gray-800">
              {insumo.tipo === 'medicamento' ? 'Medicamento' : 'Material médico'}
            </span>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
              {insumo.categoria}
            </span>
          </div>
        </div>

        <hr class="border-gray-200 my-3" />

        <!-- Info rows -->
        <dl class="space-y-2">
          <div class="flex items-start justify-between gap-4">
            <dt class="text-xs text-gray-500 shrink-0">Presentación</dt>
            <dd class="text-xs font-medium text-gray-800 text-right">{insumo.presentacion}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-xs text-gray-500 shrink-0">Lote</dt>
            <dd class="text-xs font-medium text-gray-800 text-right">{insumo.lote}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-xs text-gray-500 shrink-0">Vencimiento</dt>
            <dd class="text-xs font-medium text-gray-800 text-right capitalize">{formatFecha(insumo.fechaVencimiento)}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-xs text-gray-500 shrink-0">Precio ref.</dt>
            <dd class="text-xs font-medium text-gray-800 text-right">Bs. {insumo.precioRef.toFixed(2)}</dd>
          </div>

          {#if insumo.tipo === 'medicamento'}
            {#if insumo.principioActivo}
              <div class="flex items-start justify-between gap-4">
                <dt class="text-xs text-gray-500 shrink-0">Principio activo</dt>
                <dd class="text-xs font-medium text-gray-800 text-right">{insumo.principioActivo}</dd>
              </div>
            {/if}
            {#if insumo.laboratorio}
              <div class="flex items-start justify-between gap-4">
                <dt class="text-xs text-gray-500 shrink-0">Laboratorio</dt>
                <dd class="text-xs font-medium text-gray-800 text-right">{insumo.laboratorio}</dd>
              </div>
            {/if}
            {#if insumo.formaFarmaceutica}
              <div class="flex items-start justify-between gap-4">
                <dt class="text-xs text-gray-500 shrink-0">Forma farmacéutica</dt>
                <dd class="text-xs font-medium text-gray-800 text-right">{insumo.formaFarmaceutica}</dd>
              </div>
            {/if}
            {#if insumo.empaque}
              <div class="flex items-start justify-between gap-4">
                <dt class="text-xs text-gray-500 shrink-0">Empaque</dt>
                <dd class="text-xs font-medium text-gray-800 text-right">{insumo.empaque}</dd>
              </div>
            {/if}
          {/if}
        </dl>

        {#if insumo.observaciones}
          <hr class="border-gray-200 my-3" />
          <p class="text-xs italic text-gray-500">{insumo.observaciones}</p>
        {/if}
      </div>

      <!-- Dispensar button -->
      <button
        type="button"
        onclick={() => { dispensarDrawerOpen = true; }}
        disabled={insumo.stockDisponible === 0}
        class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowRightLeft class="size-4" />
        Registrar dispensación
      </button>

      <!-- Historial collapsible -->
      <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button
          type="button"
          onclick={() => { historialAbierto = !historialAbierto; }}
          class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <span class="flex items-center gap-2">
            <Clock class="size-4 text-gray-400" />
            Historial de movimientos
          </span>
          {#if historialAbierto}
            <ChevronUp class="size-4 text-gray-400" />
          {:else}
            <ChevronDown class="size-4 text-gray-400" />
          {/if}
        </button>

        {#if historialAbierto}
          <div class="border-t border-gray-100">
            {#if HISTORIAL.length === 0}
              <p class="px-4 py-6 text-center text-xs text-gray-400">Sin movimientos registrados.</p>
            {:else}
              <ul class="divide-y divide-gray-100">
                {#each HISTORIAL as mov (mov.id)}
                  <li class="flex items-start gap-3 px-4 py-3">
                    <!-- Type icon -->
                    <span
                      class={[
                        'mt-0.5 shrink-0 flex items-center justify-center rounded-full p-1.5',
                        mov.tipo === 'ingreso'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-primary/10 text-primary',
                      ].join(' ')}
                    >
                      {#if mov.tipo === 'ingreso'}
                        <ArrowDown class="size-3.5" />
                      {:else}
                        <ArrowUp class="size-3.5" />
                      {/if}
                    </span>

                    <!-- Details -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-semibold text-gray-700">
                          {mov.tipo === 'ingreso' ? 'Ingreso' : 'Dispensación'}
                        </span>
                        <span class="text-xs text-gray-400 shrink-0 capitalize">
                          {DateTime.fromISO(mov.fecha).setLocale('es').toFormat("d 'de' LLLL yyyy")}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 mt-0.5">
                        {mov.cantidad} ud{mov.cantidad !== 1 ? 's' : ''}
                        {#if mov.paciente}
                          · {mov.paciente}
                        {/if}
                        · {mov.personal}
                      </p>
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
      </div>
    </main>
  </div>

  <!-- Dispensar Drawer -->
  <Drawer.Root bind:open={dispensarDrawerOpen} onClose={handleCerrarDispensar}>
    <Drawer.Portal>
      <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />
      <Drawer.Content
        class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white border-t max-h-[90svh] outline-none"
      >
        <!-- Drag handle -->
        <div class="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-gray-300"></div>

        <div class="overflow-y-auto px-4 pb-8 pt-2">
          {#if !dispensarGuardado}
            <!-- Form -->
            <div class="flex items-center justify-between mb-4">
              <Drawer.Title class="text-base font-semibold text-gray-900">Registrar dispensación</Drawer.Title>
              <button
                type="button"
                onclick={handleCerrarDispensar}
                class="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X class="size-4" />
              </button>
            </div>

            <!-- Insumo info row -->
            <div class="flex items-center justify-between gap-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 mb-4">
              <span class="text-sm font-medium text-gray-800 truncate">{insumo.nombre}</span>
              <span class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                {insumo.stockDisponible} uds
              </span>
            </div>

            <!-- Fields -->
            <div class="space-y-4">
              <!-- Cantidad -->
              <div class="space-y-1">
                <label for="dispensar-cantidad" class="text-xs font-medium text-gray-700">
                  Cantidad <span class="text-red-500">*</span>
                </label>
                <input
                  id="dispensar-cantidad"
                  type="number"
                  min="1"
                  max={insumo.stockDisponible}
                  bind:value={dispensarCantidad}
                  placeholder="0"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              <!-- Precio ref -->
              <div class="space-y-1">
                <label for="dispensar-precio" class="text-xs font-medium text-gray-700">
                  Precio de referencia (Bs.)
                </label>
                <input
                  id="dispensar-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  bind:value={dispensarPrecio}
                  placeholder={insumo.precioRef.toString()}
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>

            <!-- Inline error -->
            {#if dispensarError}
              <p class="mt-3 text-xs text-red-600">{dispensarError}</p>
            {/if}

            <!-- Action button -->
            <button
              type="button"
              onclick={handleDispensar}
              class="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Registrar
            </button>
          {:else}
            <!-- Success state -->
            <div class="flex flex-col items-center gap-4 py-10 text-center">
              <CheckCircle2 class="size-12 text-emerald-500" />
              <div class="space-y-1">
                <p class="text-base font-semibold text-gray-900">Dispensación registrada</p>
                <p class="text-sm text-gray-500">El movimiento fue registrado correctamente.</p>
              </div>
              <button
                type="button"
                onclick={handleCerrarDispensar}
                class="mt-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          {/if}
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
{/if}
