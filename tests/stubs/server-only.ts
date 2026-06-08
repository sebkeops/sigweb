// Stub vide utilisé par vitest à la place du vrai paquet `server-only`,
// qui throw à l'import dès qu'on n'est pas dans un Server Component.
// La protection effective de prod (les imports `'server-only'` dans le
// code applicatif) reste assurée par Next.js à la build.
export {}
