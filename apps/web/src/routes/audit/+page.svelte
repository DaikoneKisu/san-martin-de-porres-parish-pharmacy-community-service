<script lang="ts">
  import { ShieldCheck, Users, FileHeart, CalendarDays, Package, HeartHandshake, Gift, BookOpen, Receipt, BarChart3, ChevronRight } from 'lucide-svelte';

  const SECCIONES = [
    { href: '/audit/patients',           icon: Users,          label: 'Pacientes',             desc: 'Registros y ediciones de pacientes' },
    { href: '/audit/antecedents',        icon: FileHeart,      label: 'Antecedentes',           desc: 'Cambios en antecedentes médicos' },
    { href: '/audit/appointments',       icon: CalendarDays,   label: 'Citas',                  desc: 'Agendamiento, resultados y cancelaciones' },
    { href: '/audit/supplies',           icon: Package,        label: 'Insumos',                desc: 'Registros, ediciones y dispensaciones' },
    { href: '/audit/donors',             icon: HeartHandshake, label: 'Donantes',               desc: 'Alta y modificaciones de donantes' },
    { href: '/audit/donations',          icon: Gift,           label: 'Donaciones',             desc: 'Registro y edición de donaciones' },
    { href: '/audit/journal-entries',    icon: BookOpen,       label: 'Asientos contables',     desc: 'Asientos registrados en el libro diario' },
    { href: '/audit/external-recipes',   icon: Receipt,        label: 'Récipes externos',       desc: 'Récipes registrados y dispensados' },
    { href: '/audit/accounting-access',  icon: BarChart3,      label: 'Accesos contables',      desc: 'Consultas al libro diario y estado de resultados' },
  ];
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <header class="sticky top-0 z-10 bg-white border-b px-4 py-3">
    <div class="flex items-center gap-2">
      <ShieldCheck class="h-5 w-5 text-[#2D6A4F] shrink-0" />
      <h1 class="text-lg font-semibold text-gray-900">Auditoría</h1>
    </div>
    <p class="text-xs text-gray-500 mt-0.5">Solo visible para administradores</p>
  </header>
  <main class="flex-1 px-4 pt-4 pb-8 max-w-2xl mx-auto w-full flex flex-col gap-2">
    {#each SECCIONES as sec (sec.href)}
      <a href={sec.href} class="rounded-xl border bg-white px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
        <span class="rounded-lg p-2 bg-[#2D6A4F]/10 shrink-0">
          <sec.icon class="h-4 w-4 text-[#2D6A4F]" />
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">{sec.label}</p>
          <p class="text-xs text-gray-500 mt-0.5 leading-tight">{sec.desc}</p>
        </div>
        <ChevronRight class="h-4 w-4 text-gray-400 shrink-0" />
      </a>
    {/each}
  </main>
</div>
