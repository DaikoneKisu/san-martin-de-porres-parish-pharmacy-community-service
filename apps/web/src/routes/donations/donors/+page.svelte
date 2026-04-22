<script lang="ts">
  import { ArrowLeft, Search, Plus, Heart, CheckCircle2, X } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/api';

  type EsFijoFiltro = 'all' | 'fijo' | 'eventual';

  let search = $state('');
  let esFijoFiltro = $state<EsFijoFiltro>('all');
  let drawerOpen = $state(false);
  let guardado = $state(false);
  let guardadoNombre = $state('');
  let form = $state({
    nombre: '',
    pais: '',
    contacto: '',
    esFijo: false
  });

  const queryClient = useQueryClient();

  const donorsQuery = createQuery({
    queryKey: ['donors'],
    queryFn: async () => {
      const res = await api.api.donations.donors.get();
      if (res.error) throw new Error('Error al cargar donantes');
      return res.data;
    }
  });

  const createDonorMutation = createMutation({
    mutationFn: async (body: { nombre: string; pais: string; contacto: string; esFijo: boolean }) => {
      const res = await api.api.donations.donors.post(body);
      if (res.error) throw new Error('Error al registrar donante');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
    }
  });

  const filtered = $derived(
    ($donorsQuery.data ?? [])
      .filter((d: any) => esFijoFiltro === 'all' || (esFijoFiltro === 'fijo' ? d.esFijo : !d.esFijo))
      .filter((d: any) =>
        d.nombre.toLowerCase().includes(search.toLowerCase()) ||
        d.contacto.toLowerCase().includes(search.toLowerCase())
      )
  );

  async function handleGuardar() {
    if (!form.nombre || !form.pais || !form.contacto) return;
    await $createDonorMutation.mutateAsync({
      nombre: form.nombre,
      pais: form.pais,
      contacto: form.contacto,
      esFijo: form.esFijo
    });
    guardadoNombre = form.nombre;
    guardado = true;
  }

  function handleCerrarDrawer() {
    drawerOpen = false;
    setTimeout(() => {
      guardado = false;
      guardadoNombre = '';
      form = { nombre: '', pais: '', contacto: '', esFijo: false };
    }, 300);
  }
</script>

<!-- Sticky header -->
<header class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
  <a href="/donations" class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
    <ArrowLeft class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only">Volver</span>
  </a>
  <h1 class="flex-1 text-base font-semibold">Donantes</h1>
  <button
    onclick={() => (drawerOpen = true)}
    class="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
  >
    <Plus class="h-4 w-4" />
    Nuevo
  </button>
</header>

