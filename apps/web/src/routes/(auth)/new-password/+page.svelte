<script lang="ts">
  import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-svelte';
  import SanmartLogo from '$lib/components/sanmart-logo.svelte';

  type FormState = 'idle' | 'loading' | 'error' | 'success';

  interface FieldErrors {
    password?: string;
    confirm?: string;
  }

  function getStrengthLabel(pwd: string): { label: string; color: string; width: string } {
    if (pwd.length === 0) return { label: '', color: 'bg-border', width: 'w-0' };
    if (pwd.length < 6) return { label: 'Muy débil', color: 'bg-destructive', width: 'w-1/4' };
    if (pwd.length < 8) return { label: 'Débil', color: 'bg-warning', width: 'w-2/4' };
    if (
      pwd.length < 12 &&
      /[A-Z]/.test(pwd) &&
      /[0-9]/.test(pwd)
    ) {
      return { label: 'Fuerte', color: 'bg-primary', width: 'w-3/4' };
    }
    if (
      pwd.length >= 12 &&
      /[A-Z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[^A-Za-z0-9]/.test(pwd)
    ) {
      return { label: 'Muy fuerte', color: 'bg-primary', width: 'w-full' };
    }
    return { label: 'Moderada', color: 'bg-warning', width: 'w-2/4' };
  }

  let showPassword = $state(false);
  let showConfirm = $state(false);
  let password = $state('');
  let confirm = $state('');
  let formState = $state<FormState>('idle');
  let fieldErrors = $state<FieldErrors>({});

  const strength = $derived(getStrengthLabel(password));

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (password !== confirm) {
      errors.confirm = 'Las contraseñas no coinciden.';
    }
    if (Object.keys(errors).length > 0) {
      fieldErrors = errors;
      formState = 'error';
      return;
    }
    fieldErrors = {};
    formState = 'loading';
    await new Promise((resolve) => setTimeout(resolve, 900));
    formState = 'success';
  }
</script>

<div class="w-full max-w-sm space-y-8">
  <div class="flex justify-center">
    <SanmartLogo size={180} />
  </div>

  <div class="rounded-xl border border-border bg-card shadow-sm px-6 py-8 space-y-6">
    {#if formState !== 'success'}
      <div class="space-y-1">
        <h1 class="text-xl font-semibold text-foreground">Nueva contraseña</h1>
        <p class="text-sm text-muted-foreground">
          Crea una nueva contraseña segura con al menos 8 caracteres.
        </p>
      </div>

      <form onsubmit={handleSubmit} class="space-y-4" novalidate>
        <div class="space-y-1.5">
          <label for="password" class="text-sm font-medium leading-none">
            Nueva contraseña
          </label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autocomplete="new-password"
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

          {#if password.length > 0}
            <div class="space-y-1 pt-1">
              <div class="h-1 w-full rounded-full bg-border overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300 {strength.color} {strength.width}"
                ></div>
              </div>
              {#if strength.label}
                <p class="text-xs text-muted-foreground">{strength.label}</p>
              {/if}
            </div>
          {/if}

          {#if fieldErrors.password}
            <p class="text-xs text-destructive" role="alert">{fieldErrors.password}</p>
          {/if}
        </div>

        <div class="space-y-1.5">
          <label for="confirm" class="text-sm font-medium leading-none">
            Confirmar contraseña
          </label>
          <div class="relative">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              autocomplete="new-password"
              bind:value={confirm}
              placeholder="••••••••"
              disabled={formState === 'loading'}
              class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onclick={() => (showConfirm = !showConfirm)}
              class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {#if showConfirm}
                <EyeOff class="h-4 w-4" />
              {:else}
                <Eye class="h-4 w-4" />
              {/if}
            </button>
          </div>

          {#if fieldErrors.confirm}
            <p class="text-xs text-destructive" role="alert">{fieldErrors.confirm}</p>
          {/if}
        </div>

        <button
          type="submit"
          disabled={formState === 'loading'}
          class="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {#if formState === 'loading'}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          {:else}
            Guardar nueva contraseña
          {/if}
        </button>
      </form>
    {:else}
      <div class="flex flex-col items-center text-center space-y-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 class="h-7 w-7 text-primary" />
        </div>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-foreground">Contraseña actualizada</h1>
          <p class="text-sm text-muted-foreground">
            Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <a
          href="/login"
          class="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
        >
          Ir al inicio de sesión
        </a>
      </div>
    {/if}
  </div>

  <p class="text-center text-xs text-muted-foreground">
    Farmacia Parroquial San Martín de Porres — San Félix, Estado Bolívar
  </p>
</div>
