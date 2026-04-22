import { Document, Page, View, Text, StyleSheet, renderToBuffer, Svg, Path, G } from "@react-pdf/renderer";
import sanitizeHtml from "sanitize-html";

export type RecipePdfData = {
  numero: string;
  fecha: Date;
  paciente: {
    nombre: string;
    cedula: string;
    fechaNac: Date;
  };
  medico: {
    nombre: string;
  };
  diagnostico?: string;
  indicaciones: string;
  medicamentos: Array<{
    nombre: string;
    presentacion?: string;
    cantidad: number;
    precioUnit: number;
  }>;
  sistemaNombre: string;
};

const C = {
  teal: "#1BBB99",
  dark: "#2D2F3B",
  gray: "#6B7280",
  bgGray: "#F3F4F6",
  border: "#E5E7EB",
  white: "#FFFFFF",
  rowAlt: "#F9FAFB",
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateLong(date: Date): string {
  return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatDateShort(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

export function htmlToPlainText(html: string): string {
  return sanitizeHtml(
    html
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n"),
    { allowedTags: [], allowedAttributes: {} },
  ).trim();
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: C.dark,
    paddingTop: 40,
    paddingBottom: 70,
    paddingHorizontal: 40,
  },
  // ── Watermark ──────────────────────────────────────────────────
  stamp: {
    position: "absolute",
    top: 70,
    right: 28,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: C.teal,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.08,
  },
  stampText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    textAlign: "center",
  },
  // ── Header ─────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.teal,
  },
  brandAddress: {
    fontSize: 9,
    color: C.gray,
    marginTop: 8,
    lineHeight: 1.6,
  },
  docTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  docMeta: {
    fontSize: 9,
    color: C.gray,
    textAlign: "right",
    marginTop: 3,
  },
  // ── Sections ───────────────────────────────────────────────────
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    textTransform: "uppercase",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingBottom: 3,
    marginBottom: 8,
  },
  separator: {
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    marginVertical: 10,
  },
  // ── Grid ───────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
    paddingRight: 12,
  },
  fieldLabel: {
    fontSize: 8,
    color: C.gray,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  fieldValueMono: {
    fontSize: 11,
    fontFamily: "Courier-Bold",
  },
  // ── Boxes ──────────────────────────────────────────────────────
  box: {
    backgroundColor: C.bgGray,
    borderRadius: 4,
    padding: 10,
    lineHeight: 1.6,
  },
  // ── Table ──────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.teal,
  },
  thCell: {
    padding: 7,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  tableRow: {
    flexDirection: "row",
  },
  tdCell: {
    padding: 7,
    fontSize: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  colName: { flex: 1 },
  colQty: { width: 46, textAlign: "center" },
  colUnit: { width: 58, textAlign: "right" },
  colTotal: { width: 66, textAlign: "right" },
  subText: {
    fontSize: 9,
    color: C.gray,
    marginTop: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
    paddingRight: 7,
  },
  totalLabel: {
    fontSize: 9,
    color: C.gray,
    width: 120,
    textAlign: "right",
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    width: 66,
    textAlign: "right",
  },
  // ── Signature ──────────────────────────────────────────────────
  signatureArea: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 28,
  },
  signatureBox: {
    width: 160,
    alignItems: "center",
  },
  signatureSpace: { height: 36 },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: C.dark,
    width: "100%",
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  signatureRole: {
    fontSize: 9,
    color: C.gray,
    textAlign: "center",
  },
  // ── Footer ─────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: C.gray,
  },
});

// ── Sanmart logo (SVG primitives from logo-idea.svg) ─────────────────────────
// viewBox crops to the actual glyph bounds in the 1024×768 canvas
// (S left≈122, t-dot right≈902, letter top≈316, letter bottom≈452)

