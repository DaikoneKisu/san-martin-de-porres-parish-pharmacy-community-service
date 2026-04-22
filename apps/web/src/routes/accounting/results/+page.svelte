<script lang="ts">
	import {
		ArrowLeft,
		TrendingUp,
		TrendingDown,
		ChevronDown,
		Minus,
		Stethoscope,
		HeartHandshake,
		Receipt,
		FileText,
	} from 'lucide-svelte';

	type Periodo = 'mes' | 'trimestre' | 'semestre' | 'personalizado';

	interface BarData {
		label: string;
		ingresos: number;
		egresos: number;
	}

	const DATA_MES: BarData[] = [
		{ label: 'Sem 1', ingresos: 875, egresos: 420 },
		{ label: 'Sem 2', ingresos: 1240, egresos: 288 },
		{ label: 'Sem 3', ingresos: 950, egresos: 540 },
		{ label: 'Sem 4', ingresos: 1100, egresos: 180 },
	];
	const DATA_TRIMESTRE: BarData[] = [
		{ label: 'Abr', ingresos: 3800, egresos: 1620 },
		{ label: 'May', ingresos: 4200, egresos: 1380 },
		{ label: 'Jun', ingresos: 4165, egresos: 1428 },
	];
	const DATA_SEMESTRE: BarData[] = [
		{ label: 'Ene', ingresos: 3200, egresos: 1800 },
		{ label: 'Feb', ingresos: 3600, egresos: 1400 },
		{ label: 'Mar', ingresos: 4000, egresos: 1600 },
		{ label: 'Abr', ingresos: 3800, egresos: 1620 },
		{ label: 'May', ingresos: 4200, egresos: 1380 },
		{ label: 'Jun', ingresos: 4165, egresos: 1428 },
	];

	interface DesgloseItem {
		origen: string;
		monto: number;
		color: string;
	}

	const DESGLOSE_INGRESOS: DesgloseItem[] = [
		{
			origen: 'Citas médicas',
			monto: 1750,
			color: 'text-blue-600 bg-blue-50 border-blue-200',
		},
		{
			origen: 'Donaciones',
			monto: 1600,
			color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
		},
		{
			origen: 'Récipes externos',
			monto: 815,
			color: 'text-amber-700 bg-amber-50 border-amber-200',
		},
	];
	const DESGLOSE_EGRESOS: DesgloseItem[] = [
		{
			origen: 'Compras de insumos',
			monto: 828,
			color: 'text-slate-600 bg-slate-50 border-slate-200',
		},
		{
			origen: 'Servicios',
			monto: 420,
			color: 'text-slate-600 bg-slate-50 border-slate-200',
		},
		{
			origen: 'Otros gastos',
			monto: 180,
			color: 'text-slate-600 bg-slate-50 border-slate-200',
		},
	];

	const PERIODOS: { value: Periodo; label: string }[] = [
		{ value: 'mes', label: 'Este mes' },
		{ value: 'trimestre', label: 'Último trimestre' },
		{ value: 'semestre', label: 'Último semestre' },
		{ value: 'personalizado', label: 'Personalizado' },
	];

	function formatVES(n: number): string {
		return new Intl.NumberFormat('es-VE', {
			style: 'currency',
			currency: 'VES',
			minimumFractionDigits: 2,
		}).format(n);
	}

	let periodo = $state<Periodo>('mes');
	let periodoMenuOpen = $state(false);
	let desdeStr = $state('');
	let hastaStr = $state('');

	const data = $derived<BarData[]>(
		periodo === 'mes'
			? DATA_MES
			: periodo === 'trimestre'
				? DATA_TRIMESTRE
				: periodo === 'semestre'
					? DATA_SEMESTRE
					: desdeStr && hastaStr
						? DATA_MES
						: [],
	);

	const rangoCompleto = $derived(
		periodo !== 'personalizado' || (!!desdeStr && !!hastaStr),
	);

	const totalIngresos = $derived(
		DESGLOSE_INGRESOS.reduce((s, d) => s + d.monto, 0),
	);
	const totalEgresos = $derived(
		DESGLOSE_EGRESOS.reduce((s, d) => s + d.monto, 0),
	);
	const resultado = $derived(totalIngresos - totalEgresos);
	const superavit = $derived(resultado >= 0);

	const maxValor = $derived(
		Math.max(...data.flatMap((d) => [d.ingresos, d.egresos]), 1),
	);

	const periodoLabel = $derived(
		periodo === 'personalizado' && desdeStr && hastaStr
			? `${desdeStr} – ${hastaStr}`
			: (PERIODOS.find((p) => p.value === periodo)?.label ?? ''),
	);

	function getIngresoIcon(origen: string) {
		if (origen === 'Citas médicas') return Stethoscope;
		if (origen === 'Donaciones') return HeartHandshake;
		return Receipt;
	}
