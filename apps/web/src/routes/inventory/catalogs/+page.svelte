<script lang="ts">
  import {
    ArrowLeft,
    Plus,
    Pill,
    Stethoscope,
    Tag,
    Search,
    Pencil,
    Trash2,
    CheckCircle2,
    X,
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';

  // ── Mock data ────────────────────────────────────────────────────────────────

  const MEDICAMENTOS = [
    { id: 'm1', nombre: 'Paracetamol 500mg', principioActivo: 'Paracetamol', formaFarmaceutica: 'Tableta', presentacion: 'Caja x 20 tab', categoria: 'Analgésico' },
    { id: 'm2', nombre: 'Ibuprofeno 400mg', principioActivo: 'Ibuprofeno', formaFarmaceutica: 'Tableta', presentacion: 'Caja x 10 tab', categoria: 'Antiinflamatorio' },
    { id: 'm3', nombre: 'Amoxicilina 500mg', principioActivo: 'Amoxicilina', formaFarmaceutica: 'Cápsula', presentacion: 'Caja x 12 cap', categoria: 'Antibiótico' },
    { id: 'm4', nombre: 'Vitamina C 500mg', principioActivo: 'Ácido ascórbico', formaFarmaceutica: 'Comprimido', presentacion: 'Frasco x 30 comp', categoria: 'Vitaminas' },
    { id: 'm5', nombre: 'Metformina 850mg', principioActivo: 'Metformina', formaFarmaceutica: 'Tableta', presentacion: 'Caja x 30 tab', categoria: 'Antidiabético' },
  ];

  const MATERIALES = [
    { id: 'mat1', nombre: 'Guantes de látex', presentacion: 'Caja x 100 uds', categoria: 'Protección' },
    { id: 'mat2', nombre: 'Gasas estériles', presentacion: 'Caja x 50 uds', categoria: 'Curaciones' },
    { id: 'mat3', nombre: 'Jeringas 5ml', presentacion: 'Caja x 100 uds', categoria: 'Inyectables' },
    { id: 'mat4', nombre: 'Vendas elásticas', presentacion: 'Paquete x 12 uds', categoria: 'Curaciones' },
  ];

  const CATEGORIAS = [
    { id: 'c1', nombre: 'Analgésico', descripcion: 'Medicamentos para el dolor', tipo: 'medicamento' },
    { id: 'c2', nombre: 'Antiinflamatorio', descripcion: 'Reducción de inflamación', tipo: 'medicamento' },
    { id: 'c3', nombre: 'Antibiótico', descripcion: 'Tratamiento de infecciones bacterianas', tipo: 'medicamento' },
    { id: 'c4', nombre: 'Vitaminas', descripcion: 'Suplementos vitamínicos', tipo: 'medicamento' },
    { id: 'c5', nombre: 'Antidiabético', descripcion: 'Control de glucemia', tipo: 'medicamento' },
    { id: 'c6', nombre: 'Protección', descripcion: 'Equipos de protección personal', tipo: 'material' },
    { id: 'c7', nombre: 'Curaciones', descripcion: 'Materiales para curación de heridas', tipo: 'material' },
    { id: 'c8', nombre: 'Inyectables', descripcion: 'Materiales para inyecciones', tipo: 'material' },
  ];

  // ── State ─────────────────────────────────────────────────────────────────────

  type Tab = 'medicamentos' | 'materiales' | 'categorias';

  let tabActivo = $state<Tab>('medicamentos');
  let search = $state('');
  let drawerOpen = $state(false);

  // Form state
  let formNombre = $state('');
  let formDescripcion = $state('');
  let formPresentacion = $state('');
  let formCategoria = $state('');
  let formPrincipioActivo = $state('');
  let formFormaFarmaceutica = $state('');
  let guardado = $state(false);
  let guardadoNombre = $state('');

  // ── Derived ───────────────────────────────────────────────────────────────────

  const filteredMeds = $derived(
    MEDICAMENTOS.filter(
      (m) =>
        m.nombre.toLowerCase().includes(search.toLowerCase()) ||
        m.principioActivo.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const filteredMats = $derived(
    MATERIALES.filter((m) => m.nombre.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredCats = $derived(
    CATEGORIAS.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase())),
  );

  const categoriasMedicamento = $derived(CATEGORIAS.filter((c) => c.tipo === 'medicamento'));
  const categoriasMaterial = $derived(CATEGORIAS.filter((c) => c.tipo === 'material'));

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function drawerTitle(): string {
    if (tabActivo === 'medicamentos') return 'Nuevo medicamento';
    if (tabActivo === 'materiales') return 'Nuevo material';
    return 'Nueva categoría';
  }

  function searchPlaceholder(): string {
    if (tabActivo === 'medicamentos') return 'Buscar por nombre o principio activo…';
    if (tabActivo === 'materiales') return 'Buscar material…';
    return 'Buscar categoría…';
  }

  function countLabel(): string {
    const count =
      tabActivo === 'medicamentos'
        ? filteredMeds.length
        : tabActivo === 'materiales'
          ? filteredMats.length
          : filteredCats.length;
    return `${count} elemento(s)`;
  }

  function handleGuardar() {
    if (!formNombre) return;
    guardadoNombre = formNombre;
    guardado = true;
  }

  function resetForm() {
    formNombre = '';
    formDescripcion = '';
    formPresentacion = '';
    formCategoria = '';
    formPrincipioActivo = '';
    formFormaFarmaceutica = '';
    guardado = false;
    guardadoNombre = '';
  }

  function handleCerrarDrawer() {
    drawerOpen = false;
    setTimeout(resetForm, 300);
  }

  function switchTab(tab: Tab) {
    tabActivo = tab;
    search = '';
  }
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
    <a
      href="/inventory"
      class="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
      aria-label="Volver al inventario"
    >
      <ArrowLeft class="size-5" />
    </a>
    <h1 class="flex-1 text-xl font-bold text-gray-900">Catálogos</h1>
    <button
      onclick={() => (drawerOpen = true)}
      class="inline-flex items-center gap-1.5 rounded-lg bg-[#2D6A4F] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2D6A4F]/90 transition-colors"
      aria-label="Agregar elemento"
    >
      <Plus class="size-4" />
      <span class="hidden sm:inline">Agregar</span>
    </button>
  </header>

  <!-- Main content -->
  <main class="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">

    <!-- Tab bar -->
    <div class="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
      <button
        onclick={() => switchTab('medicamentos')}
        class={[
          'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          tabActivo === 'medicamentos'
            ? 'bg-[#2D6A4F] text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ].join(' ')}
      >
        <Pill class="size-4 shrink-0" />
        <span class="hidden xs:inline sm:inline">Medicamentos</span>
      </button>
      <button
        onclick={() => switchTab('materiales')}
        class={[
          'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          tabActivo === 'materiales'
            ? 'bg-[#2D6A4F] text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ].join(' ')}
      >
        <Stethoscope class="size-4 shrink-0" />
        <span class="hidden xs:inline sm:inline">Materiales</span>
      </button>
      <button
        onclick={() => switchTab('categorias')}
        class={[
          'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          tabActivo === 'categorias'
            ? 'bg-[#2D6A4F] text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ].join(' ')}
      >
        <Tag class="size-4 shrink-0" />
        <span class="hidden xs:inline sm:inline">Categorías</span>
      </button>
    </div>

    <!-- Search -->
    <div class="relative mb-3">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        placeholder={searchPlaceholder()}
        bind:value={search}
        class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
      />
    </div>

    <!-- Count -->
    <p class="text-xs text-gray-500 mb-3">{countLabel()}</p>

    <!-- ── Medicamentos ── -->
    {#if tabActivo === 'medicamentos'}
      {#if filteredMeds.length === 0}
        <div class="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
          <Pill class="size-10 stroke-[1.5]" />
          <p class="text-sm">Sin medicamentos registrados</p>
        </div>
      {:else}
        <ul class="flex flex-col gap-3">
          {#each filteredMeds as med (med.id)}
            <li class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span class="shrink-0 rounded-lg bg-[#2D6A4F]/10 p-2 text-[#2D6A4F]">
                <Pill class="size-5" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{med.nombre}</p>
                <p class="text-xs text-gray-500 mt-0.5 truncate">
                  {med.principioActivo} · {med.formaFarmaceutica}
                </p>
                <span class="mt-1 inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                  {med.categoria}
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  onclick={() => console.log('edit', med.id)}
                  class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Editar {med.nombre}"
                >
                  <Pencil class="size-4" />
                </button>
                <button
                  onclick={() => console.log('delete', med.id)}
                  class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Eliminar {med.nombre}"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}

    <!-- ── Materiales ── -->
    {:else if tabActivo === 'materiales'}
      {#if filteredMats.length === 0}
        <div class="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
          <Stethoscope class="size-10 stroke-[1.5]" />
          <p class="text-sm">Sin materiales registrados</p>
        </div>
      {:else}
        <ul class="flex flex-col gap-3">
          {#each filteredMats as mat (mat.id)}
            <li class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span class="shrink-0 rounded-lg bg-blue-100 p-2 text-blue-600">
                <Stethoscope class="size-5" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{mat.nombre}</p>
                <p class="text-xs text-gray-500 mt-0.5 truncate">{mat.presentacion}</p>
                <span class="mt-1 inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                  {mat.categoria}
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  onclick={() => console.log('edit', mat.id)}
                  class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Editar {mat.nombre}"
                >
                  <Pencil class="size-4" />
                </button>
                <button
                  onclick={() => console.log('delete', mat.id)}
                  class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Eliminar {mat.nombre}"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}

    <!-- ── Categorías ── -->
    {:else}
      {#if filteredCats.length === 0}
        <div class="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
          <Tag class="size-10 stroke-[1.5]" />
          <p class="text-sm">Sin categorías registradas</p>
        </div>
      {:else}
        <ul class="flex flex-col gap-3">
          {#each filteredCats as cat (cat.id)}
            <li class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span class="shrink-0 rounded-lg bg-amber-100 p-2 text-amber-700">
                <Tag class="size-5" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{cat.nombre}</p>
                <p class="text-xs text-gray-500 mt-0.5 truncate">{cat.descripcion}</p>
                <span
                  class={[
                    'mt-1 inline-block px-2 py-0.5 rounded text-xs font-medium',
                    cat.tipo === 'medicamento'
                      ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                      : 'bg-blue-100 text-blue-700',
                  ].join(' ')}
                >
                  {cat.tipo === 'medicamento' ? 'Medicamento' : 'Material'}
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  onclick={() => console.log('edit', cat.id)}
                  class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Editar {cat.nombre}"
                >
                  <Pencil class="size-4" />
                </button>
                <button
                  onclick={() => console.log('delete', cat.id)}
                  class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Eliminar {cat.nombre}"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}

  </main>
</div>

<!-- ── Drawer ── -->
<Drawer.Root bind:open={drawerOpen} onClose={handleCerrarDrawer}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white border-t max-h-[92svh]">
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-gray-200"></div>

      <div class="overflow-y-auto px-4 pb-8 pt-2">
        {#if !guardado}
          <!-- Header -->
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-base font-semibold text-gray-900">{drawerTitle()}</h2>
            <button
              onclick={handleCerrarDrawer}
              class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              <X class="size-4" />
            </button>
          </div>

          <div class="space-y-4">

            <!-- Nombre (all tabs) -->
            <div class="space-y-1">
              <label for="form-nombre" class="text-xs font-medium text-gray-700">
                Nombre <span class="text-red-500">*</span>
              </label>
              <input
                id="form-nombre"
                type="text"
                bind:value={formNombre}
                placeholder={tabActivo === 'medicamentos' ? 'Ej. Paracetamol 500mg' : tabActivo === 'materiales' ? 'Ej. Guantes de látex' : 'Ej. Analgésico'}
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
              />
            </div>

            <!-- Medicamentos-only fields -->
            {#if tabActivo === 'medicamentos'}
              <div class="space-y-1">
                <label for="form-principio" class="text-xs font-medium text-gray-700">
                  Principio activo <span class="text-red-500">*</span>
                </label>
                <input
                  id="form-principio"
                  type="text"
                  bind:value={formPrincipioActivo}
                  placeholder="Ej. Paracetamol"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                />
              </div>

              <div class="space-y-1">
                <label for="form-forma" class="text-xs font-medium text-gray-700">
                  Forma farmacéutica
                </label>
                <select
                  id="form-forma"
                  bind:value={formFormaFarmaceutica}
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                >
                  <option value="">Seleccionar…</option>
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

            <!-- Presentación (medicamentos + materiales) -->
            {#if tabActivo === 'medicamentos' || tabActivo === 'materiales'}
              <div class="space-y-1">
                <label for="form-presentacion" class="text-xs font-medium text-gray-700">
                  Presentación <span class="text-red-500">*</span>
                </label>
                <input
                  id="form-presentacion"
                  type="text"
                  bind:value={formPresentacion}
                  placeholder="Ej. Caja x 20 tab"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                />
              </div>
            {/if}

            <!-- Categoría (medicamentos + materiales) -->
            {#if tabActivo === 'medicamentos'}
              <div class="space-y-1">
                <label for="form-categoria-med" class="text-xs font-medium text-gray-700">
                  Categoría
                </label>
                <select
                  id="form-categoria-med"
                  bind:value={formCategoria}
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                >
                  <option value="">Seleccionar…</option>
                  {#each categoriasMedicamento as cat (cat.id)}
                    <option value={cat.nombre}>{cat.nombre}</option>
                  {/each}
                </select>
              </div>
            {:else if tabActivo === 'materiales'}
              <div class="space-y-1">
                <label for="form-categoria-mat" class="text-xs font-medium text-gray-700">
                  Categoría
                </label>
                <select
                  id="form-categoria-mat"
                  bind:value={formCategoria}
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                >
                  <option value="">Seleccionar…</option>
                  {#each categoriasMaterial as cat (cat.id)}
                    <option value={cat.nombre}>{cat.nombre}</option>
                  {/each}
                </select>
              </div>
            {/if}

            <!-- Categorías tab: Descripción + Tipo -->
            {#if tabActivo === 'categorias'}
              <div class="space-y-1">
                <label for="form-descripcion" class="text-xs font-medium text-gray-700">
                  Descripción
                </label>
                <input
                  id="form-descripcion"
                  type="text"
                  bind:value={formDescripcion}
                  placeholder="Descripción breve de la categoría"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                />
              </div>

              <div class="space-y-1">
                <label for="form-tipo" class="text-xs font-medium text-gray-700">
                  Tipo
                </label>
                <select
                  id="form-tipo"
                  bind:value={formCategoria}
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                >
                  <option value="">Seleccionar…</option>
                  <option value="medicamento">Medicamento</option>
                  <option value="material">Material</option>
                </select>
              </div>
            {/if}

          </div>

          <!-- Actions -->
          <div class="mt-6 flex gap-2">
            <button
              onclick={handleCerrarDrawer}
              class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onclick={handleGuardar}
              disabled={!formNombre}
              class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2D6A4F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
          </div>

        {:else}
          <!-- Success state -->
          <div class="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 class="size-12 text-emerald-500" />
            <div class="space-y-1">
              <p class="text-base font-semibold text-gray-900">Guardado correctamente</p>
              <p class="text-sm text-gray-500">
                <strong>{guardadoNombre}</strong> agregado correctamente.
              </p>
            </div>
            <button
              onclick={handleCerrarDrawer}
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
