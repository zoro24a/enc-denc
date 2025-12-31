import { MadeWithDyad } from "@/components/made-with-dyad";
import { CryptoForm } from "@/components/CryptoForm";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Argon2id + AES-256-GCM Hybrid Encryption & Decryption System
      </h1>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        <div className="flex-1">
          <CryptoForm defaultMode="decrypt" />
        </div>
        <div className="flex-1">
          <CryptoForm defaultMode="encrypt" />
        </div>
      </div>
      <div className="mt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;