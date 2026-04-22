<script lang="ts">
	import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';

	function formatVES(n: number): string {
		return new Intl.NumberFormat('es-VE', {
			style: 'currency',
			currency: 'VES',
			minimumFractionDigits: 2,
		}).format(n);
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('es-VE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		});
	}

	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1;
	const currentQuarter = Math.ceil(currentMonth / 3);

	const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
	const MONTHS = [
		{ value: 1, label: 'Enero' },
		{ value: 2, label: 'Febrero' },
		{ value: 3, label: 'Marzo' },
		{ value: 4, label: 'Abril' },
		{ value: 5, label: 'Mayo' },
		{ value: 6, label: 'Junio' },
		{ value: 7, label: 'Julio' },
		{ value: 8, label: 'Agosto' },
		{ value: 9, label: 'Septiembre' },
		{ value: 10, label: 'Octubre' },
		{ value: 11, label: 'Noviembre' },
		{ value: 12, label: 'Diciembre' },
	];

	let periodoTipo = $state<'monthly' | 'quarterly' | 'custom'>('monthly');
	let year = $state(currentYear);
	let month = $state(currentMonth);
	let quarter = $state(currentQuarter);
	let customFrom = $state('');
	let customTo = $state('');

	const isCustomReady = $derived(
		periodoTipo !== 'custom' || (!!customFrom && !!customTo),
	);

	const queryParams = $derived({
		period: periodoTipo,
		...(periodoTipo === 'monthly' ? { year, month } : {}),
		...(periodoTipo === 'quarterly' ? { year, quarter } : {}),
		...(periodoTipo === 'custom' && customFrom && customTo
			? { from: customFrom, to: customTo }
			: {}),
	});

	const statementQuery = createQuery({
		get queryKey() { return ['income-statement', queryParams]; },
		queryFn: async () => {
			const res = await api.api.accounting['income-statement'].get({
				query: queryParams,
			});
			if (res.error) {
				const err = res.error as { message?: string };
				throw new Error(err.message ?? 'Error al cargar el estado de resultados');
			}
			return res.data;
		},
		get enabled() { return isCustomReady; },
	});

	const totalIngresos = $derived($statementQuery.data?.ingresos ?? 0);
	const totalEgresos = $derived($statementQuery.data?.egresos ?? 0);
	const resultado = $derived($statementQuery.data?.resultado ?? 0);
	const superavit = $derived(resultado >= 0);

	const periodoLabel = $derived.by(() => {
		if (periodoTipo === 'monthly') {
			const m = MONTHS.find((mo) => mo.value === month)?.label ?? '';
			return `${m} ${year}`;
		}
		if (periodoTipo === 'quarterly') return `T${quarter} ${year}`;
		if (customFrom && customTo) return `${customFrom} – ${customTo}`;
		return '';
	});
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
		</div>
	</div>

	<!-- Main content -->
	<main class="flex flex-col gap-4 px-4 pb-24 pt-4">
		<!-- Period type selector -->
		<div class="flex rounded-xl border bg-white p-1 gap-1">
			{#each (['monthly', 'quarterly', 'custom'] as const) as value (value)}
				{@const labels: Record<string, string> = { monthly: 'Mensual', quarterly: 'Trimestral', custom: 'Personalizado' }}
				<button
					class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors {periodoTipo === value
						? 'bg-[#2D6A4F] text-white'
						: 'text-gray-600 hover:bg-gray-50'}"
					onclick={() => (periodoTipo = value)}
				>
					{labels[value]}
				</button>
			{/each}
		</div>

		<!-- Period sub-selector -->
		{#if periodoTipo === 'monthly'}
			<div class="flex gap-2">
				<select
					bind:value={month}
					class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
				>
					{#each MONTHS as m (m.value)}
						<option value={m.value}>{m.label}</option>
					{/each}
				</select>
				<select
					bind:value={year}
					class="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
				>
					{#each YEARS as y (y)}
						<option value={y}>{y}</option>
					{/each}
				</select>
			</div>
		{:else if periodoTipo === 'quarterly'}
			<div class="flex flex-col gap-2">
				<div class="flex gap-2">
					{#each [1, 2, 3, 4] as q (q)}
						<button
							class="flex-1 rounded-lg border py-2 text-sm font-medium transition-colors {quarter === q
								? 'border-[#2D6A4F] bg-[#2D6A4F] text-white'
								: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
							onclick={() => (quarter = q)}
						>
							T{q}
						</button>
					{/each}
				</div>
				<select
					bind:value={year}
					class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
				>
					{#each YEARS as y (y)}
						<option value={y}>{y}</option>
					{/each}
				</select>
			</div>
		{:else}
			<div class="flex flex-col gap-2">
				<div class="flex flex-col gap-1">
					<label for="desde" class="text-xs font-medium text-gray-500">Desde</label>
					<input
						id="desde"
						type="date"
						bind:value={customFrom}
						class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label for="hasta" class="text-xs font-medium text-gray-500">Hasta</label>
					<input
						id="hasta"
						type="date"
						bind:value={customTo}
						class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
					/>
				</div>
			</div>
		{/if}

		<!-- Incomplete custom range notice -->
		{#if periodoTipo === 'custom' && !isCustomReady}
			<div
				class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-400"
			>
				<Minus class="h-4 w-4 shrink-0" />
				<span>Elige un rango de fechas para ver los resultados.</span>
			</div>
		{/if}

		<!-- Loading skeleton -->
		{#if $statementQuery.isPending && isCustomReady}
			<div class="flex flex-col gap-3">
				{#each [0, 1, 2] as i (i)}
					<div class="h-24 animate-pulse rounded-2xl bg-gray-200"></div>
				{/each}
			</div>
		{/if}

		<!-- Error state -->
		{#if $statementQuery.isError}
			<div
				class="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
			>
				<AlertCircle class="h-5 w-5 shrink-0 text-red-500" />
				<div class="flex flex-col gap-0.5">
					<p class="text-sm font-medium text-red-700">
						No se pudo cargar el estado de resultados
					</p>
					<p class="text-xs text-red-500">
						{$statementQuery.error?.message ?? 'Error desconocido'}
					</p>
				</div>
			</div>
		{/if}

		<!-- Results -->
		{#if $statementQuery.isSuccess && isCustomReady}
			<!-- Period info -->
			<p class="px-1 text-xs text-gray-500">
				Del {formatDate($statementQuery.data.periodo.from)} al {formatDate(
					$statementQuery.data.periodo.to,
				)}
			</p>

			<!-- Resultado neto (hero card) -->
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
				<p class="mt-1 text-xs text-gray-500">Resultado neto del período</p>
			</div>

			<!-- KPI cards -->
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<!-- Ingresos -->
				<div
					class="flex flex-col gap-1 rounded-2xl border border-emerald-200 bg-white p-4"
				>
					<div class="flex items-center gap-1.5">
						<TrendingUp class="h-4 w-4 text-emerald-600" />
						<span class="text-xs font-medium text-emerald-700">Total ingresos</span>
					</div>
					<p class="tabular-nums text-2xl font-bold text-emerald-700">
						{formatVES(totalIngresos)}
					</p>
				</div>

				<!-- Egresos -->
				<div
					class="flex flex-col gap-1 rounded-2xl border border-red-200 bg-white p-4"
				>
					<div class="flex items-center gap-1.5">
						<TrendingDown class="h-4 w-4 text-red-500" />
						<span class="text-xs font-medium text-red-600">Total egresos</span>
					</div>
					<p class="tabular-nums text-2xl font-bold text-red-600">
						{formatVES(totalEgresos)}
					</p>
				</div>
			</div>
		{/if}
	</main>
</div>