function SanmartLogo({ width = 180 }: { width?: number }) {
  const height = Math.round(width * 155 / 820);
  const DARK = C.dark;
  const TEAL = C.teal;
  return (
    <Svg width={width} height={height} viewBox="100 305 820 155">
      <G transform="matrix(1.8952,0,0,1.8952,512,384)">
        {/* S */}
        <G transform="matrix(1.3889,0,0,1.3889,-181.2371,0)">
          <Path fill={DARK} transform="translate(-99.8239,-97.0454)"
            d="M 117.7556 106.427 C 117.7556 117.9754 108.6716 123.3399 98.9548 123.3399 C 89.238 123.3399 81.8923 117.7242 81.8923 117.7242 L 87.301 107.2853 C 90.5905 110.7259 95.9567 112.3567 98.9548 112.3567 C 101.9548 112.3567 104.4919 110.0375 104.4919 107.6166 C 104.4919 98.829 83.8884 104.3799 83.8884 87.1359 C 83.8884 76.0829 91.8044 70.7509 100.6931 70.7509 C 109.2614 70.7509 115.759 74.781 115.759 74.781 L 110.7375 84.8901 C 110.7375 84.8901 106.5368 81.5202 102.6247 81.5202 C 99.7068 81.5202 97.0881 82.6031 97.0881 85.8146 C 97.0881 93.2787 117.7551 88.4745 117.7556 106.427 Z"
          />
        </G>
        {/* a */}
        <G transform="matrix(1.3889,0,0,1.3889,-123.5813,11.3121)">
          <Path fill={DARK} transform="translate(-99.2163,-105.141)"
            d="M 106.6995 88.0302 L 118.4841 88.0302 L 118.4841 121.9955 L 106.6995 121.9955 L 106.6995 119.0576 C 103.8719 121.6664 100.2363 123.2362 96.2702 123.2362 C 87.2557 123.2362 79.9484 115.1348 79.9484 105.141 C 79.9484 95.1473 87.2557 87.0458 96.2702 87.0458 C 100.2363 87.0458 103.8719 88.6164 106.6995 91.2237 L 106.6995 88.0302 Z M 106.6995 105.141 C 106.6995 100.8401 103.645 97.3528 99.5205 97.3528 C 95.3959 97.3528 92.0527 100.8401 92.0527 105.141 C 92.0527 109.4427 95.3959 112.93 99.5205 112.93 C 103.645 112.93 106.6995 109.4419 106.6995 105.141 Z"
          />
        </G>
        {/* n */}
        <G transform="matrix(1.3889,0,0,1.3889,-62.2536,10.621)">
          <Path fill={DARK} transform="translate(-100.1723,-104.6867)"
            d="M 117.5881 99.8803 L 117.5881 121.9963 L 105.8044 121.9963 L 105.8044 104.2972 C 105.8044 98.8383 103.9128 96.8905 100.5271 96.8905 C 95.6247 96.8905 94.5407 100.7709 94.5407 103.5605 L 94.5407 121.9955 L 82.7566 121.9955 L 82.7566 88.1029 L 94.5407 88.1029 L 94.5407 92.2361 C 94.5407 92.2361 97.4138 87.3771 104.9694 87.3771 C 111.696 87.3771 117.5881 91.2128 117.5881 99.8803 Z"
          />
        </G>
        {/* m */}
        <G transform="matrix(1.3889,0,0,1.3889,10.5672,10.621)">
          <Path fill={DARK} transform="translate(-100.1514,-104.6867)"
            d="M 128.0942 99.8803 L 128.0942 121.9963 L 116.3102 121.9963 L 116.3102 104.2972 C 116.3102 98.8383 114.4186 96.8905 111.0329 96.8905 C 108.3227 96.8905 106.9956 98.7138 106.3469 100.8141 L 106.3469 121.9963 L 94.5622 121.9963 L 94.5622 104.2972 C 94.5622 98.8383 92.6706 96.8905 89.2849 96.8905 C 84.3835 96.8905 83.9924 100.7709 83.9924 103.5605 L 83.9924 121.9955 L 72.2087 121.9955 L 72.2087 88.1029 L 83.9924 88.1029 L 83.9924 92.2361 C 83.9924 92.2361 86.1728 87.3771 93.7277 87.3771 C 98.8791 87.3771 103.53 89.6366 105.4316 94.5828 C 106.6176 92.2275 109.7536 87.3771 115.4758 87.3771 C 122.2033 87.3771 128.0949 91.2128 128.0942 99.8803 Z"
          />
        </G>
        {/* a (second) */}
        <G transform="matrix(1.3889,0,0,1.3889,83.9187,11.3121)">
          <Path fill={DARK} transform="translate(-99.2163,-105.141)"
            d="M 106.6995 88.0302 L 118.4841 88.0302 L 118.4841 121.9955 L 106.6995 121.9955 L 106.6995 119.0576 C 103.8719 121.6664 100.2363 123.2362 96.2702 123.2362 C 87.2557 123.2362 79.9484 115.1348 79.9484 105.141 C 79.9484 95.1473 87.2557 87.0458 96.2702 87.0458 C 100.2363 87.0458 103.8719 88.6164 106.6995 91.2237 L 106.6995 88.0302 Z M 106.6995 105.141 C 106.6995 100.8401 103.645 97.3528 99.5205 97.3528 C 95.3959 97.3528 92.0527 100.8401 92.0527 105.141 C 92.0527 109.4427 95.3959 112.93 99.5205 112.93 C 103.645 112.93 106.6995 109.4419 106.6995 105.141 Z"
          />
        </G>
        {/* r — stem + teal dot */}
        <G transform="matrix(1.3889,0,0,1.3889,139.9754,11.1269)">
          <G transform="matrix(1,0,0,1,-7.7288,0.0072)">
            <Path fill={DARK} transform="translate(-93.4726,-105.0496)"
              d="M 87.5808 121.9963 L 87.5808 88.1029 L 99.3645 88.1029 L 99.3645 121.9963 L 87.5808 121.9963 Z"
            />
          </G>
          <G transform="matrix(1,0,0,1,7.0908,-10.2148)">
            <Path fill={TEAL} transform="translate(-108.2922,-94.8276)"
              d="M 101.7624 94.8276 C 101.7624 91.1064 104.6857 88.0885 108.2927 88.0885 C 111.8986 88.0885 114.822 91.1064 114.822 94.8276 C 114.822 98.5496 111.8986 101.5667 108.2927 101.5667 C 104.6857 101.5667 101.7624 98.5496 101.7624 94.8276 Z"
            />
          </G>
        </G>
        {/* t — stroke + teal dot */}
        <G transform="matrix(1.3889,0,0,1.3889,184.75,4.9541)">
          <G transform="matrix(1,0,0,1,-4.679,0)">
            <Path fill={DARK} transform="translate(-95.6401,-100.5906)"
              d="M 106.3635 113.4736 L 106.3635 123.252 C 99.4641 123.252 88.635 121.7968 88.635 109.9986 L 88.635 98.4942 L 84.9167 98.4942 L 84.9167 88.1029 L 88.635 88.1029 L 88.635 77.9291 L 100.4187 77.9291 L 100.4187 107.9313 C 100.4187 109.9504 101.5139 113.4736 106.3635 113.4736 Z"
            />
          </G>
          <G transform="matrix(1,0,0,1,8.8726,-5.7629)">
            <Path fill={TEAL} transform="translate(-109.1916,-94.8276)"
              d="M 102.6618 94.8276 C 102.6618 91.1064 105.5852 88.0885 109.1921 88.0885 C 112.7981 88.0885 115.7214 91.1064 115.7214 94.8276 C 115.7214 98.5496 112.7981 101.5667 109.1921 101.5667 C 105.5852 101.5667 102.6618 98.5496 102.6618 94.8276 Z"
            />
          </G>
        </G>
      </G>
    </Svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={s.col}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={mono ? s.fieldValueMono : s.fieldValue}>{value}</Text>
    </View>
  );
}

