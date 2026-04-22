<script lang="ts">
  import { BookOpen, BarChart2, TrendingDown, ChevronRight } from 'lucide-svelte';
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 h-14 flex items-center">
    <h1 class="text-lg font-semibold">Contabilidad</h1>
  </header>

  <!-- Main content -->
  <main class="px-4 pt-4 pb-24 flex flex-col gap-2">
    <!-- Libro diario -->
    <a
      href="/accounting/journal"
      class="rounded-xl border bg-white p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
    >
      <div class="text-[#2D6A4F] bg-[#2D6A4F]/10 rounded-lg p-2.5 shrink-0">
        <BookOpen class="size-5" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm">Libro diario</p>
        <p class="text-xs text-gray-500 line-clamp-1">Consulta y registra todos los asientos contables</p>
      </div>
      <ChevronRight class="size-4 text-gray-400 shrink-0" />
    </a>

    <!-- Estado de resultados -->
    <a
      href="/accounting/results"
      class="rounded-xl border bg-white p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
    >
      <div class="text-blue-600 bg-blue-100 rounded-lg p-2.5 shrink-0">
        <BarChart2 class="size-5" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm">Estado de resultados</p>
        <p class="text-xs text-gray-500 line-clamp-1">Resumen de ingresos y egresos por período</p>
      </div>
      <ChevronRight class="size-4 text-gray-400 shrink-0" />
    </a>

    <!-- Registrar egreso -->
    <a
      href="/accounting/expenses/new"
      class="rounded-xl border bg-white p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
    >
      <div class="text-red-600 bg-red-100 rounded-lg p-2.5 shrink-0">
        <TrendingDown class="size-5" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm">Registrar egreso</p>
        <p class="text-xs text-gray-500 line-clamp-1">Registra un gasto puntual en VES o USD</p>
      </div>
      <ChevronRight class="size-4 text-gray-400 shrink-0" />
    </a>
  </main>
</div>
