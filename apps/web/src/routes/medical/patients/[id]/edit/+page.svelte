<script lang="ts">
  import { ArrowLeft, CheckCircle2 } from 'lucide-svelte';

  const PACIENTE = {
    id: '1',
    nombre: 'Ana Sofía',
    apellido: 'Ramírez Torres',
    cedula: 'V-12.345.678',
    fechaNac: '1985-06-15',
    sexo: 'F',
    telefono: '0414-1234567',
    direccion: 'Urb. San Félix, Calle 3, Casa 12',
  };

  let form = $state({ ...PACIENTE });
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

    if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido.';
    if (!form.apellido.trim()) errors.apellido = 'El apellido es requerido.';
    if (!form.cedula.trim()) errors.cedula = 'La cédula es requerida.';
    if (!form.fechaNac) errors.fechaNac = 'La fecha de nacimiento es requerida.';
    if (!form.sexo) errors.sexo = 'El sexo es requerido.';

    if (Object.keys(errors).length > 0) return;

    saved = true;
  }
</script>

<div class="flex min-h-screen flex-col bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
    <a
      href="/medical/patients/{PACIENTE.id}"
      class="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
    >
      <ArrowLeft class="h-5 w-5" />
    </a>
    <h1 class="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
      Editar paciente
    </h1>
  </header>

  {#if saved}
    <!-- Success state -->
    <div class="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16">
      <div
        class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
      >
        <CheckCircle2 class="h-8 w-8" />
      </div>
      <p class="text-lg font-semibold text-gray-900">Cambios guardados</p>
      <a
        href="/medical/patients/{PACIENTE.id}"
        class="rounded-lg bg-[#2D6A4F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#245a41]"
      >
        Volver al paciente
      </a>
    </div>
  {:else}
    <!-- Form -->
    <main class="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-24 pt-4">
      <!-- Datos personales -->
      <div class="flex flex-col gap-4 rounded-xl border bg-white p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Datos personales</p>

        <!-- Nombre + Apellido -->
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label for="nombre" class={labelClass}>
              Nombre <span class="text-red-500">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              bind:value={form.nombre}
              placeholder="Nombre"
              class={inputClass}
            />
            {#if errors.nombre}
              <p class={errorClass}>{errors.nombre}</p>
            {/if}
          </div>
          <div class="flex flex-col gap-1">
            <label for="apellido" class={labelClass}>
              Apellido <span class="text-red-500">*</span>
            </label>
            <input
              id="apellido"
              type="text"
              bind:value={form.apellido}
              placeholder="Apellido"
              class={inputClass}
            />
            {#if errors.apellido}
              <p class={errorClass}>{errors.apellido}</p>
            {/if}
          </div>
        </div>

        <!-- Cedula -->
        <div class="flex flex-col gap-1">
          <label for="cedula" class={labelClass}>
            Cédula <span class="text-red-500">*</span>
          </label>
          <input
            id="cedula"
            type="text"
            bind:value={form.cedula}
            placeholder="V-00.000.000"
            class={inputClass}
          />
          {#if errors.cedula}
            <p class={errorClass}>{errors.cedula}</p>
          {/if}
        </div>

        <!-- Fecha de nacimiento + Sexo -->
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label for="fechaNac" class={labelClass}>
              Fecha de nacimiento <span class="text-red-500">*</span>
            </label>
            <input
              id="fechaNac"
              type="date"
              bind:value={form.fechaNac}
              class={inputClass}
            />
            {#if errors.fechaNac}
              <p class={errorClass}>{errors.fechaNac}</p>
            {/if}
          </div>
          <div class="flex flex-col gap-1">
            <label for="sexo" class={labelClass}>
              Sexo <span class="text-red-500">*</span>
            </label>
            <select id="sexo" bind:value={form.sexo} class={selectClass}>
              <option value="">Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            {#if errors.sexo}
              <p class={errorClass}>{errors.sexo}</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Contacto -->
      <div class="flex flex-col gap-4 rounded-xl border bg-white p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Contacto</p>

        <!-- Telefono -->
        <div class="flex flex-col gap-1">
          <label for="telefono" class={labelClass}>Teléfono</label>
          <input
            id="telefono"
            type="text"
            bind:value={form.telefono}
            placeholder="0414-1234567"
            class={inputClass}
          />
        </div>

        <!-- Direccion -->
        <div class="flex flex-col gap-1">
          <label for="direccion" class={labelClass}>Dirección</label>
          <input
            id="direccion"
            type="text"
            bind:value={form.direccion}
            placeholder="Calle, sector, casa/apto"
            class={inputClass}
          />
        </div>
      </div>
    </main>

    <!-- Fixed bottom bar -->
    <div
      class="fixed bottom-0 left-0 right-0 flex gap-2 border-t bg-white px-4 py-3 md:pl-64"
    >
      <a
        href="/medical/patients/{PACIENTE.id}"
        class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancelar
      </a>
      <button
        onclick={handleGuardar}
        class="flex-1 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#245a41]"
      >
        Guardar cambios
      </button>
    </div>
  {/if}
</div>