// ── Main document ─────────────────────────────────────────────────────────────

function RecipePdfDocument({ data }: { data: RecipePdfData }) {
  const total = data.medicamentos.reduce((acc, m) => acc + m.cantidad * m.precioUnit, 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Watermark stamp */}
        <View style={s.stamp}>
          <Text style={s.stampText}>{"Dispensado\nFarmacia\nSan Martín"}</Text>
        </View>

        {/* Header */}
        <View style={s.header}>
          <View>
            <SanmartLogo width={170} />
            <Text style={s.brandAddress}>
              {"Farmacia Parroquial San Martín de Porres\nSan Félix, Estado Bolívar, Venezuela"}
            </Text>
          </View>
          <View>
            <Text style={s.docTitle}>RÉCIPE MÉDICO</Text>
            <Text style={s.docMeta}>N.º {data.numero}</Text>
            <Text style={[s.docMeta, { marginTop: 6 }]}>Fecha: {formatDateLong(data.fecha)}</Text>
          </View>
        </View>

        {/* Paciente */}
        <View style={s.section}>
          <SectionTitle>Datos del paciente</SectionTitle>
          <View style={s.row}>
            <Field label="Nombre completo" value={data.paciente.nombre} />
            <Field label="Cédula de identidad" value={data.paciente.cedula} mono />
            <Field label="Fecha de nacimiento" value={formatDateShort(data.paciente.fechaNac)} />
          </View>
        </View>

        <View style={s.separator} />

        {/* Médico */}
        <View style={s.section}>
          <SectionTitle>Médico tratante</SectionTitle>
          <View style={s.row}>
            <Field label="Nombre" value={data.medico.nombre} />
          </View>
        </View>

        <View style={s.separator} />

        {/* Diagnóstico */}
        {data.diagnostico ? (
          <View style={s.section}>
            <SectionTitle>Diagnóstico</SectionTitle>
            <View style={s.box}>
              <Text>{data.diagnostico}</Text>
            </View>
          </View>
        ) : null}

        {/* Indicaciones */}
        <View style={s.section}>
          <SectionTitle>Indicaciones y tratamiento</SectionTitle>
          <View style={s.box}>
            <Text>{data.indicaciones}</Text>
          </View>
        </View>

        {/* Medicamentos dispensados */}
        {data.medicamentos.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Medicamentos dispensados</SectionTitle>
            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={[s.thCell, s.colName]}>Medicamento</Text>
              <Text style={[s.thCell, s.colQty]}>Cant.</Text>
              <Text style={[s.thCell, s.colUnit]}>P. Unit.</Text>
              <Text style={[s.thCell, s.colTotal]}>Total</Text>
            </View>
            {/* Rows */}
            {data.medicamentos.map((med, i) => (
              <View
                key={i}
                style={[s.tableRow, { backgroundColor: i % 2 !== 0 ? C.rowAlt : C.white }]}
              >
                <View style={[s.tdCell, s.colName]}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{med.nombre}</Text>
                  {med.presentacion && <Text style={s.subText}>{med.presentacion}</Text>}
                </View>
                <Text style={[s.tdCell, s.colQty]}>{med.cantidad}</Text>
                <Text style={[s.tdCell, s.colUnit]}>${med.precioUnit.toFixed(2)}</Text>
                <Text style={[s.tdCell, s.colTotal]}>
                  ${(med.cantidad * med.precioUnit).toFixed(2)}
                </Text>
              </View>
            ))}
            {/* Total */}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total referencial</Text>
              <Text style={s.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Firma */}
        <View style={s.signatureArea}>
          <View style={s.signatureBox}>
            <View style={s.signatureSpace} />
            <View style={s.signatureLine} />
            <Text style={s.signatureName}>{data.medico.nombre}</Text>
            <Text style={s.signatureRole}>Médico tratante</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Farmacia Parroquial San Martín de Porres · San Félix, Estado Bolívar
          </Text>
          <Text style={s.footerText}>
            Generado por {data.sistemaNombre} · {formatDateLong(data.fecha)}
          </Text>
        </View>

      </Page>
    </Document>
  );
}

// ── Render ────────────────────────────────────────────────────────────────────

export async function renderRecipePdf(data: RecipePdfData): Promise<Uint8Array> {
  return renderToBuffer(<RecipePdfDocument data={data} />);
}
