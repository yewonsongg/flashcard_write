onboarding:
1. Install NVM (https://github.com/coreybutler/nvm-windows/releases)
2. Use the project's Node version (defined in `.nvmrc`)
```
nvm install
nvm use
```
3. Check versions
`node -v` -> `22.x.x`
4. Install dependencies
`npm install` 
5. (DEV) Start the dev environment
`npm run dev`
6. (PROD) Build for production
```
npm run build
npm run start
```