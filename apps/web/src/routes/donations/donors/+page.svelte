<script lang="ts">
  import { ArrowLeft, Search, Plus, User, Building2, Heart, CheckCircle2, X } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';

  const DONANTES = [
    { id: 'd1', tipo: 'persona' as const, nombre: 'María González', identificacion: 'V-12345678', telefono: '0414-1234567', donaciones: 3 },
    { id: 'd2', tipo: 'institucion' as const, nombre: 'Fundación Salud Bolívar', identificacion: 'J-30987654-0', telefono: '0286-9876543', donaciones: 5 },
    { id: 'd3', tipo: 'persona' as const, nombre: 'Carlos Martínez', identificacion: 'V-8765432', telefono: '0424-7654321', donaciones: 1 },
    { id: 'd4', tipo: 'institucion' as const, nombre: 'Iglesia San José', identificacion: 'J-28765432-1', telefono: '0286-1234567', donaciones: 2 },
  ];

  type TipoFiltro = 'all' | 'persona' | 'institucion';

  let search = $state('');
  let tipoFiltro = $state<TipoFiltro>('all');
  let drawerOpen = $state(false);
  let guardado = $state(false);
  let guardadoNombre = $state('');
  let form = $state({
    tipo: 'persona' as 'persona' | 'institucion',
    nombre: '',
    identificacion: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  const filtered = $derived(
    DONANTES
      .filter(d => tipoFiltro === 'all' || d.tipo === tipoFiltro)
      .filter(d =>
        d.nombre.toLowerCase().includes(search.toLowerCase()) ||
        d.identificacion.toLowerCase().includes(search.toLowerCase())
      )
  );

  function handleGuardar() {
    if (!form.nombre || !form.identificacion) return;
    guardadoNombre = form.nombre;
    guardado = true;
  }

  function handleCerrarDrawer() {
    drawerOpen = false;
    setTimeout(() => {
      guardado = false;
      guardadoNombre = '';
      form = { tipo: 'persona', nombre: '', identificacion: '', telefono: '', correo: '', direccion: '' };
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
      placeholder="Buscar por nombre o identificación..."
      bind:value={search}
      class="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </div>

  <!-- Filter chips -->
  <div class="flex gap-2 flex-wrap">
    {#each ([['all', 'Todos'], ['persona', 'Personas'], ['institucion', 'Instituciones']] as const) as [val, label]}
      <button
        onclick={() => (tipoFiltro = val)}
        class="rounded-full px-3 py-1 text-xs font-medium border transition-colors
          {tipoFiltro === val
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-muted-foreground border-border hover:border-primary/50'}"
      >
        {label}
      </button>
    {/each}
  </div>

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
          <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            {#if donante.tipo === 'persona'}
              <User class="h-4 w-4 text-muted-foreground" />
            {:else}
              <Building2 class="h-4 w-4 text-muted-foreground" />
            {/if}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{donante.nombre}</p>
            <p class="text-xs text-muted-foreground mt-0.5">
              {donante.identificacion} · {donante.telefono}
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground font-medium">
            {donante.donaciones} donación(es)
          </span>
        </li>
      {/each}
    </ul>
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

          <!-- Selector tipo -->
          <div class="mb-4 grid grid-cols-2 gap-2">
            <button
              onclick={() => (form.tipo = 'persona')}
              class="flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors
                {form.tipo === 'persona'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'}"
            >
              <User class="h-4 w-4 shrink-0" />
              Persona
            </button>
            <button
              onclick={() => (form.tipo = 'institucion')}
              class="flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors
                {form.tipo === 'institucion'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'}"
            >
              <Building2 class="h-4 w-4 shrink-0" />
              Institución
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
                placeholder={form.tipo === 'persona' ? 'Nombre completo' : 'Nombre de la institución'}
                class="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-1">
              <label for="identificacion" class="text-xs font-medium text-foreground">
                {form.tipo === 'persona' ? 'Cédula' : 'RIF'} <span class="text-destructive">*</span>
              </label>
              <input
                id="identificacion"
                type="text"
                bind:value={form.identificacion}
                placeholder={form.tipo === 'persona' ? 'V-12345678' : 'J-12345678-0'}
                class="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-1">
              <label for="telefono" class="text-xs font-medium text-foreground">
                Teléfono <span class="text-destructive">*</span>
              </label>
              <input
                id="telefono"
                type="tel"
                bind:value={form.telefono}
                placeholder="0414-1234567"
                class="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-1">
              <label for="correo" class="text-xs font-medium text-foreground">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                bind:value={form.correo}
                placeholder="correo@ejemplo.com"
                class="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-1">
              <label for="direccion" class="text-xs font-medium text-foreground">Dirección</label>
              <input
                id="direccion"
                type="text"
                bind:value={form.direccion}
                placeholder="Dirección completa"
                class="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
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
              disabled={!form.nombre || !form.identificacion}
              class="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Registrar
            </button>
          </div>

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
