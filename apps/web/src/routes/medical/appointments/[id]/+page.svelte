<script lang="ts">
  import { DateTime } from 'luxon';
  import { Drawer } from 'vaul-svelte';
  import {
    ArrowLeft,
    User2,
    Stethoscope,
    Calendar,
    Clock,
    FileText,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Pill,
    Search,
    X,
    AlertCircle,
  } from 'lucide-svelte';
  import { page } from '$app/state';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/api';

  // ---------------------------------------------------------------------------
  // Types
  // ---------------------------------------------------------------------------

  type InsumoConsumoForm = {
    insumoId: string;
    nombre: string;
    cantidad: number;
    precioUnit: number;
  };

  // ---------------------------------------------------------------------------
  // Route param
  // ---------------------------------------------------------------------------

  const id = $derived(page.params.id ?? '');

  // ---------------------------------------------------------------------------
  // Query client
  // ---------------------------------------------------------------------------

  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // Appointment query
  // ---------------------------------------------------------------------------

  const appointmentQuery = createQuery({
    get queryKey() {
      return ['appointment', id];
    },
    get queryFn() {
      const currentId: string = id;
      return async () => {
        const res = await api.api.medical.appointments({ id: currentId }).get();
        if (res.error) throw new Error((res.error as any).message ?? 'Error al cargar la cita');
        return res.data as any;
      };
    },
  });

  const cita = $derived($appointmentQuery.data ?? null);

  // ---------------------------------------------------------------------------
  // Supplies query (loaded on demand when opening the result form)
  // ---------------------------------------------------------------------------

  const suppliesQuery = createQuery({
    queryKey: ['supplies'],
    queryFn: async () => {
      const res = await api.api.inventory.supplies.get();
      if (res.error) throw new Error((res.error as any).message ?? 'Error al cargar insumos');
      return res.data ?? [];
    },
    enabled: false,
  });

  // ---------------------------------------------------------------------------
  // Result mutation
  // ---------------------------------------------------------------------------

  const resultMutation = createMutation({
    mutationFn: async (body: any) => {
      const currentId: string = id;
      const res = await api.api.medical.appointments({ id: currentId }).result.patch(body);
      if (res.error) throw new Error((res.error as any).message ?? 'Error al registrar resultado');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      resultGuardado = true;
      editando = false;
    },
  });

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let editando = $state(false);
  let resultadoForm = $state({
    estado: '',
    diagnostico: '',
    indicaciones: '',
  });
  let formErrors = $state<Record<string, string>>({});
  let insumos = $state<InsumoConsumoForm[]>([]);
  let insumosOpen = $state(true);
  let resultGuardado = $state(false);

  // Insumo drawer
  let insumoDrawerOpen = $state(false);
  let insumoSearch = $state('');
  let insumoQtys = $state<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const ESTADO_CLINICO = ['Bueno', 'Regular', 'Grave', 'En observación', 'Alta', 'Referido'];

  const estadoCita = $derived(cita?.estado?.toLowerCase() ?? 'pendiente');

  const availableSupplies = $derived(
    ($suppliesQuery.data ?? []).filter((s: any) => s.stockDisponible > 0),
  );

  const filteredSupplies = $derived(
    availableSupplies.filter((s: any) =>
      getNombreInsumo(s.tipo).toLowerCase().includes(insumoSearch.toLowerCase()),
    ),
  );

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function formatFecha(iso: string) {
    return DateTime.fromISO(iso).setLocale('es').toFormat("EEEE d 'de' LLLL yyyy");
  }

  function formatHora(iso: string) {
    return DateTime.fromISO(iso).setLocale('es').toFormat('HH:mm');
  }

  const ESTADO_BADGE: Record<string, string> = {
    completada: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    pendiente: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelada: 'bg-gray-100 text-gray-500 border-gray-300',
  };

  const ESTADO_LABEL: Record<string, string> = {
    COMPLETADA: 'Completada',
    PENDIENTE: 'Pendiente',
    CANCELADA: 'Cancelada',
  };

  function getNombreInsumo(s: any): string {
    if (s.materialQuirurgico) return s.materialQuirurgico.nombre;
    if (s.presentacionMedicamento) {
      const med = s.presentacionMedicamento.medicamento;
      if (med.marca.esGenerico && med.principiosActivos.length > 0) {
        return (
          med.principiosActivos
            .map((pa: any) => `${pa.principioActivo.nombre} ${pa.concentracion}`)
            .join(' + ') +
          ` — ${med.marca.laboratorio.nombre}`
        );
      }
      return med.marca.nombre;
    }
    return 'Sin nombre';
  }

  // ---------------------------------------------------------------------------
  // Functions
  // ---------------------------------------------------------------------------

  function openEditor() {
    resultadoForm = {
      estado: cita?.estadoPaciente ?? '',
      diagnostico: cita?.diagnostico ?? '',
      indicaciones: cita?.recipe?.indicaciones ?? '',
    };
    insumos =
      cita?.insumosConsumidos?.map((ic: any) => ({
        insumoId: ic.id,
        nombre: getNombreInsumo(ic.insumo),
        cantidad: ic.cantidadDespachada,
        precioUnit: ic.precioUnitario,
      })) ?? [];
    formErrors = {};
    resultGuardado = false;
    editando = true;
    // Prefetch supplies when opening the result editor
    queryClient.prefetchQuery({
      queryKey: ['supplies'],
      queryFn: async () => {
        const res = await api.api.inventory.supplies.get();
        if (res.error) throw new Error((res.error as any).message ?? 'Error al cargar insumos');
        return res.data ?? [];
      },
    });
  }

  function removeInsumo(insumoId: string) {
    insumos = insumos.filter((i) => i.insumoId !== insumoId);
  }

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!resultadoForm.estado) e.estado = 'Requerido';
    if (!resultadoForm.diagnostico.trim()) e.diagnostico = 'Requerido';
    formErrors = e;
    return Object.keys(e).length === 0;
  }

  function guardarResultado() {
    if (!validateForm()) return;
    const body: any = {
      estadoPaciente: resultadoForm.estado || undefined,
      diagnostico: resultadoForm.diagnostico || undefined,
      recipe: resultadoForm.indicaciones ? { indicaciones: resultadoForm.indicaciones } : undefined,
      insumosConsumidos: insumos.map((i) => ({
        insumoId: i.insumoId,
        cantidadDespachada: i.cantidad,
        precioUnitario: i.precioUnit,
      })),
    };
    $resultMutation.mutate(body);
  }

  function handleAgregarInsumos() {
    for (const supply of availableSupplies) {
      const qStr = insumoQtys[supply.id];
      const q = parseInt(qStr ?? '');
      if (!q || q <= 0 || q > supply.stockDisponible) continue;
      const idx = insumos.findIndex((i) => i.insumoId === supply.id);
      if (idx >= 0) {
        insumos[idx] = { ...insumos[idx], cantidad: insumos[idx].cantidad + q };
      } else {
        insumos.push({
          insumoId: supply.id,
          nombre: getNombreInsumo(supply.tipo),
          cantidad: q,
          precioUnit: supply.precioUnitario ?? 0,
        });
      }
    }
    insumoDrawerOpen = false;
    insumoSearch = '';
    insumoQtys = {};
  }
