<script>
  import { CalendarDays, Users, FileText, ChevronRight } from 'lucide-svelte';
</script>

<div class="flex min-h-screen flex-col bg-gray-50">
  <header class="sticky top-0 z-10 border-b bg-white px-4 py-3">
    <h1 class="text-lg font-semibold text-gray-900">Módulo Médico</h1>
  </header>

  <main class="mx-auto w-full max-w-2xl px-4 py-6">
    <p class="mb-6 text-sm text-gray-500">
      Gestiona citas, pacientes y récipes de la farmacia.
    </p>

    <div class="flex flex-col gap-4">
      <a
        href="/medical/appointments"
        class="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <span class="flex items-center justify-center rounded-lg bg-[#2D6A4F]/10 p-3">
          <CalendarDays class="h-7 w-7 text-[#2D6A4F]" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-medium text-gray-900">Citas médicas</p>
          <p class="text-sm text-gray-500">Agenda y consulta el historial de citas.</p>
        </div>
        <ChevronRight class="h-5 w-5 shrink-0 text-gray-400" />
      </a>

      <a
        href="/medical/patients"
        class="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <span class="flex items-center justify-center rounded-lg bg-blue-100 p-3">
          <Users class="h-7 w-7 text-blue-600" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-medium text-gray-900">Pacientes</p>
          <p class="text-sm text-gray-500">Registro y expediente de cada paciente.</p>
        </div>
        <ChevronRight class="h-5 w-5 shrink-0 text-gray-400" />
      </a>

      <a
        href="/medical/external-recipes"
        class="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <span class="flex items-center justify-center rounded-lg bg-amber-100 p-3">
          <FileText class="h-7 w-7 text-amber-600" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-medium text-gray-900">Récipes externos</p>
          <p class="text-sm text-gray-500">
            Gestiona récipes emitidos por médicos externos.
          </p>
        </div>
        <ChevronRight class="h-5 w-5 shrink-0 text-gray-400" />
      </a>
    </div>
  </main>
</div>