</script>

<div class="flex min-h-screen flex-col bg-gray-50">
	<!-- Sticky header -->
	<div class="sticky top-0 z-30 border-b bg-white px-4 py-3">
		<div class="relative flex items-center gap-3">
			<a
				href="/accounting"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
				aria-label="Volver"
			>
				<ArrowLeft class="h-5 w-5" />
			</a>

			<h1 class="flex-1 text-base font-semibold text-gray-900">
				Estado de resultados
			</h1>

			<!-- Period selector -->
			<div class="relative">
				<button
					onclick={() => (periodoMenuOpen = !periodoMenuOpen)}
					class="flex max-w-[160px] items-center gap-1.5 truncate rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
				>
					<span class="truncate">{periodoLabel}</span>
					<ChevronDown
						class="h-4 w-4 shrink-0 transition-transform duration-200 {periodoMenuOpen
							? 'rotate-180'
							: ''}"
					/>
				</button>

				{#if periodoMenuOpen}
					<!-- Overlay to close dropdown -->
					<div
						class="fixed inset-0 z-40"
						onclick={() => (periodoMenuOpen = false)}
						aria-hidden="true"
					></div>

					<!-- Dropdown -->
					<div
						class="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border bg-white shadow-lg"
					>
						{#each PERIODOS as p (p.value)}
							<button
								class="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 {periodo ===
								p.value
									? 'font-semibold text-[#2D6A4F]'
									: 'text-gray-700'}"
								onclick={() => {
									periodo = p.value;
									if (p.value !== 'personalizado') {
										periodoMenuOpen = false;
									}
								}}
							>
								{p.label}
							</button>
						{/each}

						{#if periodo === 'personalizado'}
							<div class="border-t px-4 py-3 flex flex-col gap-2">
								<div class="flex flex-col gap-1">
									<label
										for="desde"
										class="text-xs font-medium text-gray-500"
									>
										Desde
									</label>
									<input
										id="desde"
										type="date"
										bind:value={desdeStr}
										class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
									/>
								</div>
								<div class="flex flex-col gap-1">
									<label
										for="hasta"
										class="text-xs font-medium text-gray-500"
									>
										Hasta
									</label>
									<input
										id="hasta"
										type="date"
										bind:value={hastaStr}
										class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
									/>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main content -->
	<main class="flex flex-col gap-4 px-4 pb-24 pt-3">
		<!-- 1. Resultado principal card -->
		<div
			class="flex flex-col gap-1 rounded-2xl border p-4 {superavit
				? 'border-emerald-200 bg-emerald-50'
				: 'border-red-200 bg-red-50'}"
		>
			<div
				class="flex items-center gap-1.5 text-xs font-medium {superavit
					? 'text-emerald-700'
					: 'text-red-600'}"
			>
				{#if superavit}
					<TrendingUp class="h-4 w-4" />
					<span>Superávit</span>
				{:else}
					<TrendingDown class="h-4 w-4" />
					<span>Déficit</span>
				{/if}
				<span class="text-gray-400">·</span>
				<span class="text-gray-500">{periodoLabel}</span>
			</div>

			<p
				class="tabular-nums text-3xl font-bold {superavit
					? 'text-emerald-700'
					: 'text-red-600'}"
			>
				{superavit ? '+' : ''}{formatVES(resultado)}
			</p>

			<p class="mt-1 text-xs text-gray-500">
				Ingresos {formatVES(totalIngresos)} · Egresos {formatVES(totalEgresos)}
			</p>
		</div>

		<!-- 2. Empty state for incomplete custom range -->
		{#if periodo === 'personalizado' && !rangoCompleto}
			<div
				class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-400"
			>
				<Minus class="h-4 w-4 shrink-0" />
				<span>Elige un rango de fechas para ver los resultados.</span>
			</div>
		{/if}

		<!-- 3. Chart + breakdown (only if rangoCompleto) -->
		{#if rangoCompleto}
			<!-- Chart card -->
			<div class="rounded-xl border bg-white p-4">
				<div class="flex items-center justify-between">
					<span class="text-sm font-semibold text-gray-800">
						Ingresos vs. Egresos
					</span>
					<div class="flex items-center gap-3 text-xs text-gray-500">
						<span class="flex items-center gap-1">
							<span
								class="inline-block h-2.5 w-2.5 rounded-full bg-[#2D6A4F]"
							></span>
							Ingresos
						</span>
						<span class="flex items-center gap-1">
							<span
								class="inline-block h-2.5 w-2.5 rounded-full bg-red-400"
							></span>
							Egresos
						</span>
					</div>
				</div>

				<!-- Bar chart -->
				<div class="mt-2 flex items-end gap-1" style="height: 160px;">
					{#each data as bar (bar.label)}
						<div class="flex flex-1 flex-col items-center gap-0.5">
							<div
								class="flex w-full items-end gap-0.5"
								style="height: 120px;"
							>
								<div
									class="flex-1 rounded-t bg-[#2D6A4F] transition-all"
									style="height: {((bar.ingresos / maxValor) * 100).toFixed(1)}%"
									title="Ingresos: {formatVES(bar.ingresos)}"
								></div>
								<div
									class="flex-1 rounded-t bg-red-400 transition-all"
									style="height: {((bar.egresos / maxValor) * 100).toFixed(1)}%"
									title="Egresos: {formatVES(bar.egresos)}"
								></div>
							</div>
							<span class="mt-1 text-[10px] text-gray-400">{bar.label}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Breakdown card -->
			<div class="divide-y rounded-xl border bg-white">
				<!-- Ingresos section -->
				<div class="flex flex-col gap-2 p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5">
							<TrendingUp class="h-4 w-4 text-emerald-700" />
							<span class="text-sm font-semibold text-emerald-700">
								Ingresos totales
							</span>
						</div>
						<span class="font-bold text-emerald-700">
							{formatVES(totalIngresos)}
						</span>
					</div>

					{#each DESGLOSE_INGRESOS as item (item.origen)}
						{@const pct = ((item.monto / totalIngresos) * 100).toFixed(0)}
						{@const Icon = getIngresoIcon(item.origen)}
						<div class="flex items-center gap-2">
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border {item.color}"
							>
								<Icon class="h-3.5 w-3.5" />
							</span>
							<span class="flex-1 text-sm text-gray-700">{item.origen}</span>
							<span class="text-sm font-medium text-gray-900">
								{formatVES(item.monto)}
							</span>
							<span
								class="rounded border px-1 text-[10px] {item.color}"
							>
								{pct}%
							</span>
						</div>
					{/each}
				</div>

				<!-- Egresos section -->
				<div class="flex flex-col gap-2 p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5">
							<TrendingDown class="h-4 w-4 text-red-600" />
							<span class="text-sm font-semibold text-red-600">
								Egresos totales
							</span>
						</div>
						<span class="font-bold text-red-600">
							{formatVES(totalEgresos)}
						</span>
					</div>

					{#each DESGLOSE_EGRESOS as item (item.origen)}
						{@const pct = ((item.monto / totalEgresos) * 100).toFixed(0)}
						<div class="flex items-center gap-2">
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border {item.color}"
							>
								<FileText class="h-3.5 w-3.5" />
							</span>
							<span class="flex-1 text-sm text-gray-700">{item.origen}</span>
							<span class="text-sm font-medium text-gray-900">
								{formatVES(item.monto)}
							</span>
							<span class="rounded border px-1 text-[10px] {item.color}">
								{pct}%
							</span>
						</div>
					{/each}
				</div>

				<!-- Resultado neto row -->
				<div class="flex items-center justify-between p-4">
					<div class="flex items-center gap-1.5">
						{#if superavit}
							<TrendingUp class="h-4 w-4 text-emerald-700" />
							<span class="text-sm font-bold text-emerald-700">
								Resultado neto
							</span>
						{:else}
							<TrendingDown class="h-4 w-4 text-red-600" />
							<span class="text-sm font-bold text-red-600">Resultado neto</span>
						{/if}
					</div>
					<span
						class="tabular-nums text-base font-bold {superavit
							? 'text-emerald-700'
							: 'text-red-600'}"
					>
						{superavit ? '+' : ''}{formatVES(resultado)}
					</span>
				</div>
			</div>
		{/if}
	</main>
</div>
