import { MadeWithDyad } from "@/components/made-with-dyad";
import { CryptoForm } from "@/components/CryptoForm";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DecryptPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Argon2id + AES-256-GCM Hybrid Decryption System
      </h1>
      <CryptoForm defaultMode="decrypt" />
      <div className="mt-8 flex flex-col items-center space-y-4">
        <Link to="/">
          <Button variant="outline">Go to Encryption Page</Button>
        </Link>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default DecryptPage;