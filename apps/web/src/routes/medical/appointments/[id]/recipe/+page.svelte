<script lang="ts">
  import { ArrowLeft, Printer } from 'lucide-svelte';

  const RECIPE_DATA = {
    numero: 'REC-2025-0042',
    fecha: '2025-06-01',
    paciente: {
      nombre: 'Ana Sofía Ramírez Torres',
      cedula: 'V-12.345.678',
      fechaNac: '15/03/1985',
    },
    medico: {
      nombre: 'Dra. Carmen García',
      especialidad: 'Medicina General',
      mpps: '89.456',
    },
    diagnostico:
      'Infección respiratoria alta. Faringoamigdalitis bacteriana aguda. Se indica tratamiento antibiótico por 7 días y reposo relativo.',
    indicaciones:
      '1. Amoxicilina 500mg: 1 cápsula cada 8 horas por 7 días.\n2. Loratadina 10mg: 1 tableta cada 24 horas por 5 días.\n3. Reposo relativo. Abundante líquido.\n4. Control en 7 días o antes si persisten síntomas.',
    medicamentos: [
      { nombre: 'Amoxicilina 500mg', presentacion: 'Cápsulas x 21', cantidad: 21, precioUnit: 2.5 },
      { nombre: 'Loratadina 10mg', presentacion: 'Tabletas x 5', cantidad: 5, precioUnit: 1.2 },
    ],
  };

  function formatFecha(iso: string): string {
    const [y, m, d] = iso.split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    return `${d} de ${meses[parseInt(m) - 1]} de ${y}`;
  }

  const total = RECIPE_DATA.medicamentos.reduce(
    (s, med) => s + med.cantidad * med.precioUnit,
    0,
  );
</script>

<svelte:head>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
      .recipe-page {
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 32px 40px !important;
      }
    }
    @page { size: A4; margin: 0; }
  </style>
</svelte:head>

