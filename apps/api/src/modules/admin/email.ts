import { Renderer } from "better-svelte-email";
import nodemailer from "nodemailer";
import { env } from "../../config";

function WelcomeEmailTemplate(
  $payload: { push: (html: string) => void },
  $props: { nombre: string; email: string; password: string },
) {
  const { nombre, email, password } = $props;
  $payload.push(`
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1a1a1a;">Bienvenido a Sanmart, ${nombre}</h1>
        <p>Se ha creado una cuenta para usted en el sistema de gestión farmacéutica.</p>
        <p>Sus credenciales de acceso son:</p>
        <ul>
          <li><strong>Correo electrónico:</strong> ${email}</li>
          <li><strong>Contraseña temporal:</strong> ${password}</li>
        </ul>
        <p>Por favor, cambie su contraseña al ingresar por primera vez.</p>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          Farmacia Parroquia San Martín de Porres — San Félix, Estado Bolívar
        </p>
      </body>
    </html>
  `);
}

const renderer = new Renderer();

export async function sendWelcomeEmail(props: {
  nombre: string;
  email: string;
  password: string;
}): Promise<void> {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return;

  const html = await renderer.render(WelcomeEmailTemplate, { props });

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
  });

  await transport.sendMail({
    from: `Sanmart <${env.GMAIL_USER}>`,
    to: props.email,
    subject: "Bienvenido a Sanmart — Sus credenciales de acceso",
    html,
  });
}
