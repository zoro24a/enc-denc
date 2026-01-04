"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

import { embedTextInImage, extractTextFromImage, loadImageData, imageDataToBlob } from '@/modules/Steganography';
import { downloadFile } from '@/utils/download';

type Mode = 'embed' | 'extract';

interface SteganographyFormProps {
  mode: Mode;
}

export const SteganographyForm = ({ mode }: SteganographyFormProps) => {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setImageFile(selectedFile);
    if (mode === 'extract') {
      setExtractedText(''); // Clear extracted text on new image selection for extract mode
    }
    if (selectedFile && !selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file (e.g., PNG).',
        variant: 'destructive',
      });
      setImageFile(null);
    }
  };

  const handleEmbed = useCallback(async () => {
    if (!imageFile || !textInput) {
      toast({
        title: 'Missing Inputs',
        description: 'Please select an image and enter text to embed.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const imageData = await loadImageData(imageFile);
      const embeddedImageData = embedTextInImage(imageData, textInput);
      const embeddedImageBlob = await imageDataToBlob(embeddedImageData);

      const newFileName = `embedded_${imageFile.name.split('.').slice(0, -1).join('.') || 'image'}.png`;
      downloadFile(embeddedImageBlob, newFileName);

      toast({
        title: 'Embedding Successful',
        description: `Text embedded and image saved as ${newFileName}. (Note: Use PNG for best results)`,
      });
    } catch (error) {
      toast({
        title: 'Embedding Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred during embedding.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, textInput, toast]);

  const handleExtract = useCallback(async () => {
    if (!imageFile) {
      toast({
        title: 'Missing Image',
        description: 'Please select an image to extract text from.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const imageData = await loadImageData(imageFile);
      const text = extractTextFromImage(imageData);
      setExtractedText(text);
      toast({
        title: 'Extraction Successful',
        description: 'Text extracted from the image.',
      });
    } catch (error) {
      setExtractedText('');
      toast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred during extraction. Image may not contain hidden data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, toast]);

  const actionButton = mode === 'embed' ? (
    <Button
      onClick={handleEmbed}
      disabled={isLoading || !imageFile || !textInput}
      className="w-full bg-gradient-to-r from-secondary to-accent text-secondary-foreground hover:from-secondary/90 hover:to-accent/90 transition-all duration-300 ease-in-out shadow-lg"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
      Embed Text
    </Button>
  ) : (
    <Button
      onClick={handleExtract}
      disabled={isLoading || !imageFile}
      className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 transition-all duration-300 ease-in-out shadow-lg"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
      Extract Text
    </Button>
  );

  const cardTitle = mode === 'embed' ? 'Embed Text in Image' : 'Extract Text from Image';

  return (
    <Card className="w-full mx-auto shadow-xl rounded-xl border-border/50 dark:border-border/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-primary dark:text-primary-foreground">
          <ImageIcon className="mr-3 h-7 w-7 text-secondary dark:text-accent" />
          {cardTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`image-file-${mode}`} className="text-foreground">Image Input / Upload</Label>
          <Input id={`image-file-${mode}`} type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="file:text-primary file:font-medium file:bg-muted file:border-muted-foreground/20 file:rounded-md file:mr-2 file:py-1 file:px-3 hover:file:bg-muted-foreground/10 transition-colors" />
          {imageFile && <p className="text-sm text-muted-foreground">Selected: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)</p>}
          <p className="text-xs text-muted-foreground">
            For best results, use PNG images. JPEG compression can corrupt hidden data.
          </p>
        </div>

        {mode === 'embed' && (
          <div className="space-y-2">
            <Label htmlFor="text-to-hide" className="text-foreground">Text to Hide</Label>
            <Textarea
              id="text-to-hide"
              placeholder="Enter secret message to embed inside the image... (Encrypt the text before embedding for higher security)"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={4}
              className="focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        )}

        {mode === 'extract' && (
          <div className="space-y-2">
            <Label htmlFor="extracted-text" className="text-foreground">Extracted Text</Label>
            <Textarea
              id="extracted-text"
              placeholder="Extracted text will appear here..."
              value={extractedText}
              readOnly
              rows={4}
              className="bg-muted focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {extractedText && (
              <Button
                onClick={() => navigator.clipboard.writeText(extractedText)}
                className="w-full mt-2"
                variant="secondary"
              >
                Copy Extracted Text
              </Button>
            )}
          </div>
        )}

        {actionButton}
      </CardContent>
    </Card>
  );
};