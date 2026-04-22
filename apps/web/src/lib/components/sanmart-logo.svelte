<script lang="ts">
  import logoRaw from '$lib/assets/logo.svg?raw';

  interface Props {
    variant?: 'dark' | 'light';
    size?: number;
    class?: string;
  }

  let {
    variant = 'light',
    size = 160,
    class: className = '',
  }: Props = $props();

  const ASPECT = 190 / 870;
  const h = $derived(Math.round(size * ASPECT));
  const svgHtml = $derived(
    logoRaw
      .replace(/viewBox="[^"]*"/, 'viewBox="85 285 870 190"')
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${h}"`)
      .replace(/fill: rgb\(45,47,59\)/g, variant === 'dark' ? 'fill: #ffffff' : 'fill: rgb(45,47,59)')
  );
</script>

{@html svgHtml}
