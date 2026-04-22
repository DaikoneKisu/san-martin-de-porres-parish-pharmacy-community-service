<script lang="ts">
  import { page } from '$app/state';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/api';
  import { DateTime } from 'luxon';
  import {
    ArrowLeft, Mail, Phone, CreditCard, Shield, Stethoscope, FlaskConical, ClipboardList,
    Pencil, UserX, UserCheck, AlertTriangle, X, CalendarDays, Loader2,
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';

  type Rol = 'administrador' | 'secretario' | 'doctor' | 'farmaceuta';

  const ROL_META: Record<Rol, { label: string; color: string }> = {
    administrador: { label: 'Administrador', color: 'text-[#2D6A4F] bg-[#2D6A4F]/10' },
    secretario:    { label: 'Secretario',    color: 'text-blue-600 bg-blue-50' },
    doctor:        { label: 'Doctor',        color: 'text-emerald-700 bg-emerald-50' },
    farmaceuta:    { label: 'Farmacéutico',  color: 'text-amber-700 bg-amber-50' },
  };

  const queryClient = useQueryClient();

  const id = $derived(page.params.id ?? '');

  const staffQuery = createQuery({
    get queryKey() { return ['staff-member', id]; },
    queryFn: async ({ queryKey }) => {
      const currentId = queryKey[1] as string;
      const res = await api.api.admin.staff({ id: currentId }).get();
      if (res.error) throw new Error(res.error.value as string ?? 'Error al cargar el personal');
      return res.data;
    },
    get enabled() { return !!id; },
  });

  const persona = $derived($staffQuery.data ?? null);

  // activoOverride: null means "follow persona.activo", true/false means user toggled it
  let activoOverride = $state<boolean | null>(null);
  const activo = $derived(activoOverride !== null ? activoOverride : persona?.activo ?? false);

  let deactivateConfirm = $state(false);
  let deactivateDone = $state(false);
  let editDrawerOpen = $state(false);
  let editSaved = $state(false);
  let editError = $state('');

  let editForm = $state({ nombre: '', telefono: '', rol: 'doctor' as Rol });

  // Display values: after a save they come from editForm, otherwise from persona
  let savedNombre = $state('');
  let savedTelefono = $state('');
  let savedRol = $state<Rol>('doctor');

  const displayNombre = $derived(editSaved ? savedNombre : persona?.nombre ?? '');
  const displayTelefono = $derived(editSaved ? savedTelefono : persona?.telefono ?? '');
  const displayRol = $derived.by<Rol>(() => {
    if (editSaved) return savedRol;
    const firstRole = persona?.roles?.[0]?.nombre as Rol | undefined;
    return firstRole ?? 'doctor';
  });
  const displayRoles = $derived(persona?.roles?.map((r: { id: string; nombre: string }) => r.nombre).join(', ') ?? '');
  const meta = $derived(ROL_META[displayRol] ?? ROL_META['doctor']);

  const updateStaffMutation = createMutation({
    mutationFn: async (body: { nombre?: string; telefono?: string; roles?: string[] }) => {
      const res = await api.api.admin.staff({ id }).patch(body);
      if (res.error) throw new Error(res.error.value as string ?? 'Error al actualizar el personal');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-member', id] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      savedNombre = editForm.nombre;
      savedTelefono = editForm.telefono;
      savedRol = editForm.rol;
      editSaved = true;
      editDrawerOpen = false;
      editError = '';
    },
    onError: (err: Error) => {
      editError = err.message;
    },
  });

  const deactivateMutation = createMutation({
    mutationFn: async () => {
      const res = await api.api.admin.staff({ id }).deactivate.post();
      if (res.error) throw new Error(res.error.value as string ?? 'Error al desactivar el personal');
      return res.data;
    },
    onSuccess: () => {
      activoOverride = false;
      deactivateDone = true;
      deactivateConfirm = false;
      queryClient.invalidateQueries({ queryKey: ['staff-member', id] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const activateMutation = createMutation({
    mutationFn: async () => {
      const res = await api.api.admin.staff({ id }).activate.post();
      if (res.error) throw new Error(res.error.value as string ?? 'Error al activar el personal');
      return res.data;
    },
    onSuccess: () => {
      activoOverride = true;
      deactivateDone = false;
      queryClient.invalidateQueries({ queryKey: ['staff-member', id] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const isMutating = $derived(
    $updateStaffMutation.isPending || $deactivateMutation.isPending || $activateMutation.isPending
  );

  function formatDate(iso: string) {
    return DateTime.fromISO(iso).setLocale('es').toLocaleString(DateTime.DATE_FULL);
  }

  function openEdit() {
    editForm = { nombre: displayNombre, telefono: displayTelefono, rol: displayRol };
    editError = '';
    editDrawerOpen = true;
  }

  function handleEditClose() {
    editDrawerOpen = false;
    editError = '';
  }

  function handleEditSave() {
    $updateStaffMutation.mutate({
      nombre: editForm.nombre,
      telefono: editForm.telefono,
      roles: [editForm.rol],
    });
  }

  function handleDesactivar() {
    $deactivateMutation.mutate();
  }

  function handleActivar() {
    $activateMutation.mutate();
  }
</script>

<div class="flex flex-col min-h-screen bg-gray-50 pb-20">
  <header class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
    <a href="/admin/staff" class="flex items-center justify-center rounded-md p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors -ml-1">
      <ArrowLeft class="h-4 w-4" />
    </a>
    <h1 class="flex-1 text-base font-semibold text-gray-900 truncate">Detalle de personal</h1>
    <button
      type="button"
      onclick={openEdit}
      disabled={$staffQuery.isPending || isMutating}
      class="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Pencil class="h-3.5 w-3.5" />
      Editar
    </button>
  </header>

  <main class="flex flex-col gap-4 px-4 pt-4 pb-8 max-w-2xl mx-auto w-full">
    {#if $staffQuery.isPending}
      <!-- Skeleton loading state -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3 animate-pulse">
        <div class="flex items-start gap-3">
          <div class="h-11 w-11 rounded-xl shrink-0 bg-gray-200"></div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="h-4 w-40 rounded bg-gray-200"></div>
            <div class="h-3 w-24 rounded bg-gray-200"></div>
            <div class="h-5 w-16 rounded-full mt-1 bg-gray-200"></div>
          </div>
        </div>
      </div>
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3 animate-pulse">
        <div class="h-3 w-20 rounded bg-gray-200"></div>
        {#each [1, 2, 3, 4] as _, i (i)}
          <div class="h-10 w-full rounded bg-gray-200"></div>
        {/each}
      </div>
    {:else if $staffQuery.isError}
      <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
        <AlertTriangle class="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p class="text-sm font-medium text-red-800">Error al cargar el personal</p>
          <p class="text-xs text-red-700 mt-0.5">{$staffQuery.error?.message ?? 'Intente de nuevo más tarde.'}</p>
        </div>
      </div>
    {:else if persona}
      <!-- Identity card -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <span class={['rounded-xl p-3 shrink-0', meta.color].join(' ')}>
            {#if displayRol === 'administrador'}
              <Shield class="h-5 w-5" />
            {:else if displayRol === 'secretario'}
              <ClipboardList class="h-5 w-5" />
            {:else if displayRol === 'doctor'}
              <Stethoscope class="h-5 w-5" />
            {:else}
              <FlaskConical class="h-5 w-5" />
            {/if}
          </span>
          <div class="flex-1 min-w-0">
            <h2 class="font-semibold text-gray-900 leading-tight">{displayNombre}</h2>
            <p class="text-sm text-gray-500 mt-0.5">{displayRoles}</p>
            <div class="flex flex-wrap gap-1.5 mt-2">
              {#if activo}
                <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">Activo</span>
              {:else}
                <span class="text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-500 font-medium">Inactivo</span>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Contact info -->
      <div class="rounded-xl border bg-white p-4 flex flex-col gap-3">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Información</p>
        <div class="flex items-center gap-3">
          <CreditCard class="h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p class="text-xs text-gray-500">Cédula</p>
            <p class="text-sm font-medium text-gray-900">{persona.cedula}</p>
          </div>
        </div>
        <hr class="border-gray-100" />
        <div class="flex items-center gap-3">
          <Mail class="h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p class="text-xs text-gray-500">Correo</p>
            <p class="text-sm font-medium text-gray-900">{persona.email}</p>
          </div>
        </div>
        <hr class="border-gray-100" />
        <div class="flex items-center gap-3">
          <Phone class="h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p class="text-xs text-gray-500">Teléfono</p>
            <p class="text-sm font-medium text-gray-900">{displayTelefono}</p>
          </div>
        </div>
        <hr class="border-gray-100" />
        <div class="flex items-center gap-3">
          <CalendarDays class="h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p class="text-xs text-gray-500">Fecha de ingreso</p>
            <p class="text-sm font-medium text-gray-900">{formatDate(persona.createdAt)}</p>
          </div>
        </div>
      </div>

      <!-- Deactivation warning -->
      {#if deactivateDone}
        <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
          <AlertTriangle class="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p class="text-sm text-amber-800">El personal ha sido desactivado. Ya no podrá iniciar sesión.</p>
        </div>
      {/if}

      <!-- Deactivation confirm -->
      {#if deactivateConfirm}
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex flex-col gap-3">
          <div class="flex items-start gap-2">
            <AlertTriangle class="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p class="text-sm font-medium text-red-800">¿Confirmar desactivación?</p>
              <p class="text-xs text-red-700 mt-0.5">{displayNombre} no podrá iniciar sesión hasta que sea reactivado.</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              onclick={() => { deactivateConfirm = false; }}
              disabled={$deactivateMutation.isPending}
              class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onclick={handleDesactivar}
              disabled={$deactivateMutation.isPending}
              class="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if $deactivateMutation.isPending}
                <Loader2 class="h-3.5 w-3.5 animate-spin" />
              {/if}
              Desactivar
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </main>
</div>

<!-- Fixed bottom CTA -->
<div class="fixed bottom-0 left-0 right-0 md:left-64 border-t bg-white px-4 py-3">
  {#if $staffQuery.isPending}
    <div class="h-10 w-full rounded-lg bg-gray-200 animate-pulse"></div>
  {:else if activo}
    <button
      type="button"
      onclick={() => { deactivateConfirm = true; }}
      disabled={isMutating}
      class="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <UserX class="h-4 w-4" />
      Desactivar personal
    </button>
  {:else}
    <button
      type="button"
      onclick={handleActivar}
      disabled={isMutating}
      class="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if $activateMutation.isPending}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <UserCheck class="h-4 w-4" />
      {/if}
      Activar personal
    </button>
  {/if}
</div>

<!-- Edit Drawer -->
<Drawer.Root bind:open={editDrawerOpen} onClose={handleEditClose}>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white max-h-[85svh] outline-none">
      <div class="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-gray-300"></div>
      <div class="overflow-y-auto flex-1 px-4 pb-8 pt-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <Drawer.Title class="text-base font-semibold text-gray-900">Editar personal</Drawer.Title>
            <p class="text-xs text-gray-500 mt-0.5">La cédula no puede modificarse.</p>
          </div>
          <button type="button" onclick={handleEditClose} class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Cerrar">
            <X class="h-4 w-4" />
          </button>
        </div>

        {#if editError}
          <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
            <AlertTriangle class="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p class="text-sm text-red-700">{editError}</p>
          </div>
        {/if}

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="e-nombre" class="text-xs font-medium text-gray-700">Nombre completo</label>
            <input id="e-nombre" type="text" bind:value={editForm.nombre}
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="e-cedula" class="text-xs font-medium text-gray-700">Cédula</label>
            <input id="e-cedula" type="text" value={persona?.cedula ?? ''} disabled
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="e-tel" class="text-xs font-medium text-gray-700">Teléfono</label>
            <input id="e-tel" type="tel" bind:value={editForm.telefono}
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="e-rol" class="text-xs font-medium text-gray-700">Rol</label>
            <select id="e-rol" bind:value={editForm.rol}
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition">
              <option value="administrador">Administrador</option>
              <option value="secretario">Secretario</option>
              <option value="doctor">Doctor</option>
              <option value="farmaceuta">Farmacéutico</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 mt-6">
          <button
            type="button"
            onclick={handleEditClose}
            disabled={$updateStaffMutation.isPending}
            class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onclick={handleEditSave}
            disabled={$updateStaffMutation.isPending}
            class="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if $updateStaffMutation.isPending}
              <Loader2 class="h-3.5 w-3.5 animate-spin" />
            {/if}
            Guardar cambios
          </button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
