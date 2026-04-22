<script lang="ts">
  import { Users, Settings, ChevronRight } from 'lucide-svelte';

  const SECCIONES = [
    {
      href: '/admin/staff',
      icon: Users,
      titulo: 'Personal',
      descripcion: 'Registrar, editar, activar y desactivar miembros del equipo.',
      color: 'text-[#2D6A4F] bg-[#2D6A4F]/10',
    },
    {
      href: '/admin/settings',
      icon: Settings,
      titulo: 'Configuración del sistema',
      descripcion: 'Parámetros de agenda médica y de contabilidad.',
      color: 'text-slate-700 bg-slate-100',
    },
  ];
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <header class="border-b bg-white px-4 py-3">
    <h1 class="text-base font-semibold text-gray-900">Administración</h1>
    <p class="text-xs text-gray-500 mt-0.5">Solo accesible para administradores.</p>
  </header>
  <main class="flex flex-col gap-3 px-4 pt-4 pb-8 max-w-2xl mx-auto w-full">
    {#each SECCIONES as s (s.href)}
      <a href={s.href} class="rounded-xl border bg-white p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
        <span class={['rounded-xl p-3 shrink-0', s.color].join(' ')}>
          <s.icon class="h-5 w-5" />
        </span>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900">{s.titulo}</p>
          <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.descripcion}</p>
        </div>
        <ChevronRight class="h-4 w-4 text-gray-400 shrink-0" />
      </a>
    {/each}
  </main>
</div>