{#snippet sectionTitle(text: string)}
  <p class="text-[10px] font-bold text-[#1BBB99] uppercase tracking-[0.15em] border-b border-[#F3F4F6] pb-1">{text}</p>
{/snippet}

{#snippet field(label: string, value: string, mono = false)}
  <div>
    <p class="text-[10px] text-[#6B7280] mb-0.5">{label}</p>
    <p class={['text-[13px] font-semibold text-[#2D2F3B]', mono ? 'font-mono' : ''].join(' ')}>{value}</p>
  </div>
{/snippet}

<!-- Screen toolbar -->
<div class="no-print sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
  <a
    href="/medical/appointments/c1"
    class="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
  >
    <ArrowLeft size={18} />
  </a>
  <div class="flex-1 flex items-center gap-2">
    <span class="text-base font-semibold">Récipe médico</span>
    <span class="text-xs text-gray-500">{RECIPE_DATA.numero}</span>
  </div>
  <button
    onclick={() => window.print()}
    class="bg-primary text-white px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5"
  >
    <Printer size={15} />
    Imprimir / Guardar PDF
  </button>
</div>

<!-- Screen preview area -->
<div class="no-print bg-gray-100 min-h-screen py-8 px-4 flex justify-center">
  <div
    class="recipe-page bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg rounded-lg p-10 font-sans relative overflow-hidden"
    style="font-size: 13px; color: #2D2F3B;"
  >
    <!-- Background watermark -->
    <div
      class="absolute top-24 right-8 w-28 h-28 rounded-full border-[3px] border-[#1BBB99] flex items-center justify-center opacity-[0.08] rotate-[-25deg] pointer-events-none select-none"
      aria-hidden="true"
    >
      <span class="text-[10px] font-bold uppercase text-center leading-tight text-[#1BBB99]">
        Dispensado Farmacia San Martín
      </span>
    </div>

    <!-- Header -->
    <div class="flex items-start justify-between pb-4 mb-6 border-b-2 border-[#1BBB99]">
      <div>
        <p class="text-2xl font-bold text-[#1BBB99]">Sanmart</p>
        <p class="text-[10px] text-[#6B7280] tracking-[0.2em] uppercase mt-0.5">Gestión Farmacia</p>
        <p class="text-[11px] text-[#6B7280] mt-2 leading-relaxed">
          Farmacia Parroquial San Martín de Porres<br />San Félix, Estado Bolívar, Venezuela
        </p>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold text-[#2D2F3B]">RÉCIPE MÉDICO</p>
        <p class="text-[11px] text-[#6B7280] mt-0.5">N.º {RECIPE_DATA.numero}</p>
        <p class="text-[11px] text-[#6B7280] mt-2">Fecha: {formatFecha(RECIPE_DATA.fecha)}</p>
      </div>
    </div>

    <!-- Paciente -->
    <section class="mb-5">
      {@render sectionTitle('Datos del paciente')}
      <div class="grid grid-cols-3 gap-4 mt-2">
        {@render field('Nombre completo', RECIPE_DATA.paciente.nombre)}
        {@render field('Cédula de identidad', RECIPE_DATA.paciente.cedula, true)}
        {@render field('Fecha de nacimiento', RECIPE_DATA.paciente.fechaNac)}
      </div>
    </section>

    <hr class="my-4 border-[#E5E7EB]" />

    <!-- Médico -->
    <section class="mb-5">
      {@render sectionTitle('Médico tratante')}
      <div class="grid grid-cols-3 gap-4 mt-2">
        {@render field('Nombre', RECIPE_DATA.medico.nombre)}
        {@render field('Especialidad', RECIPE_DATA.medico.especialidad)}
        {@render field('MPPS', RECIPE_DATA.medico.mpps, true)}
      </div>
    </section>

    <hr class="my-4 border-[#E5E7EB]" />

    <!-- Diagnóstico -->
    <section class="mb-5">
      {@render sectionTitle('Diagnóstico')}
      <div class="mt-2 bg-[#F3F4F6] rounded-md p-3 text-[13px] leading-relaxed">
        {RECIPE_DATA.diagnostico}
      </div>
    </section>

    <!-- Indicaciones -->
    {#if RECIPE_DATA.indicaciones}
      <section class="mb-5">
        {@render sectionTitle('Indicaciones y tratamiento')}
        <div class="mt-2 bg-[#F3F4F6] rounded-md p-3 text-[13px] leading-relaxed whitespace-pre-line">
          {RECIPE_DATA.indicaciones}
        </div>
      </section>
    {/if}

    <!-- Medicamentos -->
    <section class="mb-6">
      {@render sectionTitle('Medicamentos dispensados')}
      <table class="w-full mt-2 border-collapse text-[12px]">
        <thead>
          <tr class="bg-[#1BBB99] text-white">
            <th class="text-left px-3 py-2 rounded-tl">Medicamento</th>
            <th class="text-center px-3 py-2 w-16">Cant.</th>
            <th class="text-right px-3 py-2 w-20">P. Unit.</th>
            <th class="text-right px-3 py-2 w-24 rounded-tr">Total</th>
          </tr>
        </thead>
        <tbody>
          {#each RECIPE_DATA.medicamentos as med, i (med.nombre)}
            <tr class={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
              <td class="px-3 py-2">
                <span class="font-semibold">{med.nombre}</span>
                <span class="text-[10px] text-[#6B7280] ml-1">({med.presentacion})</span>
              </td>
              <td class="px-3 py-2 text-center">{med.cantidad}</td>
              <td class="px-3 py-2 text-right">${med.precioUnit.toFixed(2)}</td>
              <td class="px-3 py-2 text-right">${(med.cantidad * med.precioUnit).toFixed(2)}</td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr>
            <td colspan={3} class="px-3 py-2 text-right text-[11px] text-[#6B7280]">Total referencial</td>
            <td class="px-3 py-2 text-right text-base font-bold text-[#1BBB99]">${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <!-- Firma -->
    <div class="flex justify-end mt-8">
      <div class="w-44 text-center">
        <div class="h-10 border-b border-[#2D2F3B] mb-1"></div>
        <p class="text-[12px] font-semibold text-[#2D2F3B]">{RECIPE_DATA.medico.nombre}</p>
        <p class="text-[11px] text-[#6B7280]">{RECIPE_DATA.medico.especialidad}</p>
        <p class="text-[11px] text-[#6B7280]">MPPS {RECIPE_DATA.medico.mpps}</p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="absolute bottom-6 left-10 right-10 flex justify-between border-t border-[#E5E7EB] pt-2">
      <span class="text-[10px] text-[#6B7280]">
        Farmacia Parroquial San Martín de Porres · San Félix, Estado Bolívar
      </span>
      <span class="text-[10px] text-[#6B7280]">
        Generado por Sanmart · {formatFecha(RECIPE_DATA.fecha)}
      </span>
    </footer>
  </div>
</div>

<!-- Print-only area -->
<div class="hidden print:block">
  <div
    class="recipe-page bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg rounded-lg p-10 font-sans relative overflow-hidden"
    style="font-size: 13px; color: #2D2F3B;"
  >
    <!-- Background watermark -->
    <div
      class="absolute top-24 right-8 w-28 h-28 rounded-full border-[3px] border-[#1BBB99] flex items-center justify-center opacity-[0.08] rotate-[-25deg] pointer-events-none select-none"
      aria-hidden="true"
    >
      <span class="text-[10px] font-bold uppercase text-center leading-tight text-[#1BBB99]">
        Dispensado Farmacia San Martín
      </span>
    </div>

    <!-- Header -->
    <div class="flex items-start justify-between pb-4 mb-6 border-b-2 border-[#1BBB99]">
      <div>
        <p class="text-2xl font-bold text-[#1BBB99]">Sanmart</p>
        <p class="text-[10px] text-[#6B7280] tracking-[0.2em] uppercase mt-0.5">Gestión Farmacia</p>
        <p class="text-[11px] text-[#6B7280] mt-2 leading-relaxed">
          Farmacia Parroquial San Martín de Porres<br />San Félix, Estado Bolívar, Venezuela
        </p>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold text-[#2D2F3B]">RÉCIPE MÉDICO</p>
        <p class="text-[11px] text-[#6B7280] mt-0.5">N.º {RECIPE_DATA.numero}</p>
        <p class="text-[11px] text-[#6B7280] mt-2">Fecha: {formatFecha(RECIPE_DATA.fecha)}</p>
      </div>
    </div>

    <!-- Paciente -->
    <section class="mb-5">
      {@render sectionTitle('Datos del paciente')}
      <div class="grid grid-cols-3 gap-4 mt-2">
        {@render field('Nombre completo', RECIPE_DATA.paciente.nombre)}
        {@render field('Cédula de identidad', RECIPE_DATA.paciente.cedula, true)}
        {@render field('Fecha de nacimiento', RECIPE_DATA.paciente.fechaNac)}
      </div>
    </section>

    <hr class="my-4 border-[#E5E7EB]" />

    <!-- Médico -->
    <section class="mb-5">
      {@render sectionTitle('Médico tratante')}
      <div class="grid grid-cols-3 gap-4 mt-2">
        {@render field('Nombre', RECIPE_DATA.medico.nombre)}
        {@render field('Especialidad', RECIPE_DATA.medico.especialidad)}
        {@render field('MPPS', RECIPE_DATA.medico.mpps, true)}
      </div>
    </section>

    <hr class="my-4 border-[#E5E7EB]" />

    <!-- Diagnóstico -->
    <section class="mb-5">
      {@render sectionTitle('Diagnóstico')}
      <div class="mt-2 bg-[#F3F4F6] rounded-md p-3 text-[13px] leading-relaxed">
        {RECIPE_DATA.diagnostico}
      </div>
    </section>

    <!-- Indicaciones -->
    {#if RECIPE_DATA.indicaciones}
      <section class="mb-5">
        {@render sectionTitle('Indicaciones y tratamiento')}
        <div class="mt-2 bg-[#F3F4F6] rounded-md p-3 text-[13px] leading-relaxed whitespace-pre-line">
          {RECIPE_DATA.indicaciones}
        </div>
      </section>
    {/if}

    <!-- Medicamentos -->
    <section class="mb-6">
      {@render sectionTitle('Medicamentos dispensados')}
      <table class="w-full mt-2 border-collapse text-[12px]">
        <thead>
          <tr class="bg-[#1BBB99] text-white">
            <th class="text-left px-3 py-2 rounded-tl">Medicamento</th>
            <th class="text-center px-3 py-2 w-16">Cant.</th>
            <th class="text-right px-3 py-2 w-20">P. Unit.</th>
            <th class="text-right px-3 py-2 w-24 rounded-tr">Total</th>
          </tr>
        </thead>
        <tbody>
          {#each RECIPE_DATA.medicamentos as med, i (med.nombre)}
            <tr class={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
              <td class="px-3 py-2">
                <span class="font-semibold">{med.nombre}</span>
                <span class="text-[10px] text-[#6B7280] ml-1">({med.presentacion})</span>
              </td>
              <td class="px-3 py-2 text-center">{med.cantidad}</td>
              <td class="px-3 py-2 text-right">${med.precioUnit.toFixed(2)}</td>
              <td class="px-3 py-2 text-right">${(med.cantidad * med.precioUnit).toFixed(2)}</td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr>
            <td colspan={3} class="px-3 py-2 text-right text-[11px] text-[#6B7280]">Total referencial</td>
            <td class="px-3 py-2 text-right text-base font-bold text-[#1BBB99]">${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <!-- Firma -->
    <div class="flex justify-end mt-8">
      <div class="w-44 text-center">
        <div class="h-10 border-b border-[#2D2F3B] mb-1"></div>
        <p class="text-[12px] font-semibold text-[#2D2F3B]">{RECIPE_DATA.medico.nombre}</p>
        <p class="text-[11px] text-[#6B7280]">{RECIPE_DATA.medico.especialidad}</p>
        <p class="text-[11px] text-[#6B7280]">MPPS {RECIPE_DATA.medico.mpps}</p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="absolute bottom-6 left-10 right-10 flex justify-between border-t border-[#E5E7EB] pt-2">
      <span class="text-[10px] text-[#6B7280]">
        Farmacia Parroquial San Martín de Porres · San Félix, Estado Bolívar
      </span>
      <span class="text-[10px] text-[#6B7280]">
        Generado por Sanmart · {formatFecha(RECIPE_DATA.fecha)}
      </span>
    </footer>
  </div>
</div>
