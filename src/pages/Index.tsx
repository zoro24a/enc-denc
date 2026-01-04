import { CryptoForm } from "@/components/CryptoForm";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 p-4 sm:p-8">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center text-primary dark:text-primary-foreground leading-tight">
        Argon2id + AES-256-GCM Hybrid Encryption & Decryption System
      </h1>

      <Card className="w-full max-w-4xl mb-10 bg-warning border-warning-foreground/20 text-warning-foreground shadow-lg rounded-xl">
        <CardContent className="p-4 flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 flex-shrink-0 text-warning-foreground" />
          <CardDescription className="text-sm font-medium text-warning-foreground">
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
    </div>
  );
};

export default Index;