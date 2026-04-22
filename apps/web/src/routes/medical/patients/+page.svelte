<script lang="ts">
  import { DateTime } from 'luxon';
  import { Plus, Search, ChevronRight, SlidersHorizontal, Users, CheckCircle2, X } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/api';

  type Patient = {
    id: string;
    nombre: string;
    cedula: string;
    fechaNac: string;
    genero: 'M' | 'F';
    telefono: string;
    lugarNac: string;
    residencia: string;
    historialMedicoId: string;
  };

  function calcEdad(fechaNac: string): number {
    return Math.abs(Math.floor(DateTime.fromISO(fechaNac).diffNow('years').years));
  }

  const queryClient = useQueryClient();

  const patientsQuery = createQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.api.medical.patients.get();
      if (res.error) throw new Error(res.error.value?.message ?? 'Error al cargar pacientes');
      return res.data as Patient[];
    },
  });

  const mutation = createMutation({
    mutationFn: async (body: {
      nombre: string;
      cedula: string;
      fechaNac: string;
      genero: string;
      telefono: string;
      lugarNac: string;
      residencia: string;
    }) => {
      const res = await api.api.medical.patients.post(body);
      if (res.error) throw new Error(res.error.value?.message ?? 'Error al registrar paciente');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  let search = $state('');
  let generoFiltro = $state<'all' | 'M' | 'F'>('all');
  let filtrosDrawerOpen = $state(false);
  let nuevoDrawerOpen = $state(false);
  let guardado = $state(false);
  let guardadoNombre = $state('');
  let submitError = $state('');
  let form = $state({ nombre: '', apellido: '', cedula: '', fechaNac: '', genero: '', telefono: '', lugarNac: '', residencia: '' });
  let formErrors = $state<Record<string, string>>({});

  const patients = $derived($patientsQuery.data ?? []);

  const filtered = $derived(
    patients
      .filter(p => generoFiltro === 'all' || p.genero === generoFiltro)
      .filter(p => {
        const q = search.toLowerCase();
        return !q || p.nombre.toLowerCase().includes(q) || p.cedula.toLowerCase().includes(q);
      })
  );

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido.';
    if (!form.apellido.trim()) errors.apellido = 'El apellido es requerido.';
    if (!form.cedula.trim()) errors.cedula = 'La cédula es requerida.';
    if (!form.fechaNac) errors.fechaNac = 'La fecha de nacimiento es requerida.';
    if (!form.genero) errors.genero = 'El género es requerido.';
    formErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleGuardar() {
    if (!validateForm()) return;
    submitError = '';
    const nombreCompleto = `${form.nombre.trim()} ${form.apellido.trim()}`;
    try {
      await $mutation.mutateAsync({
        nombre: nombreCompleto,
        cedula: form.cedula.trim(),
        fechaNac: form.fechaNac,
        genero: form.genero,
        telefono: form.telefono.trim(),
        lugarNac: form.lugarNac.trim(),
        residencia: form.residencia.trim(),
      });
      guardadoNombre = nombreCompleto;
      guardado = true;
    } catch (e: unknown) {
      submitError = e instanceof Error ? e.message : 'Error al registrar paciente.';
    }
  }

  function resetNuevoDrawer() {
    setTimeout(() => {
      form = { nombre: '', apellido: '', cedula: '', fechaNac: '', genero: '', telefono: '', lugarNac: '', residencia: '' };
      formErrors = {};
      guardado = false;
      submitError = '';
    }, 300);
  }

  const inputClass = 'w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30';
  const selectClass = 'w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'text-xs font-medium text-gray-700';
  const errorClass = 'text-xs text-red-600 mt-0.5';

  const skeletonItems = [1, 2, 3];
</script>

<style>
  :global(:root) {
    --color-primary: #2D6A4F;
  }
</style>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
    <h1 class="text-lg font-bold text-gray-900">Pacientes</h1>
    <button
      onclick={() => (nuevoDrawerOpen = true)}
      class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white"
      style="background-color: #2D6A4F;"
    >
      <Plus size={16} />
      Nuevo
    </button>
  </div>

  <div class="flex-1 px-4 pt-4 pb-8 space-y-3 max-w-2xl mx-auto w-full">
    <!-- Search bar -->
    <div class="relative">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar por nombre o cédula..."
        bind:value={search}
        class="w-full rounded-lg border bg-white pl-9 pr-9 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {#if search}
        <button
          onclick={() => (search = '')}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      {/if}
    </div>

    <!-- Filter row -->
    <div class="flex items-center justify-between">
      <button
        onclick={() => (filtrosDrawerOpen = true)}
        class="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 relative"
      >
        <SlidersHorizontal size={15} />
        Filtros
        {#if generoFiltro !== 'all'}
          <span class="absolute -top-1 -right-1 size-2 rounded-full" style="background-color: #2D6A4F;"></span>
        {/if}
      </button>
      <span class="text-xs text-gray-500">
        {#if !$patientsQuery.isPending}{filtered.length} paciente(s){/if}
      </span>
    </div>

    <!-- Loading skeleton -->
    {#if $patientsQuery.isPending}
      <ul class="space-y-2">
        {#each skeletonItems as item (item)}
          <li class="flex items-center gap-3 rounded-xl bg-white border p-3">
            <div class="flex-shrink-0 size-10 rounded-full bg-gray-200 animate-pulse"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3.5 w-2/5 rounded bg-gray-200 animate-pulse"></div>
              <div class="h-3 w-3/5 rounded bg-gray-200 animate-pulse"></div>
              <div class="h-3 w-1/4 rounded bg-gray-200 animate-pulse"></div>
            </div>
          </li>
        {/each}
      </ul>

    <!-- Error state -->
    {:else if $patientsQuery.isError}
      <div class="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div class="rounded-full bg-red-50 p-4">
          <X size={28} class="text-red-400" />
        </div>
        <p class="font-medium text-gray-700">Error al cargar pacientes</p>
        <p class="text-sm text-gray-400">{$patientsQuery.error?.message ?? 'Intenta de nuevo más tarde.'}</p>
      </div>

    <!-- Card list -->
    {:else if filtered.length > 0}
      <ul class="space-y-2">
        {#each filtered as p (p.id)}
          <li>
            <a
              href="/medical/patients/{p.id}"
              class="flex items-center gap-3 rounded-xl bg-white border p-3 hover:shadow-sm transition-shadow"
            >
              <!-- Avatar -->
              <div
                class="flex-shrink-0 size-10 rounded-full flex items-center justify-center font-bold text-sm"
                style="background-color: #2D6A4F1A; color: #2D6A4F;"
              >
                {p.nombre[0]}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 text-sm truncate">{p.nombre}</p>
                <p class="text-xs text-gray-400 truncate">{p.cedula} · {calcEdad(p.fechaNac)} años</p>
                <span class="inline-block mt-0.5 rounded-full border px-2 py-0.5 text-xs text-gray-600">
                  {p.genero === 'M' ? 'Masculino' : 'Femenino'}
                </span>
              </div>

              <ChevronRight size={16} class="flex-shrink-0 text-gray-400" />
            </a>
          </li>
        {/each}
      </ul>

    {:else}
      <!-- Empty state -->
      <div class="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div class="rounded-full bg-gray-100 p-4">
          <Users size={28} class="text-gray-400" />
        </div>
        <p class="font-medium text-gray-700">Sin resultados</p>
        <p class="text-sm text-gray-400">Ajusta los filtros o el término de búsqueda.</p>
      </div>
    {/if}
  </div>
</div>

<!-- Filtros Drawer -->
<Drawer.Root bind:open={filtrosDrawerOpen} onClose={() => (filtrosDrawerOpen = false)}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-w-lg mx-auto">
      <!-- Drag handle -->
      <div class="flex justify-center pt-3 pb-1">
        <div class="w-10 h-1 rounded-full bg-gray-200"></div>
      </div>

      <div class="px-4 pb-6 space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between pt-1">
          <h2 class="text-base font-semibold text-gray-900">Filtros</h2>
          <button onclick={() => (filtrosDrawerOpen = false)} class="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <!-- Genero filter -->
        <div class="space-y-1.5">
          <label for="genero-filter" class={labelClass}>Género</label>
          <select id="genero-filter" bind:value={generoFiltro} class={selectClass}>
            <option value="all">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-1">
          <button
            onclick={() => { generoFiltro = 'all'; filtrosDrawerOpen = false; }}
            class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button
            onclick={() => (filtrosDrawerOpen = false)}
            class="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style="background-color: #2D6A4F;"
          >
            Aplicar
          </button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>

<!-- Nuevo Paciente Drawer -->
<Drawer.Root bind:open={nuevoDrawerOpen} onClose={() => { nuevoDrawerOpen = false; resetNuevoDrawer(); }}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-w-lg mx-auto max-h-[90svh] overflow-y-auto">
      <!-- Drag handle -->
      <div class="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
        <div class="w-10 h-1 rounded-full bg-gray-200"></div>
      </div>

      {#if !guardado}
        <div class="px-4 pb-8 space-y-4">
          <!-- Header -->
          <div class="flex items-center justify-between pt-1 sticky top-6 bg-white z-10 pb-1">
            <h2 class="text-base font-semibold text-gray-900">Registrar paciente</h2>
            <button onclick={() => { nuevoDrawerOpen = false; resetNuevoDrawer(); }} class="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <!-- Form -->
          <div class="space-y-3">
            <!-- Nombre + Apellido -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="nombre" class={labelClass}>Nombre *</label>
                <input id="nombre" type="text" placeholder="Nombre" bind:value={form.nombre} class={inputClass} />
                {#if formErrors.nombre}
                  <p class={errorClass}>{formErrors.nombre}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label for="apellido" class={labelClass}>Apellido *</label>
                <input id="apellido" type="text" placeholder="Apellido" bind:value={form.apellido} class={inputClass} />
                {#if formErrors.apellido}
                  <p class={errorClass}>{formErrors.apellido}</p>
                {/if}
              </div>
            </div>

            <!-- Cedula -->
            <div class="space-y-1">
              <label for="cedula" class={labelClass}>Cédula *</label>
              <input id="cedula" type="text" placeholder="V-12.345.678" bind:value={form.cedula} class={inputClass} />
              {#if formErrors.cedula}
                <p class={errorClass}>{formErrors.cedula}</p>
              {/if}
            </div>

            <!-- Fecha + Genero -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="fechaNac" class={labelClass}>Fecha de nacimiento *</label>
                <input id="fechaNac" type="date" bind:value={form.fechaNac} class={inputClass} />
                {#if formErrors.fechaNac}
                  <p class={errorClass}>{formErrors.fechaNac}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label for="genero" class={labelClass}>Género *</label>
                <select id="genero" bind:value={form.genero} class={selectClass}>
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                {#if formErrors.genero}
                  <p class={errorClass}>{formErrors.genero}</p>
                {/if}
              </div>
            </div>

            <!-- Teléfono -->
            <div class="space-y-1">
              <label for="telefono" class={labelClass}>Teléfono</label>
              <input id="telefono" type="tel" placeholder="0414-1234567" bind:value={form.telefono} class={inputClass} />
            </div>

            <!-- Lugar de nacimiento -->
            <div class="space-y-1">
              <label for="lugarNac" class={labelClass}>Lugar de nacimiento</label>
              <input id="lugarNac" type="text" placeholder="Ciudad o municipio de nacimiento" bind:value={form.lugarNac} class={inputClass} />
            </div>

            <!-- Residencia -->
            <div class="space-y-1">
              <label for="residencia" class={labelClass}>Residencia</label>
              <input id="residencia" type="text" placeholder="Dirección de residencia" bind:value={form.residencia} class={inputClass} />
            </div>
          </div>

          <!-- Submit error -->
          {#if submitError}
            <p class="text-sm text-red-600 rounded-lg bg-red-50 px-3 py-2">{submitError}</p>
          {/if}

          <!-- Actions -->
          <div class="flex gap-2 pt-1">
            <button
              onclick={() => { nuevoDrawerOpen = false; resetNuevoDrawer(); }}
              class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={$mutation.isPending}
            >
              Cancelar
            </button>
            <button
              onclick={handleGuardar}
              class="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style="background-color: #2D6A4F;"
              disabled={$mutation.isPending}
            >
              {$mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      {:else}
        <!-- Success state -->
        <div class="px-4 pb-10 flex flex-col items-center text-center gap-4 pt-6">
          <CheckCircle2 size={48} class="text-emerald-500" />
          <p class="text-base font-medium text-gray-900">{guardadoNombre} registrado correctamente.</p>
          <button
            onclick={() => { nuevoDrawerOpen = false; resetNuevoDrawer(); }}
            class="rounded-lg px-6 py-2 text-sm font-medium text-white"
            style="background-color: #2D6A4F;"
          >
            Cerrar
          </button>
        </div>
      {/if}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
