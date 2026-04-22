<script lang="ts">
  import { DateTime } from 'luxon';
  import {
    CalendarClock,
    Users,
    AlertTriangle,
    TrendingUp,
    Stethoscope,
    Package,
    Gift,
    BookOpen,
    ShieldCheck,
    Settings,
    ChevronRight,
    Pill
  } from 'lucide-svelte';

  const today = $derived(
    DateTime.now().setLocale('es').toFormat("cccc, d 'de' LLLL 'de' yyyy")
  );

  const kpis = [
    {
      label: 'Citas hoy',
      value: '24',
      trend: '+3',
      icon: CalendarClock,
      alert: false
    },
    {
      label: 'Pacientes activos',
      value: '1,284',
      trend: '+12',
      icon: Users,
      alert: false
    },
    {
      label: 'Insumos por vencer',
      value: '7',
      trend: null,
      icon: AlertTriangle,
      alert: true
    },
    {
      label: 'Ingresos del mes',
      value: 'Bs 4,200',
      trend: '+8%',
      icon: TrendingUp,
      alert: false
    }
  ] as const;

  const modules = [
    {
      name: 'Módulo Médico',
      description: 'Pacientes, citas y récipes',
      href: '/medical',
      icon: Stethoscope,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      stat: '24 citas hoy',
      restricted: false
    },
    {
      name: 'Inventario',
      description: 'Insumos y dispensación',
      href: '/inventory',
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      stat: '312 insumos',
      restricted: false
    },
    {
      name: 'Donaciones',
      description: 'Donantes y donaciones',
      href: '/donations',
      icon: Gift,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      stat: '8 este mes',
      restricted: false
    },
    {
      name: 'Contabilidad',
      description: 'Libro diario y egresos',
      href: '/accounting/journal',
      icon: BookOpen,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      stat: '15 asientos',
      restricted: false
    },
    {
      name: 'Auditoría',
      description: 'Registro de acciones',
      href: '/audit',
      icon: ShieldCheck,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      stat: 'Solo admin',
      restricted: true
    },
    {
      name: 'Administración',
      description: 'Personal y configuración',
      href: '/admin',
      icon: Settings,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      stat: '6 usuarios',
      restricted: true
    }
  ] as const;

  const activities = [
    {
      label: 'Cita registrada',
      sub: 'Pedro Ramírez — Consulta general',
      time: 'Hace 5 min',
      icon: CalendarClock
    },
    {
      label: 'Dispensación registrada',
      sub: 'Ibuprofeno 400mg × 20',
      time: 'Hace 18 min',
      icon: Pill
    },
    {
      label: 'Donación recibida',
      sub: 'Fundación Esperanza — 40 insumos',
      time: 'Hace 1 h',
      icon: Gift
    },
    {
      label: 'Paciente registrado',
      sub: 'Ana Luisa Pérez',
      time: 'Hace 2 h',
      icon: Users
    }
  ] as const;
</script>

<div class="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-6">
  <!-- Page header -->
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
      <span class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Secretaria
      </span>
    </div>
    <p class="text-sm capitalize text-muted-foreground">{today}</p>
  </div>

  <!-- KPI grid -->
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {#each kpis as kpi (kpi.label)}
      {@const KpiIcon = kpi.icon}
      <div
        class="rounded-xl border p-4 shadow-sm {kpi.alert
          ? 'border-destructive bg-destructive/5'
          : 'bg-white'}"
      >
        <div class="flex items-start justify-between">
          <p class="text-sm font-medium text-muted-foreground">{kpi.label}</p>
          <KpiIcon
            class="size-4 shrink-0 {kpi.alert ? 'text-destructive' : 'text-muted-foreground'}"
          />
        </div>
        <p class="mt-2 text-2xl font-bold {kpi.alert ? 'text-destructive' : ''}">
          {kpi.value}
        </p>
        {#if kpi.trend}
          <p class="mt-1 text-xs text-emerald-600">{kpi.trend} desde ayer</p>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Modules section -->
  <div class="space-y-3">
    <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Módulos</p>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each modules as mod (mod.href)}
        {@const ModIcon = mod.icon}
        <a
          href={mod.href}
          class="rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="rounded-lg p-2 {mod.iconBg}">
                <ModIcon class="size-5 {mod.iconColor}" />
              </div>
              <div>
                <p class="text-sm font-semibold">{mod.name}</p>
                <p class="text-xs text-muted-foreground">{mod.description}</p>
              </div>
            </div>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
          </div>
          <hr class="my-3" />
          <div class="flex items-center justify-between">
            <p class="text-xs text-muted-foreground">{mod.stat}</p>
            {#if mod.restricted}
              <span
                class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
              >
                Admin
              </span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  </div>

  <!-- Recent activity -->
  <div class="space-y-3">
    <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      Actividad reciente
    </p>
    <div class="rounded-xl border bg-white shadow-sm">
      <div class="divide-y">
        {#each activities as activity (activity.label)}
          {@const ActivityIcon = activity.icon}
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <ActivityIcon class="size-4 text-gray-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">{activity.label}</p>
              <p class="truncate text-xs text-muted-foreground">{activity.sub}</p>
            </div>
            <p class="shrink-0 text-xs text-muted-foreground">{activity.time}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
