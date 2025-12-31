import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Lock, Unlock, FileText } from 'lucide-react';

import { generateSalt, securityLog } from '@/utils/security';
import { deriveKeyPBKDF2 } from '@/modules/KeyDerivation';
import { generateDataEncryptionKey, deriveMasterKey, wrapDataKey, unwrapDataKey } from '@/modules/KeyManagement';
import { packageMetadata, parseMetadata, ParsedMetadata } from '@/modules/Metadata';
import { encryptFileStream } from '@/modules/EncryptionStream';
import { decryptFileStream } from '@/modules/DecryptionStream';
import { downloadFile } from '@/utils/download';

const ENCRYPTED_FILE_EXTENSION = '.dyadenc';
const MIN_PASSWORD_LENGTH = 7; // Define minimum password length

type Mode = 'encrypt' | 'decrypt';

interface CryptoFormProps {
  defaultMode?: Mode;
}

export const CryptoForm = ({ defaultMode = 'encrypt' }: CryptoFormProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      // Automatically switch mode based on file extension if defaultMode is not explicitly set
      // or if the user selects a file that clearly indicates a different mode.
      if (defaultMode === 'encrypt' && selectedFile.name.endsWith(ENCRYPTED_FILE_EXTENSION)) {
        setMode('decrypt');
      } else if (defaultMode === 'decrypt' && !selectedFile.name.endsWith(ENCRYPTED_FILE_EXTENSION)) {
        setMode('encrypt');
      } else {
        setMode(defaultMode); // Revert to default mode if no clear indication from file
      }
    }
  };

  const handleEncrypt = useCallback(async () => {
    if (!file || !password || !receiverEmail) {
      toast({
        title: 'Missing Inputs',
        description: 'Please provide a file, password, and receiver email.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: 'Password Too Short',
        description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    securityLog('Starting encryption process.');

    try {
      // 1. Salt Generation
      const sp = generateSalt(); // Password Salt
      const se = generateSalt(); // Email Salt

      // 2. Key Derivation (PBKDF2)
      const kp = await deriveKeyPBKDF2(password, sp);
      const ke = await deriveKeyPBKDF2(receiverEmail, se);

      // 3. Master Key Derivation (HKDF)
      const km = await deriveMasterKey(kp, ke);

      // 4. Data Key Generation
      const dek = await generateDataEncryptionKey();

      // 5. Key Wrapping (AES-GCM)
      const { wrappedKey, iv: wiv } = await wrapDataKey(dek, km);

      // 6. File Encryption (AES-256-GCM)
      const encryptedContentBlob = await encryptFileStream(file, dek);

      // 7. Metadata Packaging
      const header = packageMetadata(file.name, sp, se, wiv, wrappedKey);

      // 8. Final Output Blob: Header + Encrypted Content
      const finalBlob = new Blob([header, encryptedContentBlob], {
        type: 'application/octet-stream',
      });

      const encryptedFileName = `${file.name}${ENCRYPTED_FILE_EXTENSION}`;
      downloadFile(finalBlob, encryptedFileName);

      toast({
        title: 'Encryption Successful',
        description: `File saved as ${encryptedFileName}.`,
      });
    } catch (error) {
      securityLog(`Encryption failed: ${error}`, 'ERROR');
      toast({
        title: 'Encryption Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred during encryption.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [file, password, receiverEmail, toast]);

  const handleDecrypt = useCallback(async () => {
    if (!file || !password || !receiverEmail) {
      toast({
        title: 'Missing Inputs',
        description: 'Please provide the encrypted file, password, and receiver email.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: 'Password Too Short',
        description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    securityLog('Starting decryption process.');

    try {
      // 1. Metadata Extraction
      const metadata: ParsedMetadata = await parseMetadata(file);
      const encryptedContentBlob = file.slice(metadata.headerLength);

      // 2. Key Derivation (PBKDF2)
      const sp = metadata.sp;
      const se = metadata.se;

      const kp = await deriveKeyPBKDF2(password, sp);
      const ke = await deriveKeyPBKDF2(receiverEmail, se);

      // 3. Master Key Derivation (HKDF)
      const km = await deriveMasterKey(kp, ke);

      // 4. Key Unwrapping (AES-GCM) & Access Control
      // This step verifies both password and email correctness via the AES-GCM tag check.
      const dek = await unwrapDataKey(metadata.wdek, metadata.wiv, km);

      // 5. File Decryption & Integrity Verification
      const decryptedBlob = await decryptFileStream(encryptedContentBlob, dek);

      // 6. Download
      const originalFileName = metadata.fileName;
      downloadFile(decryptedBlob, originalFileName);

      toast({
        title: 'Decryption Successful',
        description: `File recovered as ${originalFileName}.`,
      });
    } catch (error) {
      securityLog(`Decryption failed: ${error}`, 'ERROR');
      toast({
        title: 'Decryption Failed',
        description: error instanceof Error ? error.message : 'Authentication failed: Invalid password or receiver email.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [file, password, receiverEmail, toast]);

  const actionButton = mode === 'encrypt' ? (
    <Button onClick={handleEncrypt} disabled={isLoading || !file} className="w-full">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
      Encrypt File
    </Button>
  ) : (
    <Button onClick={handleDecrypt} disabled={isLoading || !file} className="w-full">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
      Decrypt File
    </Button>
  );

  const title = mode === 'encrypt' ? 'Secure File Encryption' : 'Secure File Decryption';

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-6 w-6 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file">File Input / Upload</Label>
          <Input id="file" type="file" onChange={handleFileChange} />
          {file && <p className="text-sm text-muted-foreground">Selected: {file.name} ({Math.round(file.size / 1024 / 1024)} MB)</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password Input</Label>
          <Input
            id="password"
            type="password"
            placeholder={`Enter strong password (min ${MIN_PASSWORD_LENGTH} chars)`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Receiver Email ID (Access Control)</Label>
          <Input
            id="email"
            type="email"
            placeholder="receiver@example.com"
            value={receiverEmail}
            onChange={(e) => setReceiverEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Both the password and this email are required for decryption.
          </p>
        </div>

        {actionButton}
      </CardContent>
    </Card>
  );
};