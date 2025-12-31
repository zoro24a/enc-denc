import { MadeWithDyad } from "@/components/made-with-dyad";
import { CryptoForm } from "@/components/CryptoForm";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Argon2id + AES-256-GCM Hybrid Encryption & Decryption System
      </h1>

      <Card className="w-full max-w-4xl mb-8 bg-yellow-50 border-yellow-200 text-yellow-800 shadow-md">
        <CardContent className="p-4 flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 flex-shrink-0" />
          <CardDescription className="text-sm font-medium text-yellow-800">
            <span className="font-bold">Important:</span> Please keep your password and receiver email in a safe place. If lost, you will not be able to decrypt (recover) your file(s).
          </CardDescription>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        <div className="flex-1">
          <CryptoForm defaultMode="encrypt" />
        </div>
        <div className="flex-1">
          <CryptoForm defaultMode="decrypt" />
        </div>
      </div>
      <div className="mt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;