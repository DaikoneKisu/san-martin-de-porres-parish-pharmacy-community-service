<script lang="ts">
	import {
		ArrowLeft,
		TrendingDown,
		AlertTriangle,
		CheckCircle2,
		Info,
		Loader2,
	} from 'lucide-svelte';

	type Moneda = 'VES' | 'USD';
	type Paso = 'formulario' | 'confirmar' | 'guardado';

	const TASA_BCV_SIMULADA = 36.48;

	const CATEGORIAS = [
		{ value: 'insumos', label: 'Compra de insumos' },
		{ value: 'servicios', label: 'Servicios (luz, agua, internet)' },
		{ value: 'mantenimiento', label: 'Mantenimiento' },
		{ value: 'personal', label: 'Personal / honorarios' },
		{ value: 'otros', label: 'Otros gastos' },
	];

	function formatVES(n: number): string {
		return new Intl.NumberFormat('es-VE', {
			style: 'currency',
			currency: 'VES',
			minimumFractionDigits: 2,
		}).format(n);
	}

	let concepto = $state('');
	let categoria = $state('');
	let moneda = $state<Moneda>('VES');
	let monto = $state('');
	let notas = $state('');
	let paso = $state<Paso>('formulario');
	let cargandoTasa = $state(false);
	let tasa = $state<number | null>(null);
	let tasaError = $state(false);

	const montoNum = $derived(parseFloat(monto) || 0);
	const montoVES = $derived(
		moneda === 'USD' && tasa ? montoNum * tasa : montoNum,
	);
	const montoUSD = $derived(moneda === 'USD' ? montoNum : null);
	const formValido = $derived(
		concepto.trim().length >= 3 && !!categoria && montoNum > 0,
	);
	const categoriaLabel = $derived(
		CATEGORIAS.find((c) => c.value === categoria)?.label ?? categoria,
	);

	async function handleContinuar() {
		if (!formValido) return;
		if (moneda === 'USD') {
			cargandoTasa = true;
			tasaError = false;
			await new Promise((r) => setTimeout(r, 1200));
			tasa = TASA_BCV_SIMULADA;
			cargandoTasa = false;
			paso = 'confirmar';
		} else {
			paso = 'confirmar';
		}
	}

	async function handleGuardar() {
		await new Promise((r) => setTimeout(r, 600));
		paso = 'guardado';
	}

	function resetForm() {
		concepto = '';
		categoria = '';
		moneda = 'VES';
		monto = '';
		notas = '';
		paso = 'formulario';
		tasa = null;
		tasaError = false;
	}

	const inputClass =
		'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30';
	const labelClass = 'text-sm font-medium text-gray-700';
</script>

