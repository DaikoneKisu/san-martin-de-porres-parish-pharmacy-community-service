<script lang="ts">
  import { ArrowLeft, CheckCircle2 } from 'lucide-svelte';
  import { page } from '$app/state';
  import { api } from '$lib/api';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';

  const queryClient = useQueryClient();

  const patientQuery = createQuery({
    get queryKey() {
      return ['patient', page.params.id];
    },
    get queryFn() {
      const id: string = page.params.id ?? '';
      return async () => {
        const res = await api.api.medical.patients({ id }).get();
        if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al cargar paciente');
        return res.data!;
      };
    },
    get enabled() {
      return !!page.params.id;
    },
  });

  const patientMutation = createMutation({
    mutationFn: async (body: {
      nombre?: string;
      cedula?: string;
      fechaNac?: string;
      genero?: string;
      telefono?: string;
      lugarNac?: string;
      residencia?: string;
    }) => {
      const id: string = page.params.id ?? '';
      const res = await api.api.medical.patients({ id }).patch(body);
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al guardar');
      return res.data;
    },
    onSuccess: () => {
      saved = true;
      queryClient.invalidateQueries({ queryKey: ['patient', page.params.id] });
    },
  });

  // Derive initial form values from query data; overridable because declared with `let`
  let nombre = $derived($patientQuery.data?.nombre ?? '');
  let cedula = $derived($patientQuery.data?.cedula ?? '');
  let fechaNac = $derived($patientQuery.data?.fechaNac ?? '');
  let genero = $derived($patientQuery.data?.genero ?? '');
  let telefono = $derived($patientQuery.data?.telefono ?? '');
  let lugarNac = $derived($patientQuery.data?.lugarNac ?? '');
  let residencia = $derived($patientQuery.data?.residencia ?? '');

  let errors = $state<Record<string, string>>({});
  let saved = $state(false);

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30';
  const selectClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30';
  const labelClass = 'text-xs font-medium text-gray-700';
  const errorClass = 'text-xs text-red-600 mt-0.5';

  function handleGuardar() {
    errors = {};

    if (!nombre.trim()) errors.nombre = 'El nombre es requerido.';
    if (!cedula.trim()) errors.cedula = 'La cédula es requerida.';
    if (!fechaNac) errors.fechaNac = 'La fecha de nacimiento es requerida.';
    if (!genero) errors.genero = 'El género es requerido.';

    if (Object.keys(errors).length > 0) return;

    $patientMutation.mutate({
      nombre: nombre.trim(),
      cedula: cedula.trim(),
      fechaNac,
      genero,
      telefono: telefono.trim() || undefined,
      lugarNac: lugarNac.trim() || undefined,
      residencia: residencia.trim() || undefined,
    });
  }
</script>

