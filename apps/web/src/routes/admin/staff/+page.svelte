<script lang="ts">
  import {
    ArrowLeft, Search, Plus, UserCheck, UserX, ChevronRight,
    Shield, Stethoscope, FlaskConical, ClipboardList, CheckCircle2, X,
    AlertCircle,
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/api';

  type Rol = 'administrador' | 'secretario' | 'doctor' | 'farmaceuta';

  interface StaffMember {
    id: string;
    nombre: string;
    cedula: string;
    email: string;
    telefono: string;
    activo: boolean;
    roles: { id: string; nombre: string }[];
    createdAt: string;
  }

  const ROL_META: Record<Rol, { label: string; color: string }> = {
    administrador: { label: 'Administrador', color: 'text-[#2D6A4F] bg-[#2D6A4F]/10' },
    secretario:    { label: 'Secretario',    color: 'text-blue-600 bg-blue-50' },
    doctor:        { label: 'Doctor',        color: 'text-emerald-700 bg-emerald-50' },
    farmaceuta:    { label: 'Farmacéutico',  color: 'text-amber-700 bg-amber-50' },
  };

  const ROLES_DISPONIBLES: Rol[] = ['administrador', 'secretario', 'doctor', 'farmaceuta'];

  const queryClient = useQueryClient();

  const staffQuery = createQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await api.api.admin.staff.get();
      if (res.error) throw new Error(String((res.error as any)?.value ?? 'Error al cargar el personal'));
      return res.data as StaffMember[];
    },
  });

  let busqueda = $state('');
  let filtroRol = $state<Rol | 'todos'>('todos');
  let drawerOpen = $state(false);
  let paso = $state<'form' | 'exito'>('form');
  let exitoEmail = $state('');
  let submitError = $state<string | null>(null);
  let form = $state({ nombre: '', cedula: '', email: '', telefono: '', rol: '' as Rol | '' });
  let errors = $state<Partial<{ nombre: string; cedula: string; email: string; rol: string }>>({});

  const personal = $derived(
    ($staffQuery.data ?? []).filter((p: StaffMember) => {
      const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.cedula.includes(busqueda);
      const matchRol = filtroRol === 'todos' || p.roles.some(r => r.nombre === filtroRol);
      return matchBusqueda && matchRol;
    })
  );

  const activos = $derived(personal.filter((p: StaffMember) => p.activo).length);
  const inactivos = $derived(personal.filter((p: StaffMember) => !p.activo).length);

  const mutation = createMutation({
    mutationFn: async (body: { nombre: string; cedula: string; telefono: string; email: string; roles: string[] }) => {
      const res = await api.api.admin.staff.post(body);
      if (res.error) throw new Error(String((res.error as any)?.value ?? 'Error al registrar el personal'));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  function getPrimaryRol(p: StaffMember): Rol | null {
    for (const r of ROLES_DISPONIBLES) {
      if (p.roles.some(pr => pr.nombre === r)) return r;
    }
    return null;
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!form.cedula.trim()) e.cedula = 'Requerido';
    if (!form.email.trim()) e.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.rol) e.rol = 'Selecciona un rol';
    return e;
  }

  async function handleGuardar() {
    const e = validate();
    errors = e;
    submitError = null;
    if (Object.keys(e).length) return;

    try {
      await $mutation.mutateAsync({
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        roles: [form.rol as string],
      });
      exitoEmail = form.email.trim();
      paso = 'exito';
    } catch (err) {
      submitError = err instanceof Error ? err.message : 'Error al registrar el personal';
    }
  }

  function handleCerrar() {
    drawerOpen = false;
    setTimeout(() => {
      form = { nombre: '', cedula: '', email: '', telefono: '', rol: '' };
      errors = {};
      paso = 'form';
      submitError = null;
      exitoEmail = '';
    }, 300);
  }
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <header class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
    <a href="/admin" class="flex items-center justify-center rounded-md p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors -ml-1">
      <ArrowLeft class="h-4 w-4" />
    </a>
    <h1 class="flex-1 text-base font-semibold text-gray-900">Personal</h1>
    <button
      type="button"
      onclick={() => { paso = 'form'; drawerOpen = true; }}
      class="flex items-center gap-1.5 rounded-lg bg-[#2D6A4F] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2D6A4F]/90 transition-colors"
    >
      <Plus class="h-3.5 w-3.5" />
      Registrar
    </button>
  </header>

  <main class="flex flex-col gap-4 px-4 pt-4 pb-8 max-w-2xl mx-auto w-full">
    <!-- KPI cards -->
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-xl border bg-white p-3 flex items-center gap-3">
        <span class="rounded-lg p-2 bg-emerald-50"><UserCheck class="h-4 w-4 text-emerald-600" /></span>
        <div>
          {#if $staffQuery.isPending}
            <div class="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
          {:else}
            <p class="text-xl font-bold text-gray-900">{activos}</p>
          {/if}
          <p class="text-xs text-gray-500">Activos</p>
        </div>
      </div>
      <div class="rounded-xl border bg-white p-3 flex items-center gap-3">
        <span class="rounded-lg p-2 bg-gray-100"><UserX class="h-4 w-4 text-gray-500" /></span>
        <div>
          {#if $staffQuery.isPending}
            <div class="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
          {:else}
            <p class="text-xl font-bold text-gray-900">{inactivos}</p>
          {/if}
          <p class="text-xs text-gray-500">Inactivos</p>
        </div>
      </div>
    </div>

    <!-- Search + filter chips -->
    <div class="flex flex-col gap-2">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por nombre o cédula..."
          bind:value={busqueda}
          class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition"
        />
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1">
        {#each (['todos', ...ROLES_DISPONIBLES] as const) as r (r)}
          <button
            type="button"
            onclick={() => { filtroRol = r; }}
            class={[
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              filtroRol === r ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
            ].join(' ')}
          >
            {r === 'todos' ? 'Todos' : ROL_META[r as Rol].label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Error state -->
    {#if $staffQuery.isError}
      <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
        <AlertCircle class="h-4 w-4 text-red-500 shrink-0" />
        <p class="text-sm text-red-700">No se pudo cargar el personal. Intenta recargar la página.</p>
      </div>
    {/if}

    <!-- List -->
    <div class="rounded-xl border bg-white divide-y overflow-hidden">
      {#if $staffQuery.isPending}
        {#each [1, 2, 3] as n (n)}
          <div class="flex items-center gap-3 px-4 py-3.5">
            <div class="rounded-full p-2 bg-gray-200 animate-pulse h-8 w-8 shrink-0"></div>
            <div class="flex-1 flex flex-col gap-1.5">
              <div class="h-3.5 w-36 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        {/each}
      {:else if !$staffQuery.isError && personal.length === 0}
        <p class="px-4 py-8 text-sm text-gray-500 text-center">Sin resultados.</p>
      {:else if !$staffQuery.isError}
        {#each personal as p (p.id)}
          {@const primaryRol = getPrimaryRol(p)}
          <a href={`/admin/staff/${p.id}`} class="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <span class={['rounded-full p-2 shrink-0', primaryRol ? ROL_META[primaryRol].color : 'bg-gray-100 text-gray-500'].join(' ')}>
              {#if primaryRol === 'administrador'}
                <Shield class="h-4 w-4" />
              {:else if primaryRol === 'secretario'}
                <ClipboardList class="h-4 w-4" />
              {:else if primaryRol === 'doctor'}
                <Stethoscope class="h-4 w-4" />
              {:else}
                <FlaskConical class="h-4 w-4" />
              {/if}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                {#if !p.activo}
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full border border-gray-300 text-gray-500 font-medium shrink-0">Inactivo</span>
                {/if}
              </div>
              <p class="text-xs text-gray-500 mt-0.5">{p.roles.map(r => ROL_META[r.nombre as Rol]?.label ?? r.nombre).join(', ')} · {p.cedula}</p>
            </div>
            <ChevronRight class="h-4 w-4 text-gray-400 shrink-0" />
          </a>
        {/each}
      {/if}
    </div>
  </main>
</div>

<!-- Drawer: Registrar personal -->
<Drawer.Root bind:open={drawerOpen} onClose={handleCerrar}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[92svh] outline-none">
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-gray-300"></div>

      {#if paso === 'exito'}
        <div class="flex flex-col items-center justify-center flex-1 gap-4 px-4 py-12 text-center">
          <span class="rounded-full bg-[#2D6A4F]/10 p-4">
            <CheckCircle2 class="h-8 w-8 text-[#2D6A4F]" />
          </span>
          <div>
            <p class="font-semibold text-gray-900 text-lg">Personal registrado</p>
            <p class="text-sm text-gray-500 mt-1">
              Las credenciales iniciales han sido enviadas a <strong>{exitoEmail}</strong>.
            </p>
          </div>
          <button type="button" onclick={handleCerrar} class="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors mt-2">Cerrar</button>
        </div>
      {:else}
        <div class="overflow-y-auto flex-1 px-4 pb-8 pt-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <Drawer.Title class="text-base font-semibold text-gray-900">Registrar personal</Drawer.Title>
              <p class="text-xs text-gray-500 mt-0.5">Se notificará al nuevo miembro por correo.</p>
            </div>
            <button type="button" onclick={handleCerrar} class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Cerrar">
              <X class="h-4 w-4" />
            </button>
          </div>

          {#if submitError}
            <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-center gap-2">
              <AlertCircle class="h-4 w-4 text-red-500 shrink-0" />
              <p class="text-xs text-red-700">{submitError}</p>
            </div>
          {/if}

          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label for="r-nombre" class="text-xs font-medium text-gray-700">Nombre completo <span class="text-red-500">*</span></label>
              <input id="r-nombre" type="text" bind:value={form.nombre} placeholder="Ej: María Rodríguez"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition" />
              {#if errors.nombre}<p class="text-xs text-red-600">{errors.nombre}</p>{/if}
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="r-cedula" class="text-xs font-medium text-gray-700">Cédula de identidad <span class="text-red-500">*</span></label>
              <input id="r-cedula" type="text" bind:value={form.cedula} placeholder="V-12345678"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition" />
              {#if errors.cedula}<p class="text-xs text-red-600">{errors.cedula}</p>{/if}
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="r-email" class="text-xs font-medium text-gray-700">Correo electrónico <span class="text-red-500">*</span></label>
              <input id="r-email" type="email" bind:value={form.email} placeholder="correo@sanmart.org"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition" />
              {#if errors.email}<p class="text-xs text-red-600">{errors.email}</p>{/if}
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="r-tel" class="text-xs font-medium text-gray-700">Teléfono</label>
              <input id="r-tel" type="tel" bind:value={form.telefono} placeholder="0414-1234567"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="r-rol" class="text-xs font-medium text-gray-700">Rol <span class="text-red-500">*</span></label>
              <select id="r-rol" bind:value={form.rol}
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition">
                <option value="" disabled>Seleccionar rol</option>
                <option value="administrador">Administrador</option>
                <option value="secretario">Secretario</option>
                <option value="doctor">Doctor</option>
                <option value="farmaceuta">Farmacéutico</option>
              </select>
              {#if errors.rol}<p class="text-xs text-red-600">{errors.rol}</p>{/if}
            </div>
          </div>

          <div class="flex gap-2 mt-6">
            <button type="button" onclick={handleCerrar} class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
            <button
              type="button"
              onclick={handleGuardar}
              disabled={$mutation.isPending}
              class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {$mutation.isPending ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </div>
      {/if}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
