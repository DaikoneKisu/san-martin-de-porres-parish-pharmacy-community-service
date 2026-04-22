<script lang="ts">
  import { page } from '$app/state';
  import {
    ArrowLeft, Mail, Phone, CreditCard, Shield, Stethoscope, FlaskConical, ClipboardList,
    Pencil, UserX, UserCheck, AlertTriangle, X, CalendarDays,
  } from 'lucide-svelte';
  import { Drawer } from 'vaul-svelte';

  type Rol = 'administrador' | 'secretario' | 'doctor' | 'farmaceutico';

  interface PersonalEntry {
    id: string;
    nombre: string;
    cedula: string;
    email: string;
    telefono: string;
    rol: Rol;
    activo: boolean;
    sesionActiva: boolean;
    fechaIngreso: string;
  }

  const ROL_META: Record<Rol, { label: string; color: string }> = {
    administrador: { label: 'Administrador', color: 'text-[#2D6A4F] bg-[#2D6A4F]/10' },
    secretario:    { label: 'Secretario',    color: 'text-blue-600 bg-blue-50' },
    doctor:        { label: 'Doctor',        color: 'text-emerald-700 bg-emerald-50' },
    farmaceutico:  { label: 'Farmacéutico',  color: 'text-amber-700 bg-amber-50' },
  };

  const PERSONAL_MAP: Record<string, PersonalEntry> = {
    'p1': { id: 'p1', nombre: 'Ana González',    cedula: 'V-12345678', email: 'ana@sanmart.org',    telefono: '0414-1234567', rol: 'administrador', activo: true,  sesionActiva: false, fechaIngreso: '2022-03-10' },
    'p2': { id: 'p2', nombre: 'Carlos Pérez',    cedula: 'V-23456789', email: 'carlos@sanmart.org', telefono: '0424-2345678', rol: 'doctor',        activo: true,  sesionActiva: true,  fechaIngreso: '2023-08-15' },
    'p3': { id: 'p3', nombre: 'María Rodríguez', cedula: 'V-34567890', email: 'maria@sanmart.org',  telefono: '0416-3456789', rol: 'farmaceutico',  activo: true,  sesionActiva: false, fechaIngreso: '2023-11-20' },
    'p4': { id: 'p4', nombre: 'Luis Martínez',   cedula: 'V-45678901', email: 'luis@sanmart.org',   telefono: '0426-4567890', rol: 'secretario',    activo: false, sesionActiva: false, fechaIngreso: '2024-01-05' },
  };

  const persona = $derived(PERSONAL_MAP[page.params.id ?? ''] ?? PERSONAL_MAP['p2']);

  // activoOverride: null means "follow persona.activo", true/false means user toggled it
  let activoOverride = $state<boolean | null>(null);
  const activo = $derived(activoOverride !== null ? activoOverride : persona.activo);

  let deactivateConfirm = $state(false);
  let deactivateDone = $state(false);
  let editDrawerOpen = $state(false);
  let editSaved = $state(false);
  // editForm is only used inside the drawer; populated via openEdit()
  let editForm = $state({ nombre: '', email: '', telefono: '', rol: 'doctor' as Rol });

  // Display values: after a save they come from editForm, otherwise from persona
  let savedNombre = $state('');
  let savedEmail = $state('');
  let savedTelefono = $state('');
  let savedRol = $state<Rol>('doctor');
  const displayNombre = $derived(editSaved ? savedNombre : persona.nombre);
  const displayEmail = $derived(editSaved ? savedEmail : persona.email);
  const displayTelefono = $derived(editSaved ? savedTelefono : persona.telefono);
  const displayRol = $derived(editSaved ? savedRol : persona.rol);
  const meta = $derived(ROL_META[displayRol] ?? ROL_META['doctor']);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function openEdit() {
    editForm = { nombre: displayNombre, email: displayEmail, telefono: displayTelefono, rol: displayRol };
    editDrawerOpen = true;
  }

  function handleDesactivar() {
    activoOverride = false;
    deactivateConfirm = false;
    deactivateDone = true;
  }

  function handleActivar() {
    activoOverride = true;
    deactivateDone = false;
  }

  function handleEditSave() {
    savedNombre = editForm.nombre;
    savedEmail = editForm.email;
    savedTelefono = editForm.telefono;
    savedRol = editForm.rol;
    editSaved = true;
    editDrawerOpen = false;
  }

  function handleEditClose() {
    editDrawerOpen = false;
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
      class="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <Pencil class="h-3.5 w-3.5" />
      Editar
    </button>
  </header>

  <main class="flex flex-col gap-4 px-4 pt-4 pb-8 max-w-2xl mx-auto w-full">
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
          <p class="text-sm text-gray-500 mt-0.5">{meta.label}</p>
          <div class="flex flex-wrap gap-1.5 mt-2">
            {#if activo}
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">Activo</span>
              {#if persona.sesionActiva}
                <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">Sesión activa</span>
              {/if}
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
          <p class="text-sm font-medium text-gray-900">{displayEmail}</p>
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
          <p class="text-sm font-medium text-gray-900">{formatDate(persona.fechaIngreso)}</p>
        </div>
      </div>
    </div>

    <!-- Deactivation warning -->
    {#if deactivateDone}
      <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
        <AlertTriangle class="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p class="text-sm text-amber-800">El personal ha sido desactivado y su sesión ha sido revocada. Ya no podrá iniciar sesión.</p>
      </div>
    {/if}

    <!-- Deactivation confirm -->
    {#if deactivateConfirm}
      <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex flex-col gap-3">
        <div class="flex items-start gap-2">
          <AlertTriangle class="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-red-800">¿Confirmar desactivación?</p>
            <p class="text-xs text-red-700 mt-0.5">
              {persona.sesionActiva
                ? `${displayNombre} tiene una sesión activa. Su sesión será revocada al confirmar.`
                : `${displayNombre} no podrá iniciar sesión hasta que sea reactivado.`}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button type="button" onclick={() => { deactivateConfirm = false; }} class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button type="button" onclick={handleDesactivar} class="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">Desactivar</button>
        </div>
      </div>
    {/if}
  </main>
</div>

<!-- Fixed bottom CTA -->
<div class="fixed bottom-0 left-0 right-0 md:left-64 border-t bg-white px-4 py-3">
  {#if activo}
    <button
      type="button"
      onclick={() => { deactivateConfirm = true; }}
      class="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
    >
      <UserX class="h-4 w-4" />
      Desactivar personal
    </button>
  {:else}
    <button
      type="button"
      onclick={handleActivar}
      class="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors"
    >
      <UserCheck class="h-4 w-4" />
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
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="e-nombre" class="text-xs font-medium text-gray-700">Nombre completo</label>
            <input id="e-nombre" type="text" bind:value={editForm.nombre}
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="e-cedula" class="text-xs font-medium text-gray-700">Cédula</label>
            <input id="e-cedula" type="text" value={persona.cedula} disabled
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="e-email" class="text-xs font-medium text-gray-700">Correo electrónico</label>
            <input id="e-email" type="email" bind:value={editForm.email}
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition" />
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
              <option value="farmaceutico">Farmacéutico</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 mt-6">
          <button type="button" onclick={handleEditClose} class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
          <button type="button" onclick={handleEditSave} class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]/90 transition-colors">Guardar cambios</button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
