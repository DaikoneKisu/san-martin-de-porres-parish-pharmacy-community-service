<script lang="ts">
  import { page } from '$app/state';
  import { api } from '$lib/api';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { ArrowLeft, CheckCircle2 } from 'lucide-svelte';

  const queryClient = useQueryClient();

  const supplyQuery = createQuery({
    get queryKey() { return ['supply', page.params.id]; },
    get queryFn() {
      const id: string = page.params.id ?? '';
      return async () => {
        const res = await api.api.inventory.supplies({ id }).get();
        if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al cargar insumo');
        return res.data as any;
      };
    },
    get enabled() { return !!page.params.id; },
  });

  // User overrides: undefined means "use the value from the query"
  let overrides = $state<{
    numeroLote?: string;
    fechaVencimiento?: string;
    cantidad?: number;
    precioUnitarioReferencial?: number;
  }>({});

  // Form values are derived from query data, overridden by user edits
  const form = $derived({
    numeroLote: overrides.numeroLote ?? ($supplyQuery.data?.numeroLote ?? ''),
    fechaVencimiento: overrides.fechaVencimiento ?? (
      $supplyQuery.data?.fechaVencimiento
        ? ($supplyQuery.data.fechaVencimiento as string).slice(0, 10)
        : ''
    ),
    cantidad: overrides.cantidad ?? ($supplyQuery.data?.cantidad ?? 0),
    precioUnitarioReferencial: overrides.precioUnitarioReferencial ?? ($supplyQuery.data?.precioUnitarioReferencial ?? 0),
  });

  const editMutation = createMutation({
    mutationFn: async (body: {
      numeroLote?: string;
      fechaVencimiento?: string;
      cantidad?: number;
      precioUnitarioReferencial?: number;
    }) => {
      const id: string = page.params.id ?? '';
      const res = await api.api.inventory.supplies({ id }).patch(body);
      if (res.error) throw new Error((res.error as { message?: string }).message ?? 'Error al guardar cambios');
      return res.data!;
    },
    onSuccess: () => {
      const id = page.params.id;
      queryClient.invalidateQueries({ queryKey: ['supply', id] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
    },
  });

  function getSupplyName(data: typeof $supplyQuery.data): string {
    if (!data) return '';
    if (data.presentacionMedicamento) {
      const pm = data.presentacionMedicamento as {
        medicamento?: { marca?: { nombre?: string }; nombre?: string };
        nombre?: string;
      };
      return pm.medicamento?.marca?.nombre ?? pm.medicamento?.nombre ?? pm.nombre ?? data.id;
    }
    if (data.materialQuirurgico) {
      const mq = data.materialQuirurgico as { nombre?: string };
      return mq.nombre ?? data.id;
    }
    return data.id;
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    $editMutation.mutate({
      numeroLote: form.numeroLote || undefined,
      fechaVencimiento: form.fechaVencimiento || undefined,
      cantidad: form.cantidad,
      precioUnitarioReferencial: form.precioUnitarioReferencial,
    });
  }

  const inputClass =
    'w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'text-xs font-medium text-foreground';
  const sectionLabelClass = 'text-sm font-semibold text-foreground mb-3';
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <header class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
    <a href="/inventory/{page.params.id}" class="text-gray-500 hover:text-gray-700 transition-colors">
      <ArrowLeft size={20} />
    </a>
    <h1 class="text-base font-semibold text-foreground">Editar insumo</h1>
  </header>

  <!-- Main content -->
  <main class="flex-1 px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
    {#if $supplyQuery.isPending}
      <!-- Loading skeleton -->
      <div class="space-y-4">
        {#each [1, 2] as _item (_item)}
          <div class="rounded-xl border bg-white p-4 space-y-4 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            <div class="h-9 bg-gray-200 rounded"></div>
            <div class="h-9 bg-gray-200 rounded"></div>
          </div>
        {/each}
      </div>
    {:else if $supplyQuery.isError}
      <!-- Error state -->
      <div class="flex flex-col items-center justify-center py-16 gap-4">
        <p class="text-sm text-destructive text-center">
          {$supplyQuery.error?.message ?? 'Error al cargar el insumo.'}
        </p>
        <a href="/inventory" class="text-sm font-medium text-primary hover:underline">
          Volver al inventario
        </a>
      </div>
    {:else if $editMutation.isSuccess}
      <!-- Success state -->
      <div class="flex flex-col items-center justify-center py-16 gap-4">
        <CheckCircle2 size={48} class="text-emerald-500" />
        <h2 class="text-lg font-semibold text-foreground">Cambios guardados</h2>
        <p class="text-sm text-muted-foreground text-center">
          El insumo fue actualizado correctamente.
        </p>
        <a href="/inventory/{page.params.id}" class="text-sm font-medium text-primary hover:underline">
          Ver insumo →
        </a>
      </div>
    {:else}
      <form id="edit-form" onsubmit={handleSubmit} class="space-y-4">
        <!-- Section 1: Identificación (read-only) -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
          <p class={sectionLabelClass}>Identificación</p>

          <div class="flex items-center gap-3">
            <span class="text-sm text-muted-foreground font-mono">{$supplyQuery.data?.id}</span>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                {$supplyQuery.data?.tipo === 'MEDICAMENTO'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'}"
            >
              {$supplyQuery.data?.tipo}
            </span>
          </div>

          <div>
            <p class="text-xs text-muted-foreground">Nombre</p>
            <p class="text-sm font-medium text-foreground">{getSupplyName($supplyQuery.data)}</p>
          </div>
        </section>

        <!-- Section 2: Datos editables -->
        <section class="rounded-xl border bg-white p-4 space-y-4">
          <p class={sectionLabelClass}>Datos editables</p>

          <div class="space-y-1">
            <label for="numeroLote" class={labelClass}>Número de lote *</label>
            <input
              id="numeroLote"
              type="text"
              value={form.numeroLote}
              oninput={(e) => { overrides.numeroLote = (e.currentTarget as HTMLInputElement).value; }}
              class={inputClass}
              required
            />
          </div>

          <div class="space-y-1">
            <label for="fechaVencimiento" class={labelClass}>Fecha de vencimiento</label>
            <input
              id="fechaVencimiento"
              type="date"
              value={form.fechaVencimiento}
              oninput={(e) => { overrides.fechaVencimiento = (e.currentTarget as HTMLInputElement).value; }}
              class={inputClass}
            />
          </div>

          <div class="space-y-1">
            <label for="cantidad" class={labelClass}>Cantidad</label>
            <input
              id="cantidad"
              type="number"
              min="0"
              value={form.cantidad}
              oninput={(e) => { overrides.cantidad = Number((e.currentTarget as HTMLInputElement).value); }}
              class={inputClass}
            />
          </div>

          <div class="space-y-1">
            <label for="precioUnitarioReferencial" class={labelClass}>Precio unitario ref. Bs.</label>
            <input
              id="precioUnitarioReferencial"
              type="number"
              min="0"
              step="0.01"
              value={form.precioUnitarioReferencial}
              oninput={(e) => { overrides.precioUnitarioReferencial = Number((e.currentTarget as HTMLInputElement).value); }}
              class={inputClass}
            />
          </div>

          {#if $editMutation.isError}
            <p class="text-xs text-destructive">
              {$editMutation.error?.message ?? 'Error al guardar los cambios.'}
            </p>
          {/if}
        </section>
      </form>
    {/if}
  </main>

  <!-- Fixed bottom bar -->
  {#if $supplyQuery.isSuccess && !$editMutation.isSuccess}
    <div class="fixed bottom-0 left-0 right-0 md:pl-64 bg-white border-t px-4 py-3">
      <button
        type="submit"
        form="edit-form"
        disabled={!form.numeroLote || $editMutation.isPending}
        class="w-full rounded-lg bg-[#2D6A4F] text-white text-sm font-semibold py-2.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#255c43] transition-colors"
      >
        {$editMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  {/if}
</div>
