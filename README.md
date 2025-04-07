# 🎰 lotto-$ron

Una aplicación de lotería descentralizada impulsada por blockchain y funciones serverless.  
Los usuarios pueden comprar tickets, ver su historial y participar en sorteos — todo gestionado con contratos inteligentes y tokens $ron.

---

![Vue 3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)
![Supabase](https://img.shields.io/badge/backend-supabase-3ecf8e)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

---

## 🚀 Funcionalidades

- 🎟️ Comprar tickets de lotería con cripto
- 👥 Ver jugadores y el historial de tickets
- 🧾 Contrato inteligente que generará y validará los números del sorteo
- ⚡ Backend serverless (vía Supabase) para verificación de pagos y distribución de tokens
- 🌑 Modo oscuro
- 🔓 Código completamente abierto y visible

---

## 🛠 Tecnologías

- **Frontend**: Vue 3 + Composition API + TailwindCSS
- **Backend**: Supabase (Functions, Postgres, Auth)
- **Contrato Inteligente**: Solidity (en fase de pruebas)
- **Blockchain**: Red compatible con EVM (como Sepolia o Hardhat local)

---

## 📂 Estructura del Proyecto

```
lotton-ronin/
├── .vscode/               # Configuración de VSCode
├── hardhat/               # Contrato inteligente y scripts
├── node_modules/
├── public/                # Archivos públicos
├── src/                   # Código fuente de Vue
├── supabase/              # Funciones serverless y config de Supabase
├── .env                   # Variables de entorno
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```

---

## 🔧 Primeros Pasos

### 1. Clona el repositorio

```bash
git clone https://github.com/hbiblia/lottoron-app.git
cd lottoron-app
```

### 2. Crea el archivo `.env`

```env
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
VITE_WALLET_KEY=wallet-destino-para-pagos
```

### 3. Instala las dependencias

```bash
npm install
```

### 4. Ejecuta la app localmente

```bash
npm run dev
```

---

## 🧪 Probar el Contrato Inteligente

### Requisitos:

- [Node.js](https://nodejs.org/)
- [Hardhat](https://hardhat.org/)

### Pasos:

```bash
cd hardhat
npm install
npx hardhat test
```

Puedes editar `test/LottoRon.js` para simular sorteos, asignar ganadores y probar la lógica de validación.

---

## ⚙️ Funciones Serverless (Supabase)

Actualmente se usan para:

- Verificar pagos
- Enviar automáticamente tokens `$ron`

Para desplegarlas:

```bash
cd supabase/functions/verify-payments
supabase functions deploy verify-payments

cd ../distribute-ron
supabase functions deploy distribute-ron
```

Ejemplo de uso desde Vue:

```ts
const { data, error } = await supabase.functions.invoke('verify-payments', {
  body: {
    ptxhass: result,
    wallet: walletAddress,
    ticket: ticketNumbers
  }
})
```

---

## ⚓ Contrato Inteligente (Próximamente)

Una vez finalizado, el contrato se encargará de:

- 🧶 Generar los números ganadores on-chain
- 📂 Almacenar y validar los tickets completamente en la blockchain
- 📊 Seleccionar automáticamente a los ganadores con transparencia

🧪 Actualmente en fase de pruebas.

---

## 🤝 Contribuir

Todo el código es abierto y transparente. Puedes:

- Hacer fork del repositorio
- Reportar errores o sugerencias
- Enviar pull requests
- ¡Y dejarnos una ⭐ en GitHub!

---

## 📜 Licencia

Licencia MIT

---

## 📢 Contacto

Creado con ❤️ por [@hbiblia](https://github.com/hbiblia)  
Discord: [@lottoron](https://discord.gg/xxemTpaM)