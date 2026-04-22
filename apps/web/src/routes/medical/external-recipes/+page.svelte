<script lang="ts">
  import { DateTime } from 'luxon';
  import { Plus, Search, ChevronRight, FileText, X } from 'lucide-svelte';

  const RECIPES = [
    { id: 'r1', paciente: 'Ana Sofía Ramírez', cedula: 'V-12.345.678', medico: 'Dr. Fuentes', fecha: '2025-05-10', medicamentos: ['Enalapril 10mg x 30', 'Metformina 850mg x 60'], dispensado: true },
    { id: 'r2', paciente: 'Carlos Medina', cedula: 'V-9.876.543', medico: 'Dra. Soto', fecha: '2025-04-28', medicamentos: ['Amoxicilina 500mg x 21'], dispensado: false },
    { id: 'r3', paciente: 'José Luis Hernández', cedula: 'V-8.001.234', medico: 'Dr. Blanco', fecha: '2025-05-15', medicamentos: ['Loratadina 10mg x 10', 'Ibuprofeno 400mg x 20'], dispensado: true },
    { id: 'r4', paciente: 'María González', cedula: 'V-15.432.100', medico: 'Dra. Morales', fecha: '2025-06-01', medicamentos: ['Enalapril 10mg x 30'], dispensado: false },
  ];

  function formatFecha(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("dd 'de' LLLL yyyy");
  }

  let search = $state('');
  let filtro = $state<'all' | 'pendiente' | 'dispensado'>('all');

  const filtered = $derived(
    RECIPES
      .filter(r => {
        if (filtro === 'dispensado') return r.dispensado === true;
        if (filtro === 'pendiente') return r.dispensado === false;
        return true;
      })
      .filter(r => {
        const q = search.toLowerCase();
        return !q || r.paciente.toLowerCase().includes(q) || r.cedula.toLowerCase().includes(q) || r.medico.toLowerCase().includes(q);
      })
  );

  type Chip = { label: string; value: 'all' | 'pendiente' | 'dispensado' };
  const chips: Chip[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Dispensado', value: 'dispensado' },
  ];
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
    <h1 class="text-lg font-bold text-gray-900">Récipes externos</h1>
    <a
      href="/medical/external-recipes/new"
      class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white"
      style="background-color: #2D6A4F;"
    >
      <Plus size={16} />
      Registrar
    </a>
  </div>

  <div class="flex-1 px-4 pt-4 pb-8 space-y-3 max-w-2xl mx-auto w-full">
    <!-- Search bar -->
    <div class="relative">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar por paciente, cédula o médico..."
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

    <!-- Filter chips + count -->
    <div class="flex items-center gap-2 flex-wrap">
      {#each chips as chip (chip.value)}
        <button
          onclick={() => (filtro = chip.value)}
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          class:text-white={filtro === chip.value}
          class:border-transparent={filtro === chip.value}
          class:text-gray-500={filtro !== chip.value}
          style={filtro === chip.value ? 'background-color: #2D6A4F; border-color: #2D6A4F;' : ''}
        >
          {chip.label}
        </button>
      {/each}
      <span class="ml-auto text-xs text-gray-500">{filtered.length} récipe(s)</span>
    </div>

    <!-- Card list -->
    {#if filtered.length > 0}
      <ul class="space-y-2">
        {#each filtered as r (r.id)}
          <li>
            <a
              href="/medical/external-recipes/{r.id}"
              class="flex items-center gap-3 rounded-xl bg-white border p-3 hover:shadow-sm transition-shadow"
            >
              <!-- Icon -->
              <div
                class="flex-shrink-0 rounded-lg p-2"
                style="background-color: #2D6A4F1A;"
              >
                <FileText size={20} style="color: #2D6A4F;" />
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0 space-y-0.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-medium text-gray-900 text-sm">{r.paciente}</p>
                  {#if r.dispensado}
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                      Dispensado
                    </span>
                  {:else}
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                      Pendiente
                    </span>
                  {/if}
                </div>
                <p class="text-xs text-gray-500">{r.cedula} · {r.medico}</p>
                <p class="text-xs text-gray-500 truncate">{r.medicamentos.join(', ')}</p>
                <p class="text-xs text-gray-400">{formatFecha(r.fecha)}</p>
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
          <FileText size={28} class="text-gray-400" />
        </div>
        <p class="font-medium text-gray-700">Sin resultados</p>
      </div>
    {/if}
  </div>
</div>
