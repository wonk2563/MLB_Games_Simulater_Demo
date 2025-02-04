// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    pineconeApiKey: process.env.PINECONE_API_KEY,
    pineconeIndex: process.env.PINECONE_INDEX_NAME,
    geminiApiKey: process.env.GOOGLE_API_KEY,
  },
  modules: ['@nuxt/ui'],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  // If you want to use https
  // devServer: {
  //   https: {
  //     key: './https/private.key.pem',
  //     cert: './https/certificate.pem',
  //   },
  //   host: '0.0.0.0',
  //   port: 3000,
  // }
})