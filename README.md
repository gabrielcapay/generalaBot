# 🎲 Generala Bot para Discord

Bot para jugar a la Generala en Discord. Soporta partidas de 2 a 4 jugadores con múltiples partidas simultáneas en diferentes canales.

---

## Requisitos

- Node.js v18 o superior
- Una cuenta de Discord
- 5 minutos para configurar

---

## Configuración paso a paso

### 1. Crear el bot en Discord

1. Entrar a https://discord.com/developers/applications
2. Clic en **New Application** → ponerle un nombre (ej: "Generala Bot")
3. Ir a la pestaña **Bot** → clic en **Reset Token** → copiar el token
4. En la misma pestaña, activar:
   - ✅ `Public Bot` (para poder invitarlo a servidores)
5. Ir a **OAuth2** → copiar el **Client ID**

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus datos:

```env
DISCORD_TOKEN=tu_token_aqui
CLIENT_ID=tu_client_id_aqui
GUILD_ID=id_de_tu_servidor   # opcional, para tests
```

Para obtener el ID de tu servidor: clic derecho en el servidor en Discord → "Copiar ID del servidor" (necesitás activar Modo Desarrollador en Ajustes → Avanzado).

### 4. Registrar los comandos

```bash
npm run deploy
```

Esto registra el comando `/generala` en Discord. Solo hay que hacerlo una vez (o cuando agregues nuevos comandos).

### 5. Invitar el bot a tu servidor

Ir a **OAuth2 → URL Generator** en el portal de desarrolladores:
- Scopes: `bot`, `applications.commands`
- Permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`

Copiar la URL generada y abrirla en el navegador para invitar el bot.

### 6. Arrancar el bot

```bash
# Producción
npm start

# Desarrollo (reinicia automáticamente al guardar)
npm run dev
```

---

## Cómo jugar

| Comando | Descripción |
|---|---|
| `/generala crear` | Crear una partida en el canal actual |
| `/generala unirse` | Sumarse a la partida |
| `/generala iniciar` | Iniciar (solo el creador, mínimo 2 jugadores) |
| `/generala tirar` | Tirar los dados en tu turno |
| `/generala planillas` | Ver el estado de todas las planillas |
| `/generala abandonar` | Cancelar la partida (solo el creador) |

### Flujo de un turno

1. El bot muestra los 5 dados
2. Hacés clic en los dados que querés **guardar** (se ponen verdes)
3. Clic en **🎲 Tirar de nuevo** (hasta 2 veces más)
4. Clic en **📝 Anotar combinación** → elegís del menú

### Combinaciones

| Combinación | Puntos |
|---|---|
| Unos / Doses / … / Seises | Suma de esos dados |
| Escalera (1-2-3-4-5 o 2-3-4-5-6) | 20 |
| Full (par + trío) | 30 |
| Póker (cuatro iguales) | 40 |
| Generala (cinco iguales) | 50 |
| Generala servida (primera tirada) | 100 |

---

## Estructura del proyecto

```
generala-bot/
├── src/
│   ├── index.js              ← Punto de entrada
│   ├── deploy-commands.js    ← Script de registro
│   ├── commands/
│   │   ├── index.js          ← Definición de comandos slash
│   │   └── handlers.js       ← Lógica de cada comando
│   ├── game/
│   │   ├── engine.js         ← Motor del juego (dados, puntuación)
│   │   └── session.js        ← Gestor de partidas activas
│   └── utils/
│       └── embeds.js         ← Constructores de embeds y botones
├── .env.example
├── package.json
└── README.md
```

---

## Deploy en producción (Railway)

1. Crear cuenta en https://railway.app
2. **New Project → Deploy from GitHub repo**
3. Agregar las variables de entorno en el panel de Railway
4. El bot queda corriendo 24/7

---

## Ideas para expandir

- 💾 **Base de datos** con `better-sqlite3` para ranking histórico
- 🏆 **Sistema de ELO** entre jugadores
- ⏱️ **Tiempo límite por turno** con recordatorios
- 🎨 **Imágenes de dados** en vez de emojis unicode
- 🌍 **Generala doble** (variante con 50 jugadas)
