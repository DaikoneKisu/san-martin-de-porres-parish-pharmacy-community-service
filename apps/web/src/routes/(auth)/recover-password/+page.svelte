<script lang="ts">
  import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-svelte';
  import SanmartLogo from '$lib/components/sanmart-logo.svelte';

  type FormState = 'idle' | 'loading' | 'error' | 'sent';

  let formState = $state<FormState>('idle');
  let sentEmail = $state('');
  let email = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!email) {
      formState = 'error';
      return;
    }
    formState = 'loading';
    await new Promise((resolve) => setTimeout(resolve, 900));
    sentEmail = email;
    formState = 'sent';
  }

  function handleResend() {
    email = '';
    formState = 'idle';
  }
</script>

<div class="w-full max-w-sm space-y-8">
  <div class="flex justify-center">
    <SanmartLogo size={180} />
  </div>

  <div class="rounded-xl border border-border bg-card shadow-sm px-6 py-8 space-y-6">
    {#if formState !== 'sent'}
      <div class="space-y-1">
        <a
          href="/login"
          class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft class="h-4 w-4" />
          Volver al inicio de sesión
        </a>
        <h1 class="text-xl font-semibold text-foreground">Recuperar contraseña</h1>
        <p class="text-sm text-muted-foreground">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {#if formState === 'error'}
        <div
          class="relative w-full rounded-lg border border-destructive/50 px-4 py-3 text-destructive flex items-start gap-3"
          role="alert"
        >
          <AlertCircle class="h-4 w-4 mt-0.5 shrink-0" />
          <p class="text-sm">
            No encontramos una cuenta asociada a ese correo electrónico.
          </p>
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

        <button
          type="submit"
          disabled={formState === 'loading'}
          class="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {#if formState === 'loading'}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          {:else}
            Enviar enlace de recuperación
          {/if}
        </button>
      </form>
    {:else}
      <div class="flex flex-col items-center text-center space-y-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail class="h-7 w-7 text-primary" />
        </div>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-foreground">Revisa tu correo</h1>
          <p class="text-sm text-muted-foreground">
            Enviamos un enlace a <span class="font-medium text-foreground">{sentEmail}</span>.
            El enlace expira en 30 minutos.
          </p>
        </div>
      </div>

      <div
        class="relative w-full rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-start gap-3"
      >
        <CheckCircle2 class="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p class="text-sm text-foreground">
          Si no ves el correo, revisa la carpeta de spam o solicita un nuevo enlace.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <button
          type="button"
          onclick={handleResend}
          class="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
        >
          Reenviar enlace
        </button>
        <a
          href="/login"
          class="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
        >
          Volver al inicio de sesión
        </a>
      </div>
    {/if}
  </div>

  <p class="text-center text-xs text-muted-foreground">
    Farmacia Parroquial San Martín de Porres — San Félix, Estado Bolívar
  </p>
</div>
