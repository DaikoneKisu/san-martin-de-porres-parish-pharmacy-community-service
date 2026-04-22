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
    CheckCircle2,
    X,
    Info,
  } from 'lucide-svelte';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import StockIndicator from '$lib/components/custom/stock-indicator.svelte';
  import ExpiryIndicator from '$lib/components/custom/expiry-indicator.svelte';
  import { api } from '$lib/api';

  const queryClient = useQueryClient();

  const id = $derived(page.params.id ?? '');

  const supplyQuery = createQuery({
    get queryKey() { return ['supply', id]; },
    queryFn: async () => {
      const res = await api.api.inventory.supplies({ id }).get();
      if (res.error) throw new Error((res.error as any)?.value?.message ?? 'Error al cargar el insumo.');
      return res.data as any;
    },
    get enabled() { return id !== ''; },
  });

  const supply = $derived($supplyQuery.data ?? null);

  // Drawer state
  let dispensarDrawerOpen = $state(false);
  let dispensarCantidad = $state('');
  let dispensarPrecio = $state('');
  let dispensarError = $state('');
  let dispensarGuardado = $state(false);

  const dispensarMutation = createMutation({
    mutationFn: async (body: { cantidadDespachada: number; precioUnitario: number }) => {
      const res = await api.api.inventory.supplies({ id }).dispense.post(body);
      if (res.error) throw new Error((res.error as any)?.value?.message ?? 'Error al registrar la dispensación.');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply', id] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      dispensarGuardado = true;
    },
    onError: (err: Error) => {
      dispensarError = err.message;
    },
  });

  function getNombreInsumo(s: any): string {
    if (s.materialQuirurgico) return s.materialQuirurgico.nombre;
    if (s.presentacionMedicamento) {
      const med = s.presentacionMedicamento.medicamento;
      if (med.marca.esGenerico && med.principiosActivos.length > 0) {
        return (
          med.principiosActivos
            .map((pa: any) => `${pa.principioActivo.nombre} ${pa.concentracion}`)
            .join(' + ') + ` — ${med.marca.laboratorio.nombre}`
        );
      }
      return med.marca.nombre;
    }
    return 'Sin nombre';
  }

  function getPresentacion(s: any): string {
    if (s.presentacionMedicamento) return s.presentacionMedicamento.empaque.nombre;
    return '';
  }

  function getPrincipiosActivos(s: any): string {
    if (!s.presentacionMedicamento) return '';
    return s.presentacionMedicamento.medicamento.principiosActivos
      .map((pa: any) => `${pa.principioActivo.nombre} ${pa.concentracion}`)
      .join(', ');
  }

  function getLaboratorio(s: any): string {
    if (!s.presentacionMedicamento) return '';
    return s.presentacionMedicamento.medicamento.marca.laboratorio.nombre;
  }

  function getFormaFarmaceutica(s: any): string {
    if (!s.presentacionMedicamento) return '';
    return s.presentacionMedicamento.formaFarmaceutica.nombre;
  }

  function getViaAdministracion(s: any): string {
    if (!s.presentacionMedicamento) return '';
    return s.presentacionMedicamento.viaAdministracion.nombre;
  }

  function getCategorias(s: any): string {
    if (!s.presentacionMedicamento) return '';
    return s.presentacionMedicamento.medicamento.categorias.map((c: any) => c.nombre).join(', ');
  }

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("d 'de' LLLL yyyy");
  }

  function handleDispensar() {
    dispensarError = '';
    const cantidad = Number(dispensarCantidad);
    const precio = Number(dispensarPrecio);

    if (!dispensarCantidad || isNaN(cantidad) || cantidad <= 0) {
      dispensarError = 'Ingrese una cantidad válida mayor a 0.';
      return;
    }
    if (!supply) return;
    if (cantidad > supply.stockDisponible) {
      dispensarError = `La cantidad no puede superar el stock disponible (${supply.stockDisponible} uds).`;
      return;
    }
    if (!dispensarPrecio || isNaN(precio) || precio <= 0) {
      dispensarError = 'Ingrese un precio de referencia válido mayor a 0.';
      return;
    }

    $dispensarMutation.mutate({ cantidadDespachada: cantidad, precioUnitario: precio });
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

{#if $supplyQuery.isPending}
  <div class="flex flex-col min-h-screen bg-gray-50 animate-pulse">
    <!-- Sticky header skeleton -->
    <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <div class="size-8 rounded-md shrink-0 bg-gray-200"></div>
      <div class="flex-1 h-5 rounded bg-gray-200"></div>
      <div class="h-8 w-20 rounded-lg shrink-0 bg-gray-200"></div>
    </header>
    <main class="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-4">
      <div class="flex gap-2">
        <div class="h-6 w-24 rounded-full bg-gray-200"></div>
        <div class="h-6 w-24 rounded-full bg-gray-200"></div>
      </div>
      <div class="h-48 w-full rounded-xl bg-gray-200"></div>
      <div class="h-12 w-full rounded-xl bg-gray-200"></div>
    </main>
  </div>
{:else if $supplyQuery.isError || !supply}
  <!-- Error / not found state -->
  <div class="flex flex-col min-h-screen items-center justify-center gap-4 bg-gray-50 px-4 text-center">
    <p class="text-lg font-semibold text-gray-700">
      {$supplyQuery.isError ? 'Error al cargar el insumo.' : 'Insumo no encontrado.'}
    </p>
    {#if $supplyQuery.error}
      <p class="text-sm text-gray-500">{($supplyQuery.error as Error).message}</p>
    {/if}
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

      <h1 class="flex-1 text-base font-semibold text-gray-900 truncate">{getNombreInsumo(supply)}</h1>

      <a
        href="/inventory/{supply.id}/edit"
        class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Pencil class="size-4" />
        <span>Editar</span>
      </a>
    </header>

    <main class="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-4">
      <!-- Badges row -->
      <div class="flex flex-wrap items-center gap-2">
        <StockIndicator stockDisponible={supply.stockDisponible} cantidadInicial={supply.cantidad} />
        <ExpiryIndicator fechaVencimiento={supply.fechaVencimiento} />
      </div>

      <!-- Info card -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <!-- Tipo -->
        <div class="flex items-center gap-2.5">
          <span
            class={[
              'shrink-0 flex items-center justify-center rounded-lg p-2',
              supply.tipo === 'MEDICAMENTO' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600',
            ].join(' ')}
          >
            {#if supply.tipo === 'MEDICAMENTO'}
              <Pill class="size-5" />
            {:else}
              <Stethoscope class="size-5" />
            {/if}
          </span>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-gray-800">
              {supply.tipo === 'MEDICAMENTO' ? 'Medicamento' : 'Material médico'}
            </span>
            {#if supply.tipo === 'MEDICAMENTO' && getCategorias(supply)}
              <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                {getCategorias(supply)}
              </span>
            {/if}
          </div>
        </div>

        <hr class="border-gray-200 my-3" />

        <!-- Info rows -->
        <dl class="space-y-2">
          {#if getPresentacion(supply)}
            <div class="flex items-start justify-between gap-4">
              <dt class="text-xs text-gray-500 shrink-0">Presentación</dt>
              <dd class="text-xs font-medium text-gray-800 text-right">{getPresentacion(supply)}</dd>
            </div>
          {/if}
          <div class="flex items-start justify-between gap-4">
            <dt class="text-xs text-gray-500 shrink-0">Lote</dt>
            <dd class="text-xs font-medium text-gray-800 text-right">{supply.numeroLote}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-xs text-gray-500 shrink-0">Vencimiento</dt>
            <dd class="text-xs font-medium text-gray-800 text-right capitalize">{formatFecha(supply.fechaVencimiento)}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-xs text-gray-500 shrink-0">Precio ref.</dt>
            <dd class="text-xs font-medium text-gray-800 text-right">Bs. {supply.precioUnitarioReferencial.toFixed(2)}</dd>
          </div>

          {#if supply.tipo === 'MEDICAMENTO'}
            {#if getPrincipiosActivos(supply)}
              <div class="flex items-start justify-between gap-4">
                <dt class="text-xs text-gray-500 shrink-0">Principio activo</dt>
                <dd class="text-xs font-medium text-gray-800 text-right">{getPrincipiosActivos(supply)}</dd>
              </div>
            {/if}
            {#if getLaboratorio(supply)}
              <div class="flex items-start justify-between gap-4">
                <dt class="text-xs text-gray-500 shrink-0">Laboratorio</dt>
                <dd class="text-xs font-medium text-gray-800 text-right">{getLaboratorio(supply)}</dd>
              </div>
            {/if}
            {#if getFormaFarmaceutica(supply)}
              <div class="flex items-start justify-between gap-4">
                <dt class="text-xs text-gray-500 shrink-0">Forma farmacéutica</dt>
                <dd class="text-xs font-medium text-gray-800 text-right">{getFormaFarmaceutica(supply)}</dd>
              </div>
            {/if}
            {#if getViaAdministracion(supply)}
              <div class="flex items-start justify-between gap-4">
                <dt class="text-xs text-gray-500 shrink-0">Vía de administración</dt>
                <dd class="text-xs font-medium text-gray-800 text-right">{getViaAdministracion(supply)}</dd>
              </div>
            {/if}
          {/if}
        </dl>
      </div>

      <!-- Dispensar button -->
      <button
        type="button"
        onclick={() => { dispensarDrawerOpen = true; }}
        disabled={supply.stockDisponible === 0}
        class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowRightLeft class="size-4" />
        Registrar dispensación
      </button>

      <!-- Historial note -->
      <div class="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <Info class="mt-0.5 size-4 shrink-0 text-blue-500" />
        <p class="text-xs text-blue-700">
          El historial de movimientos se encuentra en el módulo de Auditoría.
        </p>
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
              <span class="text-sm font-medium text-gray-800 truncate">{getNombreInsumo(supply)}</span>
              <span class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                {supply.stockDisponible} uds
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
                  max={supply.stockDisponible}
                  bind:value={dispensarCantidad}
                  placeholder="0"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              <!-- Precio ref -->
              <div class="space-y-1">
                <label for="dispensar-precio" class="text-xs font-medium text-gray-700">
                  Precio de referencia (Bs.) <span class="text-red-500">*</span>
                </label>
                <input
                  id="dispensar-precio"
                  type="number"
                  step="0.01"
                  min="0.01"
                  bind:value={dispensarPrecio}
                  placeholder={supply.precioUnitarioReferencial.toString()}
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
              disabled={$dispensarMutation.isPending}
              class="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {$dispensarMutation.isPending ? 'Registrando...' : 'Registrar'}
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