</script>

<!-- ============================================================ PAGE SHELL -->
<div class="flex min-h-screen flex-col bg-gray-50">

  <!-- -------------------------------------------------------- STICKY HEADER -->
  <header class="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
    <a
      href="/medical/appointments"
      class="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
      aria-label="Volver"
    >
      <ArrowLeft size={20} />
    </a>
    <h1 class="flex-1 text-base font-semibold text-gray-900">Detalle de cita</h1>
    {#if cita}
      <span
        class="border rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {ESTADO_BADGE[estadoCita] ?? 'bg-gray-100 text-gray-500 border-gray-300'}"
      >
        {ESTADO_LABEL[cita.estado] ?? cita.estado}
      </span>
    {/if}
  </header>

  <!-- ------------------------------------------------------- MAIN CONTENT -->
  <main class="flex w-full max-w-2xl mx-auto flex-col gap-4 px-4 pt-4 pb-28">

    <!-- --------------------------------------------------- SKELETON LOADING -->
    {#if $appointmentQuery.isPending}
      <section class="rounded-xl border bg-white p-4 flex flex-col gap-3 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-gray-200 shrink-0"></div>
          <div class="flex flex-col gap-1.5 flex-1">
            <div class="h-3.5 w-40 rounded bg-gray-200"></div>
            <div class="h-3 w-24 rounded bg-gray-100"></div>
          </div>
        </div>
        <hr class="border-gray-100" />
        <div class="flex flex-col gap-2">
          {#each [1, 2, 3, 4] as _ (_)}
            <div class="flex items-center gap-3">
              <div class="h-4 w-4 rounded bg-gray-200 shrink-0"></div>
              <div class="h-3 w-16 rounded bg-gray-100 shrink-0"></div>
              <div class="h-3 w-32 rounded bg-gray-200"></div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ----------------------------------------------------- ERROR STATE -->
    {#if $appointmentQuery.isError}
      <section class="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
        <AlertCircle size={18} class="mt-0.5 shrink-0 text-red-500" />
        <div class="flex flex-col gap-0.5">
          <p class="text-sm font-medium text-red-700">Error al cargar la cita</p>
          <p class="text-xs text-red-500">
            {$appointmentQuery.error?.message ?? 'Ocurrió un error inesperado.'}
          </p>
        </div>
      </section>
    {/if}

    <!-- -------------------------------------------------- DATOS DE LA CITA -->
    {#if cita}
      <section class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <!-- Patient row -->
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style="background-color: #2D6A4F1A;"
          >
            <User2 size={20} style="color: #2D6A4F;" />
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm leading-tight">{cita.paciente.nombre}</p>
            <p class="text-xs text-gray-500">{cita.paciente.cedula}</p>
          </div>
        </div>

        <hr class="border-gray-100" />

        <!-- Info rows -->
        <div class="flex flex-col gap-2">
          <!-- Medico -->
          <div class="flex items-start gap-3">
            <Stethoscope size={16} class="mt-0.5 shrink-0 text-gray-400" />
            <span class="w-20 shrink-0 text-xs text-gray-400">Médico</span>
            <span class="text-sm text-gray-800">{cita.personal.nombre}</span>
          </div>
          <!-- Fecha -->
          <div class="flex items-start gap-3">
            <Calendar size={16} class="mt-0.5 shrink-0 text-gray-400" />
            <span class="w-20 shrink-0 text-xs text-gray-400">Fecha</span>
            <span class="text-sm text-gray-800 capitalize">{formatFecha(cita.fechaHora)}</span>
          </div>
          <!-- Hora -->
          <div class="flex items-start gap-3">
            <Clock size={16} class="mt-0.5 shrink-0 text-gray-400" />
            <span class="w-20 shrink-0 text-xs text-gray-400">Hora</span>
            <span class="text-sm text-gray-800">{formatHora(cita.fechaHora)}</span>
          </div>
          <!-- Motivo (HTML sanitizado por el backend) -->
          <div class="flex items-start gap-3">
            <FileText size={16} class="mt-0.5 shrink-0 text-gray-400" />
            <span class="w-20 shrink-0 text-xs text-gray-400">Motivo</span>
            <span class="text-sm text-gray-800 prose prose-sm max-w-none">{@html cita.motivo}</span>
          </div>
        </div>
      </section>

      <!-- ----------------------------------------------- RESULTADO (readonly) -->
      {#if (cita.estado === 'COMPLETADA' || cita.diagnostico) && !editando}
        <section class="rounded-xl border bg-white p-4 flex flex-col gap-3">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Resultado de la consulta
            </span>
            {#if cita.estado !== 'CANCELADA'}
              <button
                onclick={openEditor}
                class="text-xs font-medium"
                style="color: #2D6A4F;"
              >
                Editar
              </button>
            {/if}
          </div>

          <!-- Estado clínico -->
          {#if cita.estadoPaciente}
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-400">Estado clínico</span>
              <span class="border rounded-full px-2 py-0.5 text-xs w-fit">
                {cita.estadoPaciente}
              </span>
            </div>
          {/if}

          <!-- Diagnóstico (HTML sanitizado por el backend) -->
          {#if cita.diagnostico}
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-400">Diagnóstico</span>
              <div class="text-sm text-gray-800 prose prose-sm max-w-none">{@html cita.diagnostico}</div>
            </div>
          {/if}

          <!-- Indicaciones del récipe (HTML sanitizado por el backend) -->
          {#if cita.recipe?.indicaciones}
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-400">Indicaciones</span>
              <div class="text-sm text-gray-800 prose prose-sm max-w-none">{@html cita.recipe.indicaciones}</div>
            </div>
          {/if}

          <!-- Insumos dispensados -->
          {#if cita.insumosConsumidos && cita.insumosConsumidos.length > 0}
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-400">Insumos dispensados</span>
              <ul class="flex flex-col gap-1">
                {#each cita.insumosConsumidos as ic (ic.id)}
                  <li class="text-sm text-gray-800">
                    {getNombreInsumo(ic.insumo)} — {ic.cantidadDespachada} × Bs. {ic.precioUnitario.toFixed(2)}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </section>
      {/if}

      <!-- -------------------------------------------- EDITOR DE RESULTADO -->
      {#if editando}
        <section class="rounded-xl border bg-white p-4 flex flex-col gap-4">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Registrar resultado
            </span>
            <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
              Editando
            </span>
          </div>

          <!-- Mutation error -->
          {#if $resultMutation.isError}
            <div class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <AlertCircle size={15} class="mt-0.5 shrink-0 text-red-500" />
              <p class="text-xs text-red-600">
                {$resultMutation.error?.message ?? 'Error al guardar el resultado.'}
              </p>
            </div>
          {/if}

          <!-- Estado clínico chips -->
          <div class="flex flex-col gap-1.5">
            <p class="text-xs text-gray-500 font-medium" id="label-estado">
              Estado clínico <span class="text-red-500">*</span>
            </p>
            <div class="flex flex-wrap gap-2" role="group" aria-labelledby="label-estado">
              {#each ESTADO_CLINICO as estado (estado)}
                <button
                  type="button"
                  onclick={() => (resultadoForm.estado = estado)}
                  class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  class:text-white={resultadoForm.estado === estado}
                  class:border-gray-300={resultadoForm.estado !== estado}
                  class:text-gray-500={resultadoForm.estado !== estado}
                  style={resultadoForm.estado === estado
                    ? 'background-color: #2D6A4F; border-color: #2D6A4F;'
                    : ''}
                >
                  {estado}
                </button>
              {/each}
            </div>
            {#if formErrors.estado}
              <p class="text-xs text-red-500">{formErrors.estado}</p>
            {/if}
          </div>

          <!-- Diagnóstico -->
          <div class="flex flex-col gap-1.5">
            <label for="diagnostico-textarea" class="text-xs text-gray-500 font-medium">
              Diagnóstico <span class="text-red-500">*</span>
            </label>
            <div
              class="rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-2 py-1 flex gap-1"
              aria-hidden="true"
            >
              <button type="button" class="rounded px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-200">B</button>
              <button type="button" class="rounded px-2 py-0.5 text-xs italic text-gray-600 hover:bg-gray-200">I</button>
              <button type="button" class="rounded px-2 py-0.5 text-xs underline text-gray-600 hover:bg-gray-200">U</button>
            </div>
            <textarea
              id="diagnostico-textarea"
              bind:value={resultadoForm.diagnostico}
              rows={3}
              class="w-full rounded-b-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 resize-none"
              class:border-red-300={!!formErrors.diagnostico}
              placeholder="Indique el diagnóstico..."
            ></textarea>
            {#if formErrors.diagnostico}
              <p class="text-xs text-red-500">{formErrors.diagnostico}</p>
            {/if}
          </div>

          <!-- Indicaciones -->
          <div class="flex flex-col gap-1.5">
            <label for="indicaciones-textarea" class="text-xs text-gray-500 font-medium">Indicaciones</label>
            <div
              class="rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-2 py-1 flex gap-1"
              aria-hidden="true"
            >
              <button type="button" class="rounded px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-200">B</button>
              <button type="button" class="rounded px-2 py-0.5 text-xs italic text-gray-600 hover:bg-gray-200">I</button>
              <button type="button" class="rounded px-2 py-0.5 text-xs underline text-gray-600 hover:bg-gray-200">U</button>
              <button type="button" class="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200">≡</button>
              <button type="button" class="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200">•</button>
            </div>
            <textarea
              id="indicaciones-textarea"
              bind:value={resultadoForm.indicaciones}
              rows={4}
              class="w-full rounded-b-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 resize-none"
              placeholder="Escriba las indicaciones para el paciente..."
            ></textarea>
          </div>

          <!-- Insumos consumidos (collapsible) -->
          <div class="flex flex-col gap-2">
            <button
              type="button"
              onclick={() => (insumosOpen = !insumosOpen)}
              class="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Pill size={16} class="text-gray-500" />
              <span class="flex-1 text-left">Insumos consumidos</span>
              {#if insumos.length > 0}
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {insumos.length}
                </span>
              {/if}
              {#if insumosOpen}
                <ChevronUp size={16} class="text-gray-400" />
              {:else}
                <ChevronDown size={16} class="text-gray-400" />
              {/if}
            </button>

            {#if insumosOpen}
              <div class="flex flex-col gap-2">
                {#if insumos.length > 0}
                  <ul class="rounded-lg border divide-y divide-gray-100 overflow-hidden">
                    {#each insumos as insumo (insumo.insumoId)}
                      <li class="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <p class="text-sm font-medium text-gray-800">{insumo.nombre}</p>
                          <p class="text-xs text-gray-400">
                            {insumo.cantidad} uds × Bs. {insumo.precioUnit.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onclick={() => removeInsumo(insumo.insumoId)}
                          class="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          aria-label="Eliminar insumo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </li>
                    {/each}
                  </ul>
                {/if}
                <button
                  type="button"
                  onclick={() => (insumoDrawerOpen = true)}
                  class="flex items-center gap-1.5 self-start rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={13} />
                  Agregar insumos
                </button>
              </div>
            {/if}
          </div>

          <hr class="border-gray-100" />

          <!-- Action buttons -->
          <div class="flex gap-3">
            <button
              type="button"
              onclick={() => (editando = false)}
              class="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={$resultMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="button"
              onclick={guardarResultado}
              class="flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
              style="background-color: #2D6A4F;"
              disabled={$resultMutation.isPending}
            >
              {#if $resultMutation.isPending}
                Guardando...
              {:else}
                Guardar resultado
              {/if}
            </button>
          </div>
        </section>
      {/if}

      <!-- ---------------------------------------- SIN RESULTADO (empty state) -->
      {#if cita.estado === 'PENDIENTE' && !cita.diagnostico && !editando}
        <section
          class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 flex flex-col items-center gap-3 text-center"
        >
          <FileText size={32} class="text-gray-300" />
          <p class="font-medium text-gray-600 text-sm">Sin resultado registrado</p>
          <p class="text-xs text-gray-400">Registra el resultado al concluir la consulta.</p>
          <button
            type="button"
            onclick={openEditor}
            class="mt-1 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style="background-color: #2D6A4F;"
          >
            <Plus size={15} />
            Registrar resultado
          </button>
        </section>
      {/if}
    {/if}

  </main>

  <!-- ------------------------------------------------- FIXED BOTTOM BAR -->
  {#if cita && cita.estado === 'COMPLETADA'}
    <div class="fixed bottom-0 left-0 right-0 md:pl-64 bg-white border-t px-4 py-3">
      <a
        href="/medical/appointments/{cita.id}/recipe"
        class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <FileText size={16} />
        Generar récipe PDF
      </a>
    </div>
  {/if}

</div>

<!-- ======================================================= INSUMO DRAWER -->
<Drawer.Root
  bind:open={insumoDrawerOpen}
  onClose={() => {
    insumoSearch = '';
    insumoQtys = {};
  }}
>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />
    <Drawer.Content
      class="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white outline-none"
    >
      <!-- Drag handle -->
      <div class="flex justify-center pt-3 pb-1">
        <div class="h-1.5 w-10 rounded-full bg-gray-200"></div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 class="text-base font-semibold text-gray-900">Insumos consumidos</h2>
        <button
          type="button"
          onclick={() => (insumoDrawerOpen = false)}
          class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Search -->
      <div class="px-4 pt-3 pb-2">
        <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <Search size={15} class="shrink-0 text-gray-400" />
          <input
            type="text"
            bind:value={insumoSearch}
            placeholder="Buscar insumo..."
            class="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <!-- Insumo list -->
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        {#if $suppliesQuery.isPending}
          <ul class="flex flex-col gap-1 animate-pulse">
            {#each [1, 2, 3] as _ (_)}
              <li class="flex items-center justify-between rounded-lg px-2 py-2.5">
                <div class="flex flex-col gap-1.5">
                  <div class="h-3.5 w-36 rounded bg-gray-200"></div>
                  <div class="h-3 w-20 rounded bg-gray-100"></div>
                </div>
                <div class="h-8 w-20 rounded bg-gray-100"></div>
              </li>
            {/each}
          </ul>
        {:else}
          <ul class="flex flex-col gap-1">
            {#each filteredSupplies as supply (supply.id)}
              <li class="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-gray-50">
                <div>
                  <p class="font-medium text-sm text-gray-800">{getNombreInsumo(supply.tipo)}</p>
                  <p class="text-xs text-gray-400">Stock: {supply.stockDisponible}</p>
                </div>
                <input
                  type="number"
                  min="1"
                  max={supply.stockDisponible}
                  bind:value={insumoQtys[supply.id]}
                  placeholder="0"
                  class="w-20 rounded border border-gray-200 px-2 py-1 text-center text-sm outline-none focus:border-gray-400"
                />
              </li>
            {/each}
            {#if filteredSupplies.length === 0}
              <li class="py-6 text-center text-sm text-gray-400">No se encontraron insumos</li>
            {/if}
          </ul>
        {/if}
      </div>

      <!-- Confirm button -->
      <div class="border-t border-gray-100 px-4 py-3">
        <button
          type="button"
          onclick={handleAgregarInsumos}
          class="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style="background-color: #2D6A4F;"
        >
          Agregar seleccionados
        </button>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