<main class="mx-auto max-w-xl px-4 py-4 space-y-4">
  <!-- Search -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    <input
      type="search"
      placeholder="Buscar por nombre o contacto..."
      bind:value={search}
      class="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </div>

  <!-- Filter chips -->
  <div class="flex gap-2 flex-wrap">
    {#each ([['all', 'Todos'], ['fijo', 'Fijos'], ['eventual', 'Eventuales']] as const) as [val, label] (val)}
      <button
        onclick={() => (esFijoFiltro = val)}
        class="rounded-full px-3 py-1 text-xs font-medium border transition-colors
          {esFijoFiltro === val
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-muted-foreground border-border hover:border-primary/50'}"
      >
        {label}
      </button>
    {/each}
  </div>

  <!-- Loading skeletons -->
  {#if $donorsQuery.isPending}
    <ul class="space-y-2">
      {#each [1, 2, 3] as n (n)}
        <li class="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm animate-pulse">
          <span class="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-muted"></span>
          <div class="flex-1 space-y-2">
            <div class="h-3.5 w-1/2 rounded bg-muted"></div>
            <div class="h-3 w-2/3 rounded bg-muted"></div>
          </div>
          <div class="h-6 w-16 rounded-full bg-muted shrink-0"></div>
        </li>
      {/each}
    </ul>

  <!-- Error state -->
  {:else if $donorsQuery.isError}
    <div class="flex flex-col items-center gap-3 py-16 text-center">
      <X class="h-10 w-10 text-destructive/50" />
      <p class="text-sm text-muted-foreground">Error al cargar los donantes. Intente de nuevo.</p>
    </div>

  {:else}
    <!-- Counter -->
    <p class="text-xs text-muted-foreground">{filtered.length} donante(s)</p>

    <!-- List -->
    {#if filtered.length === 0}
      <div class="flex flex-col items-center gap-3 py-16 text-center">
        <Heart class="h-10 w-10 text-muted-foreground/40" />
        <p class="text-sm text-muted-foreground">Sin donantes registrados</p>
      </div>
    {:else}
      <ul class="space-y-2">
        {#each filtered as donante (donante.id)}
          <li class="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Heart class="h-4 w-4 text-primary" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{donante.nombre}</p>
              <p class="text-xs text-muted-foreground mt-0.5">
                {donante.pais} · {donante.contacto}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span class="rounded-full px-2.5 py-1 text-xs font-medium
                {donante.esFijo
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'}">
                {donante.esFijo ? 'Fijo' : 'Eventual'}
              </span>
              <span class="text-xs text-muted-foreground">
                {donante.donaciones.length} donación(es)
              </span>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</main>

<!-- Drawer: registrar donante -->
<Drawer.Root bind:open={drawerOpen} onClose={handleCerrarDrawer}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-background border-t max-h-[90svh]">
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-muted"></div>

      <div class="overflow-y-auto px-4 pb-8 pt-2">
        {#if !guardado}
          <!-- Formulario -->
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold">Registrar donante</h2>
            <button
              onclick={handleCerrarDrawer}
              class="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Cerrar"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Campos -->
          <div class="space-y-3">
            <div class="space-y-1">
              <label for="nombre" class="text-xs font-medium text-foreground">
                Nombre <span class="text-destructive">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                bind:value={form.nombre}
                placeholder="Nombre completo o institución"
                class="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-1">
              <label for="pais" class="text-xs font-medium text-foreground">
                País <span class="text-destructive">*</span>
              </label>
              <input
                id="pais"
                type="text"
                bind:value={form.pais}
                placeholder="Venezuela"
                class="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-1">
              <label for="contacto" class="text-xs font-medium text-foreground">
                Contacto <span class="text-destructive">*</span>
              </label>
              <input
                id="contacto"
                type="text"
                bind:value={form.contacto}
                placeholder="Teléfono o correo electrónico"
                class="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <label class="flex items-center gap-3 cursor-pointer rounded-xl border px-3 py-3 hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                bind:checked={form.esFijo}
                class="h-4 w-4 rounded border-border accent-primary"
              />
              <span class="text-sm font-medium">¿Es donante fijo?</span>
            </label>
          </div>

          <!-- Botones -->
          <div class="mt-6 flex gap-2">
            <button
              onclick={handleCerrarDrawer}
              class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onclick={handleGuardar}
              disabled={!form.nombre || !form.pais || !form.contacto || $createDonorMutation.isPending}
              class="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {$createDonorMutation.isPending ? 'Registrando...' : 'Registrar'}
            </button>
          </div>

          {#if $createDonorMutation.isError}
            <p class="mt-3 text-center text-xs text-destructive">
              Error al registrar donante. Intente de nuevo.
            </p>
          {/if}

        {:else}
          <!-- Estado éxito -->
          <div class="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 class="h-10 w-10 text-emerald-500" />
            <div class="space-y-1">
              <p class="text-base font-semibold">Donante registrado</p>
              <p class="text-sm text-muted-foreground">
                <strong>{guardadoNombre}</strong> fue registrado correctamente.
              </p>
            </div>
            <button
              onclick={handleCerrarDrawer}
              class="mt-2 rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          </div>
        {/if}
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
