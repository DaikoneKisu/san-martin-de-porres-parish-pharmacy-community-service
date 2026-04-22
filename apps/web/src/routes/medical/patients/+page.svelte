<script lang="ts">
  import { DateTime } from 'luxon';
  import { Plus, Search, ChevronRight, SlidersHorizontal, Users, CheckCircle2, X } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';

  const PACIENTES = [
    { id: '1', nombre: 'Ana Sofía', apellido: 'Ramírez Torres', cedula: 'V-12.345.678', fechaNac: '1985-06-15', sexo: 'F', telefono: '0414-1234567', direccion: 'Urb. San Félix, Calle 3, Casa 12' },
    { id: '2', nombre: 'Carlos', apellido: 'Medina López', cedula: 'V-9.876.543', fechaNac: '1972-03-22', sexo: 'M', telefono: '0424-9876543', direccion: 'Sector La Unión, Edif. B, Apto 4' },
    { id: '3', nombre: 'María', apellido: 'González Pérez', cedula: 'V-15.432.100', fechaNac: '1990-11-08', sexo: 'F', telefono: '0416-5554433', direccion: 'Av. Las Américas, Qta. Rosalinda' },
    { id: '4', nombre: 'José Luis', apellido: 'Hernández', cedula: 'V-8.001.234', fechaNac: '1965-01-30', sexo: 'M', telefono: '0412-3334455', direccion: 'Calle Bolívar, Casa 45, San Félix' },
    { id: '5', nombre: 'Luisa', apellido: 'Martínez Blanco', cedula: 'V-22.678.901', fechaNac: '2001-09-14', sexo: 'F', telefono: '0426-7776655', direccion: 'Res. El Rosal, Piso 3, Apto 3-B' },
    { id: '6', nombre: 'Pedro', apellido: 'Castillo Rivas', cedula: 'V-11.223.344', fechaNac: '1958-07-25', sexo: 'M', telefono: '0414-2223344', direccion: 'Barrio El Carmen, Casa 8' },
  ];

  function calcEdad(fechaNac: string): number {
    return Math.abs(Math.floor(DateTime.fromISO(fechaNac).diffNow('years').years));
  }

  let search = $state('');
  let sexoFiltro = $state<'all' | 'M' | 'F'>('all');
  let filtrosDrawerOpen = $state(false);
  let nuevoDrawerOpen = $state(false);
  let guardado = $state(false);
  let guardadoNombre = $state('');
  let form = $state({ nombre: '', apellido: '', cedula: '', fechaNac: '', sexo: '', telefono: '', direccion: '' });
  let formErrors = $state<Record<string, string>>({});

  const filtered = $derived(
    PACIENTES
      .filter(p => sexoFiltro === 'all' || p.sexo === sexoFiltro)
      .filter(p => {
        const q = search.toLowerCase();
        return !q || p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q) || p.cedula.toLowerCase().includes(q);
      })
  );

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido.';
    if (!form.apellido.trim()) errors.apellido = 'El apellido es requerido.';
    if (!form.cedula.trim()) errors.cedula = 'La cédula es requerida.';
    if (!form.fechaNac) errors.fechaNac = 'La fecha de nacimiento es requerida.';
    if (!form.sexo) errors.sexo = 'El sexo es requerido.';
    formErrors = errors;
    return Object.keys(errors).length === 0;
  }

  function handleGuardar() {
    if (!validateForm()) return;
    guardadoNombre = `${form.nombre} ${form.apellido}`;
    guardado = true;
  }

  function resetNuevoDrawer() {
    setTimeout(() => {
      form = { nombre: '', apellido: '', cedula: '', fechaNac: '', sexo: '', telefono: '', direccion: '' };
      formErrors = {};
      guardado = false;
    }, 300);
  }

  const inputClass = 'w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30';
  const selectClass = 'w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'text-xs font-medium text-gray-700';
  const errorClass = 'text-xs text-red-600 mt-0.5';
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
        placeholder="Buscar por nombre, apellido o cédula..."
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
        {#if sexoFiltro !== 'all'}
          <span class="absolute -top-1 -right-1 size-2 rounded-full" style="background-color: #2D6A4F;"></span>
        {/if}
      </button>
      <span class="text-xs text-gray-500">{filtered.length} paciente(s)</span>
    </div>

    <!-- Card list -->
    {#if filtered.length > 0}
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
                {p.nombre[0]}{p.apellido[0]}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 text-sm truncate">{p.nombre} {p.apellido}</p>
                <p class="text-xs text-gray-400 truncate">{p.cedula} · {calcEdad(p.fechaNac)} años</p>
                <span class="inline-block mt-0.5 rounded-full border px-2 py-0.5 text-xs text-gray-600">
                  {p.sexo === 'M' ? 'Masculino' : 'Femenino'}
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

        <!-- Sexo filter -->
        <div class="space-y-1.5">
          <label for="sexo-filter" class={labelClass}>Sexo</label>
          <select id="sexo-filter" bind:value={sexoFiltro} class={selectClass}>
            <option value="all">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-1">
          <button
            onclick={() => { sexoFiltro = 'all'; filtrosDrawerOpen = false; }}
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

            <!-- Fecha + Sexo -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="fechaNac" class={labelClass}>Fecha de nacimiento *</label>
                <input id="fechaNac" type="date" bind:value={form.fechaNac} class={inputClass} />
                {#if formErrors.fechaNac}
                  <p class={errorClass}>{formErrors.fechaNac}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label for="sexo" class={labelClass}>Sexo *</label>
                <select id="sexo" bind:value={form.sexo} class={selectClass}>
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                {#if formErrors.sexo}
                  <p class={errorClass}>{formErrors.sexo}</p>
                {/if}
              </div>
            </div>

            <!-- Teléfono -->
            <div class="space-y-1">
              <label for="telefono" class={labelClass}>Teléfono</label>
              <input id="telefono" type="tel" placeholder="0414-1234567" bind:value={form.telefono} class={inputClass} />
            </div>

            <!-- Dirección -->
            <div class="space-y-1">
              <label for="direccion" class={labelClass}>Dirección</label>
              <input id="direccion" type="text" placeholder="Dirección de residencia" bind:value={form.direccion} class={inputClass} />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-1">
            <button
              onclick={() => { nuevoDrawerOpen = false; resetNuevoDrawer(); }}
              class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onclick={handleGuardar}
              class="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style="background-color: #2D6A4F;"
            >
              Guardar
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
