// டெமோ முறை: Vercel-இல் DATABASE_URL இல்லாவிட்டால் (அல்லது DEMO_MODE=1) தானாக இயங்கும்.
// தரவு /tmp-இல் தற்காலிகமாகச் சேமிக்கப்படும்; மாதிரிக் கடை தானாக நிரப்பப்படும்.
export const isDemo = () => process.env.DEMO_MODE === '1' || (!!process.env.VERCEL && !process.env.DATABASE_URL);
