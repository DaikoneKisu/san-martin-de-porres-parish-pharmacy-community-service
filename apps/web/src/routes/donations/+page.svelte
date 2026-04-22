<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { DateTime } from 'luxon';
  import { Search, Heart, User, Package, ChevronRight, Plus, Users } from 'lucide-svelte';
  import { api } from '$lib/api';

  const donationsQuery = createQuery({
    queryKey: ['donations'],
    queryFn: async () => {
      const res = await api.api.donations.get();
      if (res.error) throw res.error;
      return res.data;
    },
  });

  let search = $state('');

  const filtered = $derived(
    ($donationsQuery.data ?? []).filter((d: any) =>
      d.donante.nombre.toLowerCase().includes(search.toLowerCase())
    )
  );

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

    {#if $donationsQuery.isPending}
      <!-- Skeleton cards -->
      <p class="text-xs text-gray-500 mb-3">Cargando…</p>
      <ul class="flex flex-col gap-3">
        {#each [1, 2, 3] as i (i)}
          <li class="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3 animate-pulse">
            <span class="shrink-0 rounded-lg p-2 bg-gray-100 size-9"></span>
            <div class="flex-1 min-w-0 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-2/5"></div>
              <div class="h-3 bg-gray-100 rounded w-1/4"></div>
              <div class="h-3 bg-gray-100 rounded w-1/3"></div>
            </div>
          </li>
        {/each}
      </ul>
    {:else if $donationsQuery.isError}
      <!-- Error panel -->
      <div class="flex flex-col items-center justify-center gap-3 py-20 text-red-500">
        <Heart class="size-10 stroke-[1.5]" />
        <p class="text-sm font-medium">Error al cargar las donaciones</p>
        <p class="text-xs text-gray-400">Intenta recargar la página</p>
      </div>
    {:else}
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
                <!-- Donor icon -->
                <span class="shrink-0 rounded-lg p-2 bg-primary/10 text-primary">
                  <User class="size-5" />
                </span>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">{donacion.donante.nombre}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{formatFecha(donacion.fechaRecepcion)}</p>
                  <div class="flex items-center gap-1 mt-1">
                    <Package class="size-3 text-gray-400" />
                    <span class="text-xs text-gray-500">{donacion.items.length} insumos</span>
                    {#if donacion.contabilizable.asientosContables.length > 0}
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
    {/if}
  </main>
</div>