<div class="flex min-h-screen flex-col bg-gray-50">
	<!-- Sticky header -->
	<div class="sticky top-0 z-30 border-b bg-white px-4 py-3">
		<div class="flex items-center gap-3">
			{#if paso === 'formulario'}
				<a
					href="/accounting/journal"
					class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
					aria-label="Volver"
				>
					<ArrowLeft class="h-5 w-5" />
				</a>
			{:else}
				<button
					onclick={() => (paso = 'formulario')}
					class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
					aria-label="Volver"
				>
					<ArrowLeft class="h-5 w-5" />
				</button>
			{/if}

			<div class="flex flex-1 flex-col">
				<h1 class="text-base font-semibold text-gray-900">Registrar egreso</h1>
				{#if paso === 'confirmar'}
					<p class="text-xs text-gray-400">
						Confirma el monto antes de guardar
					</p>
				{/if}
			</div>

			<!-- Step dots -->
			<div class="flex items-center gap-1">
				<div
					class="h-1.5 rounded-full transition-all duration-200 {paso ===
					'formulario'
						? 'w-4 bg-[#2D6A4F]'
						: 'w-2 bg-gray-200'}"
				></div>
				<div
					class="h-1.5 rounded-full transition-all duration-200 {paso ===
					'confirmar'
						? 'w-4 bg-[#2D6A4F]'
						: 'w-2 bg-gray-200'}"
				></div>
			</div>
		</div>
	</div>

	<!-- Paso: formulario -->
	{#if paso === 'formulario'}
		<div class="flex flex-col gap-4 px-4 py-4 pb-32">
			<!-- Concepto -->
			<div class="flex flex-col gap-1.5">
				<label for="concepto" class={labelClass}>Concepto *</label>
				<input
					id="concepto"
					type="text"
					bind:value={concepto}
					placeholder="Ej: Compra de material de limpieza"
					class={inputClass}
				/>
			</div>

			<!-- Categoría -->
			<div class="flex flex-col gap-1.5">
				<label for="categoria" class={labelClass}>Categoría *</label>
				<select id="categoria" bind:value={categoria} class={inputClass}>
					<option value="" disabled>Selecciona una categoría</option>
					{#each CATEGORIAS as cat (cat.value)}
						<option value={cat.value}>{cat.label}</option>
					{/each}
				</select>
			</div>

			<!-- Moneda -->
			<div class="flex flex-col gap-1.5">
				<span class={labelClass}>Moneda *</span>
				<div class="grid grid-cols-2 gap-2">
					<button
						onclick={() => (moneda = 'VES')}
						class="flex flex-col items-center rounded-xl border px-4 py-3 transition-colors {moneda ===
						'VES'
							? 'border-2 border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#2D6A4F]'
							: 'border border-gray-300 text-gray-500'}"
					>
						<span class="text-lg font-bold">Bs.</span>
						<span class="text-xs {moneda === 'VES' ? 'font-semibold' : ''}">
							Bolívares
						</span>
					</button>
					<button
						onclick={() => (moneda = 'USD')}
						class="flex flex-col items-center rounded-xl border px-4 py-3 transition-colors {moneda ===
						'USD'
							? 'border-2 border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#2D6A4F]'
							: 'border border-gray-300 text-gray-500'}"
					>
						<span class="text-lg font-bold">$</span>
						<span class="text-xs {moneda === 'USD' ? 'font-semibold' : ''}">
							Dólares
						</span>
					</button>
				</div>

				{#if moneda === 'USD'}
					<div
						class="mt-1 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
					>
						<Info class="mt-0.5 h-3.5 w-3.5 shrink-0" />
						<span>
							El monto se convertirá a VES usando la tasa oficial del BCV del día
							al continuar.
						</span>
					</div>
				{/if}
			</div>

			<!-- Monto -->
			<div class="flex flex-col gap-1.5">
				<label for="monto" class={labelClass}>Monto *</label>
				<div class="relative">
					<span
						class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
					>
						{moneda === 'USD' ? '$' : 'Bs.'}
					</span>
					<input
						id="monto"
						type="number"
						min="0"
						step="0.01"
						bind:value={monto}
						placeholder="0.00"
						class="{inputClass} pl-9"
					/>
				</div>
			</div>

			<!-- Notas -->
			<div class="flex flex-col gap-1.5">
				<label for="notas" class={labelClass}>Notas</label>
				<textarea
					id="notas"
					rows={3}
					bind:value={notas}
					placeholder="Observaciones adicionales (opcional)"
					class={inputClass}
				></textarea>
			</div>

			{#if tasaError}
				<div
					class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
				>
					<AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						No se pudo obtener la tasa del BCV. Verifica tu conexión e intenta
						de nuevo.
					</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Paso: confirmar -->
	{#if paso === 'confirmar'}
		<div class="flex flex-col gap-4 px-4 py-4 pb-32">
			<!-- Resumen card -->
			<div class="flex flex-col gap-3 rounded-2xl border bg-white p-4">
				<div class="flex items-center gap-2">
					<TrendingDown class="h-5 w-5 text-red-500" />
					<span class="font-semibold text-gray-800">Resumen del egreso</span>
				</div>

				<hr class="border-gray-100" />

				<div class="flex flex-col gap-2.5">
					<!-- Concepto row -->
					<div class="flex items-start justify-between gap-4">
						<span class="text-sm text-gray-500">Concepto</span>
						<span class="text-right text-sm font-medium text-gray-900">
							{concepto}
						</span>
					</div>

					<!-- Categoría row -->
					<div class="flex items-start justify-between gap-4">
						<span class="text-sm text-gray-500">Categoría</span>
						<span class="text-right text-sm font-medium text-gray-900">
							{categoriaLabel}
						</span>
					</div>

					{#if moneda === 'USD'}
						<!-- Monto USD -->
						<div class="flex items-start justify-between gap-4">
							<span class="text-sm text-gray-500">Monto (USD)</span>
							<span class="text-right text-sm font-medium text-gray-900">
								${montoUSD!.toFixed(2)}
							</span>
						</div>

						<!-- Tasa BCV -->
						<div class="flex items-start justify-between gap-4">
							<span class="text-sm text-gray-500">Tasa BCV del día</span>
							<span class="text-right text-sm font-medium text-gray-900">
								Bs. {tasa!.toFixed(2)} / USD
							</span>
						</div>

						<hr class="border-gray-100" />
					{/if}

					<!-- Monto VES -->
					<div class="flex items-start justify-between gap-4">
						<span class="text-sm text-gray-500">Monto (VES)</span>
						<span
							class="tabular-nums text-right text-xl font-bold text-red-600"
						>
							{formatVES(montoVES)}
						</span>
					</div>
				</div>
			</div>

			{#if moneda === 'USD' && tasa}
				<div
					class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
				>
					<CheckCircle2 class="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						Tasa obtenida del BCV: Bs. {tasa.toFixed(2)} por USD — válida para
						el día de hoy.
					</span>
				</div>
			{/if}

			{#if notas}
				<div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
					<p class="mb-1 text-xs font-medium text-gray-500">Notas</p>
					<p class="text-sm text-gray-700">{notas}</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Paso: guardado -->
	{#if paso === 'guardado'}
		<div
			class="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center"
		>
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
			>
				<CheckCircle2 class="h-8 w-8 text-emerald-600" />
			</div>

			<div class="flex flex-col gap-1">
				<p class="text-lg font-semibold text-gray-900">Egreso registrado</p>
				<p class="text-sm text-gray-400">
					El asiento ha sido guardado en el libro diario.
				</p>
			</div>

			<span
				class="tabular-nums rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-base font-bold text-red-700"
			>
				-{formatVES(montoVES)}
			</span>

			<div class="mt-2 flex w-full max-w-xs flex-col gap-3">
				<a
					href="/accounting/journal"
					class="flex w-full items-center justify-center rounded-xl bg-[#2D6A4F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#245a42]"
				>
					Ver libro diario
				</a>
				<a
					href="/accounting/expenses/new"
					onclick={resetForm}
					class="flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
				>
					Registrar otro egreso
				</a>
			</div>
		</div>
	{/if}

	<!-- Fixed bottom bar -->
	{#if paso !== 'guardado'}
		<div
			class="fixed bottom-0 left-0 right-0 flex gap-2 border-t bg-white px-4 py-3 md:pl-64"
		>
			{#if paso === 'confirmar'}
				<button
					onclick={() => (paso = 'formulario')}
					class="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
				>
					Volver
				</button>
			{/if}

			<button
				onclick={paso === 'formulario' ? handleContinuar : handleGuardar}
				disabled={!formValido || cargandoTasa}
				class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#245a42] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if cargandoTasa}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Obteniendo tasa BCV…</span>
				{:else if paso === 'formulario'}
					{moneda === 'USD' ? 'Obtener tasa y continuar' : 'Continuar'}
				{:else}
					Confirmar y guardar
				{/if}
			</button>
		</div>
	{/if}
</div>
