<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { makeQueryClient } from '$lib/query-client';
	import { Drawer } from 'vaul-svelte';
	import { Menu, X, LayoutDashboard, Stethoscope, Package, HandHeart, BookOpen, ShieldCheck, Settings } from 'lucide-svelte';
	import SanmartLogo from '$lib/components/sanmart-logo.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const queryClient = makeQueryClient();

	const isAuthRoute = $derived(page.route.id?.includes('(auth)') ?? false);

	const roles: string[] = $derived((data as any)?.session?.user?.roles ?? []);
	const isAdmin = $derived(roles.includes('administrador'));

	let mobileDrawerOpen = $state(false);

	const navItems = $derived([
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
		{ href: '/medical', label: 'Médico', icon: Stethoscope, show: true },
		{ href: '/inventory', label: 'Inventario', icon: Package, show: true },
		{ href: '/donations', label: 'Donaciones', icon: HandHeart, show: true },
		{ href: '/accounting', label: 'Contable', icon: BookOpen, show: true },
		{ href: '/audit', label: 'Auditoría', icon: ShieldCheck, show: isAdmin },
		{ href: '/admin', label: 'Administración', icon: Settings, show: isAdmin },
	].filter((item) => item.show));

	function isActive(href: string): boolean {
		const pathname = page.url.pathname;
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	function closeMobileDrawer() {
		mobileDrawerOpen = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	{#if isAuthRoute}
		{@render children()}
	{:else}
		<div class="flex min-h-screen bg-background">
			<!-- Desktop sidebar -->
			<aside class="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-sidebar text-sidebar-foreground">
				<div class="flex flex-col flex-1 overflow-y-auto">
					<div class="flex items-center h-16 px-6 border-b shrink-0">
						<SanmartLogo variant="dark" size={140} />
					</div>
					<nav class="flex-1 px-3 py-4 space-y-1">
						{#each navItems as item (item.href)}
							{@const active = isActive(item.href)}
							<a
								href={item.href}
								class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
									{active
										? 'bg-sidebar-accent text-sidebar-accent-foreground'
										: 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}"
							>
								<item.icon class="size-4 shrink-0" />
								{item.label}
							</a>
						{/each}
					</nav>
				</div>
			</aside>

			<!-- Main content area -->
			<div class="flex flex-col flex-1 md:pl-64">
				<!-- Mobile top bar -->
				<header class="flex items-center h-14 px-4 border-b bg-background md:hidden shrink-0">
					<Drawer.Root bind:open={mobileDrawerOpen} direction="bottom">
						<Drawer.Trigger
							class="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none"
							aria-label="Abrir menú"
						>
							<Menu class="size-5" />
						</Drawer.Trigger>

						<Drawer.Portal>
							<Drawer.Overlay
								class="fixed inset-0 bg-black/40 z-40"
								onclick={closeMobileDrawer}
							/>
							<Drawer.Content
								class="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-background border-t max-h-[80vh]"
							>
								<!-- Drag handle -->
								<div class="flex justify-center pt-3 pb-2">
									<div class="w-10 h-1.5 rounded-full bg-muted"></div>
								</div>

								<!-- Drawer header -->
								<div class="flex items-center justify-between px-4 pb-3 border-b">
									<span class="text-base font-semibold">Menú</span>
									<button
										onclick={closeMobileDrawer}
										class="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent"
										aria-label="Cerrar menú"
									>
										<X class="size-4" />
									</button>
								</div>

								<!-- Nav links -->
								<nav class="flex-1 overflow-y-auto px-3 py-3 space-y-1">
									{#each navItems as item (item.href)}
										{@const active = isActive(item.href)}
										<a
											href={item.href}
											onclick={closeMobileDrawer}
											class="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors
												{active
													? 'bg-accent text-accent-foreground'
													: 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'}"
										>
											<item.icon class="size-5 shrink-0" />
											{item.label}
										</a>
									{/each}
								</nav>

								<!-- Bottom safe area spacer -->
								<div class="h-safe-bottom pb-4"></div>
							</Drawer.Content>
						</Drawer.Portal>
					</Drawer.Root>

					<SanmartLogo size={110} />
				</header>

				<!-- Page content -->
				<main class="flex-1 p-4 md:p-6">
					{@render children()}
				</main>
			</div>
		</div>
	{/if}
</QueryClientProvider>
