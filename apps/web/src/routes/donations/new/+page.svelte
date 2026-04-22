<script lang="ts">
  import { DateTime } from 'luxon';
  import { Drawer } from 'vaul-svelte';
  import {
    ArrowLeft,
    User,
    Package,
    Pill,
    Stethoscope,
    Trash2,
    Check,
    BookCheck,
    CheckCircle2,
    X,
    Plus,
    Search,
    Loader2,
  } from 'lucide-svelte';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/api';

  // ── Types ──────────────────────────────────────────────────────────────────
  type Donante = {
    id: string;
    nombre: string;
    pais: string;
    contacto: string;
    esFijo: boolean;
  };

  type ItemMedicamento = {
    tipo: 'MEDICAMENTO';
    tempId: string;
    medicamentoId: string;
    medicamentoNombre: string;
    viaAdministracionId: string;
    formaFarmaceuticaId: string;
    empaqueId: string;
    cantidadPorEmpaque: number;
    numeroLote: string;
    fechaVencimiento: string;
    cantidad: number;
    precioUnitarioReferencial: number;
  };

  type ItemMaterial = {
    tipo: 'MATERIAL';
    tempId: string;
    nombre: string;
    numeroLote: string;
    fechaVencimiento: string;
    cantidad: number;
    precioUnitarioReferencial: number;
  };

  type InsumoItem = ItemMedicamento | ItemMaterial;

  // ── Query client ───────────────────────────────────────────────────────────
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────
  const donorsQuery = createQuery({
    queryKey: ['donors'],
    queryFn: async () => {
      const res = await api.api.donations.donors.get();
      if (res.error) throw new Error('Error al cargar donantes');
      return res.data!;
    },
    staleTime: 1000 * 60 * 2,
  });

  const medicationsQuery = createQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const res = await api.api.inventory.medications.get();
      if (res.error) throw new Error('Error al cargar medicamentos');
      return res.data!;
    },
    staleTime: 1000 * 60 * 10,
  });

  const adminRoutesQuery = createQuery({
    queryKey: ['administration-routes'],
    queryFn: async () => {
      const res = await api.api.inventory['administration-routes'].get();
      if (res.error) throw new Error('Error al cargar vías de administración');
      return res.data!;
    },
    staleTime: 1000 * 60 * 60,
  });

  const pharmaFormsQuery = createQuery({
    queryKey: ['pharmaceutical-forms'],
    queryFn: async () => {
      const res = await api.api.inventory['pharmaceutical-forms'].get();
      if (res.error) throw new Error('Error al cargar formas farmacéuticas');
      return res.data!;
    },
    staleTime: 1000 * 60 * 60,
  });

  const packagesQuery = createQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.api.inventory.packages.get();
      if (res.error) throw new Error('Error al cargar empaques');
      return res.data!;
    },
    staleTime: 1000 * 60 * 60,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createDonorMutation = createMutation({
    mutationFn: async (body: { nombre: string; pais: string; contacto: string; esFijo: boolean }) => {
      const res = await api.api.donations.donors.post(body);
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al crear donante');
      return res.data!;
    },
    onSuccess: (donor) => {
      donante = donor as Donante;
      drawerMode = null;
      nuevoDonantNombre = '';
      nuevoDonantPais = '';
      nuevoDonantContacto = '';
      nuevoDonantEsFijo = false;
      queryClient.invalidateQueries({ queryKey: ['donors'] });
    },
  });

  const createDonationMutation = createMutation({
    mutationFn: async () => {
      if (!donante) throw new Error('Donante requerido');
      const res = await api.api.donations.post({
        donanteId: donante.id,
        fechaRecepcion: fecha,
        observaciones,
        items: items.map((item) => {
          if (item.tipo === 'MEDICAMENTO') {
            return {
              tipo: 'MEDICAMENTO' as const,
              medicamentoId: item.medicamentoId,
              viaAdministracionId: item.viaAdministracionId,
              formaFarmaceuticaId: item.formaFarmaceuticaId,
              empaqueId: item.empaqueId,
              cantidadPorEmpaque: item.cantidadPorEmpaque,
              numeroLote: item.numeroLote,
              fechaVencimiento: item.fechaVencimiento,
              cantidad: item.cantidad,
              precioUnitarioReferencial: item.precioUnitarioReferencial,
            };
          } else {
            return {
              tipo: 'MATERIAL' as const,
              nombre: item.nombre,
              numeroLote: item.numeroLote,
              fechaVencimiento: item.fechaVencimiento,
              cantidad: item.cantidad,
              precioUnitarioReferencial: item.precioUnitarioReferencial,
            };
          }
        }),
      });
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al crear donación');
      return res.data!;
    },
    onSuccess: () => {
      guardado = true;
    },
    onError: (err) => {
      donationError = (err as Error).message;
    },
  });

  // ── Wizard state ───────────────────────────────────────────────────────────
  let paso = $state<0 | 1 | 2>(0);
  let donante = $state<Donante | null>(null);
  let fecha = $state(DateTime.now().toISODate() ?? '');
  let observaciones = $state('');
  let items = $state<InsumoItem[]>([]);
  let drawerMode = $state<'donante' | 'nuevo-donante' | 'insumo' | null>(null);
  let guardado = $state(false);
  let donationError = $state('');

  // ── Donor search ───────────────────────────────────────────────────────────
  let searchDonante = $state('');

  // ── New donor form ─────────────────────────────────────────────────────────
  let nuevoDonantNombre = $state('');
  let nuevoDonantPais = $state('');
  let nuevoDonantContacto = $state('');
  let nuevoDonantEsFijo = $state(false);

  // ── Insumo drawer state ────────────────────────────────────────────────────
  let insumoStep = $state<'tipo' | 'catalogo' | 'datos'>('tipo');
  let insumoTipo = $state<'MEDICAMENTO' | 'MATERIAL'>('MEDICAMENTO');
  let insumoSeleccionado = $state<{ id: string; nombre: string } | null>(null);
  let searchInsumo = $state('');

  // ── Insumo form for MEDICAMENTO ────────────────────────────────────────────
  let insForm = $state({
    viaAdministracionId: '',
    formaFarmaceuticaId: '',
    empaqueId: '',
    cantidadPorEmpaque: 1,
    numeroLote: '',
    fechaVencimiento: '',
    cantidad: 1,
    precioUnitarioReferencial: 0,
  });

  // ── Insumo form for MATERIAL ───────────────────────────────────────────────
  let matForm = $state({
    nombre: '',
    numeroLote: '',
    fechaVencimiento: '',
    cantidad: 1,
    precioUnitarioReferencial: 0,
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredDonantes = $derived(
    ($donorsQuery.data ?? []).filter(
      (d: any) =>
        d.nombre.toLowerCase().includes(searchDonante.toLowerCase()) ||
        d.contacto.toLowerCase().includes(searchDonante.toLowerCase()),
    ),
  );

  const catalogoFiltrado = $derived(
    insumoTipo === 'MEDICAMENTO'
      ? ($medicationsQuery.data ?? []).filter((m: any) => {
          const name = m.marca?.nombre ?? '';
          return name.toLowerCase().includes(searchInsumo.toLowerCase());
        })
      : [],
  );

  const totalDonacion = $derived(
    items.reduce((sum, item) => sum + item.cantidad * item.precioUnitarioReferencial, 0),
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getMedNombre(m: NonNullable<typeof $medicationsQuery.data>[0]): string {
    return m.marca?.nombre ?? m.id;
  }

  function resetInsumoDrawer() {
    drawerMode = null;
    insumoStep = 'tipo';
    insumoSeleccionado = null;
    insForm = {
      viaAdministracionId: '',
      formaFarmaceuticaId: '',
      empaqueId: '',
      cantidadPorEmpaque: 1,
      numeroLote: '',
      fechaVencimiento: '',
      cantidad: 1,
      precioUnitarioReferencial: 0,
    };
    matForm = { nombre: '', numeroLote: '', fechaVencimiento: '', cantidad: 1, precioUnitarioReferencial: 0 };
    searchInsumo = '';
  }

  function selectDonante(d: Donante) {
    donante = d;
    drawerMode = null;
    searchDonante = '';
  }

  function agregarMedicamento() {
    if (
      !insumoSeleccionado ||
      !insForm.viaAdministracionId ||
      !insForm.formaFarmaceuticaId ||
      !insForm.empaqueId ||
      !insForm.fechaVencimiento ||
      insForm.cantidad <= 0
    )
      return;
    items.push({
      tipo: 'MEDICAMENTO',
      tempId: `med-${Date.now()}`,
      medicamentoId: insumoSeleccionado.id,
      medicamentoNombre: insumoSeleccionado.nombre,
      viaAdministracionId: insForm.viaAdministracionId,
      formaFarmaceuticaId: insForm.formaFarmaceuticaId,
      empaqueId: insForm.empaqueId,
      cantidadPorEmpaque: insForm.cantidadPorEmpaque,
      numeroLote: insForm.numeroLote,
      fechaVencimiento: insForm.fechaVencimiento,
      cantidad: insForm.cantidad,
      precioUnitarioReferencial: insForm.precioUnitarioReferencial,
    });
    resetInsumoDrawer();
  }

  function agregarMaterial() {
    if (!matForm.nombre || !matForm.fechaVencimiento || matForm.cantidad <= 0) return;
    items.push({
      tipo: 'MATERIAL',
      tempId: `mat-${Date.now()}`,
      nombre: matForm.nombre,
      numeroLote: matForm.numeroLote,
      fechaVencimiento: matForm.fechaVencimiento,
      cantidad: matForm.cantidad,
      precioUnitarioReferencial: matForm.precioUnitarioReferencial,
    });
    resetInsumoDrawer();
  }

  function eliminarItem(tempId: string) {
    const idx = items.findIndex((i) => i.tempId === tempId);
    if (idx !== -1) items.splice(idx, 1);
  }

  function resetAll() {
    paso = 0;
    donante = null;
    fecha = DateTime.now().toISODate() ?? '';
    observaciones = '';
    items = [];
    drawerMode = null;
    guardado = false;
    donationError = '';
  }

  function formatDate(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toLocaleString(DateTime.DATE_MED) || iso;
  }
</script>

<!-- ══ SUCCESS SCREEN ════════════════════════════════════════════════════════ -->
{#if guardado}
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
    <CheckCircle2 class="size-16 text-emerald-500" />
    <h1 class="text-2xl font-bold text-gray-900">¡Donación registrada!</h1>
    <p class="text-gray-600">
      Donación de <span class="font-medium">{donante?.nombre}</span> registrada correctamente.
    </p>
    <div class="mt-2 flex flex-col gap-2 sm:flex-row">
      <a
        href="/donations"
        class="rounded-lg bg-[#2D6A4F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#245a42]"
      >
        Ver donaciones →
      </a>
      <button
        onclick={resetAll}
        class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Registrar otra
      </button>
    </div>
  </div>

<!-- ══ WIZARD ════════════════════════════════════════════════════════════════ -->
{:else}
  <div class="mx-auto max-w-2xl pb-24">
    <!-- Page header -->
    <div class="px-4 pt-6 pb-4">
      <h1 class="text-xl font-bold text-gray-900">Nueva donación</h1>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center px-4 pb-6">
      {#each [0, 1, 2] as step (step)}
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors
            {paso > step
              ? 'bg-[#2D6A4F] text-white'
              : paso === step
                ? 'border-2 border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-2 border-gray-300 text-gray-400'}"
        >
          {#if paso > step}
            <Check class="size-4" />
          {:else}
            {step + 1}
          {/if}
        </div>
        {#if step < 2}
          <div
            class="h-0.5 flex-1 transition-colors
              {paso > step ? 'bg-[#2D6A4F]' : 'bg-gray-200'}"
          ></div>
        {/if}
      {/each}
    </div>

    <!-- ── PASO 0: Donante + Fecha ────────────────────────────────────────── -->
    {#if paso === 0}
      <div class="space-y-4 px-4">
        <!-- Donante card -->
        {#if !donante}
          <div class="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-8">
            <button
              onclick={() => (drawerMode = 'donante')}
              class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <User class="size-4" />
              Buscar donante
            </button>
            <button
              onclick={() => (drawerMode = 'nuevo-donante')}
              class="text-sm text-[#2D6A4F] underline-offset-2 hover:underline"
            >
              ¿Donante nuevo? Registrar aquí →
            </button>
          </div>
        {:else}
          <div class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center gap-3">
              <User class="size-5 text-[#2D6A4F]" />
              <div>
                <p class="font-semibold text-gray-900">{donante.nombre}</p>
                <p class="text-sm text-gray-500">{donante.pais} · {donante.contacto}</p>
              </div>
            </div>
            <button
              onclick={() => (drawerMode = 'donante')}
              class="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              Cambiar
            </button>
          </div>
        {/if}

        <!-- Date field -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-700" for="fecha">
            Fecha de donación
          </label>
          <input
            id="fecha"
            type="date"
            bind:value={fecha}
            class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
          />
        </div>

        <!-- Observaciones -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-700" for="observaciones">
            Observaciones (opcional)
          </label>
          <textarea
            id="observaciones"
            bind:value={observaciones}
            rows="3"
            placeholder="Notas sobre la donación..."
            class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
          ></textarea>
        </div>
      </div>

    <!-- ── PASO 1: Insumos ───────────────────────────────────────────────── -->
    {:else if paso === 1}
      <div class="space-y-4 px-4">
        <button
          onclick={() => {
            drawerMode = 'insumo';
            insumoStep = 'tipo';
          }}
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245a42]"
        >
          <Plus class="size-4" />
          Agregar insumo
        </button>

        {#if items.length === 0}
          <div class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-gray-400">
            <Package class="size-8" />
            <p class="text-sm">Sin insumos agregados</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each items as item (item.tempId)}
              <div class="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div class="mt-0.5 shrink-0">
                  {#if item.tipo === 'MEDICAMENTO'}
                    <Pill class="size-5 text-[#2D6A4F]" />
                  {:else}
                    <Stethoscope class="size-5 text-blue-600" />
                  {/if}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-gray-900">
                    {item.tipo === 'MEDICAMENTO' ? item.medicamentoNombre : item.nombre}
                  </p>
                  <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                    {item.tipo === 'MEDICAMENTO' ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-blue-50 text-blue-600'}">
                    {item.tipo === 'MEDICAMENTO' ? 'Medicamento' : 'Material'}
                  </span>
                  <div class="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span class="font-medium text-gray-700">x{item.cantidad}</span>
                    {#if item.numeroLote}
                      <span>Lote: {item.numeroLote}</span>
                    {/if}
                    <span>Vence: {formatDate(item.fechaVencimiento)}</span>
                    {#if item.precioUnitarioReferencial > 0}
                      <span>Bs. {item.precioUnitarioReferencial.toFixed(2)}</span>
                    {/if}
                  </div>
                </div>
                <button
                  onclick={() => eliminarItem(item.tempId)}
                  class="shrink-0 rounded-md p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Eliminar insumo"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    <!-- ── PASO 2: Confirmación ──────────────────────────────────────────── -->
    {:else}
      <div class="space-y-4 px-4">
        <!-- Donante + fecha summary -->
        <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Resumen de donación</h2>
          <div class="flex items-center gap-3">
            <User class="size-5 text-[#2D6A4F]" />
            <div>
              <p class="font-semibold text-gray-900">{donante?.nombre}</p>
              <p class="text-sm text-gray-500">{donante?.pais} · {donante?.contacto}</p>
            </div>
          </div>
          <p class="mt-2 text-sm text-gray-600">
            Fecha: <span class="font-medium">{formatDate(fecha)}</span>
          </p>
          {#if observaciones}
            <p class="mt-1 text-sm text-gray-600">
              Observaciones: <span class="font-medium">{observaciones}</span>
            </p>
          {/if}
        </div>

        <!-- Items list -->
        <div class="space-y-2">
          {#each items as item (item.tempId)}
            <div class="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              {#if item.tipo === 'MEDICAMENTO'}
                <Pill class="mt-0.5 size-4 shrink-0 text-[#2D6A4F]" />
              {:else}
                <Stethoscope class="mt-0.5 size-4 shrink-0 text-blue-600" />
              {/if}
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">
                  {item.tipo === 'MEDICAMENTO' ? item.medicamentoNombre : item.nombre}
                </p>
                <p class="text-xs text-gray-500">
                  {item.tipo === 'MEDICAMENTO' ? 'Medicamento' : 'Material'}
                </p>
              </div>
              <div class="text-right text-sm">
                <p class="font-medium text-gray-900">x{item.cantidad}</p>
                {#if item.precioUnitarioReferencial > 0}
                  <p class="text-xs text-gray-500">Bs. {item.precioUnitarioReferencial.toFixed(2)}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Total -->
        <div class="flex justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <span class="font-semibold text-gray-700">Total estimado</span>
          <span class="font-bold text-[#2D6A4F]">Bs. {totalDonacion.toFixed(2)}</span>
        </div>

        <!-- Info box -->
        <div class="flex items-start gap-3 rounded-xl border border-[#2D6A4F]/30 bg-[#2D6A4F]/5 p-4">
          <BookCheck class="mt-0.5 size-5 shrink-0 text-[#2D6A4F]" />
          <p class="text-sm text-[#2D6A4F]">
            Se generará automáticamente el asiento de ingreso contable.
          </p>
        </div>

        <!-- Donation error -->
        {#if donationError}
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {donationError}
          </p>
        {/if}
      </div>
    {/if}
  </div>

  <!-- ══ FIXED BOTTOM BAR ══════════════════════════════════════════════════ -->
  <div class="fixed right-0 bottom-0 left-0 flex gap-2 border-t bg-white px-4 py-3 md:pl-64">
    {#if paso === 0}
      <button
        onclick={() => (paso = 1)}
        disabled={!donante || !fecha}
        class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245a42] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente →
      </button>
    {:else if paso === 1}
      <button
        onclick={() => (paso = 0)}
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        ← Atrás
      </button>
      <button
        onclick={() => (paso = 2)}
        disabled={items.length === 0}
        class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245a42] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente →
      </button>
    {:else}
      <button
        onclick={() => (paso = 1)}
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        ← Atrás
      </button>
      <button
        onclick={() => $createDonationMutation.mutate()}
        disabled={$createDonationMutation.isPending}
        class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245a42] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {#if $createDonationMutation.isPending}
          <Loader2 class="size-4 animate-spin" />
          Guardando...
        {:else}
          Confirmar y guardar
        {/if}
      </button>
    {/if}
  </div>

  <!-- ══ DRAWER: Seleccionar donante ═════════════════════════════════════════ -->
  <Drawer.Root
    open={drawerMode === 'donante'}
    onClose={() => (drawerMode = null)}
  >
    <Drawer.Portal>
      <Drawer.Overlay class="fixed inset-0 bg-black/40" />
      <Drawer.Content
        class="fixed right-0 bottom-0 left-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white"
      >
        <div class="flex items-center justify-between border-b px-4 py-4">
          <h2 class="text-base font-semibold text-gray-900">Seleccionar donante</h2>
          <div class="flex items-center gap-2">
            <button
              onclick={() => (drawerMode = 'nuevo-donante')}
              class="text-sm font-medium text-[#2D6A4F] hover:underline"
            >
              Registrar nuevo →
            </button>
            <button
              onclick={() => (drawerMode = null)}
              class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X class="size-5" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <!-- Search -->
          <div class="relative mb-4">
            <Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o contacto..."
              bind:value={searchDonante}
              class="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-9 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
            />
          </div>

          <!-- Loading state -->
          {#if $donorsQuery.isPending}
            <div class="space-y-2">
              {#each [1, 2, 3] as skeleton (skeleton)}
                <div class="h-14 animate-pulse rounded-lg bg-gray-100"></div>
              {/each}
            </div>
          {:else}
            <!-- List -->
            <div class="space-y-2">
              {#each filteredDonantes as d (d.id)}
                <button
                  onclick={() => selectDonante(d as Donante)}
                  class="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-3 text-left hover:border-[#2D6A4F]/40 hover:bg-[#2D6A4F]/5"
                >
                  <User class="size-5 shrink-0 text-[#2D6A4F]" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">{d.nombre}</p>
                    <p class="text-xs text-gray-500">{d.pais} · {d.contacto}</p>
                  </div>
                </button>
              {/each}
              {#if filteredDonantes.length === 0}
                <p class="py-6 text-center text-sm text-gray-400">Sin resultados</p>
              {/if}
            </div>
          {/if}
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>

  <!-- ══ DRAWER: Registrar nuevo donante ═════════════════════════════════════ -->
  <Drawer.Root
    open={drawerMode === 'nuevo-donante'}
    onClose={() => (drawerMode = null)}
  >
    <Drawer.Portal>
      <Drawer.Overlay class="fixed inset-0 bg-black/40" />
      <Drawer.Content
        class="fixed right-0 bottom-0 left-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white"
      >
        <div class="flex items-center gap-3 border-b px-4 py-4">
          <button
            onclick={() => (drawerMode = 'donante')}
            class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Volver"
          >
            <ArrowLeft class="size-5" />
          </button>
          <h2 class="text-base font-semibold text-gray-900">Nuevo donante</h2>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto p-4">
          <!-- Nombre -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700" for="nd-nombre">
              Nombre *
            </label>
            <input
              id="nd-nombre"
              type="text"
              bind:value={nuevoDonantNombre}
              placeholder="Nombre completo o razón social"
              class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
            />
          </div>

          <!-- País -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700" for="nd-pais">
              País *
            </label>
            <input
              id="nd-pais"
              type="text"
              bind:value={nuevoDonantPais}
              placeholder="Ej. Venezuela"
              class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
            />
          </div>

          <!-- Contacto -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700" for="nd-contacto">
              Contacto *
            </label>
            <input
              id="nd-contacto"
              type="text"
              bind:value={nuevoDonantContacto}
              placeholder="Teléfono, email o dirección"
              class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
            />
          </div>

          <!-- Es fijo -->
          <label class="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              bind:checked={nuevoDonantEsFijo}
              class="size-4 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F]"
            />
            <span class="text-sm font-medium text-gray-700">Donante recurrente</span>
          </label>

          <button
            onclick={() => $createDonorMutation.mutate({
              nombre: nuevoDonantNombre,
              pais: nuevoDonantPais,
              contacto: nuevoDonantContacto,
              esFijo: nuevoDonantEsFijo,
            })}
            disabled={!nuevoDonantNombre || !nuevoDonantPais || !nuevoDonantContacto || $createDonorMutation.isPending}
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245a42] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {#if $createDonorMutation.isPending}
              <Loader2 class="size-4 animate-spin" />
              Registrando...
            {:else}
              Registrar y seleccionar
            {/if}
          </button>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>

  <!-- ══ DRAWER: Agregar insumo ═══════════════════════════════════════════════ -->
  <Drawer.Root
    open={drawerMode === 'insumo'}
    onClose={resetInsumoDrawer}
  >
    <Drawer.Portal>
      <Drawer.Overlay class="fixed inset-0 bg-black/40" />
      <Drawer.Content
        class="fixed right-0 bottom-0 left-0 flex max-h-[90vh] flex-col rounded-t-2xl bg-white"
      >
        <!-- Sub-step dots -->
        <div class="flex items-center justify-center gap-2 pt-4 pb-2">
          {#each ['tipo', 'catalogo', 'datos'] as step (step)}
            <div
              class="size-2 rounded-full transition-colors
                {insumoStep === step ? 'bg-[#2D6A4F]' : 'bg-gray-300'}"
            ></div>
          {/each}
        </div>

        <!-- Step: tipo -->
        {#if insumoStep === 'tipo'}
          <div class="flex items-center justify-between border-b px-4 py-3">
            <h2 class="text-base font-semibold text-gray-900">¿Qué tipo de insumo?</h2>
            <button
              onclick={resetInsumoDrawer}
              class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X class="size-5" />
            </button>
          </div>
          <div class="flex flex-col gap-4 p-6">
            <button
              onclick={() => {
                insumoTipo = 'MEDICAMENTO';
                insumoStep = 'catalogo';
              }}
              class="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-6 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5"
            >
              <Pill class="size-8 text-[#2D6A4F]" />
              <span class="text-base font-semibold text-gray-800">Medicamento</span>
            </button>
            <button
              onclick={() => {
                insumoTipo = 'MATERIAL';
                insumoStep = 'datos';
              }}
              class="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-6 hover:border-blue-500 hover:bg-blue-50"
            >
              <Stethoscope class="size-8 text-blue-600" />
              <span class="text-base font-semibold text-gray-800">Material médico</span>
            </button>
          </div>

        <!-- Step: catalogo (MEDICAMENTO only) -->
        {:else if insumoStep === 'catalogo'}
          <div class="flex items-center gap-3 border-b px-4 py-3">
            <button
              onclick={() => (insumoStep = 'tipo')}
              class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Volver"
            >
              <ArrowLeft class="size-5" />
            </button>
            <h2 class="flex-1 text-base font-semibold text-gray-900">Seleccionar medicamento</h2>
            <button
              onclick={resetInsumoDrawer}
              class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X class="size-5" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div class="relative mb-4">
              <Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar medicamento..."
                bind:value={searchInsumo}
                class="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-9 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
              />
            </div>

            {#if $medicationsQuery.isPending}
              <div class="space-y-2">
                {#each [1, 2, 3, 4] as skeleton (skeleton)}
                  <div class="h-12 animate-pulse rounded-lg bg-gray-100"></div>
                {/each}
              </div>
            {:else}
              <div class="space-y-2">
                {#each catalogoFiltrado as med (med.id)}
                  <button
                    onclick={() => {
                      insumoSeleccionado = { id: med.id, nombre: getMedNombre(med) };
                      insumoStep = 'datos';
                    }}
                    class="flex w-full flex-col items-start rounded-lg border border-gray-100 p-3 text-left hover:border-[#2D6A4F]/40 hover:bg-[#2D6A4F]/5"
                  >
                    <p class="text-sm font-medium text-gray-900">{getMedNombre(med)}</p>
                    {#if med.marca?.laboratorio?.nombre}
                      <p class="text-xs text-gray-500">{med.marca.laboratorio.nombre}</p>
                    {/if}
                  </button>
                {/each}
                {#if catalogoFiltrado.length === 0}
                  <p class="py-6 text-center text-sm text-gray-400">Sin resultados</p>
                {/if}
              </div>
            {/if}
          </div>

        <!-- Step: datos -->
        {:else}
          <div class="flex items-center gap-3 border-b px-4 py-3">
            <button
              onclick={() => (insumoTipo === 'MEDICAMENTO' ? (insumoStep = 'catalogo') : (insumoStep = 'tipo'))}
              class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Volver"
            >
              <ArrowLeft class="size-5" />
            </button>
            <div class="min-w-0 flex-1">
              {#if insumoTipo === 'MEDICAMENTO' && insumoSeleccionado}
                <h2 class="truncate text-base font-semibold text-gray-900">{insumoSeleccionado.nombre}</h2>
                <p class="text-xs text-gray-500">Medicamento</p>
              {:else}
                <h2 class="text-base font-semibold text-gray-900">Material médico</h2>
              {/if}
            </div>
            <button
              onclick={resetInsumoDrawer}
              class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X class="size-5" />
            </button>
          </div>

          <div class="flex-1 space-y-4 overflow-y-auto p-4">
            {#if insumoTipo === 'MEDICAMENTO'}
              <!-- Via de administración -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="ins-via">
                  Vía de administración *
                </label>
                <select
                  id="ins-via"
                  bind:value={insForm.viaAdministracionId}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {#each ($adminRoutesQuery.data ?? []) as route (route.id)}
                    <option value={route.id}>{route.nombre}</option>
                  {/each}
                </select>
              </div>

              <!-- Forma farmacéutica -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="ins-forma">
                  Forma farmacéutica *
                </label>
                <select
                  id="ins-forma"
                  bind:value={insForm.formaFarmaceuticaId}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {#each ($pharmaFormsQuery.data ?? []) as form (form.id)}
                    <option value={form.id}>{form.nombre}</option>
                  {/each}
                </select>
              </div>

              <!-- Empaque -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="ins-empaque">
                  Empaque *
                </label>
                <select
                  id="ins-empaque"
                  bind:value={insForm.empaqueId}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {#each ($packagesQuery.data ?? []) as pkg (pkg.id)}
                    <option value={pkg.id}>{pkg.nombre}</option>
                  {/each}
                </select>
              </div>

              <!-- Cantidad por empaque -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="ins-cant-emp">
                  Cantidad por empaque *
                </label>
                <input
                  id="ins-cant-emp"
                  type="number"
                  min="1"
                  bind:value={insForm.cantidadPorEmpaque}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <!-- Número de lote -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="ins-lote">
                  Número de lote
                </label>
                <input
                  id="ins-lote"
                  type="text"
                  bind:value={insForm.numeroLote}
                  placeholder="Número de lote"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <!-- Fecha de vencimiento -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="ins-venc">
                  Fecha de vencimiento *
                </label>
                <input
                  id="ins-venc"
                  type="date"
                  bind:value={insForm.fechaVencimiento}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <!-- Cantidad -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="ins-cant">
                  Cantidad *
                </label>
                <input
                  id="ins-cant"
                  type="number"
                  min="1"
                  bind:value={insForm.cantidad}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <!-- Precio unitario referencial -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="ins-precio">
                  Precio unitario referencial Bs. (opcional)
                </label>
                <input
                  id="ins-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  bind:value={insForm.precioUnitarioReferencial}
                  placeholder="0.00"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <button
                onclick={agregarMedicamento}
                disabled={!insForm.viaAdministracionId || !insForm.formaFarmaceuticaId || !insForm.empaqueId || !insForm.fechaVencimiento || insForm.cantidad <= 0}
                class="w-full rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245a42] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Agregar medicamento
              </button>

            {:else}
              <!-- Material fields -->
              <!-- Nombre -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="mat-nombre">
                  Nombre *
                </label>
                <input
                  id="mat-nombre"
                  type="text"
                  bind:value={matForm.nombre}
                  placeholder="Nombre del material"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <!-- Número de lote -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="mat-lote">
                  Número de lote
                </label>
                <input
                  id="mat-lote"
                  type="text"
                  bind:value={matForm.numeroLote}
                  placeholder="Número de lote"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <!-- Fecha de vencimiento -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="mat-venc">
                  Fecha de vencimiento *
                </label>
                <input
                  id="mat-venc"
                  type="date"
                  bind:value={matForm.fechaVencimiento}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <!-- Cantidad -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="mat-cant">
                  Cantidad *
                </label>
                <input
                  id="mat-cant"
                  type="number"
                  min="1"
                  bind:value={matForm.cantidad}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <!-- Precio unitario referencial -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700" for="mat-precio">
                  Precio unitario referencial Bs. (opcional)
                </label>
                <input
                  id="mat-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  bind:value={matForm.precioUnitarioReferencial}
                  placeholder="0.00"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <button
                onclick={agregarMaterial}
                disabled={!matForm.nombre || !matForm.fechaVencimiento || matForm.cantidad <= 0}
                class="w-full rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245a42] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Agregar material
              </button>
            {/if}
          </div>
        {/if}
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
{/if}
