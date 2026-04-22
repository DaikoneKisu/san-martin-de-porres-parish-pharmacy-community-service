<script lang="ts">
  import { goto } from '$app/navigation';
  import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-svelte';
  import SanmartLogo from '$lib/components/sanmart-logo.svelte';

  type FormState = 'idle' | 'loading' | 'error';

  let showPassword = $state(false);
  let formState = $state<FormState>('idle');
  let errorMsg = $state('');
  let email = $state('');
  let password = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!email || !password) {
      errorMsg = 'Por favor, completa todos los campos.';
      formState = 'error';
      return;
    }
    formState = 'loading';
    await new Promise((resolve) => setTimeout(resolve, 900));
    if (password === 'error') {
      errorMsg = 'Correo o contraseña incorrectos. Intenta de nuevo.';
      formState = 'error';
      return;
    }
    goto('/');
  }
</script>

<div class="w-full max-w-sm space-y-8">
  <div class="flex justify-center">
    <SanmartLogo size={180} />
  </div>

  <div class="rounded-xl border border-border bg-card shadow-sm px-6 py-8 space-y-6">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold text-foreground">Iniciar sesión</h1>
      <p class="text-sm text-muted-foreground">Accede a tu cuenta para continuar.</p>
    </div>

    {#if formState === 'error'}
      <div
        class="relative w-full rounded-lg border border-destructive/50 px-4 py-3 text-destructive flex items-start gap-3"
        role="alert"
      >
        <AlertCircle class="h-4 w-4 mt-0.5 shrink-0" />
        <p class="text-sm">{errorMsg}</p>
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4" novalidate>
      <div class="space-y-1.5">
        <label for="email" class="text-sm font-medium leading-none">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          bind:value={email}
          placeholder="correo@ejemplo.com"
          disabled={formState === 'loading'}
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div class="space-y-1.5">
        <label for="password" class="text-sm font-medium leading-none">Contraseña</label>
        <div class="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autocomplete="current-password"
            bind:value={password}
            placeholder="••••••••"
            disabled={formState === 'loading'}
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onclick={() => (showPassword = !showPassword)}
            class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {#if showPassword}
              <EyeOff class="h-4 w-4" />
            {:else}
              <Eye class="h-4 w-4" />
            {/if}
          </button>
        </div>
      </div>

      <div class="flex justify-end">
        <a
          href="/recover-password"
          class="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Olvidé mi contraseña
        </a>
      </div>

      <button
        type="submit"
        disabled={formState === 'loading'}
        class="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
      >
        {#if formState === 'loading'}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Iniciando sesión...
        {:else}
          Iniciar sesión
        {/if}
      </button>
    </form>
  </div>

  <p class="text-center text-xs text-muted-foreground">
    Farmacia Parroquial San Martín de Porres — San Félix, Estado Bolívar
  </p>
</div>
