<script lang="ts">
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { ArrowLeft, CheckCircle2 } from 'lucide-svelte';

  const INSUMOS = [
    { id: 'inv1', tipo: 'medicamento', nombre: 'Paracetamol 500mg', presentacion: 'Caja x 20 tab', stockDisponible: 8, cantidadInicial: 15, fechaVencimiento: '2026-06-30', lote: 'L2025-01', precioRef: 80, stockMinimo: 3, categoria: 'Analgésico', principioActivo: 'Paracetamol', laboratorio: 'Lab. Nacional', formaFarmaceutica: 'Tableta', empaque: 'Caja', observaciones: '' },
    { id: 'inv2', tipo: 'medicamento', nombre: 'Ibuprofeno 400mg', presentacion: 'Caja x 10 tab', stockDisponible: 2, cantidadInicial: 10, fechaVencimiento: '2026-09-15', lote: 'L2025-02', precioRef: 75, stockMinimo: 3, categoria: 'Antiinflamatorio', principioActivo: 'Ibuprofeno', laboratorio: 'Farma Bolívar', formaFarmaceutica: 'Tableta', empaque: 'Caja', observaciones: 'Usar con comida' },
    { id: 'inv3', tipo: 'medicamento', nombre: 'Amoxicilina 500mg', presentacion: 'Caja x 12 cap', stockDisponible: 0, cantidadInicial: 5, fechaVencimiento: '2026-03-01', lote: 'L2025-03', precioRef: 120, stockMinimo: 2, categoria: 'Antibiótico', principioActivo: 'Amoxicilina', laboratorio: 'BioFarma', formaFarmaceutica: 'Cápsula', empaque: 'Caja', observaciones: '' },
    { id: 'inv4', tipo: 'material', nombre: 'Guantes de látex', presentacion: 'Caja x 100 uds', stockDisponible: 4, cantidadInicial: 10, fechaVencimiento: '2027-01-01', lote: 'L2025-04', precioRef: 300, stockMinimo: 2, categoria: 'Protección', principioActivo: '', laboratorio: '', formaFarmaceutica: '', empaque: 'Caja', observaciones: '' },
    { id: 'inv5', tipo: 'medicamento', nombre: 'Vitamina C 500mg', presentacion: 'Frasco x 30 comp', stockDisponible: 9, cantidadInicial: 9, fechaVencimiento: '2026-12-31', lote: 'L2025-05', precioRef: 60, stockMinimo: 3, categoria: 'Vitaminas', principioActivo: 'Ácido ascórbico', laboratorio: 'Vitapharma', formaFarmaceutica: 'Comprimido', empaque: 'Frasco', observaciones: '' },
    { id: 'inv6', tipo: 'material', nombre: 'Gasas estériles', presentacion: 'Caja x 50 uds', stockDisponible: 1, cantidadInicial: 8, fechaVencimiento: '2027-06-30', lote: 'L2025-06', precioRef: 150, stockMinimo: 2, categoria: 'Curaciones', principioActivo: '', laboratorio: '', formaFarmaceutica: '', empaque: 'Caja', observaciones: '' },
    { id: 'inv7', tipo: 'material', nombre: 'Jeringas 5ml', presentacion: 'Caja x 100 uds', stockDisponible: 6, cantidadInicial: 6, fechaVencimiento: '2028-01-01', lote: 'L2025-07', precioRef: 190, stockMinimo: 2, categoria: 'Inyectables', principioActivo: '', laboratorio: '', formaFarmaceutica: '', empaque: 'Caja', observaciones: '' },
  ];

  const insumo = $derived(INSUMOS.find(i => i.id === page.params.id));

  // Initialize form state directly from insumo using untrack so the user's edits
  // are not overwritten on reactive re-runs triggered by page.params.id changes.
  let form = $state(
    untrack(() => {
      const found = INSUMOS.find(i => i.id === page.params.id);
      return {
        nombre: found?.nombre ?? '',
        presentacion: found?.presentacion ?? '',
        lote: found?.lote ?? '',
        vencimiento: found?.fechaVencimiento ?? '',
        stockMinimo: found?.stockMinimo ?? 0,
        precioRef: found?.precioRef ?? 0,
        categoria: found?.categoria ?? '',
        principioActivo: found?.principioActivo ?? '',
        laboratorio: found?.laboratorio ?? '',
        formaFarmaceutica: found?.formaFarmaceutica ?? '',
        empaque: found?.empaque ?? '',
        observaciones: found?.observaciones ?? ''
      };
    })
  );

  let guardado = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    guardado = true;
  }

  const inputClass =
    'w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'text-xs font-medium text-foreground';
  const sectionLabelClass = 'text-sm font-semibold text-foreground mb-3';
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
    <a href="/inventory/{page.params.id}" class="text-gray-500 hover:text-gray-700 transition-colors">
      <ArrowLeft size={20} />
    </a>
    <h1 class="text-base font-semibold text-foreground">Editar insumo</h1>
  </header>

  <!-- Main content -->
  <main class="flex-1 px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
    {#if !insumo}
      <!-- Not found state -->
      <div class="flex flex-col items-center justify-center py-16 gap-4">
        <p class="text-sm text-muted-foreground">Insumo no encontrado.</p>
        <a href="/inventory" class="text-sm font-medium text-primary hover:underline">
          Volver al inventario
        </a>
      </div>
    {:else if guardado}
      <!-- Success state -->
      <div class="flex flex-col items-center justify-center py-16 gap-4">
        <CheckCircle2 size={48} class="text-emerald-500" />
        <h2 class="text-lg font-semibold text-foreground">Cambios guardados</h2>
        <p class="text-sm text-muted-foreground text-center">
          El insumo fue actualizado correctamente.
        </p>
        <a href="/inventory/{page.params.id}" class="text-sm font-medium text-primary hover:underline">
          Ver insumo →
        </a>
      </div>
    {:else}
      <form id="edit-form" onsubmit={handleSubmit} class="space-y-4">
        <!-- Section 1: Identificación -->
        <section class="rounded-xl border bg-white p-4 space-y-4">
          <p class={sectionLabelClass}>Identificación</p>

          <div class="space-y-1">
            <label for="nombre" class={labelClass}>Nombre *</label>
            <input
              id="nombre"
              type="text"
              bind:value={form.nombre}
              class={inputClass}
              required
            />
          </div>

          <div class="space-y-1">
            <label for="presentacion" class={labelClass}>Presentación *</label>
            <input
              id="presentacion"
              type="text"
              bind:value={form.presentacion}
              placeholder="Caja x 20 tab"
              class={inputClass}
              required
            />
          </div>

          <div class="space-y-1">
            <label for="lote" class={labelClass}>Lote</label>
            <input
              id="lote"
              type="text"
              bind:value={form.lote}
              class={inputClass}
            />
          </div>

          <div class="space-y-1">
            <label for="vencimiento" class={labelClass}>Vencimiento</label>
            <input
              id="vencimiento"
              type="date"
              bind:value={form.vencimiento}
              class={inputClass}
            />
          </div>
        </section>

        <!-- Section 2: Stock y precio -->
        <section class="rounded-xl border bg-white p-4 space-y-4">
          <p class={sectionLabelClass}>Stock y precio</p>

          <div class="space-y-1">
            <label for="stockMinimo" class={labelClass}>Stock mínimo</label>
            <input
              id="stockMinimo"
              type="number"
              min="0"
              bind:value={form.stockMinimo}
              class={inputClass}
            />
          </div>

          <div class="space-y-1">
            <label for="precioRef" class={labelClass}>Precio de referencia Bs.</label>
            <input
              id="precioRef"
              type="number"
              min="0"
              step="0.01"
              bind:value={form.precioRef}
              class={inputClass}
            />
          </div>
        </section>

        <!-- Section 3: Clasificación -->
        <section class="rounded-xl border bg-white p-4 space-y-4">
          <p class={sectionLabelClass}>Clasificación</p>

          <div class="space-y-1">
            <label for="categoria" class={labelClass}>Categoría</label>
            <input
              id="categoria"
              type="text"
              bind:value={form.categoria}
              class={inputClass}
            />
          </div>

          <div class="space-y-1">
            <label for="empaque" class={labelClass}>Empaque</label>
            <input
              id="empaque"
              type="text"
              bind:value={form.empaque}
              class={inputClass}
            />
          </div>

          {#if insumo.tipo === 'medicamento'}
            <div class="space-y-1">
              <label for="principioActivo" class={labelClass}>Principio activo</label>
              <input
                id="principioActivo"
                type="text"
                bind:value={form.principioActivo}
                class={inputClass}
              />
            </div>

            <div class="space-y-1">
              <label for="laboratorio" class={labelClass}>Laboratorio</label>
              <input
                id="laboratorio"
                type="text"
                bind:value={form.laboratorio}
                class={inputClass}
              />
            </div>

            <div class="space-y-1">
              <label for="formaFarmaceutica" class={labelClass}>Forma farmacéutica</label>
              <select
                id="formaFarmaceutica"
                bind:value={form.formaFarmaceutica}
                class={inputClass}
              >
                <option value="">Seleccionar...</option>
                <option value="Tableta">Tableta</option>
                <option value="Cápsula">Cápsula</option>
                <option value="Comprimido">Comprimido</option>
                <option value="Jarabe">Jarabe</option>
                <option value="Suspensión">Suspensión</option>
                <option value="Crema">Crema</option>
                <option value="Ungüento">Ungüento</option>
                <option value="Inyectable">Inyectable</option>
              </select>
            </div>
          {/if}
        </section>

        <!-- Section 4: Observaciones -->
        <section class="rounded-xl border bg-white p-4 space-y-4">
          <p class={sectionLabelClass}>Observaciones</p>

          <div class="space-y-1">
            <label for="observaciones" class={labelClass}>Observaciones</label>
            <textarea
              id="observaciones"
              rows={3}
              bind:value={form.observaciones}
              class={inputClass}
            ></textarea>
          </div>
        </section>
      </form>
    {/if}
  </main>

  <!-- Fixed bottom bar -->
  {#if insumo && !guardado}
    <div class="fixed bottom-0 left-0 right-0 md:pl-64 bg-white border-t px-4 py-3">
      <button
        type="submit"
        form="edit-form"
        disabled={!form.nombre}
        class="w-full rounded-lg bg-[#2D6A4F] text-white text-sm font-semibold py-2.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#255c43] transition-colors"
      >
        Guardar cambios
      </button>
    </div>
  {/if}
</div>
