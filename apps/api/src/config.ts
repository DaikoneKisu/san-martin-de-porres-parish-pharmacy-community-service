import { cleanEnv, str, num, makeValidator } from "envalid";

const optionalStr = makeValidator((x) => x ?? "");
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

export const env = cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
  DATABASE_URL: str(),
  DATABASE_AUTH_TOKEN: str(),
  BETTER_AUTH_SECRET: str(),
  BETTER_AUTH_URL: str({ default: "" }),
  UPLOADTHING_TOKEN: str(),
  KNOWN_FINGERPRINTS: str(),
  FRONTEND_URL: str(),
  GMAIL_USER: str({ default: "" }),
  GMAIL_APP_PASSWORD: str({ default: "" }),
});

const CONFIG_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "config.json"
);

type DayOfWeek =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

type AppConfig = {
  agenda: {
    tiempo_entre_citas_minutos: number;
    hora_inicio: string;
    hora_fin: string;
    dias_habiles: DayOfWeek[];
  };
  contabilidad: {
    actualizar_tasa_cada_horas: number;
  };
  sistema: {
    nombre: string;
    version: string;
  };
};

export let appConfig: AppConfig = loadConfig();

function loadConfig(): AppConfig {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as AppConfig;
}

export function reloadConfig(): void {
  appConfig = loadConfig();
}
