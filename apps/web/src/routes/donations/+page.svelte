<script lang="ts">
  import { DateTime } from 'luxon';
  import { Search, Heart, User, Building2, Package, ChevronRight, Plus, Users } from 'lucide-svelte';

  const DONACIONES = [
    { id: 'd1', fecha: '2025-03-15', donante: { tipo: 'persona', nombre: 'María González' }, items: 5, observaciones: 'Medicamentos en buen estado', contabilizada: true },
    { id: 'd2', fecha: '2025-03-10', donante: { tipo: 'institucion', nombre: 'Fundación Salud Bolívar' }, items: 12, observaciones: '', contabilizada: true },
    { id: 'd3', fecha: '2025-02-28', donante: { tipo: 'persona', nombre: 'Carlos Martínez' }, items: 3, observaciones: '', contabilizada: false },
    { id: 'd4', fecha: '2025-02-14', donante: { tipo: 'institucion', nombre: 'Iglesia San José' }, items: 8, observaciones: 'Incluye materiales quirúrgicos', contabilizada: true },
  ];

  let search = $state('');
  const filtered = $derived(DONACIONES.filter(d =>
    d.donante.nombre.toLowerCase().includes(search.toLowerCase())
  ));

  function formatFecha(iso: string) {
    return DateTime.fromISO(iso).setLocale('es').toFormat("d 'de' LLLL yyyy");
  }
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
    <h1 class="text-xl font-bold text-gray-900 shrink-0">Donaciones</h1>
    <div class="flex items-center gap-2">
      <a
        href="/donations/donors"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Users class="size-4" />
        <span class="hidden sm:inline">Donantes</span>
      </a>
      <a
        href="/donations/new"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
      >
        <Plus class="size-4" />
        <span class="hidden sm:inline">Nueva</span>
      </a>
    </div>
  </header>

  <main class="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
    <!-- Search input -->
    <div class="relative mb-3">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        placeholder="Buscar por donante…"
        bind:value={search}
        class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
    </div>

    <!-- Count -->
    <p class="text-xs text-gray-500 mb-3">{filtered.length} donación(es)</p>

    <!-- List -->
    {#if filtered.length === 0}
      <div class="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
        <Heart class="size-10 stroke-[1.5]" />
        <p class="text-sm">Sin donaciones registradas</p>
      </div>
    {:else}
      <ul class="flex flex-col gap-3">
        {#each filtered as donacion (donacion.id)}
          <li>
            <a
              href="/donations/{donacion.id}"
              class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <!-- Donor type icon -->
              <span class={[
                'shrink-0 rounded-lg p-2',
                donacion.donante.tipo === 'persona'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-blue-100 text-blue-600'
              ].join(' ')}>
                {#if donacion.donante.tipo === 'persona'}
                  <User class="size-5" />
                {:else}
                  <Building2 class="size-5" />
                {/if}
              </span>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{donacion.donante.nombre}</p>
                <p class="text-xs text-gray-500 mt-0.5">{formatFecha(donacion.fecha)}</p>
                <div class="flex items-center gap-1 mt-1">
                  <Package class="size-3 text-gray-400" />
                  <span class="text-xs text-gray-500">{donacion.items} insumos</span>
                  {#if donacion.contabilizada}
                    <span class="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Contabilizada
                    </span>
                  {/if}
                </div>
              </div>

              <!-- Arrow -->
              <ChevronRight class="size-4 text-gray-400 shrink-0" />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </main>
</div>