<div class="flex min-h-screen flex-col bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
    <a
      href="/medical/patients/{page.params.id}"
      class="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
    >
      <ArrowLeft class="h-5 w-5" />
    </a>
    <h1 class="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
      Editar paciente
    </h1>
  </header>

  {#if $patientQuery.isPending}
    <!-- Loading skeleton -->
    <main class="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-24 pt-4">
      <div class="flex flex-col gap-4 rounded-xl border bg-white p-4">
        <div class="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
        <div class="h-9 animate-pulse rounded-lg bg-gray-200"></div>
        <div class="h-9 animate-pulse rounded-lg bg-gray-200"></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="h-9 animate-pulse rounded-lg bg-gray-200"></div>
          <div class="h-9 animate-pulse rounded-lg bg-gray-200"></div>
        </div>
        <div class="h-9 animate-pulse rounded-lg bg-gray-200"></div>
      </div>
      <div class="flex flex-col gap-4 rounded-xl border bg-white p-4">
        <div class="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
        <div class="h-9 animate-pulse rounded-lg bg-gray-200"></div>
        <div class="h-9 animate-pulse rounded-lg bg-gray-200"></div>
      </div>
    </main>
  {:else if $patientQuery.isError}
    <!-- Error state -->
    <div class="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
      <p class="text-base font-semibold text-gray-900">No se pudo cargar el paciente</p>
      <p class="text-sm text-gray-500">
        {$patientQuery.error?.message ?? 'Error desconocido'}
      </p>
      <button
        onclick={() => $patientQuery.refetch()}
        class="rounded-lg bg-[#2D6A4F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#245a41]"
      >
        Reintentar
      </button>
    </div>
  {:else if saved}
    <!-- Success state -->
    <div class="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16">
      <div
        class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
      >
        <CheckCircle2 class="h-8 w-8" />
      </div>
      <p class="text-lg font-semibold text-gray-900">Cambios guardados</p>
      <a
        href="/medical/patients/{page.params.id}"
        class="rounded-lg bg-[#2D6A4F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#245a41]"
      >
        Volver al paciente
      </a>
    </div>
  {:else}
    <!-- Form -->
    <main class="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-24 pt-4">
      {#if $patientMutation.isError}
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {$patientMutation.error?.message ?? 'Error al guardar los cambios'}
        </div>
      {/if}

      <!-- Datos personales -->
      <div class="flex flex-col gap-4 rounded-xl border bg-white p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Datos personales</p>

        <!-- Nombre -->
        <div class="flex flex-col gap-1">
          <label for="nombre" class={labelClass}>
            Nombre completo <span class="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            type="text"
            bind:value={nombre}
            placeholder="Nombre y apellido"
            class={inputClass}
          />
          {#if errors.nombre}
            <p class={errorClass}>{errors.nombre}</p>
          {/if}
        </div>

        <!-- Cedula -->
        <div class="flex flex-col gap-1">
          <label for="cedula" class={labelClass}>
            Cédula <span class="text-red-500">*</span>
          </label>
          <input
            id="cedula"
            type="text"
            bind:value={cedula}
            placeholder="V-00.000.000"
            class={inputClass}
          />
          {#if errors.cedula}
            <p class={errorClass}>{errors.cedula}</p>
          {/if}
        </div>

        <!-- Fecha de nacimiento + Género -->
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label for="fechaNac" class={labelClass}>
              Fecha de nacimiento <span class="text-red-500">*</span>
            </label>
            <input
              id="fechaNac"
              type="date"
              bind:value={fechaNac}
              class={inputClass}
            />
            {#if errors.fechaNac}
              <p class={errorClass}>{errors.fechaNac}</p>
            {/if}
          </div>
          <div class="flex flex-col gap-1">
            <label for="genero" class={labelClass}>
              Género <span class="text-red-500">*</span>
            </label>
            <select id="genero" bind:value={genero} class={selectClass}>
              <option value="">Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            {#if errors.genero}
              <p class={errorClass}>{errors.genero}</p>
            {/if}
          </div>
        </div>

        <!-- Lugar de nacimiento -->
        <div class="flex flex-col gap-1">
          <label for="lugarNac" class={labelClass}>Lugar de nacimiento</label>
          <input
            id="lugarNac"
            type="text"
            bind:value={lugarNac}
            placeholder="Ciudad o estado"
            class={inputClass}
          />
        </div>
      </div>

      <!-- Contacto -->
      <div class="flex flex-col gap-4 rounded-xl border bg-white p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Contacto</p>

        <!-- Teléfono -->
        <div class="flex flex-col gap-1">
          <label for="telefono" class={labelClass}>Teléfono</label>
          <input
            id="telefono"
            type="text"
            bind:value={telefono}
            placeholder="0414-1234567"
            class={inputClass}
          />
        </div>

        <!-- Residencia -->
        <div class="flex flex-col gap-1">
          <label for="residencia" class={labelClass}>Dirección de residencia</label>
          <input
            id="residencia"
            type="text"
            bind:value={residencia}
            placeholder="Calle, sector, casa/apto"
            class={inputClass}
          />
        </div>
      </div>
    </main>

    <!-- Fixed bottom bar -->
    <div class="fixed bottom-0 left-0 right-0 flex gap-2 border-t bg-white px-4 py-3 md:pl-64">
      <a
        href="/medical/patients/{page.params.id}"
        class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancelar
      </a>
      <button
        onclick={handleGuardar}
        disabled={$patientMutation.isPending}
        class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#245a41] disabled:opacity-60"
      >
        {$patientMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  {/if}
</div>
