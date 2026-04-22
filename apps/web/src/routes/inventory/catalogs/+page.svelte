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
    Info,
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/api';

  // ── Types ─────────────────────────────────────────────────────────────────────

  type Tab = 'medicamentos' | 'materiales' | 'categorias';

  // ── Query client ──────────────────────────────────────────────────────────────

  const queryClient = useQueryClient();

  // ── Queries ───────────────────────────────────────────────────────────────────

  const medsQuery = createQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const res = await api.api.inventory.medications.get();
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al cargar medicamentos');
      return res.data ?? [];
    },
  });

  const matsQuery = createQuery({
    queryKey: ['surgical-materials'],
    queryFn: async () => {
      const res = await api.api.inventory['surgical-materials'].get();
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al cargar materiales');
      return res.data ?? [];
    },
  });

  const catsQuery = createQuery({
    queryKey: ['medication-categories'],
    queryFn: async () => {
      const res = await api.api.inventory['medication-categories'].get();
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al cargar categorías');
      return res.data ?? [];
    },
  });

  // ── Mutation ──────────────────────────────────────────────────────────────────

  const createCategoryMutation = createMutation({
    mutationFn: async (nombre: string) => {
      const res = await api.api.inventory['medication-categories'].post({ nombre });
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al guardar');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-categories'] });
      guardado = true;
      guardadoNombre = formNombre;
    },
  });

  // ── State ─────────────────────────────────────────────────────────────────────

  let tabActivo = $state<Tab>('medicamentos');
  let search = $state('');
  let drawerOpen = $state(false);

  // Form state
  let formNombre = $state('');
  let guardado = $state(false);
  let guardadoNombre = $state('');
  let mutationError = $state('');

  // ── Derived — filtered lists ──────────────────────────────────────────────────

  const filteredMeds = $derived.by(() => {
    const data = $medsQuery.data ?? [];
    const q = search.toLowerCase();
    return data.filter((m: any) => m.nombre.toLowerCase().includes(q));
  });

  const filteredMats = $derived.by(() => {
    const data = $matsQuery.data ?? [];
    const q = search.toLowerCase();
    return data.filter((m: any) => m.nombre.toLowerCase().includes(q));
  });

  const filteredCats = $derived.by(() => {
    const data = $catsQuery.data ?? [];
    const q = search.toLowerCase();
    return data.filter((c: any) => c.nombre.toLowerCase().includes(q));
  });

  const activeCount = $derived(
    tabActivo === 'medicamentos'
      ? filteredMeds.length
      : tabActivo === 'materiales'
        ? filteredMats.length
        : filteredCats.length,
  );

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function drawerTitle(): string {
    if (tabActivo === 'medicamentos') return 'Nuevo medicamento';
    if (tabActivo === 'materiales') return 'Nuevo material';
    return 'Nueva categoría';
  }

  function searchPlaceholder(): string {
    if (tabActivo === 'medicamentos') return 'Buscar medicamento…';
    if (tabActivo === 'materiales') return 'Buscar material…';
    return 'Buscar categoría…';
  }

  async function handleGuardar() {
    if (!formNombre.trim()) return;
    mutationError = '';
    try {
      await $createCategoryMutation.mutateAsync(formNombre.trim());
    } catch (err) {
      mutationError = err instanceof Error ? err.message : 'Error inesperado';
    }
  }

  function resetForm() {
    formNombre = '';
    guardado = false;
    guardadoNombre = '';
    mutationError = '';
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
    <p class="text-xs text-gray-500 mb-3">{activeCount} elemento(s)</p>

    <!-- ── Medicamentos ── -->
    {#if tabActivo === 'medicamentos'}
      {#if $medsQuery.isPending}
        <ul class="flex flex-col gap-3">
          {#each { length: 4 } as _, i (i)}
            <li class="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
              <div class="flex items-center gap-3">
                <div class="size-9 rounded-lg bg-gray-200 shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {:else if $medsQuery.isError}
        <div class="flex flex-col items-center justify-center gap-3 py-20 text-red-400">
          <Pill class="size-10 stroke-[1.5]" />
          <p class="text-sm">{$medsQuery.error?.message ?? 'Error al cargar medicamentos'}</p>
        </div>
      {:else if filteredMeds.length === 0}
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
                {#if med.categorias?.length}
                  <p class="text-xs text-gray-500 mt-0.5 truncate">
                    {med.categorias.map((c: any) => c.nombre).join(', ')}
                  </p>
                {/if}
                {#if med.presentaciones?.length}
                  <span class="mt-1 inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                    {med.presentaciones.length} presentación(es)
                  </span>
                {/if}
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
      {#if $matsQuery.isPending}
        <ul class="flex flex-col gap-3">
          {#each { length: 3 } as _, i (i)}
            <li class="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
              <div class="flex items-center gap-3">
                <div class="size-9 rounded-lg bg-gray-200 shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {:else if $matsQuery.isError}
        <div class="flex flex-col items-center justify-center gap-3 py-20 text-red-400">
          <Stethoscope class="size-10 stroke-[1.5]" />
          <p class="text-sm">{$matsQuery.error?.message ?? 'Error al cargar materiales'}</p>
        </div>
      {:else if filteredMats.length === 0}
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
                {#if mat.insumo != null}
                  <p class="text-xs text-gray-500 mt-0.5">
                    Stock disponible: {mat.insumo.stockDisponible}
                  </p>
                {/if}
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
      {#if $catsQuery.isPending}
        <ul class="flex flex-col gap-3">
          {#each { length: 5 } as _, i (i)}
            <li class="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
              <div class="flex items-center gap-3">
                <div class="size-9 rounded-lg bg-gray-200 shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {:else if $catsQuery.isError}
        <div class="flex flex-col items-center justify-center gap-3 py-20 text-red-400">
          <Tag class="size-10 stroke-[1.5]" />
          <p class="text-sm">{$catsQuery.error?.message ?? 'Error al cargar categorías'}</p>
        </div>
      {:else if filteredCats.length === 0}
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

          {#if tabActivo === 'categorias'}
            <!-- Category form -->
            <div class="space-y-4">
              <div class="space-y-1">
                <label for="form-nombre" class="text-xs font-medium text-gray-700">
                  Nombre <span class="text-red-500">*</span>
                </label>
                <input
                  id="form-nombre"
                  type="text"
                  bind:value={formNombre}
                  placeholder="Ej. Analgésico"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
                />
              </div>

              {#if mutationError}
                <p class="text-xs text-red-500">{mutationError}</p>
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
                disabled={!formNombre.trim() || $createCategoryMutation.isPending}
                class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2D6A4F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {$createCategoryMutation.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>

          {:else}
            <!-- Info message for medications and materials -->
            <div class="flex flex-col items-center gap-4 py-6 text-center">
              <span class="rounded-full bg-amber-100 p-3 text-amber-600">
                <Info class="size-6" />
              </span>
              <div class="space-y-1">
                <p class="text-sm font-medium text-gray-900">Registro no disponible aquí</p>
                <p class="text-sm text-gray-500">
                  Para registrar medicamentos o materiales, use el módulo de Donaciones.
                </p>
              </div>
              <button
                onclick={handleCerrarDrawer}
                class="mt-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Entendido
              </button>
            </div>
          {/if}

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
